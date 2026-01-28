import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check(modelName) {
    try {
        console.log(`Checking ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Hello");
        console.log(`✅ ${modelName} WORKS!`);
    } catch (e) {
        console.log(`❌ ${modelName} FAILED`);
    }
}

async function run() {
    await check("gemini-1.5-flash");
    await check("gemini-1.5-flash-latest");
    await check("gemini-1.0-pro");
    await check("gemini-pro");
}

run();
