import { Router } from "express";
import {
    registerAdmin, loginAdmin, logoutAdmin,
    getAllAdmins, updateAdminStatus, updateAdmin, deleteAdmin, // Master Actions
} from "../controllers/admin.controllers.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// --- DEPRECATED AUTH ROUTES (Use /api/auth/login instead) ---
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

// --- MASTER ADMIN OPERATIONS (Public for external master admin system) ---
router.post("/register", registerAdmin); // Master admin can create admins without auth

// --- ADMIN MANAGEMENT (Protected Routes) ---
// These routes require admin role authorization
router.get("/all", verifyJWT, authorizeRoles("admin"), getAllAdmins);
router.patch("/status/:id", verifyJWT, authorizeRoles("admin"), updateAdminStatus);
router.put("/update/:id", verifyJWT, authorizeRoles("admin"), updateAdmin);
router.delete("/delete/:id", verifyJWT, authorizeRoles("admin"), deleteAdmin);

export default router;
