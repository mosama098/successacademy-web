import "server-only";
import { GoogleSheetsCustomerRepository } from "../../customers/google-sheets-customer-repository";
import type { CustomerRepository } from "../../customers/customer-repository";
import type { OrderService } from "./order-service";
import { GoogleSheetsMetaPurchaseOutbox } from "./google-sheets-meta-purchase-outbox";
import { MetaCapiClient, MetaCapiConfigurationError, readMetaCapiConfig, type MetaDeliveryResult } from "./meta-capi";
import { buildMetaPurchaseEvent } from "./meta-purchase";
import type { MetaPurchaseOutbox } from "./meta-purchase-outbox";
import { createConfiguredOrderService } from "./service-factory";

type DeliveryDependencies = {
  outbox: MetaPurchaseOutbox;
  service: OrderService;
  customers: CustomerRepository;
  createClient: () => { sendPurchase: MetaCapiClient["sendPurchase"] };
  trackingValueEgp: number;
};

export type MetaPurchaseDrainResult = {
  claimed: boolean;
  eventId: string | null;
  outcome: "delivered" | "retryable" | "permanent" | "idle";
  diagnosticCode: string;
  httpStatus: number | null;
};

export async function drainMetaPurchaseForOrder(orderId: string) {
  return drainOne(createConfiguredDependencies(), orderId);
}

export async function drainPendingMetaPurchases(limit = 10) {
  const dependencies = createConfiguredDependencies();
  const results: MetaPurchaseDrainResult[] = [];
  try {
    await dependencies.outbox.reconcile();
  } catch {
    logResult({ claimed: false, eventId: null, outcome: "retryable", diagnosticCode: "outbox_reconcile_failed", httpStatus: null });
  }
  for (let index = 0; index < Math.max(1, Math.min(limit, 10)); index += 1) {
    const result = await drainOne(dependencies);
    results.push(result);
    if (!result.claimed) break;
  }
  return results;
}

export async function requeueMetaPurchaseForOrder(orderId: string) {
  await createConfiguredDependencies().outbox.requeue(orderId);
}

export async function drainOne(dependencies: DeliveryDependencies, orderId?: string): Promise<MetaPurchaseDrainResult> {
  let job;
  try {
    job = await dependencies.outbox.claim(orderId);
  } catch {
    return logResult({ claimed: false, eventId: null, outcome: "retryable", diagnosticCode: "outbox_claim_failed", httpStatus: null });
  }
  if (!job) return { claimed: false, eventId: null, outcome: "idle", diagnosticCode: "no_due_job", httpStatus: null };

  let delivery: MetaDeliveryResult;
  try {
    const order = await dependencies.service.getOrder(job.orderId);
    const customer = await dependencies.customers.getByOrderId(job.orderId);
    if (!customer) throw new Error("customer_missing");
    const event = buildMetaPurchaseEvent(order, customer, dependencies.trackingValueEgp, job.occurredAt);
    if (event.eventId !== job.eventId) throw new Error("event_mismatch");
    delivery = await dependencies.createClient().sendPurchase(event);
  } catch (failure) {
    const permanent = failure instanceof Error
      && ["meta_purchase_not_authoritative", "event_mismatch"].includes(failure.message);
    delivery = {
      outcome: permanent ? "permanent" : "retryable",
      diagnosticCode: failure instanceof MetaCapiConfigurationError ? "configuration_invalid"
        : permanent ? failure.message : "event_build_failed",
      httpStatus: null,
    };
  }

  try {
    await dependencies.outbox.complete({
      eventId: job.eventId,
      leaseId: job.leaseId,
      outcome: delivery.outcome,
      diagnosticCode: delivery.diagnosticCode,
    });
  } catch {
    return logResult({ claimed: true, eventId: job.eventId, outcome: "retryable", diagnosticCode: "outbox_complete_failed", httpStatus: delivery.httpStatus });
  }
  return logResult({ claimed: true, eventId: job.eventId, ...delivery });
}

function createConfiguredDependencies(): DeliveryDependencies {
  const webhookUrl = process.env.PAYMENTS_SHEETS_WEBHOOK_URL ?? "";
  const webhookSecret = process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET ?? "";
  let trackingValueEgp = Number(process.env.META_PURCHASE_VALUE_EGP);
  if (!Number.isFinite(trackingValueEgp)) trackingValueEgp = 0;
  return {
    outbox: new GoogleSheetsMetaPurchaseOutbox({ webhookUrl, webhookSecret }),
    service: createConfiguredOrderService(),
    customers: new GoogleSheetsCustomerRepository({ webhookUrl, webhookSecret }),
    trackingValueEgp,
    createClient: () => new MetaCapiClient(readMetaCapiConfig()),
  };
}

function logResult(result: MetaPurchaseDrainResult) {
  try {
    console.info(JSON.stringify({
      scope: "meta_purchase",
      eventId: result.eventId,
      outcome: result.outcome,
      diagnosticCode: result.diagnosticCode,
      httpStatus: result.httpStatus,
    }));
  } catch {
    // Conversion logging is diagnostic only.
  }
  return result;
}
