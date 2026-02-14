/**
 * Google AI Studio embeddings only.
 * Uses embedding-001 (768 dimensions).
 */

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_MODEL = "models/embedding-001";

/**
 * Create a Google embeddings instance for RAG, uploads, etc.
 */
export function createGoogleEmbeddings(): GoogleGenerativeAIEmbeddings {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: EMBEDDING_MODEL,
  });
}
