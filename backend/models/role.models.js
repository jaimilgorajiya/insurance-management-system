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
    },
    description: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export const Role = mongoose.model("Role", roleSchema);
