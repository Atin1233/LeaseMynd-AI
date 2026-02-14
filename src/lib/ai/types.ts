/**
 * Unified AI abstraction – types
 * Google AI Studio only.
 */

export interface CreateChatModelOptions {
  /** Model name. Default: gemini-2.0-flash */
  model?: string;
  /** Temperature 0–1. Default 0.7 */
  temperature?: number;
  /** Timeout in ms */
  timeout?: number;
  /** Max tokens for completion */
  maxTokens?: number;
}

export const DEFAULT_MODEL = "gemini-2.0-flash" as const;
