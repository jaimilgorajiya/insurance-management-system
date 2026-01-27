import { Role } from "../models/role.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.models.js";

// Helper to ensure default roles exist
const ensureRoleExists = async (roleName) => {
    let role = await Role.findOne({ name: roleName });
    if (!role) {
        // Default structure matching User model
        const defaultPermissions = {
            customers: { create: true, view: true, edit: true, delete: false },
            policies: { view: true },
            kyc: { approve: false, reject: false },
            claims: { create: true, view: true, edit: false, delete: false }
        };
        
        role = await Role.create({ 
            name: roleName, 
            permissions: defaultPermissions, 
            description: `Default ${roleName} role` 
        });
    }
    return role;
};

export const getRolePermissions = asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    
    const role = await ensureRoleExists(roleName);

    return res.status(200).json(
        new ApiResponse(200, role, "Permissions fetched successfully")
    );
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    const { permissions } = req.body;

    const role = await Role.findOneAndUpdate(
        { name: roleName },
        { permissions: permissions },
        { new: true, upsert: true }
    );

    // Propagate changes to all users with this role
    await User.updateMany(
        { role: roleName },
        { $set: { permissions: permissions } }
    );

    return res.status(200).json(
        new ApiResponse(200, role, "Permissions updated globally for all " + roleName + "s")
    );
});

export const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({});
    return res.status(200).json(
        new ApiResponse(200, roles, "All roles fetched successfully")
    );
});
