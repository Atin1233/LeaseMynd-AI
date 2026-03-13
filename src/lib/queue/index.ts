/**
 * Job Queue System
 * 
 * Provides a simple job queue for handling long-running operations like lease analysis.
 * 
 * Features:
 * - In-memory queue for development
 * - Upstash QStash integration for production (optional)
 * - Job status tracking
 * - Retry logic
 * - Concurrency control
 */

export interface Job<T = unknown> {
  /** Unique job ID */
  id: string;
  /** Job type/name */
  type: string;
  /** Job payload */
  payload: T;
  /** Job status */
  status: JobStatus;
  /** Priority (higher = more urgent) */
  priority: number;
  /** When the job was created */
  createdAt: number;
  /** When the job started processing */
  startedAt?: number;
  /** When the job completed */
  completedAt?: number;
  /** Number of retry attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Error message if failed */
  error?: string;
  /** Job result if completed */
  result?: unknown;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobHandler<T = unknown, R = unknown> {
  (job: Job<T>): Promise<R>;
}

export interface QueueConfig {
  /** Maximum concurrent jobs */
  concurrency: number;
  /** Default max retry attempts */
  defaultMaxAttempts: number;
  /** Delay between retries in ms */
  retryDelay: number;
  /** Job timeout in ms */
  jobTimeout: number;
  /** Poll interval for processing in ms */
  pollInterval: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  concurrency: 2,
  defaultMaxAttempts: 3,
  retryDelay: 5000,
  jobTimeout: 300000, // 5 minutes
  pollInterval: 1000,
};

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * In-memory Job Queue
 */
class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private config: QueueConfig;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private statusListeners: Map<string, ((job: Job) => void)[]> = new Map();
  
  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Register a handler for a job type
   */
  registerHandler<T, R>(type: string, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler as JobHandler);
    console.log(`[Queue] Registered handler for job type: ${type}`);
  }
  
  /**
   * Add a job to the queue
   */
  async enqueue<T>(
    type: string,
    payload: T,
    options: {
      priority?: number;
      maxAttempts?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: generateJobId(),
      type,
      payload,
      status: 'pending',
      priority: options.priority ?? 0,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.defaultMaxAttempts,
      metadata: options.metadata,
    };
    
    this.jobs.set(job.id, job as Job);
    console.log(`[Queue] Enqueued job ${job.id} (type: ${type})`);
    
    // Start processing if not already running
    this.startProcessing();
    
    return job;
  }
  
  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) ?? null;
  }
  
  /**
   * Get all jobs with optional status filter
   */
  async getJobs(status?: JobStatus): Promise<Job[]> {
    const jobs = Array.from(this.jobs.values());
    if (status) {
      return jobs.filter(j => j.status === status);
    }
    return jobs;
  }
  
  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }
    
    if (job.status === 'pending') {
      job.status = 'cancelled';
      this.notifyStatusChange(job);
      return true;
    }
    
    return false;
  }
  
  /**
   * Subscribe to job status changes
   */
  onStatusChange(jobId: string, callback: (job: Job) => void): () => void {
    if (!this.statusListeners.has(jobId)) {
      this.statusListeners.set(jobId, []);
    }
    this.statusListeners.get(jobId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.statusListeners.get(jobId);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Wait for a job to complete
   */
  async waitForJob(jobId: string, timeoutMs?: number): Promise<Job> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkJob = () => {
        const job = this.jobs.get(jobId);
        if (!job) {
          reject(new Error(`Job ${jobId} not found`));
          return;
        }
        
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          resolve(job);
          return;
        }
        
        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timeout waiting for job ${jobId}`));
          return;
        }
        
        setTimeout(checkJob, 500);
      };
      
      checkJob();
    });
  }
  
  /**
   * Start the queue processor
   */
  startProcessing(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[Queue] Started processing');
    
    this.pollTimer = setInterval(() => {
      this.processNextJobs();
    }, this.config.pollInterval);
  }
  
  /**
   * Stop the queue processor
   */
  stopProcessing(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[Queue] Stopped processing');
  }
  
  /**
   * Process next available jobs
   */
  private async processNextJobs(): Promise<void> {
    // Check concurrency limit
    if (this.processing.size >= this.config.concurrency) {
      return;
    }
    
    // Get pending jobs sorted by priority (highest first)
    const pendingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
    
    // Process up to concurrency limit
    const slotsAvailable = this.config.concurrency - this.processing.size;
    const jobsToProcess = pendingJobs.slice(0, slotsAvailable);
    
    for (const job of jobsToProcess) {
      this.processJob(job);
    }
  }
  
  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`[Queue] No handler for job type: ${job.type}`);
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      this.notifyStatusChange(job);
      return;
    }
    
    // Mark as processing
    this.processing.add(job.id);
    job.status = 'processing';
    job.startedAt = Date.now();
    job.attempts++;
    this.notifyStatusChange(job);
    
    console.log(`[Queue] Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
    
    try {
      // Run handler with timeout
      const result = await Promise.race([
        handler(job),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Job timeout')), this.config.jobTimeout)
        ),
      ]);
      
      // Success
      job.status = 'completed';
      job.completedAt = Date.now();
      job.result = result;
      console.log(`[Queue] Job ${job.id} completed in ${job.completedAt - job.startedAt!}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Queue] Job ${job.id} failed: ${errorMessage}`);
      
      // Check if should retry
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        job.error = errorMessage;
        console.log(`[Queue] Job ${job.id} will retry in ${this.config.retryDelay}ms`);
        
        // Delay before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      } else {
        job.status = 'failed';
        job.error = `Failed after ${job.attempts} attempts: ${errorMessage}`;
      }
    } finally {
      this.processing.delete(job.id);
      this.notifyStatusChange(job);
    }
  }
  
  /**
   * Notify status change listeners
   */
  private notifyStatusChange(job: Job): void {
    const listeners = this.statusListeners.get(job.id);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(job);
        } catch (error) {
          console.error(`[Queue] Status listener error for job ${job.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    };
  }
  
  /**
   * Clear completed and failed jobs older than specified age
   */
  cleanup(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt &&
        now - job.completedAt > maxAgeMs
      ) {
        this.jobs.delete(id);
        this.statusListeners.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Queue] Cleaned up ${cleaned} old jobs`);
    }
    
    return cleaned;
  }
}

// Singleton queue instance
let queueInstance: JobQueue | null = null;

/**
 * Get the queue instance
 */
export function getQueue(): JobQueue {
  if (!queueInstance) {
    queueInstance = new JobQueue();
  }
  return queueInstance;
}

/**
 * Create a new queue instance with custom config
 */
export function createQueue(config: Partial<QueueConfig>): JobQueue {
  return new JobQueue(config);
}

// Job types for lease analysis
export const JobTypes = {
  /** Analyze a lease document */
  ANALYZE_LEASE: 'analyze_lease',
  /** Generate improved lease */
  GENERATE_IMPROVED_LEASE: 'generate_improved_lease',
  /** Export lease as PDF */
  EXPORT_LEASE_PDF: 'export_lease_pdf',
  /** Process uploaded document */
  PROCESS_UPLOAD: 'process_upload',
  /** Generate market comparison */
  MARKET_COMPARISON: 'market_comparison',
} as const;

export type JobType = typeof JobTypes[keyof typeof JobTypes];

// Payload types for each job
export interface AnalyzeLeasePayload {
  leaseId: string;
  userId: string;
  organizationId: string;
  forceReanalyze?: boolean;
}

export interface GenerateImprovedLeasePayload {
  leaseId: string;
  analysisId: string;
  userId: string;
  mode: 'full' | 'changes_only';
}

export interface ExportLeasePdfPayload {
  leaseId: string;
  analysisId: string;
  userId: string;
  includeRedlines?: boolean;
}

export interface ProcessUploadPayload {
  leaseId: string;
  fileUrl: string;
  userId: string;
  organizationId: string;
}

export { JobQueue };
export default JobQueue;
