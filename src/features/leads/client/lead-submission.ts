"use client";

export const LEAD_SUBMISSION_TIMEOUT_MS = 60_000;
const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const volatileSubmissionIds = new Map<string, string>();

export type LeadSubmissionOutcome =
  | { kind: "success" }
  | { kind: "skipped" }
  | { kind: "validation" }
  | { kind: "timeout" }
  | { kind: "network" }
  | { kind: "downstream" }
  | { kind: "rejected" };

export async function submitLead(
  payload: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<LeadSubmissionOutcome> {
  let response: Response;
  try {
    response = await fetchImpl("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(LEAD_SUBMISSION_TIMEOUT_MS),
    });
  } catch (failure) {
    return isTimeoutFailure(failure) ? { kind: "timeout" } : { kind: "network" };
  }

  let result: unknown = null;
  try { result = await response.json(); } catch {
    return { kind: "downstream" };
  }

  if (response.ok && isRecord(result) && result.ok === true) {
    return result.skipped === true ? { kind: "skipped" } : { kind: "success" };
  }
  if (response.status === 400 || response.status === 422) return { kind: "validation" };
  if (response.status === 504 || (isRecord(result) && result.error === "submission_timeout")) {
    return { kind: "timeout" };
  }
  if (isRecord(result) && result.error === "submission_rejected") return { kind: "rejected" };
  if (response.status >= 500) return { kind: "downstream" };
  return { kind: "rejected" };
}

export function getOrCreateLeadSubmissionId(storageKey: string) {
  const volatileId = volatileSubmissionIds.get(storageKey);
  if (volatileId) return volatileId;

  let storedId: string | null = null;
  try {
    storedId = window.sessionStorage.getItem(storageKey);
  } catch {
    // A stable in-memory identity still protects repeated submits on this page.
  }

  const submissionId = storedId && submissionIdPattern.test(storedId)
    ? storedId
    : window.crypto.randomUUID();
  volatileSubmissionIds.set(storageKey, submissionId);
  try {
    window.sessionStorage.setItem(storageKey, submissionId);
  } catch {
    // Storage is optional; the in-memory identity remains stable for this page.
  }
  return submissionId;
}

export function clearLeadSubmissionId(storageKey: string) {
  volatileSubmissionIds.delete(storageKey);
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Persistence cleanup must never turn a confirmed lead into a UI failure.
  }
}

function isTimeoutFailure(value: unknown) {
  return value instanceof DOMException && value.name === "TimeoutError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
