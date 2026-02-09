
/**
 * Vehicle Information Service
 * 
 * RESPONSIBILITY: Fetch vehicle details (RTO, Insurance, Challan) based on vehicle number.
 * 
 * -------------------------------------------------------------------------
 * HOW TO GET REAL DATA:
 * Real vehicle data in India (Vahan/Parivahan) is protected and not free.
 * You must use a third-party API provider. Common providers include:
 * 
 * 1. RapidAPI (Search for "RTO Vehicle Information" or "Car Info")
 *    - Easy to start, pay-per-use or monthly.
 *    - Link: https://rapidapi.com/search/rto
 * 
 * 2. SurePass.io / Sandbox / Zoop.one
 *    - Enterprise grade, requires business verification usually.
 *    - Very accurate.
 * 
 * 3. IDfy / Signzy
 *    - Banking grade verification APIs.
 * 
 * -------------------------------------------------------------------------
 * CONFIGURATION:
 * To use a REAL API, add these to your .env file:
 * 
 * VEHICLE_DATA_PROVIDER="RAPIDAPI"  (or "CUSTOM")
 * VEHICLE_API_KEY="your_api_key_here"
 * VEHICLE_API_URL="https://.../api/endpoint"
 * 
 * If VEHICLE_API_KEY is missing, this service falls back to MOCK data.
 * -------------------------------------------------------------------------
 */

import { ApiError } from "../utils/ApiError.js";
import fetch from "node-fetch"; // Using node-fetch since it's in package.json

// ==============================================================================
// 1. MOCK DATABASE (Fallback)
// ==============================================================================
const MOCK_VEHICLE_DB = {
    "GJ01AB1234": {
        registrationNumber: "GJ01AB1234",
        ownerName: "Jaimil Gorajiya",
        chassisNumber: "MB1TE466XMC12345",
        engineNumber: "K9K45678",
        vehicleClass: "Motor Cycle/Scooter",
        fuelType: "PETROL",
        makerModel: "HONDA ACTIVA 6G",
        registrationDate: "2023-01-15",
        insurance: {
            isInsured: true,
            insurer: "Bajaj Allianz General Insurance",
            policyNumber: "OG-24-9906-1801-00000001",
            expiryDate: "2025-01-14"
        },
        challans: [
            {
                challanNumber: "GJ0120240001",
                amount: 500,
                status: "PENDING",
                offense: "Driving without Helmet",
                date: "2024-02-10"
            }
        ]
    }
};

// ==============================================================================
// 2. REAL API ADAPTERS
// ==============================================================================

/**
 * Adapter for RapidAPI (Example Structure)
 * Adjust the mapping based on the specific API you subscribe to on RapidAPI.
 */
const fetchRapidAPIData = async (vehicleNumber) => {
    // START EXAMPLE RAPIDAPI IMPLEMENTATION
    // This is a GENERIC implementation. You must verify the JSON structure of your specific RapidAPI provider.
    
    const url = process.env.VEHICLE_API_URL || 'https://rto-vehicle-information-verification-india.p.rapidapi.com/api/v1/rc/vehicleinfo';
    const apiKey = process.env.VEHICLE_API_KEY;
    const apiHost = process.env.VEHICLE_API_HOST || 'rto-vehicle-information-verification-india.p.rapidapi.com';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            },
            body: JSON.stringify({ reg_no: vehicleNumber })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API Error');
        }

        // --- MAPPING RAW API DATA TO OUR CRM FORMAT ---
        // Note: You must check the console.log of `data` to adjust these fields
        // based on which actual API provider you use.
        
        // Hypothetical mapping:
        return {
            registrationNumber: data.result?.registration_number || vehicleNumber,
            ownerName: data.result?.owner_name || "Unknown Owner",
            chassisNumber: data.result?.chassis_number,
            engineNumber: data.result?.engine_number,
            vehicleClass: data.result?.class || data.result?.vehicle_category,
            fuelType: data.result?.fuel_type,
            makerModel: data.result?.model || data.result?.maker_model,
            registrationDate: data.result?.registration_date,
            insurance: {
                isInsured: data.result?.insurance_validity && new Date(data.result.insurance_validity) > new Date(),
                insurer: data.result?.insurance_company,
                policyNumber: data.result?.policy_number,
                expiryDate: data.result?.insurance_validity
            },
            challans: [] // Some basic RTO APIs don't return challans, you might need a separate call for that.
        };

    } catch (error) {
        console.error("Real API Fetch Error:", error);
        throw new ApiError(500, "Failed to fetch data from Real API Provider");
    }
};


// ==============================================================================
// 3. MAIN SERVICE FUNCTION
// ==============================================================================
 
export const fetchVehicleDetails = async (vehicleNumber) => {
    // 1. Sanitize
    const cleanNumber = vehicleNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // 2. Check Configuration
    const apiKey = process.env.VEHICLE_API_KEY;
    const provider = process.env.VEHICLE_DATA_PROVIDER || "RAPIDAPI";

    // 3. Use REAL API if Key exists
    if (apiKey) {
        console.log(`[VehicleInfo] Fetching real data for ${cleanNumber} using ${provider}...`);
        
        if (provider === "RAPIDAPI") {
            return await fetchRapidAPIData(cleanNumber);
        }
        // Add other providers here if needed
    }

    // 4. Fallback to MOCK DATA
    console.log(`[VehicleInfo] No API Key found. Using MOCK data for ${cleanNumber}.`);
    
    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const vehicle = MOCK_VEHICLE_DB[cleanNumber];

    if (!vehicle) {
        // If it looks valid but not in our explicit mock list, return a generated mock
        // so you don't get stuck while testing.
        if (cleanNumber.length < 6) throw new ApiError(404, "Invalid Vehicle Number");

        return {
            registrationNumber: cleanNumber,
            ownerName: "Demo User (No Real Data Configured)",
            chassisNumber: `ME1${cleanNumber}CH123`,
            engineNumber: `EN${cleanNumber.substring(0,4)}`,
            vehicleClass: "Motor Car (Mock)",
            fuelType: "PETROL",
            makerModel: "MARUTI SUZUKI SWIFT",
            registrationDate: "2020-01-01",
            insurance: {
                isInsured: false,
                status: "Expired",
                expiryDate: "2021-01-01"
            },
            challans: []
        };
    }

    return vehicle;
};
