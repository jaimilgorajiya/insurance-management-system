import { Router } from "express";
import { 
    createCustomer, loginCustomer, logoutCustomer,
    getCustomers, updateCustomer, deleteCustomer
} from "../controllers/customer.controllers.js";
import { verifyJWT, authorizeRoles, checkPermission } from "../middlewares/auth.middleware.js";

const router = Router();

// --- DEPRECATED AUTH ROUTES (Use /api/auth/login instead) ---
router.post("/login", loginCustomer);
router.post("/logout", logoutCustomer);

// --- CUSTOMER SELF-REGISTRATION ---
router.post("/register", createCustomer);

// --- CUSTOMER MANAGEMENT (Admin/Agent Access) ---
router.get("/all", verifyJWT, authorizeRoles("admin", "agent"), checkPermission("customers", "view"), getCustomers);
router.put("/update/:id", verifyJWT, authorizeRoles("admin", "agent"), checkPermission("customers", "edit"), updateCustomer);
router.delete("/delete/:id", verifyJWT, authorizeRoles("admin", "agent"), checkPermission("customers", "delete"), deleteCustomer);

// --- SUB-CUSTOMER MANAGEMENT (Customer Access) ---
router.post("/create", verifyJWT, authorizeRoles("customer", "admin"), createCustomer);
router.get("/my-customers", verifyJWT, authorizeRoles("customer", "admin"), getCustomers);
router.put("/my-customers/:id", verifyJWT, authorizeRoles("customer", "admin"), updateCustomer);
router.delete("/my-customers/:id", verifyJWT, authorizeRoles("customer", "admin"), deleteCustomer);

export default router;
