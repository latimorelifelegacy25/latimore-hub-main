/**
 * Worker Registry — maps worker names to worker instances
 */

import type { BaseWorker } from '../types';
import { ResearchWorker } from './research-worker';
import { DraftWorker } from './draft-worker';
import { SendWorker } from './send-worker';
import { CRMWorker } from './crm-worker';
import { AnalyticsWorker } from './analytics-worker';
import { ComplianceReviewer } from './compliance-reviewer';

class WorkerRegistry {
  private workers = new Map<string, BaseWorker>();

  constructor() {
    this.register(new ResearchWorker());
    this.register(new DraftWorker());
    this.register(new SendWorker());
    this.register(new CRMWorker());
    this.register(new AnalyticsWorker());
    this.register(new ComplianceReviewer());
  }

  register(worker: BaseWorker): void {
    this.workers.set(worker.name, worker);
    console.log(`[Registry] Registered worker: ${worker.name}`);
  }

  get(name: string): BaseWorker | undefined {
    return this.workers.get(name);
  }

  list(): string[] {
    return Array.from(this.workers.keys());
  }
}

export const workerRegistry = new WorkerRegistry();