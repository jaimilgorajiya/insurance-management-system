import { Provider } from "../models/provider.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// GET /api/providers
export const getProviders = asyncHandler(async (req, res) => {
    const providers = await Provider.find({}).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, providers, "Providers fetched successfully")
    );
});

// POST /api/providers
export const createProvider = asyncHandler(async (req, res) => {
    const { name, contactEmail, contactPhone, status } = req.body;

    if (!name) {
        throw new ApiError(400, "Provider name is required");
    }

    const existingProvider = await Provider.findOne({ name });
    if (existingProvider) {
        throw new ApiError(400, "Provider with this name already exists");
    }

    const provider = await Provider.create({
        name,
        contactEmail,
        contactPhone,
        status: status || "active",
        createdBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(201, provider, "Provider created successfully")
    );
});

// PUT /api/providers/:id
export const updateProvider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, contactEmail, contactPhone, status } = req.body;

    const provider = await Provider.findByIdAndUpdate(
        id,
        {
            name,
            contactEmail,
            contactPhone,
            status
        },
        { new: true }
    );

    if (!provider) {
        throw new ApiError(404, "Provider not found");
    }

    return res.status(200).json(
        new ApiResponse(200, provider, "Provider updated successfully")
    );
});

// DELETE /api/providers/:id
export const deleteProvider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const provider = await Provider.findByIdAndDelete(id);

    if (!provider) {
        throw new ApiError(404, "Provider not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Provider deleted successfully")
    );
});
