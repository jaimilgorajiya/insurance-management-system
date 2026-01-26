import { Router } from "express";
import {
    getPolicyTypes,
    createPolicyType,
    updatePolicyType,
    togglePolicyTypeStatus,
    deletePolicyType
} from "../controllers/policyType.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Admin only routes
router.route("/")
    .get(authorizeRoles("admin"), getPolicyTypes)
    .post(authorizeRoles("admin"), createPolicyType);

router.route("/:id")
    .put(authorizeRoles("admin"), updatePolicyType)
    .delete(authorizeRoles("admin"), deletePolicyType);

router.route("/:id/status")
    .patch(authorizeRoles("admin"), togglePolicyTypeStatus);

export default router;
