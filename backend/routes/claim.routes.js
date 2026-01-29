import { Router } from "express";
import { 
    createClaim, 
    getClaims, 
    getClaimById, 
    updateClaimStatus, 
    addClaimNote,
    uploadClaimDocument
} from "../controllers/claim.controllers.js";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // Assessing multer is available

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(checkPermission("claims", "create"), createClaim)
    .get(checkPermission("claims", "view"), getClaims);

router.route("/:id")
    .get(checkPermission("claims", "view"), getClaimById);

router.route("/:id/status")
    .put(checkPermission("claims", "edit"), updateClaimStatus);

router.route("/:id/notes")
    .post(checkPermission("claims", "edit"), addClaimNote);

router.route("/:id/documents")
    .post(checkPermission("claims", "create"), upload.single("document"), uploadClaimDocument);

export default router;
