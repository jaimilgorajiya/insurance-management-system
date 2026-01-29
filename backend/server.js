import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userCreationRoutes from "./routes/userCreation.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import customerOnboardingRoutes from "./routes/customerOnboarding.routes.js";
import roleRoutes from "./routes/role.routes.js";
import policyTypeRoutes from "./routes/policyType.routes.js";
import policyRoutes from "./routes/policy.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import documentRoutes from "./routes/document.routes.js";
import claimRoutes from "./routes/claim.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";
import connectDB from "./db/db.js";

dotenv.config();
// Trigger restart 2

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Insurance CRM API is running" });
});

app.get("/api", (req, res) => {
    res.json({ message: "Insurance CRM API is running" });
});
app.use("/api/auth", authRoutes);  // Unified auth routes
app.use("/api/users", userCreationRoutes);  // New user creation routes
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/customer-onboarding", customerOnboardingRoutes);  // Customer onboarding routes
app.use("/api/roles", roleRoutes); // Role management routes
app.use("/api/admin/policy-types", policyTypeRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/reports", reportRoutes);

// Shared endpoints
app.get("/api/me", verifyJWT, (req, res) => {
    res.status(200).json({ 
        success: true,
        data: {
            user: {
                id: req.user._id,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role,
                status: req.user.status
            }
        }
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    
    console.error(`[ERROR] ${statusCode} - ${message}`);
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Database Connection and Server Start
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Insurance CRM Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
    });
