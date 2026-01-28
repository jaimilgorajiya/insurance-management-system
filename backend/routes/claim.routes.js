import { Router } from "express";
import { 
    createClaim, 
    getClaims, 
    getClaimById, 
    updateClaimStatus, 
    addClaimNote,
    uploadClaimDocument
} from "../controllers/claim.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // Assessing multer is available

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createClaim)
    .get(getClaims);

router.route("/:id")
    .get(getClaimById);

router.route("/:id/status")
    .put(updateClaimStatus);

router.route("/:id/notes")
    .post(addClaimNote);

router.route("/:id/documents")
    .post(upload.single("document"), uploadClaimDocument);

export default router;
