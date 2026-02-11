
import express from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { 
    createTicket, 
    getTickets, 
    getTicketById, 
    addReply, 
    updateTicketStatus 
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create ticket (Customer only, or maybe agents/admin too? mostly customers)
import { upload } from "../middlewares/multer.middleware.js";
router.post("/", upload.single('attachment'), createTicket);

// Get all tickets
router.get("/", getTickets);

// Get single ticket
router.get("/:id", getTicketById);

// Add reply
router.post("/:id/reply", addReply);

// Update status (Admin/Agent only)
router.patch("/:id/status", authorizeRoles("admin", "agent"), updateTicketStatus);

export default router;
