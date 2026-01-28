import fetch from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const response = await fetch(URL);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        console.log("Authorized Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found.");
        }
    } catch (error) {
        console.error("Network Error:", error);
    }
}

listModels();
