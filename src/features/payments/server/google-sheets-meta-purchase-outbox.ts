import "server-only";
import {
  MetaPurchaseOutboxUnavailableError,
  type MetaPurchaseCompletion,
  type MetaPurchaseOutbox,
  type MetaPurchaseOutboxJob,
} from "./meta-purchase-outbox";

const REQUEST_TIMEOUT_MS = 30_000;

export class GoogleSheetsMetaPurchaseOutbox implements MetaPurchaseOutbox {
  constructor(private readonly options: { webhookUrl: string; webhookSecret: string; fetchImpl?: typeof fetch }) {
    if (!options.webhookUrl || !options.webhookSecret) throw new MetaPurchaseOutboxUnavailableError();
  }

  async reconcile(): Promise<number> {
    const data = await this.execute("reconcile_meta_purchase_jobs", { contractVersion: 3 });
    if (data.reconciled !== true || !Number.isSafeInteger(data.created) || Number(data.created) < 0) {
      throw new MetaPurchaseOutboxUnavailableError();
    }
    return Number(data.created);
  }

  async claim(orderId?: string): Promise<MetaPurchaseOutboxJob | null> {
    const data = await this.execute("claim_meta_purchase_job", { contractVersion: 3, orderId: orderId ?? null });
    if (data.job === null) return null;
    if (!isRecord(data.job) || typeof data.job.eventId !== "string" || typeof data.job.orderId !== "string"
      || typeof data.job.occurredAt !== "string" || !Number.isSafeInteger(data.job.attemptCount)
      || typeof data.job.leaseId !== "string") throw new MetaPurchaseOutboxUnavailableError();
    return data.job as MetaPurchaseOutboxJob;
  }

  async complete(completion: MetaPurchaseCompletion): Promise<void> {
    const data = await this.execute("complete_meta_purchase_job", { contractVersion: 3, ...completion });
    if (data.completed !== true || data.eventId !== completion.eventId) throw new MetaPurchaseOutboxUnavailableError();
  }

  async requeue(orderId: string): Promise<void> {
    const data = await this.execute("requeue_meta_purchase_job", { contractVersion: 3, orderId });
    if (data.requeued !== true || data.orderId !== orderId) throw new MetaPurchaseOutboxUnavailableError();
  }

  private async execute(action: string, payload: Record<string, unknown>) {
    let response: Response;
    try {
      response = await (this.options.fetchImpl ?? fetch)(this.options.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: this.options.webhookSecret,
          domain: "payments",
          action,
          payload,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch { throw new MetaPurchaseOutboxUnavailableError(); }
    if (!response.ok) throw new MetaPurchaseOutboxUnavailableError();
    let result: unknown;
    try { result = await response.json(); } catch { throw new MetaPurchaseOutboxUnavailableError(); }
    if (!isRecord(result) || result.success !== true || !isRecord(result.data)) throw new MetaPurchaseOutboxUnavailableError();
    return result.data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
