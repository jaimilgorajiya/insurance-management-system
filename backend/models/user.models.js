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
    nomineeDetails: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        dateOfBirth: { type: Date },
        contact: { type: String, trim: true }
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
        },
        nomineeId: {
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
        otherDocuments: [{
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
        }]
    },
    // Policy information (for future use)
    selectedPolicy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy"
    },
    purchasedPolicies: [{
        policy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Policy",
            required: true
        },
        purchaseDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled"],
            default: "active"
        },
        policyDocument: {  // Path to the generated PDF
            type: String
        },
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    assignedAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
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
    },
    // RBAC Permissions for Agents
    permissions: {
        customers: {
            create: { type: Boolean, default: true },
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: true },
            delete: { type: Boolean, default: false }
        },
        policies: {
            view: { type: Boolean, default: true }
        },
        kyc: {
            approve: { type: Boolean, default: false },
            reject: { type: Boolean, default: false }
        },
        claims: {
            create: { type: Boolean, default: true },
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        communications: {
            email: { type: Boolean, default: false }
        }
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
