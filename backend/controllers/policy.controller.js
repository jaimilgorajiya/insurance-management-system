import { Policy } from "../models/policy.models.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/policies
export const getPolicies = asyncHandler(async (req, res) => {
    // Populate policyType name
    const policies = await Policy.find({})
        .populate("policyType", "name status")
        .populate("provider", "name")
        .sort({ createdAt: -1 });

    // Filter out policies that belong to an inactive category
    const activePolicies = policies.filter(policy => 
        !policy.policyType || policy.policyType.status === 'active'
    );

    return res.status(200).json(
        new ApiResponse(200, activePolicies, "Policies fetched successfully")
    );
});

// GET /api/policies/:id
export const getPolicyById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const policy = await Policy.findById(id)
        .populate("policyType", "name badgeColor")
        .populate("provider", "name contactEmail");

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, policy, "Policy details fetched successfully")
    );
});

// GET /api/policies/stats/summary
export const getPolicySummary = asyncHandler(async (req, res) => {
    const summary = await Policy.aggregate([
        {
            $group: {
                _id: "$policyType",
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "policytypes",
                localField: "_id",
                foreignField: "_id",
                as: "typeInfo"
            }
        },
        {
            $unwind: "$typeInfo"
        },
        {
            $match: {
                "typeInfo.status": "active"
            }
        },
        {
            $project: {
                _id: 1,
                type: "$typeInfo.name",
                count: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, summary, "Policy summary fetched successfully")
    );
});

// POST /api/policies
export const createPolicy = asyncHandler(async (req, res) => {
    const {
        policyName,
        policyType,
        planName,
        description,
        premiumAmount,
        coverageAmount,
        tenureValue,
        tenureUnit,
        minAge,
        maxAge,
        renewable,
        status,
        agentCommission,
        policySource,
        provider,
        companyCommission,
        adminCommission
    } = req.body;

    if (!policyName || !policyType || !planName || !premiumAmount || !coverageAmount || !tenureValue || !tenureUnit) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Guardrails
    if (Number(premiumAmount) <= 0) {
        throw new ApiError(400, "Premium Amount must be greater than 0");
    }

    if (agentCommission !== undefined && (Number(agentCommission) < 0 || Number(agentCommission) > 100)) {
        throw new ApiError(400, "Agent Commission must be between 0% and 100%");
    }

    if (Number(coverageAmount) <= Number(premiumAmount)) {
        throw new ApiError(400, "Coverage Amount must be greater than Premium Amount");
    }

    if (Number(tenureValue) <= 0) {
        throw new ApiError(400, "Tenure Value must be greater than 0");
    }

    if (Number(minAge) > Number(maxAge)) {
        throw new ApiError(400, "Minimum Age cannot be greater than Maximum Age");
    }

    const policy = await Policy.create({
        policyName,
        policyType,
        planName,
        description,
        premiumAmount,
        coverageAmount,
        agentCommission: agentCommission || 0,
        tenureValue,
        tenureUnit,
        minAge,
        maxAge,
        renewable,
        renewable,
        status: status || "active",
        status: status || "active",
        policySource: policySource || "IN_HOUSE",
        provider: (policySource === "THIRD_PARTY" && provider && provider !== "") ? provider : undefined,
        companyCommission: policySource === "THIRD_PARTY" ? companyCommission : undefined,
        adminCommission: policySource === "THIRD_PARTY" ? adminCommission : undefined,
        createdBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, policy, "Policy created successfully")
    );
});

// PUT /api/policies/:id
export const updatePolicy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const policy = await Policy.findById(id);
    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    const { premiumAmount, coverageAmount, minAge, maxAge, tenureValue, agentCommission, companyCommission, adminCommission, policySource, provider } = updateData;

    // Guardrails for update
    if (premiumAmount !== undefined && Number(premiumAmount) <= 0) {
        throw new ApiError(400, "Premium Amount must be greater than 0");
    }

    if (agentCommission !== undefined && (Number(agentCommission) < 0 || Number(agentCommission) > 100)) {
        throw new ApiError(400, "Agent Commission must be between 0% and 100%");
    }

    const finalPremium = premiumAmount !== undefined ? premiumAmount : policy.premiumAmount;
    const finalCoverage = coverageAmount !== undefined ? coverageAmount : policy.coverageAmount;

    if (coverageAmount !== undefined || premiumAmount !== undefined) {
        if (Number(finalCoverage) <= Number(finalPremium)) {
            throw new ApiError(400, "Coverage Amount must be greater than Premium Amount");
        }
    }

    if (tenureValue !== undefined && Number(tenureValue) <= 0) {
        throw new ApiError(400, "Tenure Value must be greater than 0");
    }

    const finalMinAge = minAge !== undefined ? minAge : policy.minAge;
    const finalMaxAge = maxAge !== undefined ? maxAge : policy.maxAge;

    if (minAge !== undefined || maxAge !== undefined) {
        if (Number(finalMinAge) > Number(finalMaxAge)) {
            throw new ApiError(400, "Minimum Age cannot be greater than Maximum Age");
        }
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
        id,
        {
            ...updateData,
            provider: (updateData.policySource === 'THIRD_PARTY' || (!updateData.policySource && policy.policySource === 'THIRD_PARTY')) && updateData.provider && updateData.provider !== "" ? updateData.provider : undefined
        },
        { new: true, runValidators: true }
    );

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPolicy, "Policy updated successfully")
    );
});

// PATCH /api/policies/:id/status
export const togglePolicyStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const policy = await Policy.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, policy, "Policy status updated successfully")
    );
});

// DELETE /api/policies/:id
export const deletePolicy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const policy = await Policy.findByIdAndDelete(id);

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Policy deleted successfully")
    );
});

// POST /api/policies/:id/ai-summary
export const getPolicyAISummary = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const policy = await Policy.findById(id).populate("policyType", "name");

    if (!policy) {
        throw new ApiError(404, "Policy not found");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new ApiError(500, "AI Configuration missing (API Key)");
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
You are a responsible insurance assistant inside an Insurance Management System.

Your job is to explain the insurance policy clearly, factually, and safely.
Do NOT use marketing language, exaggeration, or personal recommendations.

RULES:
- Use neutral, professional tone
- Do NOT persuade or sell
- Do NOT claim suitability as a guarantee
- Avoid words like "best", "perfect", "outstanding", "excellent value"
- Explain, not convince

POLICY DATA:
Name: ${policy.policyName}
Plan: ${policy.planName}
Type: ${policy.policyType?.name}
Description: ${policy.description || 'N/A'}
Premium: $${policy.premiumAmount}
Coverage: $${policy.coverageAmount}
Tenure: ${policy.tenureValue} ${policy.tenureUnit}
Min Age: ${policy.minAge}
Max Age: ${policy.maxAge}
Renewable: ${policy.renewable ? "Yes" : "No"}

Return ONLY valid JSON in the following format (no markdown, no extra text):

{
  "description": "A short, neutral explanation of what this policy provides and its purpose (max 2 sentences).",
  "benefits": [
    "Clear, factual benefit 1",
    "Clear, factual benefit 2",
    "Clear, factual benefit 3",
    "Clear, factual benefit 4"
  ],
  "customerExplanation": "A simple, customer-friendly explanation of who this policy may be suitable for, written in clear everyday language, without making promises or guarantees.",
  "financialBreakdown": "A factual explanation comparing premium and coverage. ALL monetary values MUST be formatted with a '$' sign (e.g., $150, $10,000)."
}
`;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let summaryData;
        try {
            summaryData = JSON.parse(cleanText);
        } catch (e) {
            // Fallback if JSON parsing fails
            summaryData = { 
                description: text, 
                benefits: [], 
                customerExplanation: "Could not parse specific details.", 
                financialBreakdown: "" 
            }; 
        }

        return res.status(200).json(
            new ApiResponse(200, summaryData, "AI Summary generated successfully")
        );
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new ApiError(500, `AI Error: ${error.message}`);
    }
});
