import { Router } from "express";
import { 
    registerAgent, loginAgent, logoutAgent,
    getAllAgents, updateAgent, deleteAgent,
    getMyCommissions, updateAgentPermissions, getAgentDashboardStats
} from "../controllers/agent.controllers.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// --- DEPRECATED AUTH ROUTES (Use /api/auth/login instead) ---
router.post("/login", loginAgent);
router.post("/logout", logoutAgent);

// --- AGENT SELF-REGISTRATION ---
router.post("/register", registerAgent);

// --- AGENT ACTIONS ---
router.get("/my-commissions", verifyJWT, authorizeRoles("agent"), getMyCommissions);
router.get("/stats", verifyJWT, authorizeRoles("agent"), getAgentDashboardStats);

// --- AGENT MANAGEMENT (Admin Access) ---
router.get("/all", verifyJWT, authorizeRoles("admin"), getAllAgents);
router.put("/update/:id", verifyJWT, authorizeRoles("admin"), updateAgent);
router.patch("/permissions/:id", verifyJWT, authorizeRoles("admin"), updateAgentPermissions);
router.delete("/delete/:id", verifyJWT, authorizeRoles("admin"), deleteAgent);
        
export default router;
