import { Router } from "express";
import { 
    getDashboardStats, 
    getCustomerReports, 
    getPolicyReports, 
    getClaimReports,
    getExportData
} from "../controllers/report.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require Admin privileges
router.use(verifyJWT, authorizeRoles("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/customers", getCustomerReports);
router.get("/policies", getPolicyReports);
router.get("/claims", getClaimReports);
router.get("/export/:type", getExportData);

export default router;
