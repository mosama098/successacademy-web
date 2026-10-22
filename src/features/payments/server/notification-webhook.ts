import "server-only";
import type { NotificationEvent } from "./notification-events";

const NOTIFICATION_TIMEOUT_MS = 2_500;

export async function emitConfiguredNotificationEvent(event: NotificationEvent) {
  const webhookUrl = process.env.NOTIFICATIONS_WEBHOOK_URL;
  const webhookSecret = process.env.NOTIFICATIONS_WEBHOOK_SECRET;
  let endpoint: URL | null = null;
  try {
    endpoint = webhookUrl ? new URL(webhookUrl) : null;
  } catch {}
  if (!endpoint || endpoint.protocol !== "https:" || !webhookSecret || webhookSecret.length < 32) {
    logNotification(event, "failure", null, "configuration_missing", 0);
    throw new Error("notification_configuration_missing");
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-Success-Academy-Webhook-Secret": webhookSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });
    if (!response.ok) {
      logNotification(event, "failure", response.status, "http_rejected", Date.now() - startedAt);
      throw new Error("notification_http_rejected");
    }
    logNotification(event, "success", response.status, null, Date.now() - startedAt);
  } catch (failure) {
    if (!(failure instanceof Error && failure.message === "notification_http_rejected")) {
      logNotification(event, "failure", null, failure instanceof Error && failure.name === "TimeoutError" ? "timeout" : "network_error", Date.now() - startedAt);
    }
    throw failure;
  }
}

export function logNotification(
  event: Pick<NotificationEvent, "eventId" | "eventType">,
  result: "success" | "failure",
  httpStatus: number | null,
  diagnosticCode: string | null,
  elapsedMs: number,
) {
  const message = JSON.stringify({
    scope: "notification",
    eventType: event.eventType,
    eventId: event.eventId,
    result,
    httpStatus,
    diagnosticCode,
    elapsedMs,
  });
  if (result === "success") console.info(message);
  else console.warn(message);
}
