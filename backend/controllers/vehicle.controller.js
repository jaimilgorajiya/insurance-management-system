import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { fetchVehicleDetails } from "../services/vehicleInfoService.js";

/**
 * Get full vehicle details including RTO info, Insurance status, and Challans
 * GET /api/vehicle/details/:vehicleNumber
 */
export const getVehicleInfo = asyncHandler(async (req, res) => {
    const { vehicleNumber } = req.params;

    if (!vehicleNumber) {
        throw new ApiError(400, "Vehicle Number is required");
    }

    try {
        const vehicleData = await fetchVehicleDetails(vehicleNumber);
        
        return res.status(200).json(
            new ApiResponse(200, vehicleData, "Vehicle details fetched successfully")
        );
    } catch (error) {
        console.error("Vehicle Fetch Error:", error);
        // If it's a known ApiError, rethrow it
        if (error instanceof ApiError) {
            throw error;
        }
        // Otherwise mock a 404 for "Not Found" vs 500 for system error if appropriate, 
        // or just let the global handler catch it.
        throw new ApiError(500, "Failed to fetch vehicle details from RTO service");
    }
});
