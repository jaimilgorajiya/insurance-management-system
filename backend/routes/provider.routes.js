import { Router } from "express";
import { getProviders, createProvider, updateProvider, deleteProvider } from "../controllers/provider.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(verifyJWT);

router.route("/")
    .get(authorizeRoles("admin", "agent"), getProviders)
    .post(authorizeRoles("admin"), createProvider);

router.route("/:id")
    .put(authorizeRoles("admin"), updateProvider)
    .delete(authorizeRoles("admin"), deleteProvider);

export default router;
