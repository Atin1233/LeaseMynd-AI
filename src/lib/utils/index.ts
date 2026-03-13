/**
 * Utility modules index
 * 
 * Exports all utility functions and classes.
 */

// Token Management
export {
  TokenManager,
  estimateTokens,
  estimateChars,
  exceedsTokenLimit,
  chunkContent,
  smartTruncate,
  extractKeySections,
  createCondensedContext,
  mergeChunkResults,
  createProcessingContext,
  type TokenManagerConfig,
  type ContentChunk,
  type ChunkingResult,
  type MergeStrategy,
} from './token-manager';

// Error Handling
export {
  ErrorHandler,
  ErrorType,
  classifyError,
  calculateRetryDelay,
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  sleep,
  createCircuitBreaker,
  tryCatch,
  logError,
  createErrorResponse,
  type ClassifiedError,
  type RetryConfig,
} from './error-handler';
