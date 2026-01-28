import { User } from "../models/user.models.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
            // Note: A customer usually only sees themselves, but if they created sub-users (rare), this would apply.
            // Better logic for customer role might be query._id = req.user._id if they are only allowed to see their own profile.
            // But sticking to the existing pattern of "createdBy" for now, or maybe just restrict to themselves:
             query._id = req.user._id; 
        } else if (req.user.role === "agent") {
            // Agent sees customers they created OR customers assigned to them
            query.$or = [
                { createdBy: req.user._id },
                { assignedAgentId: req.user._id }
            ];
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
            const searchCondition = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { mobile: searchRegex }
                ]
            };
            
            // Combine with existing query
            if (query.$or) {
                query.$and = [
                    { $or: query.$or }, // The agent permission check
                    searchCondition     // The search check
                ];
                delete query.$or; // Move the permission check into $and
            } else {
                query.$or = searchCondition.$or;
            }
        }
        
        const customers = await User.find(query)
            .select("-password")
            .populate('createdBy', 'name email')
            .populate('assignedAgentId', 'name email')
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
// Unified Update (Admin updates any, Customer updates only their own)
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[getCustomerById] Fetching customer ID: ${id} for User: ${req.user._id} (${req.user.role})`);

        // Basic ID validation
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[getCustomerById] Invalid ID format: ${id}`);
             return res.status(400).json({ message: "Invalid Customer ID" });
        }

        const customer = await User.findOne({ _id: id, role: "customer" })
            .select("-password")
            .populate('createdBy', 'name email')
            .populate('assignedAgentId', 'name email')
            .populate('selectedPolicy', 'policyName premiumAmount')
            .populate({
                path: 'purchasedPolicies.policy',
                populate: { path: 'policyType' }
            });

        if (!customer) {
            console.log(`[getCustomerById] Customer not found: ${id}`);
            return res.status(404).json({ message: "Customer not found" });
        }

        // Access Control
        if (req.user.role === 'customer' && customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (req.user.role === 'agent') {
            // Handle populated fields safely
            const assignedId = customer.assignedAgentId?._id?.toString() || customer.assignedAgentId?.toString();
            const creatorId = customer.createdBy?._id?.toString() || customer.createdBy?.toString();
            
            const isAssigned = assignedId === req.user._id.toString();
            const isCreator = creatorId === req.user._id.toString();

            console.log(`[getCustomerById] Agent Access Check - Assigned: ${isAssigned}, Creator: ${isCreator}`);
            
            if (!isAssigned && !isCreator) {
                return res.status(403).json({ message: "Access denied: Not your customer" });
            }
        }

        res.status(200).json({ success: true, data: customer });
    } catch (e) {
        console.error(`[getCustomerById] Error:`, e);
         res.status(500).json({ message: e.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, status, kycStatus, selectedPolicy } = req.body;
        
        // Find the customer first to get details for PDF if needed
        const query = { _id: id, role: "customer" };
        if (req.user.role === "customer") {
            query.createdBy = req.user._id;
        } else if (req.user.role === "agent") {
            query.assignedAgentId = req.user._id;
        }
        
        let customer = await User.findOne(query);
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });

        const updateOperations = { $set: {} };
        const userPermissions = req.user.permissions;

        // Fields that require 'customers.edit' permission for agents
        const requiresEditPermission = name || email || mobile || status;
        
        if (req.user.role === 'agent') {
            // Check for customer detail edits
            if (requiresEditPermission && !userPermissions?.customers?.edit) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to edit customer details."
                });
            }
            // Check for policy purchase
            if (selectedPolicy && !userPermissions?.policies?.view && !userPermissions?.customers?.edit) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to purchase policies for customers."
                });
            }
        }

        if (name) updateOperations.$set.name = name;
        if (email) updateOperations.$set.email = email;
        if (mobile) updateOperations.$set.mobile = mobile;
        if (status) updateOperations.$set.status = status;
        
        if (kycStatus) {
            if (req.user.role === 'agent') {
                if (kycStatus === 'approved' && (!userPermissions?.kyc?.approve)) {
                    return res.status(403).json({
                        success: false,
                        message: "You do not have permission to approve KYC."
                    });
                }
                if (kycStatus === 'rejected' && (!userPermissions?.kyc?.reject)) {
                    return res.status(403).json({
                        success: false,
                        message: "You do not have permission to reject KYC."
                    });
                }
            }
            updateOperations.$set.kycStatus = kycStatus;
        }
        
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
                    
                    const relativePath = `uploads/policy-documents/${fileName}`;

                    // Add to purchased history with document path
                    updateOperations.$push = { 
                        purchasedPolicies: {
                            policy: selectedPolicy,
                            purchaseDate: new Date(),
                            status: 'active',
                            policyDocument: relativePath,
                            agentId: req.user.role === 'agent' ? req.user._id : (customer.assignedAgentId || null)
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
        } else if (req.user.role === "agent") {
            query.assignedAgentId = req.user._id;
        }

        const customer = await User.findOneAndDelete(query);
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });
        res.status(200).json({ message: "Customer deleted successfully" });

    } catch (e) { res.status(500).json({ message: e.message }); }
};
// POST /api/customer/email-draft/:id
export const generateCustomerEmailAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, selectedPolicyId } = req.body;

    // 1. Fetch customer with ALL policies
    const customer = await User.findById(id)
      .populate("purchasedPolicies.policy") // array of policies customer owns
      .populate("selectedPolicy");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "AI API Key missing" });
    }

    const agentName = req.user.name;

    // 2. Prepare policy context
    const policies = customer.purchasedPolicies?.map(p => p.policy) || [];
    const selectedPolicy =
      policies.find(p => p._id.toString() === selectedPolicyId) ||
      customer.selectedPolicy ||
      null;

    const policySummary = policies.length
      ? policies.map(p => `- ${p.policyType}: ${p.policyName}`).join("\n")
      : "No active policies";

    const hasHealth = policies.some(p => p.policyType === "Health");
    const hasLife = policies.some(p => p.policyType === "Life");
    const hasMotor = policies.some(p => p.policyType === "Motor");

    // 3. Initialize AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 4. STRONG CONTEXT-AWARE PROMPT
    const prompt = `
You are an AI Email Assistant inside an Insurance CRM.

Write a professional, accurate, and context-aware email.

RULES:
- Do NOT use sales language
- Do NOT suggest policies the customer already has
- Be neutral and respectful
- If the topic is not applicable, adapt the message appropriately
- Reference a specific policy ONLY if provided

EMAIL CONTEXT:
Topic: ${topic}

CUSTOMER:
Name: ${customer.name}

AGENT:
Name: ${agentName}

CUSTOMER POLICIES:
${policySummary}

POLICY OWNERSHIP FLAGS:
- Has Health Policy: ${hasHealth}
- Has Life Policy: ${hasLife}
- Has Motor Policy: ${hasMotor}

SELECTED POLICY:
${selectedPolicy ? `${selectedPolicy.policyType} - ${selectedPolicy.policyName}` : "None"}

TOPIC RULES:
- Generic / Check-in → Reference selected policy if available, otherwise mention coverage generally
- Policy Renewal → Mention only renewable policies
- Payment Follow-up → Be factual and neutral
- Cross-sell Health Insurance → 
  If customer already has health insurance, suggest review or optimization instead

Return ONLY valid JSON:
{
  "subject": "Email subject",
  "body": "Email body"
}
`;

    // 5. Generate
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleanText = text.replace(/```json|```/g, "").trim();
    const emailData = JSON.parse(cleanText);

    res.status(200).json({ success: true, data: emailData });

  } catch (error) {
    console.error("AI Email Error:", error);
    res.status(500).json({ message: "Failed to generate email draft" });
  }
};
