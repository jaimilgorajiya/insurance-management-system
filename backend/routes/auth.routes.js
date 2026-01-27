import { Router } from "express";
import { login, logout, getMe } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Unified Authentication Routes
 * POST /auth/login - Single login endpoint for all roles
 * POST /auth/logout - Logout endpoint
 */

// Public routes
router.post("/login", login);

// Protected routes
router.get("/me", verifyJWT, getMe);
router.post("/logout", verifyJWT, logout);

export default router;