import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Attempts to repair truncated JSON by closing unclosed brackets/braces
 * This handles cases where Google AI response is cut off mid-JSON
 */
function repairTruncatedJson(json: string): string | null {
  try {
    // First, try to parse as-is
    JSON.parse(json);
    return json;
  } catch {
    // JSON is invalid, attempt repair
  }
  
  let repaired = json.trim();
  console.log(`[JSON Repair] Starting repair on ${repaired.length} char string`);
  
  // Strategy 1: Find the last complete object/array and truncate there
  // Look for patterns like "},\n    {" or "],\n    [" that indicate array elements
  
  // First, try to find the last complete array element
  const lastCompleteElementPatterns = [
    /\}\s*,\s*\{[^}]*$/,  // Incomplete object in array
    /\]\s*,\s*\[[^\]]*$/, // Incomplete array in array
    /"\s*,\s*"[^"]*$/,    // Incomplete string in array
  ];
  
  for (const pattern of lastCompleteElementPatterns) {
    const match = repaired.match(pattern);
    if (match && match.index !== undefined) {
      // Truncate at the comma before the incomplete element
      const truncateAt = match.index + 1; // Keep the closing brace/bracket
      const truncated = repaired.substring(0, truncateAt);
      console.log(`[JSON Repair] Found incomplete element, truncating from ${repaired.length} to ${truncated.length}`);
      repaired = truncated;
      break;
    }
  }
  
  // Remove trailing comma if present (common truncation issue)
  repaired = repaired.replace(/,\s*$/, '');
  
  // Remove incomplete key-value pair at end
  // Pattern: "key": "incomplete value or "key": incomplete
  const incompleteKVPattern = /,?\s*"[^"]*"\s*:\s*("[^"]*|[^,\]\}]*)$/;
  const kvMatch = repaired.match(incompleteKVPattern);
  if (kvMatch && kvMatch.index !== undefined) {
    // Check if this looks like an incomplete value
    const potentialValue = kvMatch[0];
    if (!potentialValue.match(/:\s*("[^"]*"|true|false|null|\d+)\s*$/)) {
      console.log(`[JSON Repair] Removing incomplete key-value: ${potentialValue.substring(0, 50)}...`);
      repaired = repaired.substring(0, kvMatch.index);
    }
  }
  
  // Remove trailing comma again after truncation
  repaired = repaired.replace(/,\s*$/, '');
  
  // Count brackets and braces to determine what needs closing
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }
  
  console.log(`[JSON Repair] After cleanup: ${openBraces} unclosed braces, ${openBrackets} unclosed brackets, inString: ${inString}`);
  
  // If we're still in a string, close it
  if (inString) {
    repaired += '"';
    console.log(`[JSON Repair] Closed unclosed string`);
  }
  
  // Close any unclosed brackets/braces in the correct order
  // We need to close them in reverse order of how they were opened
  // Since we don't track the order, we'll close brackets first (usually inner), then braces
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }
  
  // Verify the repair worked
  try {
    const parsed = JSON.parse(repaired);
    const addedChars = repaired.length - json.length;
    console.log(`[JSON Repair] ✅ Success! Added ${addedChars > 0 ? addedChars : 0} closing chars, removed ${addedChars < 0 ? -addedChars : 0} chars`);
    console.log(`[JSON Repair] Result has ${Object.keys(parsed).length} top-level keys`);
    return repaired;
  } catch (e) {
    console.error(`[JSON Repair] ❌ Repair failed:`, e instanceof Error ? e.message : String(e));
    
    // Strategy 2: More aggressive truncation - find last complete top-level key
    console.log(`[JSON Repair] Trying aggressive truncation...`);
    
    // Find the last complete top-level structure
    const topLevelKeyPattern = /,\s*"[a-z_]+"\s*:\s*(\[[^\]]*\]|\{[^}]*\}|"[^"]*"|true|false|null|\d+)\s*(?=,|\}$)/gi;
    let lastGoodMatch = null;
    let match;
    while ((match = topLevelKeyPattern.exec(json)) !== null) {
      lastGoodMatch = match;
    }
    
    if (lastGoodMatch && lastGoodMatch.index !== undefined) {
      const truncateAt = lastGoodMatch.index + lastGoodMatch[0].length;
      let aggressive = json.substring(0, truncateAt);
      
      // Count and close remaining braces
      let braces = 0;
      for (const char of aggressive) {
        if (char === '{') braces++;
        else if (char === '}') braces--;
      }
      while (braces > 0) {
        aggressive += '}';
        braces--;
      }
      
      try {
        JSON.parse(aggressive);
        console.log(`[JSON Repair] ✅ Aggressive truncation worked at position ${truncateAt}`);
        return aggressive;
      } catch {
        console.log(`[JSON Repair] Aggressive truncation also failed`);
      }
    }
    
    return null;
  }
}

// Simple Google AI Studio integration
export const GOOGLE_AI_MODELS = {
  GEMINI_PRO: "gemini-2.0-flash", // Using gemini-2.0-flash (works with v1beta API)
  GEMINI_FLASH: "gemini-1.5-flash", // Alternative option
} as const;

export type GoogleAIModel = typeof GOOGLE_AI_MODELS.GEMINI_PRO | typeof GOOGLE_AI_MODELS.GEMINI_FLASH;

// Simple function to call Google AI
export async function callGoogleAI(
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
  }

  // Increase default max tokens to avoid truncation - Gemini 2.0 Flash supports up to 8192 output tokens
  const { temperature = 0.3, maxTokens = 8192, jsonMode = false } = options;

  // Combine system and user messages
  let systemInstruction = "";
  let userContent = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
    } else if (msg.role === "user") {
      userContent = msg.content;
    }
  }

  // Add JSON instruction if needed
  if (jsonMode) {
    userContent = `${userContent}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just pure JSON.`;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GOOGLE_AI_MODELS.GEMINI_PRO, // Using gemini-2.0-flash (compatible with v1beta API)
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: jsonMode ? "application/json" : undefined,
    },
    systemInstruction: systemInstruction || undefined,
  });

  // Retry logic with exponential backoff for rate limits
  // Free tier has strict limits (15 RPM, 1M TPM, 1500 RPD)
  const maxRetries = 6;
  let lastError: unknown;
  
  // Track last request time to respect rate limits
  const MIN_REQUEST_INTERVAL_MS = 5000; // 5 seconds minimum between requests (12 RPM max)
  const lastRequestTimeKey = 'google_ai_last_request_time';
  const lastRequestTime = (globalThis as any)[lastRequestTimeKey] || 0;
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    console.log(`[Google AI] ⏳ Waiting ${Math.ceil(waitTime/1000)}s before request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // More aggressive exponential backoff: 30s, 60s, 90s, 120s, 150s
        const backoffMs = Math.min(30000 * attempt, 150000);
        console.log(`[Google AI] Retry attempt ${attempt + 1}/${maxRetries} after ${Math.ceil(backoffMs/1000)}s backoff...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
      
      // Update last request time
      (globalThis as any)[lastRequestTimeKey] = Date.now();
      
      const inputTokens = Math.ceil((systemInstruction.length + userContent.length) / 4);
      console.log(`[Google AI] Calling model: ${GOOGLE_AI_MODELS.GEMINI_PRO}, input tokens: ~${inputTokens}, attempt: ${attempt + 1}`);
      
      const result = await model.generateContent(userContent);
      const response = result.response;
      
      // Check if response was blocked or filtered
      if (response.promptFeedback) {
        const feedback = response.promptFeedback;
        if (feedback.blockReason) {
          throw new Error(`Google AI blocked the request: ${feedback.blockReason}. ${feedback.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(", ") || ""}`);
        }
      }
      
      const text = response.text();

      if (!text) {
        console.error(`[Google AI] ❌ Empty response from Google AI`);
        console.error(`[Google AI] Response object:`, JSON.stringify(response, null, 2));
        throw new Error("No response from Google AI");
      }
      
      console.log(`[Google AI] ✅ Success! Response length: ${text.length} chars`);
      console.log(`[Google AI] Response starts with:`, text.substring(0, 100));
      console.log(`[Google AI] Response ends with:`, text.substring(Math.max(0, text.length - 100)));
      
      // Clean JSON if needed
      if (jsonMode) {
        let cleaned = text.trim();
        
        console.log(`[Google AI] Cleaning JSON response...`);
        console.log(`[Google AI] Original starts with:`, cleaned.substring(0, 50));
        
        // Remove markdown code blocks
        if (cleaned.startsWith("```json")) {
          console.log("[Google AI] Removing markdown json code block");
          cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "");
        } else if (cleaned.startsWith("```")) {
          console.log("[Google AI] Removing markdown code block");
          cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "");
        }
        
        // Try to extract JSON object if response has extra text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0] !== cleaned) {
          console.log(`[Google AI] Extracted JSON object from response (had extra text)`);
          console.log(`[Google AI] Before extraction length: ${cleaned.length}, After: ${jsonMatch[0].length}`);
          cleaned = jsonMatch[0];
        }
        
        // Check if JSON is complete (has matching braces)
        const openBraces = (cleaned.match(/\{/g) || []).length;
        const closeBraces = (cleaned.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          console.error(`[Google AI] ⚠️ JSON appears incomplete: ${openBraces} open braces, ${closeBraces} close braces`);
          console.error(`[Google AI] Response might be truncated. Length: ${cleaned.length}`);
        }
        
        // Validate it's valid JSON before returning
        try {
          const parsed = JSON.parse(cleaned);
          console.log(`[Google AI] ✅ Valid JSON confirmed (${Object.keys(parsed).length} top-level keys)`);
        } catch (parseErr) {
          console.error(`[Google AI] ❌ Response is not valid JSON after cleaning, attempting repair...`);
          console.error(`[Google AI] Parse error:`, parseErr instanceof Error ? parseErr.message : String(parseErr));
          
          // Attempt to repair truncated JSON
          const repaired = repairTruncatedJson(cleaned);
          if (repaired) {
            try {
              const parsed = JSON.parse(repaired);
              console.log(`[Google AI] ✅ JSON repaired successfully (${Object.keys(parsed).length} top-level keys)`);
              return repaired;
            } catch (repairErr) {
              console.error(`[Google AI] ❌ JSON repair failed:`, repairErr instanceof Error ? repairErr.message : String(repairErr));
            }
          }
          
          console.error(`[Google AI] First 1000 chars:`, cleaned.substring(0, 1000));
          console.error(`[Google AI] Last 500 chars:`, cleaned.substring(Math.max(0, cleaned.length - 500)));
          console.error(`[Google AI] Open braces: ${openBraces}, Close braces: ${closeBraces}`);
          
          // Throw error with details
          const error = new Error(`Invalid JSON response from Google AI: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          (error as any).rawResponse = cleaned;
          (error as any).rawResponseLength = cleaned.length;
          (error as any).openBraces = openBraces;
          (error as any).closeBraces = closeBraces;
          throw error;
        }
        
        return cleaned.trim();
      }
      
      return text;
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If it's a rate limit and we have retries left, continue
      if (
        (errorMessage.includes("429") || 
         errorMessage.includes("quota") || 
         errorMessage.includes("rate limit") ||
         errorMessage.includes("Too Many Requests") ||
         errorMessage.includes("Resource exhausted")) &&
        attempt < maxRetries - 1
      ) {
        console.log(`[Google AI] Rate limit hit (attempt ${attempt + 1}), will retry...`);
        continue;
      }
      
      // For other errors or final attempt, break and handle below
      break;
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(`[Google AI] All ${maxRetries} attempts failed. Last error:`, errorMessage);
  console.error(`[Google AI] Error details:`, {
    message: errorMessage,
    model: GOOGLE_AI_MODELS.GEMINI_PRO,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.substring(0, 10) + "...",
    attempts: maxRetries,
  });
  
  // Check if it's a specific quota/rate limit error - provide user-friendly message with specific wait time
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("Resource exhausted")) {
    console.error(`[Google AI] Rate limit hit after ${maxRetries} attempts.`);
    // Calculate total time spent in backoff: 30 + 60 + 90 + 120 + 150 = 450 seconds = 7.5 minutes
    // If we still hit rate limit after that, suggest waiting longer
    throw new Error("Rate limit reached. Please wait 2-3 minutes before trying again. Google AI free tier allows 15 requests per minute.");
  }
  
  throw new Error(`AI analysis failed: ${errorMessage.substring(0, 200)}`);
}
