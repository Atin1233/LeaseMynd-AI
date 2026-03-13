import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testGoogleAI() {
  console.log("=== Testing Google AI Studio Connection ===\n");
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  console.log("API Key exists:", !!apiKey);
  console.log("API Key prefix:", apiKey ? apiKey.substring(0, 15) + "..." : "N/A");
  
  if (!apiKey) {
    console.error("\n❌ GOOGLE_AI_API_KEY not found in environment");
    process.exit(1);
  }
  
  try {
    console.log("\nInitializing Google AI client...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log("Getting model: gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 100,
      },
    });
    
    console.log("Sending test request...\n");
    const startTime = Date.now();
    
    const result = await model.generateContent("Say hello and confirm you are working. Keep it under 20 words.");
    const response = result.response;
    const text = response.text();
    
    const elapsed = Date.now() - startTime;
    
    console.log("✅ SUCCESS!");
    console.log("Response time:", elapsed, "ms");
    console.log("Response:", text);
    
    // Test JSON mode too
    console.log("\n--- Testing JSON Mode ---");
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    });
    
    const jsonResult = await jsonModel.generateContent(
      'Return a JSON object with keys "status", "message", and "timestamp". Status should be "ok".'
    );
    const jsonText = jsonResult.response.text();
    
    console.log("JSON Response:", jsonText);
    
    // Validate it's valid JSON
    try {
      const parsed = JSON.parse(jsonText);
      console.log("✅ Valid JSON parsed:", parsed);
    } catch (e) {
      console.log("❌ Invalid JSON:", e.message);
    }
    
  } catch (error) {
    console.error("\n❌ FAILED!");
    console.error("Error:", error.message);
    
    if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("rate")) {
      console.error("\n⚠️  Rate limit hit - the API key is valid but you've exceeded the free tier limits.");
      console.error("   Wait 1-2 minutes and try again, or upgrade to a paid plan.");
    } else if (error.message.includes("API_KEY_INVALID") || error.message.includes("401")) {
      console.error("\n⚠️  Invalid API key - check your GOOGLE_AI_API_KEY in .env.local");
    } else if (error.message.includes("blocked")) {
      console.error("\n⚠️  Request was blocked by safety filters");
    }
    
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack.split("\n").slice(0, 5).join("\n"));
    }
    
    process.exit(1);
  }
}

testGoogleAI();
