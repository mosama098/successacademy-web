import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PlacementAttempt, PlacementLocale } from "../types";
import { assessmentQuestions } from "./question-bank";
import { buildCoreSequence, selectForms } from "./randomization";

const ATTEMPT_BUDGET_MS = 30 * 60 * 1000;
const activeWrites = new Map<string, Promise<void>>();

export async function createStoredAttempt(locale: PlacementLocale, leadReference: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const selectedForms = selectForms(randomBytes(32).toString("hex"));
  const now = new Date().toISOString();
  const attempt: PlacementAttempt = {
    schemaVersion: 1,
    id: randomUUID(),
    tokenHash,
    leadReference,
    locale,
    status: "registered_not_started",
    createdAt: now,
    startedAt: null,
    completedAt: null,
    currentSection: null,
    currentIndex: 0,
    coreSequence: buildCoreSequence(assessmentQuestions, selectedForms),
    confirmationSequence: [],
    selectedForms,
    answers: [],
    questionStartedAt: null,
    questionDeadlineAt: null,
    audioCheckCompleted: false,
    introducedSections: [],
    completedReadingBlocks: [],
    readingReadyAt: null,
    audioPlayback: {},
    budgetRemainingMs: ATTEMPT_BUDGET_MS,
    budgetRunningSince: null,
    confirmationRequired: false,
    confirmationStarted: false,
    confirmationIntroSeen: false,
    finalProfile: null,
    progressWebhookQueue: [],
    progressWebhookSentKeys: [],
    progressWebhookClaimedKey: null,
    progressWebhookClaimedAt: null,
    progressWebhookRetryAt: null,
    resultWebhookClaimedAt: null,
    resultWebhookSentAt: null,
    resultWebhookAttempts: 0,
    updatedAt: now,
  };

  await persistAttempt(attempt);
  return { token, attempt };
}

export async function readStoredAttempt(token: string) {
  if (!isValidToken(token)) return null;
  const tokenHash = hashToken(token);

  try {
    const value: unknown = JSON.parse(await readFile(attemptPath(tokenHash), "utf8"));
    return isPlacementAttempt(value) && value.tokenHash === tokenHash
      ? normalizePlacementAttempt(value)
      : null;
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

export async function updateStoredAttempt(
  token: string,
  update: (attempt: PlacementAttempt) => void | Promise<void>,
) {
  if (!isValidToken(token)) return null;
  const tokenHash = hashToken(token);
  const previous = activeWrites.get(tokenHash) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => current);
  activeWrites.set(tokenHash, chain);

  await previous;
  try {
    const attempt = await readStoredAttempt(token);
    if (!attempt) return null;
    await update(attempt);
    attempt.updatedAt = new Date().toISOString();
    await persistAttempt(attempt);
    return attempt;
  } finally {
    release();
    if (activeWrites.get(tokenHash) === chain) activeWrites.delete(tokenHash);
  }
}

export function getPlacementDataDirectory() {
  const configured = process.env.PLACEMENT_TEST_DATA_DIR?.trim();
  if (configured) return path.resolve(configured);
  return process.env.NODE_ENV === "production"
    ? "/app/data/placement-test"
    : path.join(process.cwd(), ".data", "placement-test");
}

async function persistAttempt(attempt: PlacementAttempt) {
  const directory = getPlacementDataDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const destination = attemptPath(attempt.tokenHash);
  const temporary = `${destination}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporary, `${JSON.stringify(attempt)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, destination);
}

function attemptPath(tokenHash: string) {
  return path.join(getPlacementDataDirectory(), `${tokenHash}.json`);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isValidToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

function isPlacementAttempt(value: unknown): value is PlacementAttempt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const attempt = value as Partial<PlacementAttempt>;
  return (
    attempt.schemaVersion === 1 &&
    typeof attempt.id === "string" &&
    typeof attempt.tokenHash === "string" &&
    typeof attempt.leadReference === "string" &&
    (attempt.locale === "ar" || attempt.locale === "en") &&
    Array.isArray(attempt.coreSequence) &&
    Array.isArray(attempt.answers)
  );
}

function normalizePlacementAttempt(attempt: PlacementAttempt) {
  if (!Array.isArray(attempt.progressWebhookQueue)) attempt.progressWebhookQueue = [];
  if (!Array.isArray(attempt.progressWebhookSentKeys)) attempt.progressWebhookSentKeys = [];
  if (typeof attempt.progressWebhookClaimedKey !== "string") {
    attempt.progressWebhookClaimedKey = null;
  }
  if (typeof attempt.progressWebhookClaimedAt !== "string") {
    attempt.progressWebhookClaimedAt = null;
  }
  if (typeof attempt.progressWebhookRetryAt !== "string") {
    attempt.progressWebhookRetryAt = null;
  }
  return attempt;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
