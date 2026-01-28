import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
    claimNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    policy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["Theft", "Accident", "Medical", "Death", "Fire", "Maturity", "Other"]
    },
    incidentDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    requestedAmount: {
        type: Number,
        required: true,
        min: 0
    },
    approvedAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["Draft", "Submitted", "Under Review", "Info Required", "Approved", "Rejected", "Settled", "Closed"],
        default: "Submitted"
    },
    documents: [{
        name: { type: String },
        url: { type: String },
        type: { type: String }, // Explicitly define type to avoid Mongoose confusion
        uploadedAt: { type: Date, default: Date.now }
    }],
    notes: [{
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        isInternal: { type: Boolean, default: false }
    }],
    timeline: [{
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
        note: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export const Claim = mongoose.model("Claim", claimSchema);
