import { Router } from "express";
import { 
    getRolePermissions, 
    updateRolePermissions,
    getAllRoles
} from "../controllers/role.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes - Admin only
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.route("/").get(getAllRoles);
router.route("/:roleName")
    .get(getRolePermissions)
    .put(updateRolePermissions);

export default router;
