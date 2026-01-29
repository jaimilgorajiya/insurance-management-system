import { User } from "../models/user.models.js";
import { Policy } from "../models/policy.models.js";
import { Claim } from "../models/claim.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Helper to get Date Query
const getDateFilter = (startDate, endDate, field = "createdAt") => {
    if (!startDate || !endDate) return {};
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return {
        [field]: { $gte: start, $lte: end }
    };
};

/**
 * Get Dashboard KPIs (Filtered)
 * GET /api/reports/dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, policyType, policySource, claimStatus, agentId } = req.query;

    // --- 1. Customer Stats ---
    const customerQuery = { role: "customer" };
    Object.assign(customerQuery, getDateFilter(startDate, endDate)); // Join Date
    if (agentId) customerQuery.assignedAgentId = new mongoose.Types.ObjectId(agentId);

    const totalCustomers = await User.countDocuments(customerQuery);
    const activeCustomers = await User.countDocuments({ ...customerQuery, status: "active" });

    // --- 2. Policy (Sales) Stats ---
    // We must aggregate Sold Policies (User.purchasedPolicies), not Policy Definitions
    const policyPipeline = [
        { $unwind: "$purchasedPolicies" },
        // Filter by Purchase Date
        ...(startDate && endDate ? [{
            $match: {
                "purchasedPolicies.purchaseDate": {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            }
        }] : []),
        // Filter by Sold Agent
        ...(agentId ? [{
            $match: { "purchasedPolicies.agentId": new mongoose.Types.ObjectId(agentId) }
        }] : []),
        // Lookup Policy Details for Type & Source filtering
        {
            $lookup: {
                from: "policies",
                localField: "purchasedPolicies.policy",
                foreignField: "_id",
                as: "policyData"
            }
        },
        { $unwind: "$policyData" },
        // Lookup Policy Type Name
        {
            $lookup: {
                from: "policytypes",
                localField: "policyData.policyType",
                foreignField: "_id",
                as: "typeData"
            }
        },
        { $unwind: "$typeData" },
        // Apply Metrics Filters
        ...(policySource ? [{ $match: { "policyData.policySource": policySource } }] : []),
        ...(policyType ? [{ $match: { "typeData.name": policyType } }] : []),
        // Group to valid stats
        {
            $group: {
                _id: null,
                totalSold: { $sum: 1 },
                activeSold: { 
                    $sum: { $cond: [{ $eq: ["$purchasedPolicies.status", "active"] }, 1, 0] } 
                },
                totalPremium: { $sum: "$policyData.premiumAmount" },
                totalCommission: { $sum: "$policyData.agentCommission" }
            }
        }
    ];

    const policyStats = await User.aggregate(policyPipeline);
    const pStats = policyStats[0] || { totalSold: 0, activeSold: 0, totalPremium: 0, totalCommission: 0 };

    // --- 3. Claim Stats ---
    const claimPipeline = [
        // Filter by Claim Date & Status
        { $match: { 
            ...getDateFilter(startDate, endDate),
            ...(claimStatus ? { status: claimStatus } : {})
        }},
        // Lookup Customer to filter by Agent (Claims belong to customers assigned to agent)
        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customerData"
            }
        },
        { $unwind: "$customerData" },
        ...(agentId ? [{
            $match: { "customerData.assignedAgentId": new mongoose.Types.ObjectId(agentId) }
        }] : []),
        // Group
        {
            $group: {
                _id: null,
                totalClaims: { $sum: 1 },
                statuses: { $push: "$status" } // For breakdown if needed
            }
        }
    ];

    const claimStats = await Claim.aggregate(claimPipeline);
    const cStats = claimStats[0] || { totalClaims: 0 };
    
    // Recalculate status breakdown correctly for API response structure
    // Since we filtered by status above, breakdown might be single-item if status filter is on. 
    // If we want full breakdown ignoring status filter but respecting Date/Agent, we need separate query.
    // However, existing UI expects filtered result.
    
    // We need breakdown data:
    const breakdownPipeline = [...claimPipeline];
    breakdownPipeline.pop(); // Remove last group
    breakdownPipeline.push({
        $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$approvedAmount" }
        }
    });
    const claimsByStatus = await Claim.aggregate(breakdownPipeline);

    return res.status(200).json(
        new ApiResponse(200, {
            customers: { total: totalCustomers, active: activeCustomers },
            policies: { 
                total: pStats.totalSold, 
                active: pStats.activeSold, 
                totalPremium: pStats.totalPremium, 
                totalAgentCommission: pStats.totalCommission 
            },
            claims: { 
                total: cStats.totalClaims, 
                breakdown: claimsByStatus 
            }
        }, "Dashboard stats fetched successfully")
    );
});

/**
 * Get Customer Reports (Filtered)
 */
export const getCustomerReports = asyncHandler(async (req, res) => {
    const { startDate, endDate, agentId } = req.query;
    
    const matchStage = { role: "customer" };
    Object.assign(matchStage, getDateFilter(startDate, endDate));
    if (agentId) matchStage.assignedAgentId = new mongoose.Types.ObjectId(agentId);

    const newCustomersByMonth = await User.aggregate([
        { $match: matchStage },
        { 
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const customersByStatus = await User.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            growth: newCustomersByMonth,
            distribution: customersByStatus
        }, "Customer reports fetched")
    );
});

/**
 * Get Policy Reports (Visuals)
 */
export const getPolicyReports = asyncHandler(async (req, res) => {
    const { startDate, endDate, policyType, policySource, agentId } = req.query;

    // Base pipeline on User.purchasedPolicies for accurate sales data
    const basePipeline = [
        { $unwind: "$purchasedPolicies" },
        ...(startDate && endDate ? [{
            $match: {
                "purchasedPolicies.purchaseDate": {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59))
                }
            }
        }] : []),
        ...(agentId ? [{ $match: { "purchasedPolicies.agentId": new mongoose.Types.ObjectId(agentId) }}] : []),
        {
            $lookup: {
                from: "policies",
                localField: "purchasedPolicies.policy",
                foreignField: "_id",
                as: "policyData"
            }
        },
        { $unwind: "$policyData" },
        {
            $lookup: {
                from: "policytypes",
                localField: "policyData.policyType",
                foreignField: "_id",
                as: "typeData"
            }
        },
        { $unwind: "$typeData" },
        ...(policySource ? [{ $match: { "policyData.policySource": policySource } }] : []),
        ...(policyType ? [{ $match: { "typeData.name": policyType } }] : [])
    ];

    // Group by Policy Type
    const policiesByType = await User.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: "$typeData.name",
                count: { $sum: 1 },
                revenue: { $sum: "$policyData.premiumAmount" }
            }
        }
    ]);

    // Group by Source
    const policiesBySource = await User.aggregate([
        ...basePipeline,
        {
            $group: {
                _id: "$policyData.policySource",
                count: { $sum: 1 },
                avgPremium: { $avg: "$policyData.premiumAmount" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            byType: policiesByType,
            bySource: policiesBySource
        }, "Policy reports fetched")
    );
});

/**
 * Get Claim Reports (Visuals)
 */
export const getClaimReports = asyncHandler(async (req, res) => {
    const { startDate, endDate, claimStatus, agentId } = req.query;
    
    const pipeline = [
        { $match: { 
            ...getDateFilter(startDate, endDate),
            ...(claimStatus ? { status: claimStatus } : {})
        }},
        { // Lookup Customer for Agent Filter
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customerData"
            }
        },
        { $unwind: "$customerData" },
        ...(agentId ? [{
            $match: { "customerData.assignedAgentId": new mongoose.Types.ObjectId(agentId) }
        }] : [])
    ];

    const claimsOverTime = await Claim.aggregate([
        ...pipeline,
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 },
                amount: { $sum: "$approvedAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const claimsByType = await Claim.aggregate([
        ...pipeline,
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalRequested: { $sum: "$requestedAmount" },
                totalApproved: { $sum: "$approvedAmount" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            trends: claimsOverTime,
            byType: claimsByType
        }, "Claim reports fetched")
    );
});

/**
 * Get Tabular Export Data (Filtered)
 */
export const getExportData = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { startDate, endDate, policyType, policySource, claimStatus, agentId } = req.query;

    let data = [];

    switch (type) {
        case 'customers': {
            const query = { role: "customer" };
            Object.assign(query, getDateFilter(startDate, endDate));
            if (agentId) query.assignedAgentId = agentId;

            const customers = await User.find(query)
                .select("name email mobile status createdAt assignedAgentId purchasedPolicies")
                .populate("assignedAgentId", "name")
                .lean();

            data = customers.map(c => ({
                id: c._id,
                CustomerName: c.name || c.fullName,
                Email: c.email,
                Agent: c.assignedAgentId?.name || "Unassigned",
                PoliciesCount: c.purchasedPolicies?.length || 0,
                Status: c.status,
                JoinDate: c.createdAt
            }));
            break;
        }

        case 'policies': {
            // Policies Sold
            const pipeline = [
                { $unwind: "$purchasedPolicies" },
                ...(startDate && endDate ? [{
                    $match: {
                        "purchasedPolicies.purchaseDate": {
                            $gte: new Date(startDate),
                            $lte: new Date(new Date(endDate).setHours(23, 59, 59))
                        }
                    }
                }] : []),
                ...(agentId ? [{ $match: { "purchasedPolicies.agentId": new mongoose.Types.ObjectId(agentId) }}] : []),
                {
                    $lookup: {
                        from: "policies",
                        localField: "purchasedPolicies.policy",
                        foreignField: "_id",
                        as: "policyData"
                    }
                },
                { $unwind: "$policyData" },
                {
                    $lookup: {
                        from: "policytypes",
                        localField: "policyData.policyType",
                        foreignField: "_id",
                        as: "typeData"
                    }
                },
                { $unwind: "$typeData" },
                ...(policySource ? [{ $match: { "policyData.policySource": policySource } }] : []),
                ...(policyType ? [{ $match: { "typeData.name": policyType } }] : [])
            ];

            const policies = await User.aggregate(pipeline);

            data = policies.map(p => ({
                id: p.purchasedPolicies.policy, // or unique ID if needed
                PolicyName: p.policyData.policyName,
                Type: p.typeData.name,
                Source: p.policyData.policySource,
                Premium: p.policyData.premiumAmount,
                Coverage: p.policyData.coverageAmount,
                Status: p.purchasedPolicies.status
            }));
            break;
        }

        case 'claims': {
            const query = {};
            Object.assign(query, getDateFilter(startDate, endDate));
            if (claimStatus) query.status = claimStatus;

            // Agent filtering handled via lookup for claims
            let claims = [];
            if (agentId) {
                // Find customers of this agent
                const customerIds = await User.find({ role: "customer", assignedAgentId: agentId }).distinct('_id');
                query.customer = { $in: customerIds };
            }

            claims = await Claim.find(query)
                .populate("customer", "name")
                .populate("policy", "policyName")
                .lean();

            data = claims.map(c => ({
                id: c._id,
                ClaimID: c.claimNumber,
                Customer: c.customer?.name || "Unknown",
                Policy: c.policy?.policyName || "Unknown",
                ClaimType: c.type,
                ClaimAmount: c.requestedAmount,
                ApprovedAmount: c.approvedAmount,
                Status: c.status,
                ClaimDate: c.createdAt
            }));
            break;
        }

        case 'agents': {
            const query = { role: "agent" };
            if (agentId) query._id = agentId;

            const agents = await User.find(query).lean();
            
            // Performance metrics per agent
            data = await Promise.all(agents.map(async (agent) => {
                const customers = await User.countDocuments({ assignedAgentId: agent._id });

                // Sales Aggregation for this agent
                const sales = await User.aggregate([
                    { $unwind: "$purchasedPolicies" },
                    { $match: { "purchasedPolicies.agentId": agent._id } },
                    { // Apply Date filtering for "Sales Performance in Period"
                         ...(startDate && endDate ? {
                             $match: {
                                "purchasedPolicies.purchaseDate": {
                                    $gte: new Date(startDate),
                                    $lte: new Date(new Date(endDate).setHours(23, 59, 59))
                                }
                             }
                        } : {})
                    },
                    {
                        $lookup: {
                            from: "policies",
                            localField: "purchasedPolicies.policy",
                            foreignField: "_id",
                            as: "pDetails"
                        }
                    },
                    { $unwind: "$pDetails" },
                    {
                        $group: {
                            _id: null,
                            sold: { $sum: 1 },
                            premium: { $sum: "$pDetails.premiumAmount" },
                            commission: { $sum: "$pDetails.agentCommission" }
                        }
                    }
                ]);

                const s = sales[0] || { sold: 0, premium: 0, commission: 0 };

                return {
                    id: agent._id,
                    AgentName: agent.name || agent.fullName,
                    CustomersAssigned: customers,
                    PoliciesSold: s.sold,
                    PremiumGenerated: s.premium,
                    CommissionEarned: s.commission
                };
            }));
            break;
        }
        
        default:
            throw new ApiError(400, "Invalid report type");
    }

    return res.status(200).json(new ApiResponse(200, data, "Export data fetched"));
});
