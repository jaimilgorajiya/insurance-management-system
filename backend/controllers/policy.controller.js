import { Policy } from "../models/policy.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/policies
export const getPolicies = asyncHandler(async (req, res) => {
    // Populate policyType name
    const policies = await Policy.find({})
        .populate("policyType", "name status")
        .sort({ createdAt: -1 });

    // Filter out policies that belong to an inactive category
    const activePolicies = policies.filter(policy => 
        !policy.policyType || policy.policyType.status === 'active'
    );

    return res.status(200).json(
        new ApiResponse(200, activePolicies, "Policies fetched successfully")
    );
});

// GET /api/policies/:id
export const getPolicyById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const policy = await Policy.findById(id).populate("policyType", "name badgeColor");

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, policy, "Policy details fetched successfully")
    );
});

// GET /api/policies/stats/summary
export const getPolicySummary = asyncHandler(async (req, res) => {
    const summary = await Policy.aggregate([
        {
            $group: {
                _id: "$policyType",
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "policytypes",
                localField: "_id",
                foreignField: "_id",
                as: "typeInfo"
            }
        },
        {
            $unwind: "$typeInfo"
        },
        {
            $match: {
                "typeInfo.status": "active"
            }
        },
        {
            $project: {
                _id: 1,
                type: "$typeInfo.name",
                count: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, summary, "Policy summary fetched successfully")
    );
});

// POST /api/policies
export const createPolicy = asyncHandler(async (req, res) => {
    const {
        policyName,
        policyType,
        planName,
        description,
        premiumAmount,
        coverageAmount,
        tenureValue,
        tenureUnit,
        minAge,
        maxAge,
        renewable,
        status
    } = req.body;

    if (!policyName || !policyType || !planName || !premiumAmount || !coverageAmount || !tenureValue || !tenureUnit) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Guardrails
    if (Number(premiumAmount) <= 0) {
        throw new ApiError(400, "Premium Amount must be greater than 0");
    }

    if (Number(coverageAmount) <= Number(premiumAmount)) {
        throw new ApiError(400, "Coverage Amount must be greater than Premium Amount");
    }

    if (Number(tenureValue) <= 0) {
        throw new ApiError(400, "Tenure Value must be greater than 0");
    }

    if (Number(minAge) > Number(maxAge)) {
        throw new ApiError(400, "Minimum Age cannot be greater than Maximum Age");
    }

    const policy = await Policy.create({
        policyName,
        policyType,
        planName,
        description,
        premiumAmount,
        coverageAmount,
        tenureValue,
        tenureUnit,
        minAge,
        maxAge,
        renewable,
        status: status || "active",
        createdBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, policy, "Policy created successfully")
    );
});

// PUT /api/policies/:id
export const updatePolicy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const policy = await Policy.findById(id);
    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    const { premiumAmount, coverageAmount, minAge, maxAge, tenureValue } = updateData;

    // Guardrails for update
    if (premiumAmount !== undefined && Number(premiumAmount) <= 0) {
        throw new ApiError(400, "Premium Amount must be greater than 0");
    }

    const finalPremium = premiumAmount !== undefined ? premiumAmount : policy.premiumAmount;
    const finalCoverage = coverageAmount !== undefined ? coverageAmount : policy.coverageAmount;

    if (coverageAmount !== undefined || premiumAmount !== undefined) {
        if (Number(finalCoverage) <= Number(finalPremium)) {
            throw new ApiError(400, "Coverage Amount must be greater than Premium Amount");
        }
    }

    if (tenureValue !== undefined && Number(tenureValue) <= 0) {
        throw new ApiError(400, "Tenure Value must be greater than 0");
    }

    const finalMinAge = minAge !== undefined ? minAge : policy.minAge;
    const finalMaxAge = maxAge !== undefined ? maxAge : policy.maxAge;

    if (minAge !== undefined || maxAge !== undefined) {
        if (Number(finalMinAge) > Number(finalMaxAge)) {
            throw new ApiError(400, "Minimum Age cannot be greater than Maximum Age");
        }
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
        id,
        {
            ...updateData
        },
        { new: true, runValidators: true }
    );

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPolicy, "Policy updated successfully")
    );
});

// PATCH /api/policies/:id/status
export const togglePolicyStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const policy = await Policy.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, policy, "Policy status updated successfully")
    );
});

// DELETE /api/policies/:id
export const deletePolicy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const policy = await Policy.findByIdAndDelete(id);

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Policy deleted successfully")
    );
});
