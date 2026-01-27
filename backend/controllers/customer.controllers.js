import { User } from "../models/user.models.js";
import { comparePassword } from "@jaimilgorajiya/password-utils";
import { generateTokenAndResponse } from "../utils/generateToken.js";
import { createUser } from "../services/userService.js";

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
        const { name, email, mobile, status, kycStatus } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;
        if (status) updateData.status = status;
        if (kycStatus) updateData.kycStatus = kycStatus;

        const query = { _id: id, role: "customer" };
        if (req.user.role === "customer") {
            query.createdBy = req.user._id;
        }

        const customer = await User.findOneAndUpdate(query, updateData, { new: true }).select("-password");
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });

        res.status(200).json({ message: "Customer updated successfully", customer });
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
