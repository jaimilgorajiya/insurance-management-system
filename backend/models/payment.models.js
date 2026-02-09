import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    orderId: {
        type: String,
        required: true
    },
    signature: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "USD"
    },
    status: {
        type: String,
        enum: ["created", "success", "failed"],
        default: "created"
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    policy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy",
        required: true
    },
    policyPurchaseId: {
        type: String, // To link to the specific purchased policy instance if needed
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String
    }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);
