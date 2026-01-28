import { User } from "../models/user.models.js";
import { Claim } from "../models/claim.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/documents/customers
// Lists customers who have uploaded at least one document (including Claim documents)
export const getCustomersWithDocuments = asyncHandler(async (req, res) => {
    // 1. Find customers who have claim documents
    const claimCustomerIds = await Claim.distinct('customer', { 'documents.0': { $exists: true } });

    // 2. Find customers matches KYC criteria OR is in the claim list
    const customers = await User.find({
        role: "customer",
        $or: [
            { _id: { $in: claimCustomerIds } }, // Include customers with claim docs
            { "kycDocuments.governmentId": { $exists: true } },
            { "kycDocuments.proofOfAddress": { $exists: true } },
            { "kycDocuments.incomeProof": { $exists: true } },
            { "kycDocuments.nomineeId": { $exists: true } },
            { "kycDocuments.otherDocuments": { $not: { $size: 0 } } },
            { "purchasedPolicies.policyDocument": { $exists: true } }
        ]
    }).select("firstName lastName name email kycDocuments purchasedPolicies");

    // 3. Needs to fetch Claims for these customers to count correctly? 
    // To avoid N+1 queries loop, let's fetch all relevant claims once.
    const relevantClaims = await Claim.find({ 
        customer: { $in: customers.map(c => c._id) },
        'documents.0': { $exists: true } 
    }).select('customer documents');

    // Index claims by customer ID for fast lookup
    const claimsByCustomer = {};
    relevantClaims.forEach(c => {
        if (!claimsByCustomer[c.customer]) claimsByCustomer[c.customer] = [];
        claimsByCustomer[c.customer].push(...c.documents);
    });

    const result = customers.map(customer => {
        let docCount = 0;
        let lastUpload = null;
        const docs = customer.kycDocuments || {};

        const trackDoc = (doc) => {
            if (doc && doc.filename) {
                docCount++;
                if (doc.uploadDate && (!lastUpload || new Date(doc.uploadDate) > new Date(lastUpload))) {
                    lastUpload = doc.uploadDate;
                }
            }
        };

        const trackDateOnly = (date) => {
             if (date && (!lastUpload || new Date(date) > new Date(lastUpload))) {
                lastUpload = date;
            }
        }

        trackDoc(docs.governmentId);
        trackDoc(docs.proofOfAddress);
        trackDoc(docs.incomeProof);
        trackDoc(docs.nomineeId);

        if (docs.otherDocuments && docs.otherDocuments.length > 0) {
            docs.otherDocuments.forEach(trackDoc);
        }

        // Track Policy Documents
        if (customer.purchasedPolicies && customer.purchasedPolicies.length > 0) {
            customer.purchasedPolicies.forEach(p => {
                if (p.policyDocument) {
                    docCount++;
                    trackDateOnly(p.purchaseDate);
                }
            });
        }

        // Track Claim Documents
        const customerClaimsDocs = claimsByCustomer[customer._id] || [];
        customerClaimsDocs.forEach(doc => {
            docCount++;
            trackDateOnly(doc.uploadedAt);
        });

        return {
            _id: customer._id,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name,
            email: customer.email,
            docCount,
            lastUpload
        };
    }).filter(c => c.docCount > 0);

    // Sort by last upload date
    result.sort((a, b) => (new Date(b.lastUpload || 0) - new Date(a.lastUpload || 0)));

    return res.status(200).json(
        new ApiResponse(200, result, "Customers with documents fetched successfully")
    );
});

// GET /api/documents/customers/:customerId
// Lists all documents for a specific customer
export const getCustomerDocuments = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const customer = await User.findById(customerId)
        .select("firstName lastName name email kycDocuments purchasedPolicies")
        .populate("purchasedPolicies.policy", "policyName");

    if (!customer) {
        return res.status(404).json(new ApiResponse(404, null, "Customer not found"));
    }

    const documents = [];
    const docs = customer.kycDocuments || {};

    const addDoc = (doc, key, name, typeName) => {
        if (doc && doc.filename) {
            documents.push({
                _id: doc._id || `${customer._id}_${key}`,
                docName: doc.originalName || name,
                docTypeName: typeName,
                docTypeKey: key,
                fileType: doc.fileType || doc.filename.split('.').pop(),
                uploadDate: doc.uploadDate,
                filename: doc.filename
            });
        }
    };

    addDoc(docs.governmentId, 'governmentId', 'Government ID', 'Government ID');
    addDoc(docs.proofOfAddress, 'proofOfAddress', 'Address Proof', 'Address Proof');
    addDoc(docs.incomeProof, 'incomeProof', 'Income Proof', 'Income Proof');
    addDoc(docs.nomineeId, 'nomineeId', 'Nominee ID', 'Nominee ID');

    if (docs.otherDocuments && docs.otherDocuments.length > 0) {
        docs.otherDocuments.forEach((doc, idx) => {
             documents.push({
                _id: doc._id || `${customer._id}_other_${idx}`,
                docName: doc.name || doc.originalName || `Other Document ${idx + 1}`,
                docTypeName: 'Other Document',
                docTypeKey: `other/${doc._id}`, 
                fileType: doc.fileType || (doc.filename ? doc.filename.split('.').pop() : 'unknown'),
                uploadDate: doc.uploadDate,
                filename: doc.filename,
                isOther: true,
                otherDocId: doc._id
            });
        });
    }

    // Add Policy Documents
    if (customer.purchasedPolicies && customer.purchasedPolicies.length > 0) {
        customer.purchasedPolicies.forEach((p, index) => {
            if (p.policyDocument) {
                documents.push({
                    _id: `${customer._id}_policy_${index}`,
                    docName: p.policy ? `Policy: ${p.policy.policyName}` : 'Policy Document',
                    docTypeName: 'Policy Document',
                    docTypeKey: 'policy_document',
                    fileType: 'pdf',
                    uploadDate: p.purchaseDate,
                    filename: p.policyDocument,
                    isStatic: true,
                    staticUrl: p.policyDocument
                });
            }
        });
    }

    // Add Claim Documents
    const claims = await Claim.find({ customer: customerId }).select('claimNumber documents');
    claims.forEach(claim => {
        if (claim.documents && claim.documents.length > 0) {
            claim.documents.forEach((doc, index) => {
                documents.push({
                    _id: doc._id || `${claim._id}_doc_${index}`,
                    docName: `${doc.name} (Claim: ${claim.claimNumber})`,
                    docTypeName: 'Claim Document',
                    docTypeKey: `claim/${claim._id}/${index}`,
                    fileType: doc.url ? doc.url.split('.').pop() : 'unknown',
                    uploadDate: doc.uploadedAt,
                    filename: doc.url,
                    isStatic: true,
                    staticUrl: doc.url,
                    meta: { 
                        claimId: claim._id,
                        claimNumber: claim.claimNumber,
                        type: doc.type
                    }
                });
            });
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            customer: {
                _id: customer._id,
                name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name,
                email: customer.email,
            },
            documents
        }, "Customer documents fetched successfully")
    );
});
