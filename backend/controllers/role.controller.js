import { Role } from "../models/role.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper to ensure default roles exist
const ensureRoleExists = async (roleName) => {
    let role = await Role.findOne({ name: roleName });
    if (!role) {
        role = await Role.create({ 
            name: roleName, 
            permissions: [], 
            description: `Default ${roleName} role` 
        });
    }
    return role;
};

export const getRolePermissions = asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    
    // Ensure the role document exists so frontend always gets a valid response
    const role = await ensureRoleExists(roleName);

    return res.status(200).json(
        new ApiResponse(200, role, "Permissions fetched successfully")
    );
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
        throw new ApiError(400, "Permissions must be an array of strings");
    }

    const role = await Role.findOneAndUpdate(
        { name: roleName },
        { permissions: permissions },
        { new: true, upsert: true } // Upsert just in case, though get should handle it
    );

    return res.status(200).json(
        new ApiResponse(200, role, "Permissions updated successfully")
    );
});

export const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({});
    return res.status(200).json(
        new ApiResponse(200, roles, "All roles fetched successfully")
    );
});
