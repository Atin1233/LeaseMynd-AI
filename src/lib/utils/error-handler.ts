/**
 * Error Handler Utility
 * 
 * Provides standardized error handling, retry logic with exponential backoff,
 * and error classification for better recovery strategies.
 */

export enum ErrorType {
  /** Network-related errors (timeout, connection refused, etc.) */
  NETWORK = 'NETWORK',
  /** Rate limit errors (429, quota exceeded, etc.) */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Authentication errors (401, 403, invalid API key) */
  AUTH = 'AUTH',
  /** Validation errors (invalid input, bad request) */
  VALIDATION = 'VALIDATION',
  /** Server errors (500, 502, 503, etc.) */
  SERVER = 'SERVER',
  /** AI/Model specific errors (context length, safety filters, etc.) */
  AI_MODEL = 'AI_MODEL',
  /** JSON parsing errors */
  PARSE = 'PARSE',
  /** Database errors */
  DATABASE = 'DATABASE',
  /** Unknown/unclassified errors */
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedError {
  /** Original error */
  original: Error;
  /** Classified error type */
  type: ErrorType;
  /** Whether this error is retryable */
  retryable: boolean;
  /** Suggested retry delay in ms (if retryable) */
  retryDelay?: number;
  /** User-friendly error message */
  userMessage: string;
  /** Technical details for logging */
  technicalDetails: string;
  /** HTTP status code if applicable */
  statusCode?: number;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in ms */
  baseDelay: number;
  /** Maximum delay between retries in ms */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Whether to add jitter to delays */
  jitter: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: ClassifiedError) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: ClassifiedError, nextDelay: number) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Classify an error based on its message and properties
 */
export function classifyError(error: unknown): ClassifiedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();
  
  // Rate limit errors
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('too many requests') ||
    message.includes('resource exhausted')
  ) {
    return {
      original: err,
      type: ErrorType.RATE_LIMIT,
      retryable: true,
      retryDelay: 60000, // Wait 1 minute for rate limits
      userMessage: 'The service is temporarily busy. Please wait a moment and try again.',
      technicalDetails: `Rate limit error: ${err.message}`,
      statusCode: 429,
    };
  }
  
  // Authentication errors
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('api key') ||
    message.includes('authentication')
  ) {
    return {
      original: err,
      type: ErrorType.AUTH,
      retryable: false,
      userMessage: 'Authentication failed. Please check your credentials.',
      technicalDetails: `Auth error: ${err.message}`,
      statusCode: message.includes('401') ? 401 : 403,
    };
  }
  
  // Network errors
  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return {
      original: err,
      type: ErrorType.NETWORK,
      retryable: true,
      retryDelay: 5000,
      userMessage: 'Network error. Please check your connection and try again.',
      technicalDetails: `Network error: ${err.message}`,
    };
  }
  
  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('bad gateway') ||
    message.includes('service unavailable')
  ) {
    return {
      original: err,
      type: ErrorType.SERVER,
      retryable: true,
      retryDelay: 10000,
      userMessage: 'The server is experiencing issues. Please try again shortly.',
      technicalDetails: `Server error: ${err.message}`,
      statusCode: 500,
    };
  }
  
  // AI model errors
  if (
    message.includes('context length') ||
    message.includes('token') ||
    message.includes('safety') ||
    message.includes('blocked') ||
    message.includes('content policy') ||
    message.includes('model')
  ) {
    return {
      original: err,
      type: ErrorType.AI_MODEL,
      retryable: message.includes('context') || message.includes('token'), // Retryable if we can reduce input
      retryDelay: 1000,
      userMessage: 'The AI could not process this content. Try with a shorter document.',
      technicalDetails: `AI model error: ${err.message}`,
    };
  }
  
  // Parse errors
  if (
    message.includes('json') ||
    message.includes('parse') ||
    message.includes('syntax') ||
    message.includes('unexpected token')
  ) {
    return {
      original: err,
      type: ErrorType.PARSE,
      retryable: true, // Can retry, might get valid response
      retryDelay: 2000,
      userMessage: 'Failed to process the response. Retrying...',
      technicalDetails: `Parse error: ${err.message}`,
    };
  }
  
  // Validation errors
  if (
    message.includes('400') ||
    message.includes('bad request') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('validation')
  ) {
    return {
      original: err,
      type: ErrorType.VALIDATION,
      retryable: false,
      userMessage: 'Invalid request. Please check your input and try again.',
      technicalDetails: `Validation error: ${err.message}`,
      statusCode: 400,
    };
  }
  
  // Database errors
  if (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('postgres') ||
    message.includes('supabase') ||
    message.includes('constraint')
  ) {
    return {
      original: err,
      type: ErrorType.DATABASE,
      retryable: !message.includes('constraint'), // Don't retry constraint violations
      retryDelay: 3000,
      userMessage: 'Database error. Please try again.',
      technicalDetails: `Database error: ${err.message}`,
    };
  }
  
  // Unknown error
  return {
    original: err,
    type: ErrorType.UNKNOWN,
    retryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalDetails: `Unknown error: ${err.message}`,
  };
}

/**
 * Calculate delay for next retry with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  classifiedError?: ClassifiedError
): number {
  // Use error-specific delay if available
  if (classifiedError?.retryDelay) {
    return classifiedError.retryDelay;
  }
  
  // Exponential backoff
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  
  // Apply max delay cap
  delay = Math.min(delay, config.maxDelay);
  
  // Add jitter (±25%)
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay + (Math.random() * jitterRange * 2) - jitterRange;
  }
  
  return Math.floor(delay);
}

/**
 * Execute a function with automatic retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ClassifiedError | null = null;
  
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = classifyError(error);
      
      // Check if we should retry
      const shouldRetry = cfg.isRetryable 
        ? cfg.isRetryable(lastError) 
        : lastError.retryable;
      
      if (!shouldRetry || attempt === cfg.maxRetries) {
        throw lastError.original;
      }
      
      // Calculate delay
      const delay = calculateRetryDelay(attempt, cfg, lastError);
      
      // Notify about retry
      if (cfg.onRetry) {
        cfg.onRetry(attempt + 1, lastError, delay);
      }
      
      console.log(
        `[Retry] Attempt ${attempt + 1}/${cfg.maxRetries} failed (${lastError.type}). ` +
        `Retrying in ${Math.round(delay / 1000)}s...`
      );
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  // Should never reach here, but just in case
  throw lastError?.original || new Error('Retry failed');
}

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Execute a function with both retry and timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {},
  timeoutMs = 60000
): Promise<T> {
  return withRetry(
    () => withTimeout(fn, timeoutMs),
    retryConfig
  );
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: {
    failureThreshold: number;
    resetTimeout: number;
    onOpen?: () => void;
    onClose?: () => void;
    onHalfOpen?: () => void;
  }
): () => Promise<T> {
  let failures = 0;
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let lastFailureTime = 0;
  
  return async () => {
    // Check if we should reset from open to half-open
    if (state === 'open') {
      const timeSinceFailure = Date.now() - lastFailureTime;
      if (timeSinceFailure >= options.resetTimeout) {
        state = 'half-open';
        options.onHalfOpen?.();
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset to closed
      if (state === 'half-open') {
        state = 'closed';
        failures = 0;
        options.onClose?.();
      }
      
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();
      
      // Check if we should open the circuit (state is 'closed' or 'half-open' here)
      if (failures >= options.failureThreshold) {
        state = 'open';
        options.onOpen?.();
      }
      
      throw error;
    }
  };
}

/**
 * Wrap an async function with error handling that returns a Result type
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: ClassifiedError }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: classifyError(error) };
  }
}

/**
 * Log error with structured format
 */
export function logError(
  context: string,
  error: ClassifiedError | unknown,
  additionalData?: Record<string, unknown>
): void {
  const classified = error instanceof Error || typeof error === 'object' 
    ? classifyError(error)
    : classifyError(new Error(String(error)));
  
  console.error(`[${context}] Error:`, {
    type: classified.type,
    retryable: classified.retryable,
    message: classified.technicalDetails,
    userMessage: classified.userMessage,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  context = 'API'
): { error: string; details?: string; code: ErrorType; status: number } {
  const classified = classifyError(error);
  
  return {
    error: classified.userMessage,
    details: process.env.NODE_ENV === 'development' ? classified.technicalDetails : undefined,
    code: classified.type,
    status: classified.statusCode || 500,
  };
}

export const ErrorHandler = {
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
  ErrorType,
};

export default ErrorHandler;
