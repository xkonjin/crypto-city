export type AvatarJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type AvatarJob = {
  id: string;
  profileId: string;
  status: AvatarJobStatus;
  createdAt: number;
  updatedAt: number;
  outputPath?: string;
  error?: string;
};

export class AvatarQueue {
  private jobs: Map<string, AvatarJob> = new Map();
  private queue: string[] = [];

  enqueue(profileId: string): AvatarJob {
    const id = `avatar-${profileId}-${Date.now()}`;
    const job: AvatarJob = {
      id,
      profileId,
      status: 'queued',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.queue.push(id);
    return job;
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

  listJobs(): AvatarJob[] {
    return Array.from(this.jobs.values());
  }
}
