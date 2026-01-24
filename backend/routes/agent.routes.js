import { Router } from "express";
import { 
    registerAgent, loginAgent, logoutAgent,
    getAllAgents, updateAgent, deleteAgent 
} from "../controllers/agent.controllers.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// --- DEPRECATED AUTH ROUTES (Use /api/auth/login instead) ---
router.post("/login", loginAgent);
router.post("/logout", logoutAgent);

// --- AGENT SELF-REGISTRATION ---
router.post("/register", registerAgent);

// --- AGENT MANAGEMENT (Admin Access) ---
router.get("/all", verifyJWT, authorizeRoles("admin"), getAllAgents);
router.put("/update/:id", verifyJWT, authorizeRoles("admin"), updateAgent);
router.delete("/delete/:id", verifyJWT, authorizeRoles("admin"), deleteAgent);
        
export default router;
