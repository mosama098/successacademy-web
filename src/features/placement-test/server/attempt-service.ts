import "server-only";
import type {
  AssessmentQuestion,
  AssessmentSection,
  PlacementAttempt,
  PlacementAttemptAction,
  PublicAttemptState,
  PublicQuestion,
  StoredAnswer,
} from "../types";
import { getAudioAsset, isPlayableAudioAsset } from "./audio-manifest";
import {
  assessmentQuestions,
  getConfirmationSequence,
  getPassage,
  getQuestion,
  getQuestions,
} from "./question-bank";
import { scorePlacement } from "./scoring";
import { readStoredAttempt, updateStoredAttempt } from "./storage";

export class PlacementAttemptError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

const AUDIO_PROGRESS_TOLERANCE_SECONDS = 2;

export async function getPublicAttemptState(token: string) {
  let deliverResult = false;
  const attempt = await updateStoredAttempt(token, (current) => {
    reconcileAttempt(current);
    deliverResult = claimResultDelivery(current);
  });
  if (attempt && deliverResult) await deliverResultWebhook(token, attempt);
  return attempt ? toPublicState(attempt) : null;
}

export async function getExistingAttempt(token: string) {
  const attempt = await readStoredAttempt(token);
  return attempt && attempt.status !== "expired" ? attempt : null;
}

export async function applyAttemptAction(token: string, action: PlacementAttemptAction) {
  let actionError: PlacementAttemptError | null = null;
  let deliverResult = false;
  const attempt = await updateStoredAttempt(token, (current) => {
    reconcileAttempt(current, false);
    if (current.status === "completed" || current.status === "expired") return;

    try {
      applyAction(current, action);
      reconcileAttempt(current, false);
      deliverResult = claimResultDelivery(current);
    } catch (error) {
      if (error instanceof PlacementAttemptError) {
        actionError = error;
        return;
      }
      throw error;
    }
  });

  if (!attempt) throw new PlacementAttemptError("invalid_attempt", 401);
  if (actionError) throw actionError;
  if (deliverResult) await deliverResultWebhook(token, attempt);
  return toPublicState(attempt);
}

function applyAction(attempt: PlacementAttempt, action: PlacementAttemptAction) {
  const now = new Date();

  if (action.action === "start") {
    if (attempt.status !== "registered_not_started") return;
    attempt.status = "in_progress";
    attempt.startedAt = now.toISOString();
    attempt.currentSection = "listening";
    attempt.budgetRunningSince = now.toISOString();
    return;
  }

  if (attempt.status !== "in_progress") {
    throw new PlacementAttemptError("attempt_not_active", 409);
  }

  if (action.action === "audio_check_complete") {
    attempt.audioCheckCompleted = true;
    return;
  }

  if (action.action === "section_continue") {
    const question = currentQuestion(attempt);
    if (!question || question.section !== action.section) {
      throw new PlacementAttemptError("invalid_section", 409);
    }
    if (!attempt.introducedSections.includes(action.section)) {
      attempt.introducedSections.push(action.section);
    }
    return;
  }

  if (action.action === "confirmation_continue") {
    if (!attempt.confirmationStarted) {
      throw new PlacementAttemptError("confirmation_not_available", 409);
    }
    attempt.confirmationIntroSeen = true;
    return;
  }

  if (
    action.action === "answer" &&
    attempt.answers.some(
      (answer) => answer.questionId === action.questionId && answer.timedOut,
    )
  ) {
    throw new PlacementAttemptError("question_expired", 409);
  }

  const question = requireCurrentQuestion(attempt, action.questionId);

  if (action.action === "begin_reading") {
    if (!question.readingTimeSeconds || attempt.completedReadingBlocks.includes(question.blockId)) {
      throw new PlacementAttemptError("reading_period_not_available", 409);
    }
    if (!attempt.readingReadyAt) {
      attempt.readingReadyAt = new Date(now.getTime() + question.readingTimeSeconds * 1_000).toISOString();
    }
    return;
  }

  if (action.action === "begin_question") {
    if (!questionPrerequisitesComplete(attempt, question, now)) {
      throw new PlacementAttemptError("question_not_ready", 409);
    }
    if (!attempt.questionStartedAt) {
      attempt.questionStartedAt = now.toISOString();
      attempt.questionDeadlineAt = new Date(now.getTime() + question.timeLimitSeconds * 1_000).toISOString();
    }
    return;
  }

  if (action.action === "answer") {
    if (!attempt.questionStartedAt || !attempt.questionDeadlineAt) {
      throw new PlacementAttemptError("question_not_started", 409);
    }
    if (!question.options.some((option) => option.id === action.optionId)) {
      throw new PlacementAttemptError("invalid_answer", 400);
    }
    const deadline = Date.parse(attempt.questionDeadlineAt);
    if (now.getTime() > deadline) {
      recordTimeout(attempt, question, now);
      advanceAttempt(attempt);
      throw new PlacementAttemptError("question_expired", 409);
    }

    const responseTimeMs = Math.max(0, now.getTime() - Date.parse(attempt.questionStartedAt));
    attempt.answers.push({
      questionId: question.id,
      selectedOption: action.optionId,
      submittedAt: now.toISOString(),
      responseTimeMs,
      timedOut: false,
    });
    advanceAttempt(attempt);
    return;
  }

  if (!question.audioId) throw new PlacementAttemptError("audio_not_available", 409);
  const asset = getAudioAsset(question.audioId);
  if (!isPlayableAudioAsset(asset)) throw new PlacementAttemptError("audio_not_configured", 503);
  const playback = getPlayback(attempt, question.blockId);

  if (action.action === "audio_start") {
    if (playback.status === "completed") return;
    if (playback.status === "playing") return;
    playback.status = "playing";
    playback.startedAt = now.toISOString();
    pauseBudget(attempt, now);
    return;
  }

  if (action.action === "audio_progress") {
    if (playback.status !== "playing") throw new PlacementAttemptError("audio_not_started", 409);
    if (!Number.isFinite(action.progressSeconds) || action.progressSeconds < 0) {
      throw new PlacementAttemptError("invalid_audio_progress", 400);
    }
    const elapsedSeconds = playback.startedAt
      ? Math.max(0, (now.getTime() - Date.parse(playback.startedAt)) / 1_000)
      : 0;
    if (action.progressSeconds > elapsedSeconds + AUDIO_PROGRESS_TOLERANCE_SECONDS) {
      throw new PlacementAttemptError("invalid_audio_progress", 400);
    }
    playback.progressSeconds = Math.min(
      asset.expectedDurationSeconds,
      Math.max(playback.progressSeconds, action.progressSeconds),
    );
    return;
  }

  if (action.action === "audio_complete") {
    if (playback.progressSeconds < asset.expectedDurationSeconds - 1.5) {
      throw new PlacementAttemptError("audio_incomplete", 409);
    }
    playback.status = "completed";
    playback.progressSeconds = asset.expectedDurationSeconds;
    playback.completedAt = now.toISOString();
    resumeBudget(attempt, now);
    return;
  }

  if (action.action === "audio_failed") {
    if (playback.status === "not_started") return;
    if (playback.status === "playing" && playback.progressSeconds < 3) {
      playback.status = "not_started";
      playback.startedAt = null;
      playback.progressSeconds = 0;
      resumeBudget(attempt, now);
      return;
    }
    throw new PlacementAttemptError("audio_resume_required", 409);
  }
}

function reconcileAttempt(attempt: PlacementAttempt, reconcileInterruptedAudio = true) {
  if (attempt.status !== "in_progress") return;
  const now = new Date();
  chargeBudget(attempt, now);

  if (attempt.budgetRemainingMs <= 0) {
    completeRemainingAsTimeouts(attempt, now);
    finalizeAttempt(attempt, now, true);
    return;
  }

  if (reconcileInterruptedAudio) reconcileAudioPlayback(attempt, now);

  if (attempt.readingReadyAt && now.getTime() >= Date.parse(attempt.readingReadyAt)) {
    const question = currentQuestion(attempt);
    if (question && !attempt.completedReadingBlocks.includes(question.blockId)) {
      attempt.completedReadingBlocks.push(question.blockId);
    }
    attempt.readingReadyAt = null;
  }

  const question = currentQuestion(attempt);
  if (
    question &&
    attempt.questionDeadlineAt &&
    now.getTime() >= Date.parse(attempt.questionDeadlineAt)
  ) {
    recordTimeout(attempt, question, now);
    advanceAttempt(attempt);
  }

  finalizeIfSequenceComplete(attempt, now);
  attempt.currentSection = currentQuestion(attempt)?.section ?? null;
}

function finalizeIfSequenceComplete(attempt: PlacementAttempt, now: Date) {
  if (attempt.currentIndex < activeSequence(attempt).length) return;

  if (!attempt.confirmationStarted) {
    const coreQuestions = getQuestions(attempt.coreSequence);
    const coreProfile = scorePlacement(coreQuestions, attempt.answers, false);
    if (coreProfile.confirmationRequired) {
      const upperForm = attempt.selectedForms["L08-10"];
      attempt.confirmationRequired = true;
      attempt.confirmationStarted = true;
      attempt.confirmationSequence = getConfirmationSequence(upperForm);
      attempt.currentSection = "listening";
      clearQuestionClock(attempt);
      return;
    }
  }

  finalizeAttempt(attempt, now, false);
}

function finalizeAttempt(attempt: PlacementAttempt, now: Date, globalTimeout: boolean) {
  const questions = getQuestions(activeSequence(attempt));
  attempt.finalProfile = scorePlacement(questions, attempt.answers, attempt.confirmationStarted);
  attempt.finalProfile.confirmationRequired = attempt.confirmationRequired;
  attempt.status = "completed";
  attempt.completedAt = now.toISOString();
  attempt.currentSection = null;
  attempt.budgetRunningSince = null;
  clearQuestionClock(attempt);

  if (globalTimeout) attempt.finalProfile.confidence = "low";
}

function completeRemainingAsTimeouts(attempt: PlacementAttempt, now: Date) {
  const sequence = activeSequence(attempt);
  while (attempt.currentIndex < sequence.length) {
    const question = getQuestion(sequence[attempt.currentIndex]);
    if (question) recordTimeout(attempt, question, now);
    attempt.currentIndex += 1;
  }
}

function recordTimeout(attempt: PlacementAttempt, question: AssessmentQuestion, now: Date) {
  if (attempt.answers.some((answer) => answer.questionId === question.id)) return;
  const startedAt = attempt.questionStartedAt ? Date.parse(attempt.questionStartedAt) : now.getTime();
  const answer: StoredAnswer = {
    questionId: question.id,
    selectedOption: null,
    submittedAt: now.toISOString(),
    responseTimeMs: Math.max(0, now.getTime() - startedAt),
    timedOut: true,
  };
  attempt.answers.push(answer);
}

function advanceAttempt(attempt: PlacementAttempt) {
  attempt.currentIndex += 1;
  clearQuestionClock(attempt);
  attempt.readingReadyAt = null;
}

function clearQuestionClock(attempt: PlacementAttempt) {
  attempt.questionStartedAt = null;
  attempt.questionDeadlineAt = null;
}

function questionPrerequisitesComplete(
  attempt: PlacementAttempt,
  question: AssessmentQuestion,
  now: Date,
) {
  if (
    question.readingTimeSeconds &&
    !attempt.completedReadingBlocks.includes(question.blockId)
  ) {
    return Boolean(attempt.readingReadyAt && now.getTime() >= Date.parse(attempt.readingReadyAt));
  }
  if (question.audioId) return getPlayback(attempt, question.blockId).status === "completed";
  return true;
}

function currentQuestion(attempt: PlacementAttempt) {
  return getQuestion(activeSequence(attempt)[attempt.currentIndex] ?? "");
}

function requireCurrentQuestion(attempt: PlacementAttempt, questionId: string) {
  const question = currentQuestion(attempt);
  if (!question || question.id !== questionId) {
    throw new PlacementAttemptError("invalid_question", 409);
  }
  return question;
}

function activeSequence(attempt: PlacementAttempt) {
  return attempt.confirmationStarted
    ? [...attempt.coreSequence, ...attempt.confirmationSequence]
    : attempt.coreSequence;
}

function getPlayback(attempt: PlacementAttempt, audioId: string) {
  return (attempt.audioPlayback[audioId] ??= {
    status: "not_started",
    progressSeconds: 0,
    startedAt: null,
    completedAt: null,
  });
}

function reconcileAudioPlayback(attempt: PlacementAttempt, now: Date) {
  const question = currentQuestion(attempt);
  if (!question?.audioId) return;
  const asset = getAudioAsset(question.audioId);
  if (!isPlayableAudioAsset(asset)) return;
  const playback = getPlayback(attempt, question.blockId);
  if (playback.status !== "playing" || !playback.startedAt) return;
  const startedAt = Date.parse(playback.startedAt);
  if (!Number.isFinite(startedAt)) return;
  const elapsedSeconds = Math.max(0, (now.getTime() - startedAt) / 1_000);
  playback.progressSeconds = Math.min(
    asset.expectedDurationSeconds,
    Math.max(playback.progressSeconds, elapsedSeconds),
  );
  if (playback.progressSeconds < asset.expectedDurationSeconds) return;
  playback.status = "completed";
  playback.completedAt = now.toISOString();
  resumeBudget(attempt, now);
}

function chargeBudget(attempt: PlacementAttempt, now: Date) {
  if (!attempt.budgetRunningSince) return;
  const elapsed = Math.max(0, now.getTime() - Date.parse(attempt.budgetRunningSince));
  attempt.budgetRemainingMs = Math.max(0, attempt.budgetRemainingMs - elapsed);
  attempt.budgetRunningSince = now.toISOString();
}

function pauseBudget(attempt: PlacementAttempt, now: Date) {
  chargeBudget(attempt, now);
  attempt.budgetRunningSince = null;
}

function resumeBudget(attempt: PlacementAttempt, now: Date) {
  attempt.budgetRunningSince = now.toISOString();
}

function toPublicState(attempt: PlacementAttempt): PublicAttemptState {
  const sequence = activeSequence(attempt);
  const question = currentQuestion(attempt);
  const sectionQuestions = question
    ? sequence.map((id) => getQuestion(id)).filter((item) => item?.section === question.section)
    : [];
  const sectionQuestion = question
    ? Math.max(1, sectionQuestions.findIndex((item) => item?.id === question.id) + 1)
    : 0;
  const audioAsset = question?.audioId ? getAudioAsset(question.audioId) : null;
  const audioPlayback = question?.audioId ? getPlayback(attempt, question.blockId) : null;

  return {
    status: attempt.status,
    locale: attempt.locale,
    phase: determinePhase(attempt, question),
    section: question?.section ?? null,
    sectionQuestion,
    sectionTotal: sectionQuestions.length,
    overallQuestion: question ? Math.min(attempt.currentIndex + 1, sequence.length) : sequence.length,
    overallTotal: sequence.length,
    progressPercent: sequence.length === 0
      ? 0
      : Math.min(100, Math.round((attempt.answers.length / sequence.length) * 100)),
    question: question ? publicQuestion(question) : null,
    questionDeadlineAt: attempt.questionDeadlineAt,
    readingReadyAt: attempt.readingReadyAt,
    audio: audioAsset && audioPlayback ? { ...audioAsset, ...audioPlayback } : null,
    confirmationRequired: attempt.confirmationRequired,
    result: attempt.finalProfile,
  };
}

function determinePhase(
  attempt: PlacementAttempt,
  question: AssessmentQuestion | null,
): PublicAttemptState["phase"] {
  if (attempt.status === "expired") return "expired";
  if (attempt.status === "completed") return "result";
  if (attempt.status === "registered_not_started") return "welcome";
  if (!attempt.audioCheckCompleted) return "audio_check";
  if (attempt.confirmationStarted && !attempt.confirmationIntroSeen) return "confirmation_intro";
  if (!question) return "analysis";
  if (!attempt.introducedSections.includes(question.section)) return "section_intro";
  if (question.readingTimeSeconds && !attempt.completedReadingBlocks.includes(question.blockId)) {
    return "reading_period";
  }
  if (question.audioId && getPlayback(attempt, question.blockId).status !== "completed") {
    return "audio";
  }
  return "question";
}

function publicQuestion(question: AssessmentQuestion): PublicQuestion {
  const { correctOption: _correctOption, construct: _construct, evidenceBand: _evidenceBand, ...safe } = question;
  const passage = getPassage(question.passageId) ?? undefined;
  return passage ? { ...safe, passage } : safe;
}

function claimResultDelivery(attempt: PlacementAttempt) {
  if (
    attempt.status !== "completed" ||
    !attempt.finalProfile ||
    attempt.resultWebhookSentAt ||
    attempt.resultWebhookAttempts >= 5
  ) {
    return false;
  }

  const now = Date.now();
  const claimedAt = attempt.resultWebhookClaimedAt
    ? Date.parse(attempt.resultWebhookClaimedAt)
    : 0;
  if (claimedAt && now - claimedAt < 5 * 60 * 1_000) return false;

  attempt.resultWebhookClaimedAt = new Date(now).toISOString();
  attempt.resultWebhookAttempts += 1;
  return true;
}

async function deliverResultWebhook(token: string, attempt: PlacementAttempt) {
  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;
  let delivered = false;

  if (webhookUrl && webhookSecret && attempt.finalProfile) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: webhookSecret,
          status: "completed",
          source: "placement_test",
          leadReference: attempt.leadReference,
          attemptReference: attempt.id,
          locale: attempt.locale,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          placement: attempt.finalProfile.placement,
          confidence: attempt.finalProfile.confidence,
          listening: attempt.finalProfile.listening,
          reading: attempt.finalProfile.reading,
          languageUse: attempt.finalProfile.languageUse,
          evidence: attempt.finalProfile.evidence,
          strongestSkill: attempt.finalProfile.strongestSkill,
          weakestSkill: attempt.finalProfile.weakestSkill,
          b2Readiness: attempt.finalProfile.b2Readiness,
          confirmationUsed: attempt.finalProfile.confirmationUsed,
          responses: attempt.answers.map((answer) => ({
            ...answer,
            form: getQuestion(answer.questionId)?.form ?? "unknown",
          })),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      const body: unknown = response.ok ? await response.json().catch(() => null) : null;
      delivered = Boolean(
        body && typeof body === "object" && "success" in body && body.success === true,
      );
    } catch {
      delivered = false;
    }
  }

  await updateStoredAttempt(token, (current) => {
    if (delivered) current.resultWebhookSentAt = new Date().toISOString();
    current.resultWebhookClaimedAt = null;
  });
}
