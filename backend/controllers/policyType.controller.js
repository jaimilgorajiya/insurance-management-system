import { PolicyType } from "../models/policyType.models.js";
import { Policy } from "../models/policy.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /admin/policy-types
export const getPolicyTypes = asyncHandler(async (req, res) => {
    const types = await PolicyType.find({}).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, types, "Policy types fetched successfully")
    );
});

// POST /admin/policy-types
export const createPolicyType = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;

    if (!name) {
        throw new ApiError(400, "Policy Type Name is required");
    }

    const existing = await PolicyType.findOne({ name });
    if (existing) {
        throw new ApiError(400, "Policy Type with this name already exists");
    }

    const policyType = await PolicyType.create({
        name,
        description,
        status: status || "active",
        createdBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, policyType, "Policy Type created successfully")
    );
});

// PUT /admin/policy-types/:id
export const updatePolicyType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const policyType = await PolicyType.findById(id);
    if (!policyType) {
        throw new ApiError(404, "Policy Type not found");
    }

    // Check name uniqueness if changed
    if (name && name !== policyType.name) {
        const existing = await PolicyType.findOne({ name });
        if (existing) {
            throw new ApiError(400, "Policy Type with this name already exists");
        }
        policyType.name = name;
    }

    if (description !== undefined) policyType.description = description;
    if (status) policyType.status = status;

    await policyType.save();

    return res.status(200).json(
        new ApiResponse(200, policyType, "Policy Type updated successfully")
    );
});

// PATCH /admin/policy-types/:id/status
export const togglePolicyTypeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // active or inactive

    if (!["active", "inactive"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const policyType = await PolicyType.findById(id);
    if (!policyType) {
        throw new ApiError(404, "Policy Type not found");
    }

    // Rule: Cannot deactivate if in use by active policies?
    // User constraint: "Policy types cannot be deleted if already in use". 
    // It says "Inactive policy types must NOT appear in policy creation dropdown".
    // It doesn't explicitly forbid deactivating. But deleting is forbidden.
    // I will implementation toggle status freely but warn if in use? 
    // The requirement says "Status toggle instead of hard delete".
    
    policyType.status = status;
    await policyType.save();

    return res.status(200).json(
        new ApiResponse(200, policyType, `Policy Type ${status} successfully`)
    );
});

// DELETE /admin/policy-types/:id
export const deletePolicyType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if in use
    const policiesCount = await Policy.countDocuments({ policyType: id });
    if (policiesCount > 0) {
        throw new ApiError(400, "Cannot delete policy type as it is currently in use by active policies");
    }

    const policyType = await PolicyType.findByIdAndDelete(id);
    if (!policyType) {
        throw new ApiError(404, "Policy Type not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Policy Type deleted successfully")
    );
});
