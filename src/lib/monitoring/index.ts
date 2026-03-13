/**
 * Monitoring and Observability Utility
 * 
 * Provides structured logging, error tracking (Sentry), and analytics (PostHog).
 * Designed to work in both server and client environments.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Unique request/trace ID */
  traceId?: string;
  /** User ID if available */
  userId?: string;
  /** Organization ID if available */
  organizationId?: string;
  /** Feature/module name */
  module?: string;
  /** HTTP method */
  method?: string;
  /** Request path */
  path?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

export interface PerformanceMetric {
  /** Metric name */
  name: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Timestamp when measured */
  timestamp: number;
  /** Success or failure */
  success: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface MonitoringConfig {
  /** Enable console logging */
  enableConsole: boolean;
  /** Minimum log level for console */
  consoleLevel: LogLevel;
  /** Sentry DSN for error tracking */
  sentryDsn?: string;
  /** PostHog API key for analytics */
  posthogKey?: string;
  /** Environment name */
  environment: string;
  /** Enable performance monitoring */
  enablePerformance: boolean;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enableConsole: true,
  consoleLevel: 'info',
  environment: process.env.NODE_ENV || 'development',
  enablePerformance: true,
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Generate a trace ID for request tracking
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Structured Logger
 */
class Logger {
  private config: MonitoringConfig;
  private defaultContext: LogContext;
  private sentryInitialized = false;
  private posthogInitialized = false;
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.defaultContext = {};
    
    // Initialize Sentry if DSN provided
    if (this.config.sentryDsn) {
      this.initSentry();
    }
    
    // Initialize PostHog if key provided
    if (this.config.posthogKey) {
      this.initPostHog();
    }
  }
  
  /**
   * Initialize Sentry for error tracking
   */
  private async initSentry(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side - would use @sentry/node
      console.log('[Monitoring] Sentry server-side initialization (stub)');
      // In production, you would:
      // const Sentry = await import('@sentry/node');
      // Sentry.init({ dsn: this.config.sentryDsn, environment: this.config.environment });
    } else {
      // Client-side - would use @sentry/browser
      console.log('[Monitoring] Sentry client-side initialization (stub)');
      // In production, you would:
      // const Sentry = await import('@sentry/browser');
      // Sentry.init({ dsn: this.config.sentryDsn, environment: this.config.environment });
    }
    this.sentryInitialized = true;
  }
  
  /**
   * Initialize PostHog for analytics
   */
  private async initPostHog(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side - would use posthog-node
      console.log('[Monitoring] PostHog server-side initialization (stub)');
      // In production, you would:
      // const { PostHog } = await import('posthog-node');
      // this.posthog = new PostHog(this.config.posthogKey);
    } else {
      // Client-side - would use posthog-js
      console.log('[Monitoring] PostHog client-side initialization (stub)');
      // In production, you would:
      // const posthog = await import('posthog-js');
      // posthog.init(this.config.posthogKey);
    }
    this.posthogInitialized = true;
  }
  
  /**
   * Set default context for all logs
   */
  setContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }
  
  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Check log level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.consoleLevel]) {
      return;
    }
    
    const fullContext = { ...this.defaultContext, ...context };
    const timestamp = new Date().toISOString();
    
    // Build log entry
    const logEntry = {
      timestamp,
      level,
      message,
      ...fullContext,
      ...(error ? { error: error.message, stack: error.stack } : {}),
    };
    
    // Console output
    if (this.config.enableConsole) {
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const modulePrefix = fullContext.module ? `[${fullContext.module}]` : '';
      
      switch (level) {
        case 'debug':
          console.debug(`${prefix}${modulePrefix} ${message}`, fullContext);
          break;
        case 'info':
          console.info(`${prefix}${modulePrefix} ${message}`, fullContext);
          break;
        case 'warn':
          console.warn(`${prefix}${modulePrefix} ${message}`, fullContext);
          break;
        case 'error':
          console.error(`${prefix}${modulePrefix} ${message}`, fullContext, error);
          break;
      }
    }
    
    // Send errors to Sentry
    if (level === 'error' && error && this.sentryInitialized) {
      this.captureException(error, fullContext);
    }
  }
  
  /**
   * Debug log
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
  
  /**
   * Info log
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }
  
  /**
   * Warning log
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }
  
  /**
   * Error log
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, context, err);
  }
  
  /**
   * Capture an exception to Sentry
   */
  captureException(error: Error, context?: LogContext): void {
    if (!this.sentryInitialized) {
      console.error('[Monitoring] Sentry not initialized, cannot capture exception');
      return;
    }
    
    // In production, you would:
    // Sentry.captureException(error, {
    //   extra: context,
    //   tags: {
    //     module: context?.module,
    //     traceId: context?.traceId,
    //   },
    // });
    
    console.log('[Monitoring] Would capture exception to Sentry:', error.message);
  }
  
  /**
   * Capture a message to Sentry
   */
  captureMessage(message: string, level: LogLevel = 'info', context?: LogContext): void {
    if (!this.sentryInitialized) {
      return;
    }
    
    // In production, you would:
    // Sentry.captureMessage(message, { level, extra: context });
    
    console.log(`[Monitoring] Would capture message to Sentry: ${message}`);
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private maxMetrics = 1000;
  
  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }
  
  /**
   * End a performance timer and record the metric
   */
  endTimer(name: string, success = true, metadata?: Record<string, unknown>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`[Performance] Timer ${name} was not started`);
      return 0;
    }
    
    const durationMs = Date.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric({
      name,
      durationMs,
      timestamp: Date.now(),
      success,
      metadata,
    });
    
    return durationMs;
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep metrics under limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  /**
   * Measure an async function's performance
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(name);
    let success = true;
    
    try {
      return await fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      this.endTimer(name, success, metadata);
    }
  }
  
  /**
   * Get metrics for a specific name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }
  
  /**
   * Get aggregate statistics for a metric
   */
  getStats(name: string): {
    count: number;
    successRate: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.filter(m => m.name === name);
    if (metrics.length === 0) {
      return null;
    }
    
    const durations = metrics.map(m => m.durationMs).sort((a, b) => a - b);
    const successCount = metrics.filter(m => m.success).length;
    
    return {
      count: metrics.length,
      successRate: successCount / metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0]!,
      maxDuration: durations[durations.length - 1]!,
      p50: durations[Math.floor(durations.length * 0.5)]!,
      p95: durations[Math.floor(durations.length * 0.95)]!,
      p99: durations[Math.floor(durations.length * 0.99)]!,
    };
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

/**
 * Analytics Tracker
 */
class AnalyticsTracker {
  private config: MonitoringConfig;
  private initialized = false;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
  }
  
  /**
   * Track a custom event
   */
  trackEvent(
    eventName: string,
    properties?: Record<string, unknown>,
    userId?: string
  ): void {
    if (!this.config.posthogKey) {
      console.debug(`[Analytics] Event: ${eventName}`, properties);
      return;
    }
    
    // In production, you would:
    // posthog.capture(eventName, { ...properties, distinctId: userId });
    
    console.log(`[Analytics] Would track: ${eventName}`, properties);
  }
  
  /**
   * Track a page view
   */
  trackPageView(path: string, userId?: string): void {
    this.trackEvent('$pageview', { path }, userId);
  }
  
  /**
   * Identify a user
   */
  identifyUser(
    userId: string,
    traits?: Record<string, unknown>
  ): void {
    if (!this.config.posthogKey) {
      console.debug(`[Analytics] Identify: ${userId}`, traits);
      return;
    }
    
    // In production, you would:
    // posthog.identify(userId, traits);
    
    console.log(`[Analytics] Would identify: ${userId}`, traits);
  }
  
  /**
   * Track a feature flag evaluation
   */
  trackFeatureFlag(
    flagName: string,
    value: boolean | string,
    userId?: string
  ): void {
    this.trackEvent('$feature_flag_called', {
      $feature_flag: flagName,
      $feature_flag_response: value,
    }, userId);
  }
}

// Singleton instances
let loggerInstance: Logger | null = null;
let performanceInstance: PerformanceMonitor | null = null;
let analyticsInstance: AnalyticsTracker | null = null;

/**
 * Get the logger instance
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger({
      sentryDsn: process.env.SENTRY_DSN,
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      environment: process.env.NODE_ENV || 'development',
      consoleLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    });
  }
  return loggerInstance;
}

/**
 * Get the performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceInstance) {
    performanceInstance = new PerformanceMonitor();
  }
  return performanceInstance;
}

/**
 * Get the analytics tracker instance
 */
export function getAnalytics(): AnalyticsTracker {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker({
      ...DEFAULT_CONFIG,
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    });
  }
  return analyticsInstance;
}

/**
 * Create a request logger with trace ID
 */
export function createRequestLogger(request: Request): Logger {
  const logger = getLogger();
  const traceId = generateTraceId();
  const url = new URL(request.url);
  
  return logger.child({
    traceId,
    method: request.method,
    path: url.pathname,
  });
}

// Common event names for analytics
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Lease events
  LEASE_UPLOADED: 'lease_uploaded',
  LEASE_ANALYZED: 'lease_analyzed',
  LEASE_EXPORTED: 'lease_exported',
  
  // Feature events
  IMPROVED_LEASE_GENERATED: 'improved_lease_generated',
  MARKET_COMPARISON_VIEWED: 'market_comparison_viewed',
  CHEAT_SHEET_GENERATED: 'cheat_sheet_generated',
  
  // Subscription events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PLAN_UPGRADED: 'plan_upgraded',
  
  // Error events
  ANALYSIS_FAILED: 'analysis_failed',
  UPLOAD_FAILED: 'upload_failed',
  PAYMENT_FAILED: 'payment_failed',
} as const;

// Performance metric names
export const PerformanceMetrics = {
  LEASE_ANALYSIS_DURATION: 'lease_analysis_duration',
  PDF_PROCESSING_DURATION: 'pdf_processing_duration',
  AI_API_LATENCY: 'ai_api_latency',
  DATABASE_QUERY_DURATION: 'database_query_duration',
  EXPORT_GENERATION_DURATION: 'export_generation_duration',
} as const;

export { Logger, PerformanceMonitor, AnalyticsTracker };
export default { getLogger, getPerformanceMonitor, getAnalytics };
