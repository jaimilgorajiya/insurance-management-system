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
        
        // Fetch all customers with policy details to calculate stats
        const customers = await User.find({ role: "customer" })
            .populate("purchasedPolicies.policy");

        const agentsWithStats = agents.map(agent => {
            const agentId = agent._id.toString();
            
            // 1. Customer Count (Assigned to agent)
            const myCustomers = customers.filter(c => c.assignedAgentId?.toString() === agentId);
            const customerCount = myCustomers.length;

            // 2. Active Policies & Commission
            let activePolicies = 0;
            let commissionMTD = 0;
            
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            customers.forEach(cust => {
                if (cust.purchasedPolicies) {
                    cust.purchasedPolicies.forEach(p => {
                        if (p.agentId?.toString() === agentId) {
                            // Active Policy Check
                            if (p.status === 'active') {
                                activePolicies++;
                            }

                            // Commission MTD Check
                            const purchaseDate = new Date(p.purchaseDate);
                            if (purchaseDate >= startOfMonth) {
                                const commissionRate = p.policy?.agentCommission || 0; // Assuming percentage
                                const premium = p.policy?.premiumAmount || 0;
                                const earned = (commissionRate / 100) * premium;
                                commissionMTD += earned;
                            }
                        }
                    });
                }
            });

            // 3. Target Progress (Mock target of $5000)
            const target = 5000;
            const targetProgress = Math.min(Math.round((commissionMTD / target) * 100), 100);

            return {
                ...agent.toObject(),
                customerCount,
                activePolicies,
                commission: Math.round(commissionMTD), // Round to nearest integer
                targetProgress
            };
        });

        res.status(200).json({
            message: "Agents fetched successfully",
            total: agentsWithStats.length,
            agents: agentsWithStats
        });
    } catch (e) { 
        console.error("Error fetching agents:", e);
        res.status(500).json({ message: e.message }); 
    }
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

export const getAgentDashboardStats = async (req, res) => {
    try {
        const agentId = req.user._id;

        // 1. My Customers
        const totalCustomers = await User.countDocuments({ 
            role: 'customer', 
            assignedAgentId: agentId 
        });

        // 2. Pending Verifications
        const pendingVerifications = await User.countDocuments({ 
            role: 'customer', 
            assignedAgentId: agentId,
            kycStatus: "pending"
        });

        // 3. Policies Sold & Commission (MTD)
        const customersWithPolicies = await User.find({
            "purchasedPolicies.agentId": agentId
        }).populate("purchasedPolicies.policy");

        let policiesSold = 0;
        let commissionMTD = 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        customersWithPolicies.forEach(customer => {
            customer.purchasedPolicies.forEach(purchase => {
                // Check if sold by this agent
                if (purchase.agentId?.toString() === agentId.toString()) {
                    policiesSold++;

                    // Check if purchased this month
                    const purchaseDate = new Date(purchase.purchaseDate);
                    if (purchaseDate >= startOfMonth) {
                        const commissionPercent = purchase.policy?.agentCommission || 0;
                        const premium = purchase.policy?.premiumAmount || 0;
                        const earned = (commissionPercent / 100) * premium;
                        commissionMTD += earned;
                    }
                }
            });
        });

        res.status(200).json({
            success: true,
            stats: {
                totalCustomers,
                policiesSold,
                pendingVerifications,
                commissionMTD
            }
        });

    } catch (error) {
        console.error("Error fetching agent dashboard stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
    }
};
