import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const candidates = [
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-pro-latest",
  "gemini-1.0-pro",
  "gemini-pro"
];

async function testModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Testing models for availability...");

  for (const modelName of candidates) {
    process.stdout.write(`Testing ${modelName.padEnd(25)}... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hi");
      console.log(`✅ WORKING!`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`❌ 404 Not Found`);
      } else if (error.status === 429) {
        console.log(`⚠️  429 Quota Exceeded (Exists but busy)`);
      } else {
        console.log(`❌ Error: ${error.message.split('[')[0]}`);
      }
    }
  }
}

testModels();
