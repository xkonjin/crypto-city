/**
 * Avatar Generation Queue
 * 
 * Manages the queue of avatar generation jobs. Each job transforms a user's
 * profile picture into a pixel art spritesheet using Nano Banana (Gemini API).
 */

import {
  generatePixelAvatar,
  generateProceduralAvatar,
  type AvatarGenerationProgress,
} from './AvatarGenerator';

export type AvatarJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type AvatarJob = {
  id: string;
  profileId: string;
  username: string;
  profileImageUrl: string;
  status: AvatarJobStatus;
  createdAt: number;
  updatedAt: number;
  /** Base64 or data URL of the generated spritesheet */
  outputPath?: string;
  /** Loaded HTMLImageElement for rendering */
  spritesheetImage?: HTMLImageElement;
  error?: string;
  progress?: AvatarGenerationProgress;
};

export class AvatarQueue {
  private jobs: Map<string, AvatarJob> = new Map();
  private queue: string[] = [];
  private processing = false;
  private onJobUpdate?: (job: AvatarJob) => void;

  /**
   * Set a callback to be notified when jobs are updated.
   */
  setOnJobUpdate(callback: (job: AvatarJob) => void): void {
    this.onJobUpdate = callback;
  }

  /**
   * Enqueue a new avatar generation job.
   */
  enqueue(
    profileId: string,
    username: string,
    profileImageUrl: string
  ): AvatarJob {
    const id = `avatar-${profileId}-${Date.now()}`;
    const job: AvatarJob = {
      id,
      profileId,
      username,
      profileImageUrl,
      status: 'queued',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.queue.push(id);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
    
    return job;
  }

  /**
   * Process the queue of avatar generation jobs.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const nextId = this.queue.shift();
      if (!nextId) continue;
      
      const job = this.jobs.get(nextId);
      if (!job) continue;

      job.status = 'processing';
      job.updatedAt = Date.now();
      this.onJobUpdate?.(job);

      try {
        // Try AI generation first
        const result = await generatePixelAvatar(
          {
            profileImageUrl: job.profileImageUrl,
            username: job.username,
          },
          (progress) => {
            job.progress = progress;
            job.updatedAt = Date.now();
            this.onJobUpdate?.(job);
          }
        );

        if (result.success && result.spritesheetBlobUrl) {
          job.status = 'completed';
          job.outputPath = result.spritesheetBlobUrl;
          
          // Load the image for rendering
          const img = new Image();
          img.src = result.spritesheetBlobUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          job.spritesheetImage = img;
          
        } else {
          // Fall back to procedural generation
          console.warn(`[AvatarQueue] AI failed for ${job.username}, using procedural`);
          const proceduralUrl = generateProceduralAvatar(job.username);
          job.status = 'completed';
          job.outputPath = proceduralUrl;
          
          const img = new Image();
          img.src = proceduralUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          job.spritesheetImage = img;
        }
      } catch (error) {
        console.error(`[AvatarQueue] Failed for ${job.username}:`, error);
        
        // Fall back to procedural generation on any error
        try {
          const proceduralUrl = generateProceduralAvatar(job.username);
          job.status = 'completed';
          job.outputPath = proceduralUrl;
          
          const img = new Image();
          img.src = proceduralUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          job.spritesheetImage = img;
        } catch (fallbackError) {
          job.status = 'failed';
          job.error = `${error}`;
        }
      }

      job.updatedAt = Date.now();
      this.jobs.set(nextId, job);
      this.onJobUpdate?.(job);
    }

    this.processing = false;
  }

  startNext(): AvatarJob | null {
    const nextId = this.queue.shift();
    if (!nextId) return null;
    const job = this.jobs.get(nextId);
    if (!job) return null;
    job.status = 'processing';
    job.updatedAt = Date.now();
    this.jobs.set(nextId, job);
    return job;
  }

  complete(jobId: string, outputPath: string): AvatarJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.status = 'completed';
    job.outputPath = outputPath;
    job.updatedAt = Date.now();
    this.jobs.set(jobId, job);
    return job;
  }

  fail(jobId: string, error: string): AvatarJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.status = 'failed';
    job.error = error;
    job.updatedAt = Date.now();
    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): AvatarJob | null {
    return this.jobs.get(jobId) || null;
  }

  getJobByProfileId(profileId: string): AvatarJob | null {
    for (const job of this.jobs.values()) {
      if (job.profileId === profileId) return job;
    }
    return null;
  }

  listJobs(): AvatarJob[] {
    return Array.from(this.jobs.values());
  }
}
