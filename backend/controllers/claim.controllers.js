import { Claim } from "../models/claim.models.js";
import { User } from "../models/user.models.js";
import { Policy } from "../models/policy.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";

// Helper to generate unique claim ID
const generateClaimId = async () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CLM-${timestamp}-${random}`;
};

// POST /api/claims
export const createClaim = asyncHandler(async (req, res) => {
    const { policyId, customerId, type, incidentDate, description, requestedAmount } = req.body;

    // Validation
    if (!policyId || !type || !incidentDate || !description || !requestedAmount) {
        throw new ApiError(400, "All fields are required");
    }

    // Role-based customer ID assignment
    let targetCustomerId;
    if (req.user.role === 'customer') {
        targetCustomerId = req.user._id;
    } else {
        targetCustomerId = customerId;
        if (!targetCustomerId) throw new ApiError(400, "Customer ID is required for agent/admin created claims");
    }

    // Verify Policy Ownership and Validity
    // Verify Policy Ownership and Validity
    const customer = await User.findById(targetCustomerId);
    if (!customer) throw new ApiError(404, "Customer not found");

    const purchasedPolicy = customer.purchasedPolicies.find(p => p.policy.toString() === policyId);
    if (!purchasedPolicy) throw new ApiError(403, "This policy does not belong to the selected customer");
    
    if (purchasedPolicy.status !== 'active') {
        throw new ApiError(400, `Cannot create claim: Policy is ${purchasedPolicy.status}`);
    }

    // Fetch full policy details for calculation
    const policyDetails = await Policy.findById(policyId);
    if (!policyDetails) throw new ApiError(404, "Policy details not found");

    // Maturity Logic Preparation
    let maturityData = {};
    if (type === 'Maturity') {
        const startDate = new Date(purchasedPolicy.purchaseDate);
        const claimDate = new Date(incidentDate);
        let expiryDate = new Date(startDate);

        // Calculate Expiry Date
        if (policyDetails.tenureUnit === 'years') {
            expiryDate.setFullYear(expiryDate.getFullYear() + policyDetails.tenureValue);
        } else if (policyDetails.tenureUnit === 'months') {
            expiryDate.setMonth(expiryDate.getMonth() + policyDetails.tenureValue);
        } else { // days
            expiryDate.setDate(expiryDate.getDate() + policyDetails.tenureValue);
        }

        // 1. Calculate Payable Amount
        let calculatedPayable = 0;
        let maturityType = "ON_TIME";

        if (claimDate >= expiryDate) {
            // Full Maturity
            calculatedPayable = policyDetails.coverageAmount;
            maturityType = "ON_TIME";
        } else {
            // Early Maturity
            maturityType = "EARLY";
            const totalDuration = expiryDate.getTime() - startDate.getTime();
            const elapsedDuration = claimDate.getTime() - startDate.getTime();
            
            // Avoid division by zero
            if (totalDuration <= 0) {
                 calculatedPayable = policyDetails.coverageAmount; // Fallback
            } else {
                // Ratio can't be negative
                const ratio = Math.max(0, elapsedDuration / totalDuration);
                calculatedPayable = policyDetails.coverageAmount * ratio;
            }
        }
        
        // Formatting to 2 decimals
        calculatedPayable = Math.round(calculatedPayable * 100) / 100;

        // 2. Validate Requested Amount
        // Allow a small epsilon for floating point differences or just strict comparison
        if (Number(requestedAmount) > calculatedPayable + 1) { // +1 buffer for rounding
             throw new ApiError(400, `Requested amount (${requestedAmount}) exceeds eligible maturity amount (${calculatedPayable})`);
        }

        maturityData = {
            maturityType,
            policyExpiryDate: expiryDate,
            calculatedPayableAmount: calculatedPayable
        };
    }
    
    // Check if duplicate claim exists (basic check)
    // const existingClaim = await Claim.findOne({ policy: policyId, incidentDate: new Date(incidentDate), status: { $ne: 'Rejected' } });
    // if (existingClaim) throw new ApiError(400, "A claim for this incident date already exists");

    const claimId = await generateClaimId();

    const claim = await Claim.create({
        claimNumber: claimId,
        policy: policyId,
        customer: targetCustomerId,
        type,
        incidentDate,
        description,
        requestedAmount,
        createdBy: req.user._id,
        timeline: [{
            status: "Submitted",
            changedBy: req.user._id,
            date: new Date(),
            note: "Claim created"
        }],
        ...maturityData
    });

    // Mark policy as 'claimed' so it doesn't show in active lists
    const policyIndex = customer.purchasedPolicies.findIndex(p => p.policy.toString() === policyId);
    if (policyIndex !== -1) {
        customer.purchasedPolicies[policyIndex].status = 'claimed';
        await customer.save();
    }

    return res.status(201).json(
        new ApiResponse(201, claim, "Claim submitted successfully")
    );
});

// GET /api/claims
export const getClaims = asyncHandler(async (req, res) => {
    let query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
        query.customer = req.user._id;
    } else if (req.user.role === 'agent') {
        // Agents can only see claims for their assigned OR created customers
        const myCustomers = await User.find({ 
            $or: [
                { assignedAgentId: req.user._id },
                { createdBy: req.user._id }
            ]
        }).select('_id');
        const customerIds = myCustomers.map(c => c._id);
        query.customer = { $in: customerIds };
    } 
    // Admins see all by default

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    if (req.query.search) {
        query.$or = [
            { claimNumber: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    const claims = await Claim.find(query)
        .populate('customer', 'name email mobile')
        .populate({
            path: 'policy',
            populate: { path: 'policyType', select: 'name' }
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, claims, "Claims fetched successfully")
    );
});

// GET /api/claims/:id
export const getClaimById = asyncHandler(async (req, res) => {
    const claim = await Claim.findById(req.params.id)
        .populate('customer', 'name email mobile address purchasedPolicies')
        .populate({
            path: 'policy',
            populate: { path: 'policyType' } // Get full policy type info
        })
        .populate('timeline.changedBy', 'name role')
        .populate('notes.createdBy', 'name role');

    if (!claim) throw new ApiError(404, "Claim not found");

    // Security Check
    if (req.user.role === 'customer' && claim.customer._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }
    if (req.user.role === 'agent') {
        const customer = await User.findById(claim.customer._id);
        const isAssigned = customer.assignedAgentId?.toString() === req.user._id.toString();
        const isCreator = customer.createdBy?.toString() === req.user._id.toString();
        
        if (!isAssigned && !isCreator) {
            throw new ApiError(403, "Access denied: Not your customer");
        }
    }

    return res.status(200).json(
        new ApiResponse(200, claim, "Claim details fetched successfully")
    );
});

// PUT /api/claims/:id/status
export const updateClaimStatus = asyncHandler(async (req, res) => {
    const { status, note, approvedAmount } = req.body;
    
    // Only Admin/Manager can update status (Agent can maybe only request info? For now restrict to Admin)
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Only admins can update claim status");
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new ApiError(404, "Claim not found");

    claim.status = status;
    if (approvedAmount !== undefined) claim.approvedAmount = approvedAmount;
    
    claim.timeline.push({
        status,
        changedBy: req.user._id,
        date: new Date(),
        note: note || `Status updated to ${status}`
    });

    await claim.save();

    return res.status(200).json(
        new ApiResponse(200, claim, "Claim status updated successfully")
    );
});

// POST /api/claims/:id/notes
export const addClaimNote = asyncHandler(async (req, res) => {
    const { text, isInternal } = req.body;

    // Customers cannot add notes (use other endpoint or support ticket in real app)
    // For now, let's say only agents/admins add notes
    if (req.user.role === 'customer') {
        throw new ApiError(403, "Customers cannot add internal notes");
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new ApiError(404, "Claim not found");

    // Security check for Agents
    if (req.user.role === 'agent') {
        const customer = await User.findById(claim.customer);
        const isAssigned = customer.assignedAgentId?.toString() === req.user._id.toString();
        const isCreator = customer.createdBy?.toString() === req.user._id.toString();

        if (!isAssigned && !isCreator) {
            throw new ApiError(403, "Access denied");
        }
    }

    claim.notes.push({
        text,
        isInternal: isInternal || false,
        createdBy: req.user._id
    });

    await claim.save();

    return res.status(200).json(
        new ApiResponse(200, claim, "Note added successfully")
    );
});

// POST /api/claims/:id/documents
// This assumes file upload middleware handles the file and puts it in req.files or req.file
export const uploadClaimDocument = asyncHandler(async (req, res) => {
    // Basic stub for document upload logic - simplified for now
    const { name, type } = req.body;
    const file = req.file; // Provided by multer

    if (!file) throw new ApiError(400, "No file uploaded");

    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new ApiError(404, "Claim not found");

    // Security check
    if (req.user.role === 'customer' && claim.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

    // Normalize path for URL robustly
    let relativePath;
    try {
        // file.path is absolute or relative to CWD depending on config, but usually absolute with multer+path.join
        // We want path relative to backend root (where server.js and uploads/ folder are)
        const rootDir = process.cwd();
        relativePath = path.relative(rootDir, file.path);
        // Ensure forward slashes for URL
        relativePath = relativePath.split(path.sep).join('/');
    } catch (err) {
        console.error("Error normalizing path:", err);
        relativePath = file.path; // Fallback
    }

    claim.documents.push({
        name: name || file.originalname,
        url: relativePath, 
        type: type || "General",
        uploadedAt: new Date()
    });

    await claim.save();

    return res.status(200).json(
        new ApiResponse(200, claim, "Document uploaded successfully")
    );
});
