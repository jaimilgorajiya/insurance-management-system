import { Router } from "express";
import { getProviders, createProvider, updateProvider, deleteProvider } from "../controllers/provider.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.route("/")
    .get(getProviders)
    .post(createProvider);

router.route("/:id")
    .put(updateProvider)
    .delete(deleteProvider);

export default router;
