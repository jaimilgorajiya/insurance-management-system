import { Router } from "express";
import { 
    onboardCustomer, 
    upload, 
    getKYCDocument, 
    updateKYCDocumentStatus, 
    getCustomerOnboardingDetails,
    updateCustomerOnboarding
} from "../controllers/customerOnboarding.controllers.js";
import { verifyJWT, authorizeRoles, checkPermission } from "../middlewares/auth.middleware.js";

const router = Router();

// Onboard new customer
// Allows Admin/Agent to create customers with full KYC
router.post("/onboard", 
    verifyJWT, 
    authorizeRoles("admin", "agent"),
    checkPermission("customers", "create"),
    upload.fields([
        { name: 'governmentId', maxCount: 1 },
        { name: 'proofOfAddress', maxCount: 1 },
        { name: 'incomeProof', maxCount: 1 }
    ]), 
    onboardCustomer
);

// Get KYC Document
// Admin can view any, Customer can view their own (logic in controller)
router.get("/document/:customerId/:documentType", 
    verifyJWT, 
    authorizeRoles("admin", "agent", "customer"),
    getKYCDocument
);

// Update KYC Document Status (Admin/Agent only)
router.patch("/document-status/:customerId/:documentType", 
    verifyJWT, 
    authorizeRoles("admin", "agent"),
    updateKYCDocumentStatus
);

// Get Onboarding Details
router.get("/details/:customerId", 
    verifyJWT, 
    authorizeRoles("admin", "agent", "customer"),
    checkPermission("customers", "view"),
    getCustomerOnboardingDetails
);

router.put("/update/:customerId",
    verifyJWT,
    authorizeRoles("admin", "agent"),
    checkPermission("customers", "edit"),
    upload.fields([
        { name: 'governmentId', maxCount: 1 },
        { name: 'proofOfAddress', maxCount: 1 },
        { name: 'incomeProof', maxCount: 1 }
    ]),
    updateCustomerOnboarding
);

export default router;