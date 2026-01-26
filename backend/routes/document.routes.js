import { Router } from "express";
import { getCustomersWithDocuments, getCustomerDocuments } from "../controllers/document.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.route("/customers").get(getCustomersWithDocuments);
router.route("/customers/:customerId").get(getCustomerDocuments);

export default router;
