import { createUser, canCreateUser } from "../services/userService.js";
import { User } from "../models/user.models.js";

/**
 * Create Agent (Admin only)
 */
export const createAgent = async (req, res) => {
    try {
        const { name, email, mobile } = req.body;

        // Validate permissions
        if (!canCreateUser(req.user, "agent")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to create agents"
            });
        }

        // Create agent
        const result = await createUser(
            { name, email, mobile, role: "agent" },
            req.user
        );

        return res.status(201).json({
            success: true,
            message: "Agent created successfully. Credentials sent via email.",
            data: {
                user: result.user,
                tempPassword: result.tempPassword // For development/testing
            }
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Create Customer (Admin and Agent can create)
 */
export const createCustomer = async (req, res) => {
    try {
        const { name, email, mobile } = req.body;

        // Validate permissions
        if (!canCreateUser(req.user, "customer")) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to create customers"
            });
        }

        // Create customer
        const result = await createUser(
            { name, email, mobile, role: "customer" },
            req.user
        );

        return res.status(201).json({
            success: true,
            message: "Customer created successfully. Credentials sent via email.",
            data: {
                user: result.user,
                tempPassword: result.tempPassword // For development/testing
            }
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all users by role (with proper authorization)
 */
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        // Validate role parameter
        if (!["admin", "agent", "customer"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        // Build query based on user permissions
        let query = { role };

        // If customer is requesting, only show their created customers
        if (req.user.role === "customer") {
            if (role !== "customer") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
            query.createdBy = req.user._id;
        }

        const users = await User.find(query).select("-password").populate("createdBy", "name email");

        return res.status(200).json({
            success: true,
            message: `${role}s fetched successfully`,
            data: {
                total: users.length,
                users
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};