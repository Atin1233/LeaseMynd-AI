/**
 * Unified AI abstraction – chat models
 * Google AI Studio only. All chat/completion uses Gemini.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { CreateChatModelOptions } from "./types";
import { DEFAULT_MODEL } from "./types";

const defaultTemperature = 0.7;

/**
 * Create a LangChain chat model (Google AI / Gemini only).
 * Use for AIAssistant, study-agent, predictive-document-analysis, etc.
 */
export function createChatModel(
  options: CreateChatModelOptions = {}
): BaseChatModel {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? defaultTemperature;
  const maxTokens = options.maxTokens;

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature,
    ...(maxTokens != null && { maxOutputTokens: maxTokens }),
  });
}
