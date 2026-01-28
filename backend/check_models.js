import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Checking API Key...");
  if (!key) {
      console.error("❌ No API Key found in .env");
      return;
  }
  console.log(`Key available (starts with ${key.substring(0, 4)}...)`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    console.log(`Fetching models from: ${url.replace(key, "HIDDEN_KEY")}`);
    const response = await fetch(url);
    
    if (!response.ok) {
        console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error("Response:", errorText);
        return;
    }

    const data = await response.json();
    console.log("\n✅ AVAILABLE MODELS:");
    if (data.models) {
        data.models.forEach(m => console.log(`- ${m.name.replace('models/', '')}`));
    } else {
        console.log("No models returned (empty list).");
    }
    
  } catch (error) {
    console.error("Network/Script Error:", error);
  }
}

listModels();
