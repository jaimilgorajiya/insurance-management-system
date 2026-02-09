import { Router } from "express";
import { getVehicleInfo } from "../controllers/vehicle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Retrieve vehicle details
// Secured route example (requires login). 
// Remove verifyJWT if this should be public, but usually CRM features are private.
router.route("/details/:vehicleNumber").get(verifyJWT, getVehicleInfo);

export default router;
