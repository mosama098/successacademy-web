import "server-only";

export type MetaPurchaseOutboxJob = {
  eventId: string;
  orderId: string;
  occurredAt: string;
  attemptCount: number;
  leaseId: string;
};

export type MetaPurchaseCompletion = {
  eventId: string;
  leaseId: string;
  outcome: "delivered" | "retryable" | "permanent";
  diagnosticCode: string;
};

export interface MetaPurchaseOutbox {
  reconcile(): Promise<number>;
  claim(orderId?: string): Promise<MetaPurchaseOutboxJob | null>;
  complete(completion: MetaPurchaseCompletion): Promise<void>;
  requeue(orderId: string): Promise<void>;
}

export class MetaPurchaseOutboxUnavailableError extends Error {
  constructor() {
    super("meta_purchase_outbox_unavailable");
    this.name = "MetaPurchaseOutboxUnavailableError";
  }
}
