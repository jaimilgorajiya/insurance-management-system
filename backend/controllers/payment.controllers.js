import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Payment } from "../models/payment.models.js";
import { User } from "../models/user.models.js";
import { Policy } from "../models/policy.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generatePaymentReceiptPDF } from "../utils/pdfGenerator.js";
import { sendPaymentReceiptEmail } from "../services/emailService.js";

// Initialize Razorpay
// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in .env
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys not configured");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// ... (createPaymentOrder stays same)

// POST /api/payments/create-order
export const createPaymentOrder = asyncHandler(async (req, res) => {
    const { policyId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Find the purchased policy
    const purchasedPolicy = user.purchasedPolicies.find(p => p.policy.toString() === policyId && p.status === 'active');
    
    if (!purchasedPolicy) {
        throw new ApiError(404, "Active policy not found for this user");
    }

    const policyDetails = await Policy.findById(policyId);
    if (!policyDetails) throw new ApiError(404, "Policy details not found");

    // Amount to charge - assuming checking monthly
    // Using premiumAmount as the installment amount
    const amount = policyDetails.premiumAmount; 
    const currency = "INR"; // UPI requires INR

    const razorpay = getRazorpayInstance();

    const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency: currency,
        receipt: `receipt_${Date.now()}_${userId.toString().slice(-4)}`
    };

    try {
        const order = await razorpay.orders.create(options);

        // We don't save Payment record yet, only on success
        res.status(200).json(
            new ApiResponse(200, {
                order,
                keyId: process.env.RAZORPAY_KEY_ID,
                policyId,
                amount,
                currency,
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.mobile
                }
            }, "Payment order created")
        );
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        throw new ApiError(500, "Failed to create payment order");
    }
});

// POST /api/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, policyId } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        throw new ApiError(400, "Invalid payment signature");
    }

    // Payment Successful - Save to DB
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Find policy again to get amount for record
    const policyDetails = await Policy.findById(policyId);

    const payment = await Payment.create({
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        amount: policyDetails.premiumAmount,
        currency: "INR",
        status: "success",
        customer: userId,
        policy: policyId,
        paymentMethod: "razorpay"
    });

        // Update Next Payment Date
        const purchasedPolicyIndex = user.purchasedPolicies.findIndex(p => p.policy.toString() === policyId && p.status === 'active');
        if (purchasedPolicyIndex !== -1) {
            const currentPolicy = user.purchasedPolicies[purchasedPolicyIndex];
            
            // Update last payment date
            currentPolicy.lastPaymentDate = new Date();

            // Calculate Policy Expiry Date first
            const startDate = new Date(currentPolicy.purchaseDate);
            let expiryDate = new Date(startDate);
            if (policyDetails.tenureUnit === 'years') {
                expiryDate.setFullYear(expiryDate.getFullYear() + policyDetails.tenureValue);
            } else if (policyDetails.tenureUnit === 'months') {
                expiryDate.setMonth(expiryDate.getMonth() + policyDetails.tenureValue);
            } else { // days
                expiryDate.setDate(expiryDate.getDate() + policyDetails.tenureValue);
            }

            // Calculate next date (add 1 month)
            let baseDate = currentPolicy.nextPaymentDate ? new Date(currentPolicy.nextPaymentDate) : new Date();
            
            if (!baseDate || isNaN(baseDate.getTime())) {
                baseDate = new Date(currentPolicy.purchaseDate); 
            }

            // Normal next payment is +1 month
            const nextDate = new Date(baseDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            
            // Handle month rollover (e.g. Jan 31 -> Feb 28)
            if (nextDate.getDate() !== baseDate.getDate()) {
                 nextDate.setDate(0);
            }

            // Normalize for comparison (only dates, no times)
            const nextCompare = new Date(nextDate).setHours(0,0,0,0);
            const expiryCompare = new Date(expiryDate).setHours(0,0,0,0);

            // Check for Maturity: If next payment date would be >= expiry, it's matured
            if (nextCompare >= expiryCompare) {
                currentPolicy.status = 'matured';
                currentPolicy.nextPaymentDate = null; 
            } else {
                currentPolicy.nextPaymentDate = nextDate;
            }
            
            user.markModified('purchasedPolicies');
            await user.save();

        // Generate Receipt PDF & Send Email
        try {
            const fileName = `Receipt_${razorpay_payment_id}.pdf`;
            const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const filePath = path.join(uploadDir, fileName);
            
            await generatePaymentReceiptPDF(payment, user, policyDetails, filePath);
            
            // Send Email
            await sendPaymentReceiptEmail({
                email: user.email,
                name: user.name,
                policyName: policyDetails.policyName,
                amount: payment.amount,
                receiptPath: filePath
            });
            
            console.log(`✅ Receipt sent for payment ${razorpay_payment_id}`);
        } catch (receiptError) {
            console.error("❌ Receipt/Email error:", receiptError.message);
            // We don't throw here so the user gets the success response
        }
    }

    res.status(200).json(
        new ApiResponse(200, { paymentId: payment._id }, "Payment verified and receipt sent successfully")
    );
});

// GET /api/payments
export const getPayments = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    let query = {};

    if (role === "admin") {
        query = {};
    } else if (role === "agent") {
        // Find customers assigned to this agent
        const customers = await User.find({ assignedAgentId: _id }).select("_id");
        const customerIds = customers.map(c => c._id);
        query = { customer: { $in: customerIds } };
    } else if (role === "customer") {
        query = { customer: _id };
    }

    const { policyId, customerId } = req.query;
    if (policyId) query.policy = policyId;
    if (customerId && role !== "customer") query.customer = customerId;

    const payments = await Payment.find(query)
        .populate("customer", "name email mobile")
        .populate("policy", "policyName premiumAmount")
        .sort({ paymentDate: -1 });

    res.status(200).json(
        new ApiResponse(200, payments, "Payments fetched successfully")
    );
});
