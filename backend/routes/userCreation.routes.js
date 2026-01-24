import { Router } from "express";
import { createAgent, createCustomer, getUsersByRole } from "../controllers/userCreation.controllers.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * User Creation Routes
 * All routes require authentication
 */

// Agent Creation (Admin only)
router.post("/agents", verifyJWT, authorizeRoles("admin"), createAgent);

// Customer Creation (Admin and Agent)
router.post("/customers", verifyJWT, authorizeRoles("admin", "agent"), createCustomer);

// Get users by role (with proper authorization)
router.get("/:role", verifyJWT, authorizeRoles("admin", "agent", "customer"), getUsersByRole);

export default router;