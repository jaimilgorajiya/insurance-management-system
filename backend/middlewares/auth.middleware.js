import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
                      req.header("Authorization")?.replace("Bearer ", "") ||
                      req.query.token;

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized request" 
            });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.id).select("-password");

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid Access Token" 
            });
        }

        if (user.status === "inactive") {
            return res.status(403).json({ 
                success: false,
                message: "Account is inactive. Please contact administrator." 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false,
            message: error?.message || "Invalid access token" 
        });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required" 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                message: `Access denied: Role '${req.user.role}' is not authorized for this resource` 
            });
        }
        
        next();
    };
};

export const checkPermission = (module, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        // Admins have all permissions
        if (req.user.role === "admin") {
            return next();
        }

        // Check if agent has the specific permission
        const userPermissions = req.user.permissions;
        
        console.log(`Checking permission for User: ${req.user.email} Role: ${req.user.role}`);
        console.log(`Module: ${module}, Action: ${action}`);
        console.log(`User Permissions:`, JSON.stringify(userPermissions, null, 2));

        if (userPermissions && 
            userPermissions[module] && 
            userPermissions[module][action] === true) {
            console.log(`Permission GRANTED`);
            return next();
        }

        console.log(`Permission DENIED`);

        return res.status(403).json({
            success: false,
            message: `Access denied: You do not have '${action}' permission for '${module}'.`,
            details: {
                role: req.user.role,
                module,
                action,
                hasMatrix: !!userPermissions,
                permissionValue: userPermissions?.[module]?.[action]
            }
        });
    };
};
