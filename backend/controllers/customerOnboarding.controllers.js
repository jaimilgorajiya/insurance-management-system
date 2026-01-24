import { User } from "../models/user.models.js";
import { hashPassword } from "@jaimilgorajiya/password-utils";
import { sendCredentialsEmail } from "../services/emailService.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate temp password
const generateTempPassword = (length = 12) => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/kyc-documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// Customer onboarding endpoint
export const onboardCustomer = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            occupation,
            annualIncome,
            email,
            phone,
            alternatePhone,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country,
            selectedPolicy
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !dateOfBirth || !occupation || !annualIncome) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        if (!addressLine1 || !city || !state || !zipCode || !country) {
            return res.status(400).json({
                success: false,
                message: "Complete address information is required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Customer with this email already exists"
            });
        }

        // Validate uploaded files
        if (!req.files || !req.files.governmentId || !req.files.proofOfAddress || !req.files.incomeProof) {
            return res.status(400).json({
                success: false,
                message: "All KYC documents are required (Government ID, Proof of Address, Income Proof)"
            });
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);

        // Prepare KYC documents data
        const kycDocuments = {
            governmentId: {
                filename: req.files.governmentId[0].filename,
                originalName: req.files.governmentId[0].originalname,
                uploadDate: new Date(),
                fileType: req.files.governmentId[0].mimetype,
                fileSize: req.files.governmentId[0].size,
                status: "pending"
            },
            proofOfAddress: {
                filename: req.files.proofOfAddress[0].filename,
                originalName: req.files.proofOfAddress[0].originalname,
                uploadDate: new Date(),
                fileType: req.files.proofOfAddress[0].mimetype,
                fileSize: req.files.proofOfAddress[0].size,
                status: "pending"
            },
            incomeProof: {
                filename: req.files.incomeProof[0].filename,
                originalName: req.files.incomeProof[0].originalname,
                uploadDate: new Date(),
                fileType: req.files.incomeProof[0].mimetype,
                fileSize: req.files.incomeProof[0].size,
                status: "pending"
            }
        };

        // Create new customer
        const newCustomer = new User({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`, // Keep for backward compatibility
            dateOfBirth: new Date(dateOfBirth),
            gender,
            occupation,
            annualIncome: parseFloat(annualIncome),
            email,
            mobile: phone,
            alternatePhone,
            address: {
                addressLine1,
                addressLine2,
                city,
                state,
                zipCode,
                country
            },
            kycDocuments,
            selectedPolicy: selectedPolicy || null,
            password: hashedPassword,
            role: "customer",
            status: "active",
            kycStatus: "pending",
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            createdBy: req.user._id
        });

        await newCustomer.save();

        // Send welcome email with credentials
        // Send welcome email with credentials
        try {
            await sendCredentialsEmail({
                email: email,
                name: `${firstName} ${lastName}`,
                role: "customer",
                tempPassword: tempPassword,
                loginUrl: process.env.FRONTEND_URL || "http://localhost:5173/login"
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail the entire operation if email fails
        }

        // Return success response (exclude password)
        const customerResponse = newCustomer.toObject();
        delete customerResponse.password;

        res.status(201).json({
            success: true,
            message: "Customer onboarding completed successfully",
            data: {
                customer: customerResponse,
                tempPassword: tempPassword // For development/testing purposes
            }
        });

    } catch (error) {
        console.error("Customer onboarding error:", error);
        
        // Clean up uploaded files if customer creation fails
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error("Error deleting file:", err);
                    });
                });
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error during onboarding",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get KYC document
export const getKYCDocument = async (req, res) => {
    try {
        const { customerId, documentType } = req.params;

        // Validate document type
        const validDocTypes = ['governmentId', 'proofOfAddress', 'incomeProof'];
        if (!validDocTypes.includes(documentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document type"
            });
        }

        // Find customer
        const customer = await User.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if user has permission to view this document
        if (req.user.role !== 'admin' && req.user._id.toString() !== customerId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Get document info
        const document = customer.kycDocuments[documentType];
        if (!document || !document.filename) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Construct file path
        const filePath = path.join(uploadsDir, document.filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Document file not found on server"
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', document.fileType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);

        // Send file
        res.sendFile(filePath);

    } catch (error) {
        console.error("Error retrieving KYC document:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update KYC document status (Admin only)
export const updateKYCDocumentStatus = async (req, res) => {
    try {
        const { customerId, documentType } = req.params;
        const { status } = req.body;

        // Validate inputs
        const validDocTypes = ['governmentId', 'proofOfAddress', 'incomeProof'];
        const validStatuses = ['pending', 'approved', 'rejected'];

        if (!validDocTypes.includes(documentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document type"
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'pending', 'approved', or 'rejected'"
            });
        }

        // Update document status
        const updateQuery = {};
        updateQuery[`kycDocuments.${documentType}.status`] = status;

        const customer = await User.findByIdAndUpdate(
            customerId,
            updateQuery,
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if all documents are approved to update overall KYC status
        const allDocuments = customer.kycDocuments;
        const allApproved = allDocuments.governmentId?.status === 'approved' &&
                          allDocuments.proofOfAddress?.status === 'approved' &&
                          allDocuments.incomeProof?.status === 'approved';

        const anyRejected = allDocuments.governmentId?.status === 'rejected' ||
                           allDocuments.proofOfAddress?.status === 'rejected' ||
                           allDocuments.incomeProof?.status === 'rejected';

        let overallKycStatus = 'pending';
        if (allApproved) {
            overallKycStatus = 'approved';
        } else if (anyRejected) {
            overallKycStatus = 'rejected';
        }

        // Update overall KYC status if needed
        if (customer.kycStatus !== overallKycStatus) {
            customer.kycStatus = overallKycStatus;
            await customer.save();
        }

        res.status(200).json({
            success: true,
            message: "Document status updated successfully",
            data: {
                customer,
                overallKycStatus
            }
        });

    } catch (error) {
        console.error("Error updating KYC document status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get customer onboarding details
export const getCustomerOnboardingDetails = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Check permissions
        if (req.user.role !== 'admin' && req.user._id.toString() !== customerId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const customer = await User.findById(customerId).select('-password');
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                customer
            }
        });

    } catch (error) {
        console.error("Error retrieving customer details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};