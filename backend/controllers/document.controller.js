import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/documents/customers
// Lists customers who have uploaded at least one document
export const getCustomersWithDocuments = asyncHandler(async (req, res) => {
    const customers = await User.find({
        role: "customer",
        $or: [
            { "kycDocuments.governmentId": { $exists: true } },
            { "kycDocuments.proofOfAddress": { $exists: true } },
            { "kycDocuments.incomeProof": { $exists: true } }
        ]
    }).select("firstName lastName name email kycDocuments");

    const result = customers.map(customer => {
        let docCount = 0;
        let lastUpload = null;
        const docs = customer.kycDocuments || {};

        const trackDoc = (doc) => {
            if (doc && doc.filename) {
                docCount++;
                if (!lastUpload || new Date(doc.uploadDate) > new Date(lastUpload)) {
                    lastUpload = doc.uploadDate;
                }
            }
        };

        trackDoc(docs.governmentId);
        trackDoc(docs.proofOfAddress);
        trackDoc(docs.incomeProof);

        return {
            _id: customer._id,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name,
            email: customer.email,
            docCount,
            lastUpload
        };
    }).filter(c => c.docCount > 0);

    // Sort by last upload date
    result.sort((a, b) => new Date(b.lastUpload) - new Date(a.lastUpload));

    return res.status(200).json(
        new ApiResponse(200, result, "Customers with documents fetched successfully")
    );
});

// GET /api/documents/customers/:customerId
// Lists all documents for a specific customer
export const getCustomerDocuments = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const customer = await User.findById(customerId).select("firstName lastName name email kycDocuments");

    if (!customer) {
        return res.status(404).json(new ApiResponse(404, null, "Customer not found"));
    }

    const documents = [];
    const docs = customer.kycDocuments || {};

    if (docs.governmentId && docs.governmentId.filename) {
        documents.push({
            _id: `${customer._id}_gov`,
            docName: docs.governmentId.originalName || 'Government ID',
            docTypeName: 'Government ID',
            docTypeKey: 'governmentId',
            fileType: docs.governmentId.fileType || docs.governmentId.filename.split('.').pop(),
            uploadDate: docs.governmentId.uploadDate,
            filename: docs.governmentId.filename
        });
    }

    if (docs.proofOfAddress && docs.proofOfAddress.filename) {
        documents.push({
            _id: `${customer._id}_addr`,
            docName: docs.proofOfAddress.originalName || 'Address Proof',
            docTypeName: 'Address Proof',
            docTypeKey: 'proofOfAddress',
            fileType: docs.proofOfAddress.fileType || docs.proofOfAddress.filename.split('.').pop(),
            uploadDate: docs.proofOfAddress.uploadDate,
            filename: docs.proofOfAddress.filename
        });
    }

    if (docs.incomeProof && docs.incomeProof.filename) {
        documents.push({
            _id: `${customer._id}_inc`,
            docName: docs.incomeProof.originalName || 'Income Proof',
            docTypeName: 'Income Proof',
            docTypeKey: 'incomeProof',
            fileType: docs.incomeProof.fileType || docs.incomeProof.filename.split('.').pop(),
            uploadDate: docs.incomeProof.uploadDate,
            filename: docs.incomeProof.filename
        });
    }

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
