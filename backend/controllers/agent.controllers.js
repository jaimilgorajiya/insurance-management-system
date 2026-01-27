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

        // 1. Assigned Customers
        const assignedCustomers = await User.countDocuments({ 
            role: 'customer', 
            assignedAgentId: agentId 
        });

        // 2. Fetch customers with policies for deep calculations
        const customersWithPolicies = await User.find({
            "purchasedPolicies.agentId": agentId
        }).select("name purchasedPolicies assignedAgentId createdAt").populate({
            path: "purchasedPolicies.policy",
            select: "policyName premiumAmount agentCommission policyType",
            populate: { path: "policyType", select: "name" }
        });

        let activePolicies = 0;
        let totalCommission = 0;
        let monthlySalesMap = {}; // Key: "Jan", Value: count
        let recentCustomersList = [];

        // Initialize last 6 months for chart
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short' });
            monthlySalesMap[monthKey] = 0;
        }

        // Helper to track unique recent customers
        const uniqueRecentCustMap = new Map();

        customersWithPolicies.forEach(cust => {
            if (cust.purchasedPolicies) {
                cust.purchasedPolicies.forEach(p => {
                    if (p.agentId?.toString() === agentId.toString()) {
                        
                        // Active Policies
                        if (p.status === 'active') {
                            activePolicies++;
                        }

                        // Commission Calculation
                        const commissionPercent = p.policy?.agentCommission || 0;
                        const premium = p.policy?.premiumAmount || 0;
                        const earned = (commissionPercent / 100) * premium;
                        totalCommission += earned;

                        // Monthly Performance (Line Chart)
                        if (p.purchaseDate) {
                            const pDate = new Date(p.purchaseDate);
                            const monthKey = pDate.toLocaleString('default', { month: 'short' });
                            if (monthlySalesMap.hasOwnProperty(monthKey)) {
                                monthlySalesMap[monthKey] += 1; // Counting sales volume
                            }

                            // Track latest purchase for Recent Customers list
                            // We only want the LATEST purchase for a specific customer to appear once
                            const existing = uniqueRecentCustMap.get(cust._id.toString());
                            if (!existing || pDate > existing.date) {
                                uniqueRecentCustMap.set(cust._id.toString(), {
                                    _id: cust._id,
                                    name: cust.name,
                                    policyName: p.policy?.policyName || p.policy?.policyType?.name || "Insurance Policy",
                                    status: p.status,
                                    date: pDate,
                                    premium: premium
                                });
                            }
                        }
                    }
                });
            }
        });

        // Convert map to array
        recentCustomersList = Array.from(uniqueRecentCustMap.values());

        // Sort and slice recent customers
        recentCustomersList.sort((a, b) => b.date - a.date);
        const recentCustomers = recentCustomersList.slice(0, 5);

        // Format Chart Data
        const monthlyPerformance = Object.keys(monthlySalesMap).map(key => ({
            name: key,
            value: monthlySalesMap[key]
        }));

        // Mock Target Progress (Assume target $5000/month or 10 sales/month? Let's use 10 sales count for now)
        const currentMonthName = new Date().toLocaleString('default', { month: 'short' });
        const currentMonthSales = monthlySalesMap[currentMonthName] || 0;
        const targetProgress = Math.min((currentMonthSales / 10) * 100, 100); // 10 sales target

        res.status(200).json({
            success: true,
            stats: {
                assignedCustomers,
                activePolicies,
                earnedCommission: Math.round(totalCommission),
                targetProgress: Math.round(targetProgress * 10) / 10, // 1 decimal
                monthlyPerformance,
                recentCustomers
            }
        });

    } catch (error) {
        console.error("Error fetching agent dashboard stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
    }
};
