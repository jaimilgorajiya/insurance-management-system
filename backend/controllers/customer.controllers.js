import { User } from "../models/user.models.js";
import { Policy } from "../models/policy.models.js"; // Import Policy model
import { comparePassword } from "@jaimilgorajiya/password-utils";
import { generateTokenAndResponse } from "../utils/generateToken.js";
import { createUser } from "../services/userService.js";
import { generatePolicyPDF } from "../utils/pdfGenerator.js"; // Import PDF generator
import { sendPolicyDocumentEmail } from "../services/emailService.js"; // Import Email service
import path from "path";
import fs from "fs";

export const createCustomer = async (req, res) => {
    try {
        const { email, name, mobile } = req.body;
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }

        // Use the new user creation service
        const result = await createUser({
            name,
            email,
            mobile,
            role: "customer"
        }, req.user);

        return res.status(201).json({ 
            success: true,
            message: "Customer created successfully. Credentials sent via email.", 
            data: {
                user: result.user,
                tempPassword: result.tempPassword // For development/testing
            }
        });
    } catch (error) { 
        res.status(500).json({ 
            success: false,
            message: error.message 
        }); 
    }
};

export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: "customer" });
        if (!user || !(await comparePassword(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
        if (user.status === "inactive") return res.status(403).json({ message: "Account inactive" });
        
        const tokenResponse = await generateTokenAndResponse(user, res, "Customer logged in");
        return res.status(200).json(tokenResponse);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const logoutCustomer = async (req, res) => {
    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };
    return res.status(200).clearCookie("accessToken", options).json({ message: "Logged out" });
};

// Unified Get (Admin gets all, Customer gets only their own)
export const getCustomers = async (req, res) => {
    try {
        const query = { role: "customer" };
        if (req.user.role === "customer") {
            query.createdBy = req.user._id;
        }

        // Filtering
        if (req.query.status && req.query.status !== "All") {
            query.status = req.query.status.toLowerCase();
        }
        if (req.query.kycStatus && req.query.kycStatus !== "All") {
            query.kycStatus = req.query.kycStatus.toLowerCase();
        }

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { mobile: searchRegex }
            ];
        }
        
        const customers = await User.find(query)
            .select("-password")
            .populate('createdBy', 'name email')
            .populate('selectedPolicy', 'policyName premiumAmount')
            .populate('purchasedPolicies.policy', 'policyName premiumAmount')
            .sort({ createdAt: -1 });
        res.status(200).json({
            message: "Customers fetched successfully",
            total: customers.length,
            customers
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// Unified Update (Admin updates any, Customer updates only their own)
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, status, kycStatus, selectedPolicy } = req.body;
        
        // Find the customer first to get details for PDF if needed
        const query = { _id: id, role: "customer" };
        if (req.user.role === "customer") {
            query.createdBy = req.user._id;
        }
        
        let customer = await User.findOne(query);
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });

        const updateOperations = { $set: {} };
        if (name) updateOperations.$set.name = name;
        if (email) updateOperations.$set.email = email;
        if (mobile) updateOperations.$set.mobile = mobile;
        if (status) updateOperations.$set.status = status;
        if (kycStatus) updateOperations.$set.kycStatus = kycStatus;
        
        if (selectedPolicy) {
            // Fetch policy for validation
            const policy = await Policy.findById(selectedPolicy).populate('policyType').populate('provider');
            if (!policy) return res.status(404).json({ message: "Selected policy not found" });

            // Validate Age Eligibility
            if (customer.dateOfBirth) {
                const birthDate = new Date(customer.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                if (age < policy.minAge || age > policy.maxAge) {
                    return res.status(400).json({
                        success: false,
                        message: `Age eligibility failed. Customer age (${age}) must be between ${policy.minAge} and ${policy.maxAge} years for this policy.`
                    });
                }
            }

            updateOperations.$set.selectedPolicy = selectedPolicy;
            
            // Logic to generate Policy Document
            try {
                if (policy) {
                    const timestamp = Date.now();
                    const fileName = `Policy_${id}_${selectedPolicy}_${timestamp}.pdf`;
                    const uploadDir = path.join(process.cwd(), 'uploads', 'policy-documents');
                    
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    const filePath = path.join(uploadDir, fileName);
                    
                    await generatePolicyPDF(policy, customer, filePath);
                    
                    const relativePath = path.join('uploads', 'policy-documents', fileName); // Path to save in DB

                    // Add to purchased history with document path
                    updateOperations.$push = { 
                        purchasedPolicies: {
                            policy: selectedPolicy,
                            purchaseDate: new Date(),
                            status: 'active',
                            policyDocument: relativePath
                        }
                    };

                    // Send Email
                    await sendPolicyDocumentEmail({
                        email: customer.email,
                        name: customer.name,
                        policyName: policy.policyName,
                        pdfPath: filePath
                    });

                } else {
                     // Fallback if policy not found (should not happen usually)
                     updateOperations.$push = { 
                        purchasedPolicies: {
                            policy: selectedPolicy,
                            purchaseDate: new Date(),
                            status: 'active'
                        }
                    };
                }
            } catch (err) {
                console.error("Error generating policy document:", err);
                // Fallback to push without document if error
                updateOperations.$push = { 
                    purchasedPolicies: {
                        policy: selectedPolicy,
                        purchaseDate: new Date(),
                        status: 'active'
                    }
                };
            }
        }

        const updatedCustomer = await User.findOneAndUpdate(query, updateOperations, { new: true }).select("-password");
        
        res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// Unified Delete (Admin deletes any, Customer deletes only their own)
export const deleteCustomer = async (req, res) => {
    try {
        const query = { _id: req.params.id, role: "customer" };
        if (req.user.role === "customer") {
            query.createdBy = req.user._id;
        }

        const customer = await User.findOneAndDelete(query);
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });
        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};
