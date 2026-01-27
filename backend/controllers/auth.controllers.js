import { User } from "../models/user.models.js";
import { comparePassword } from "@jaimilgorajiya/password-utils";
import { generateTokenAndResponse } from "../utils/generateToken.js";

/**
 * Unified Login Controller
 * Handles authentication for all user roles (admin, agent, customer)
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email (regardless of role)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check account status
        if (user.status === "inactive") {
            return res.status(403).json({
                success: false,
                message: "Account is inactive. Please contact administrator."
            });
        }

        // Generate token and send response
        const tokenResponse = await generateTokenAndResponse(user, res, "Login successful");
        
        // Return standardized response format
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    permissions: user.permissions
                },
                accessToken: tokenResponse.accessToken
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

/**
 * Unified Logout Controller
 * Clears authentication cookies
 */
export const logout = async (req, res) => {
    try {
        const options = { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        };
        
        return res.status(200)
            .clearCookie("accessToken", options)
            .json({
                success: true,
                message: "Logged out successfully"
            });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const user = await User.findById(req.user._id).select("-password");

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};