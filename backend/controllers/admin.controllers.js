import { User } from "../models/user.models.js";
import { comparePassword } from "@jaimilgorajiya/password-utils";
import { generateTokenAndResponse } from "../utils/generateToken.js";
import { createUser } from "../services/userService.js";

// --- AUTH & MASTER ACTIONS ---

// 1. Create Admin (Master Action - "Register Admin") - Updated to use new service
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, mobile, phone, status } = req.body;
        const finalMobile = mobile || phone || "N/A";

        if (!email || !email.trim()) {
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }

        // Use the new user creation service
        const result = await createUser({
            name,
            email,
            mobile: finalMobile,
            role: "admin"
        });

        // Update status if provided
        if (status && status !== "active") {
            await User.findByIdAndUpdate(result.user._id, { status });
            result.user.status = status;
        }

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully. Credentials sent via email.",
            data: {
                admin: result.user,
                tempPassword: result.tempPassword // For development/testing
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// 2. Login Admin (Admin Action) - DEPRECATED: Use /api/auth/login instead
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: "admin" });
        if (!user || !(await comparePassword(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
        if (user.status === "inactive") return res.status(403).json({ message: "Account inactive" });
        
        const tokenResponse = await generateTokenAndResponse(user, res, "Admin logged in");
        return res.status(200).json(tokenResponse);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// 3. Get All Admins (Master Action)
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" }).select("-password");
        res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            data: {
                total: admins.length,
                admins
            }
        });
    } catch (e) { 
        res.status(500).json({ 
            success: false,
            message: e.message 
        }); 
    }
};

// 4. Update Admin Status (Master Action)
export const updateAdminStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid status" 
            });
        }
        
        const admin = await User.findOneAndUpdate({ _id: id, role: "admin" }, { status }, { new: true }).select("-password");
        if (!admin) {
            return res.status(404).json({ 
                success: false,
                message: "Admin not found" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Admin status updated", 
            data: { admin } 
        });
    } catch (e) { 
        res.status(500).json({ 
            success: false,
            message: e.message 
        }); 
    }
};

// 5. Update Admin Details (Master Action)
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, status } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;
        if (status) updateData.status = status;

        const admin = await User.findOneAndUpdate({ _id: id, role: "admin" }, updateData, { new: true }).select("-password");
        if (!admin) {
            return res.status(404).json({ 
                success: false,
                message: "Admin not found" 
            });
        }

        res.status(200).json({ 
            success: true,
            message: "Admin details updated", 
            data: { admin } 
        });
    } catch (e) { 
        res.status(500).json({ 
            success: false,
            message: e.message 
        }); 
    }
};

// 6. Delete Admin (Master Action)
export const deleteAdmin = async (req, res) => {
    try {
        const admin = await User.findOneAndDelete({ _id: req.params.id, role: "admin" });
        if (!admin) {
            return res.status(404).json({ 
                success: false,
                message: "Admin not found" 
            });
        }
        res.status(200).json({ 
            success: true,
            message: "Admin deleted successfully" 
        });
    } catch (e) { 
        res.status(500).json({ 
            success: false,
            message: e.message 
        }); 
    }
};

export const logoutAdmin = async (req, res) => {
    const options = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };
    return res.status(200).clearCookie("accessToken", options).json({ 
        success: true,
        message: "Logged out successfully" 
    });
};

export const getAdminDashboardStats = async (req, res) => {
    try {
        // 1. Fetch all customers with their policies fully populated
        const customers = await User.find({ role: "customer" })
            .select("name email createdAt kycStatus purchasedPolicies")
            .populate({
                path: "purchasedPolicies.policy",
                select: "policyName premiumAmount policyType",
                populate: {
                    path: "policyType",
                    select: "name"
                }
            });

        let totalPolicies = 0;
        let activePolicies = 0;
        let pendingApprovals = 0; // KYC Pending
        let totalRevenue = 0;
        
        const distributionMap = {};
        const revenueMap = {};
        
        // Activity Stream
        let activities = [];

        // Initialize last 6 months for revenue map
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short' });
            revenueMap[monthKey] = 0;
        }

        customers.forEach(cust => {
            // Activity: New Customer
            activities.push({
                type: 'USER_ONBOARDED',
                title: 'New customer onboarded',
                subtitle: `Customer: ${cust.name}`,
                date: new Date(cust.createdAt),
                status: 'active'
            });

            // Count Pending KYC
            if (cust.kycStatus === 'pending') {
                pendingApprovals++;
            }

            if (cust.purchasedPolicies && cust.purchasedPolicies.length > 0) {
                cust.purchasedPolicies.forEach(p => {
                    totalPolicies++;
                    
                    if (p.status === 'active') {
                        activePolicies++;
                    }

                    const policy = p.policy;
                    if (policy) {
                        // Revenue
                        totalRevenue += (policy.premiumAmount || 0);

                        // Distribution
                        const typeName = policy.policyType?.name || "Other";
                        distributionMap[typeName] = (distributionMap[typeName] || 0) + 1;

                        // Monthly Trend (Based on purchaseDate)
                        if (p.purchaseDate) {
                            const pDate = new Date(p.purchaseDate);
                            const monthKey = pDate.toLocaleString('default', { month: 'short' });
                            if (revenueMap.hasOwnProperty(monthKey)) {
                                revenueMap[monthKey] += (policy.premiumAmount || 0);
                            }

                            // Activity: Policy Purchased
                            activities.push({
                                type: 'POLICY_PURCHASED',
                                title: `New ${policy.policyName || policy.policyType?.name || 'Policy'} purchased`,
                                subtitle: `Customer: ${cust.name}`,
                                date: pDate,
                                status: p.status || 'active'
                            });
                        }
                    }
                });
            }
        });

        // Sort activities by date desc and take top 5
        activities.sort((a, b) => b.date - a.date);
        const recentActivities = activities.slice(0, 5);

        // Format Charts Data
        const policyDistribution = Object.keys(distributionMap).map(key => ({
            name: key,
            value: distributionMap[key]
        }));

        const monthlyRevenue = Object.keys(revenueMap).map(key => ({
            name: key,
            revenue: revenueMap[key]
        }));

        res.status(200).json({
            success: true,
            stats: {
                totalPolicies,
                activePolicies,
                pendingApprovals,
                totalRevenue,
                policyDistribution,
                monthlyRevenue,
                claimsStats: { // Mocked as requested
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    total: 0
                },
                recentActivities
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};