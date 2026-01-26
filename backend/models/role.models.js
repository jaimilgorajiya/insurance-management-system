import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // e.g., "agent", "admin"
        trim: true,
        lowercase: true
    },
    permissions: {
        type: [String], // Array of permission strings e.g. "customer.create"
        default: []
    },
    description: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export const Role = mongoose.model("Role", roleSchema);
