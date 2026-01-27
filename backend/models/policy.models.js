import mongoose from "mongoose";

const policySchema = new mongoose.Schema({
    policyName: {
        type: String,
        required: true,
        trim: true
    },
    policyType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PolicyType",
        required: true
    },
    policySource: {
        type: String,
        enum: ["IN_HOUSE", "THIRD_PARTY"],
        default: "IN_HOUSE"
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider"
    },
    planName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    premiumAmount: {
        type: Number,
        required: true,
        min: 0
    },
    coverageAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Commission Details
    agentCommission: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    companyCommission: {
        value: { type: Number, min: 0, default: 0 },
        type: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" }
    },
    adminCommission: {
        value: { type: Number, min: 0, default: 0 },
        type: { type: String, enum: ["PERCENTAGE", "FIXED"], default: "PERCENTAGE" }
    },
    tenureValue: {
        type: Number,
        required: true,
        min: 1
    },
    tenureUnit: {
        type: String,
        enum: ["days", "months", "years"],
        required: true,
        default: "years"
    },
    // Eligibility criteria
    minAge: {
        type: Number,
        default: 18
    },
    maxAge: {
        type: Number,
        default: 100
    },
    renewable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export const Policy = mongoose.model("Policy", policySchema);
