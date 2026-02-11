
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'TKT-' + Math.floor(100000 + Math.random() * 900000)
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["Policy", "Claim", "Payment", "Technical", "Other"],
        default: "Other"
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium"
    },
    status: {
        type: String,
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Admin or Agent
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        attachments: [String] // URLs to uploaded files
    }],
    lastViewedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });


// Ticket model export

export const Ticket = mongoose.model("Ticket", ticketSchema);
