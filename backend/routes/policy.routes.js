import { Router } from "express";
import {
    getPolicies,
    getPolicyById,
    getPolicySummary,
    createPolicy,
    updatePolicy,
    togglePolicyStatus,
    deletePolicy
} from "../controllers/policy.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Policy Summary Stats
router.route("/stats/summary").get(getPolicySummary);

router.route("/")
    .get(getPolicies)
    .post(authorizeRoles("admin"), createPolicy);

router.route("/:id")
    .get(getPolicyById)
    .put(authorizeRoles("admin"), updatePolicy)
    .delete(authorizeRoles("admin"), deletePolicy);

router.route("/:id/status")
    .patch(authorizeRoles("admin"), togglePolicyStatus);

export default router;
