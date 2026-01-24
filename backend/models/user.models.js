import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    name: {
        type: String,
        trim: true,
    },
    // Enhanced personal details for onboarding
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },
    occupation: {
        type: String,
        trim: true,
    },
    annualIncome: {
        type: Number,
    },
    // Contact information
    mobile: {
        type: String,
        trim: true,
    },
    alternatePhone: {
        type: String,
        trim: true,
    },
    address: {
        addressLine1: {
            type: String,
            trim: true,
        },
        addressLine2: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        zipCode: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
    },
    // KYC Documents
    kycDocuments: {
        governmentId: {
            filename: String,
            originalName: String,
            uploadDate: Date,
            fileType: String,
            fileSize: Number,
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending"
            }
        },
        proofOfAddress: {
            filename: String,
            originalName: String,
            uploadDate: Date,
            fileType: String,
            fileSize: Number,
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending"
            }
        },
        incomeProof: {
            filename: String,
            originalName: String,
            uploadDate: Date,
            fileType: String,
            fileSize: Number,
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending"
            }
        }
    },
    // Policy information (for future use)
    selectedPolicy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy" // This will be created later when policy management is implemented
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "agent", "customer"],
        default: "customer", 
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    kycStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    // Onboarding tracking
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    onboardingCompletedAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.name || '';
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

export const User = mongoose.model("User", userSchema);
