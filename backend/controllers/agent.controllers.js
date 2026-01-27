import { User } from "../models/user.models.js";
import { comparePassword } from "@jaimilgorajiya/password-utils";
import { generateTokenAndResponse } from "../utils/generateToken.js";
import { createUser } from "../services/userService.js";

export const registerAgent = async (req, res) => {
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
            role: "agent"
        });

        return res.status(201).json({ 
            success: true,
            message: "Agent registered successfully. Credentials sent via email.", 
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

export const loginAgent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: "agent" });
        if (!user || !(await comparePassword(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
        if (user.status === "inactive") return res.status(403).json({ message: "Account inactive" });
        
        const tokenResponse = await generateTokenAndResponse(user, res, "Agent logged in");
        return res.status(200).json(tokenResponse);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const logoutAgent = async (req, res) => {
    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };
    return res.status(200).clearCookie("accessToken", options).json({ message: "Logged out" });
};

// --- ADMIN MANAGEMENT ACTIONS (Performed by Admin on Agents) ---
export const getAllAgents = async (req, res) => {
    try {
        const agents = await User.find({ role: "agent" }).select("-password");
        res.status(200).json({
            message: "Agents fetched successfully",
            total: agents.length,
            agents
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, status } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;
        if (status) updateData.status = status;

        const agent = await User.findOneAndUpdate({ _id: id, role: "agent" }, updateData, { new: true }).select("-password");
        if (!agent) return res.status(404).json({ message: "Agent not found" });

        res.status(200).json({ message: "Agent updated successfully", agent });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteAgent = async (req, res) => {
    try {
        const agent = await User.findOneAndDelete({ _id: req.params.id, role: "agent" });
        if (!agent) return res.status(404).json({ message: "Agent not found" });
        res.status(200).json({ message: "Agent deleted successfully" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateAgentPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!permissions) {
            return res.status(400).json({ success: false, message: "Permissions object is required" });
        }

        const agent = await User.findOne({ _id: id, role: "agent" });

        if (!agent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }

        agent.permissions = permissions;
        agent.markModified('permissions');
        await agent.save();

        if (!agent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }

        res.status(200).json({
            success: true,
            message: "Permissions updated successfully",
            agent
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyCommissions = async (req, res) => {
    try {
        const agentId = req.user._id;

        // Find all customers who have policies purchased through this agent
        const customers = await User.find({
            "purchasedPolicies.agentId": agentId
        }).populate("purchasedPolicies.policy");

        let totalEarnings = 0;
        const sales = [];

        customers.forEach(customer => {
            customer.purchasedPolicies.forEach(purchase => {
                if (purchase.agentId?.toString() === agentId.toString()) {
                    const commissionPercent = purchase.policy?.agentCommission || 0;
                    const premium = purchase.policy?.premiumAmount || 0;
                    const earned = (commissionPercent / 100) * premium;
                    
                    totalEarnings += earned;
                    sales.push({
                        customerName: customer.name,
                        policyName: purchase.policy?.policyName,
                        premiumAmount: premium,
                        commissionPercentage: commissionPercent,
                        earnedAmount: earned,
                        purchaseDate: purchase.purchaseDate
                    });
                }
            });
        });

        res.status(200).json({
            success: true,
            totalEarnings,
            totalSales: sales.length,
            sales
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
