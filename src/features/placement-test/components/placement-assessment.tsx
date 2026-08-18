"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { trackPlacementTestEvent } from "@/lib/tracking";
import { courseLabel, placementCopy } from "../copy";
import type {
  AssessmentOption,
  AssessmentSection,
  PlacementAttemptAction,
  PlacementLocale,
  PublicAttemptState,
  PublicQuestion,
} from "../types";

type PlacementAssessmentProps = {
  locale: PlacementLocale;
  initialState: PublicAttemptState;
};

type ApiError = Error & { status?: number; code?: string };
type PlacementCopy = (typeof placementCopy)[PlacementLocale];
type SelectedOption = AssessmentOption["id"] | null;

export function PlacementAssessment({ locale, initialState }: PlacementAssessmentProps) {
  const copy = placementCopy[locale];
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState<SelectedOption>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [timeoutVisible, setTimeoutVisible] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [questionStartFailed, setQuestionStartFailed] = useState(false);
  const previousPhase = useRef(state.phase);
  const autoStartKey = useRef<string | null>(null);
  const expiredDeadline = useRef<string | null>(null);
  const timeoutActive = useRef(false);
  const timeoutTimer = useRef<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const analysisTimers = useRef<number[]>([]);

  async function sendAction(action: PlacementAttemptAction, quiet = false) {
    if (!quiet) {
      setBusy(true);
      setError(null);
    }
    try {
      const next = await postAction(action);
      const previousProgress = state.progressPercent;
      if (state.status !== "completed" && next.status === "completed") {
        startAnalysis(next);
      } else {
        setState(next);
      }
      if (action.action === "answer") {
        setSelected(null);
        setToast(copy.saved);
        window.setTimeout(() => setToast(null), 900);
        if (state.section && next.section !== state.section) {
          trackPlacementTestEvent("placement_test_section_complete", {
            section: state.section,
          });
        }
        const crossed = [25, 50, 75].find(
          (point) => previousProgress < point && next.progressPercent >= point,
        );
        if (crossed) {
          setMilestone(crossed);
          trackPlacementTestEvent("placement_test_progress", {
            progressPercent: crossed,
            section: next.section,
          });
          window.setTimeout(() => setMilestone(null), 1_350);
        }
      }
      return next;
    } catch (caught) {
      const apiError = caught as ApiError;
      if (apiError.status === 409 && apiError.code === "question_expired") {
        showTimeoutAndAdvance();
      } else if (apiError.status === 401) {
        window.location.assign(`/${locale}/placement-test`);
      } else {
        setError(apiError.code === "audio_not_configured" ? copy.audioUnavailable : copy.networkError);
      }
      return null;
    } finally {
      if (!quiet) setBusy(false);
    }
  }

  async function refreshState() {
    try {
      const response = await fetch("/api/placement-test/attempt", { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isStateResponse(body)) throw new Error("state_unavailable");
      if (state.status !== "completed" && body.state.status === "completed") startAnalysis(body.state);
      else setState(body.state);
      setSelected(null);
      setError(null);
    } catch {
      setError(copy.networkError);
    }
  }

  function showTimeoutAndAdvance() {
    if (timeoutActive.current) return;
    timeoutActive.current = true;
    setTimeoutVisible(true);
    timeoutTimer.current = window.setTimeout(() => {
      void refreshState().finally(() => {
        setTimeoutVisible(false);
        timeoutActive.current = false;
      });
    }, 1_150);
  }

  function startAnalysis(finalState: PublicAttemptState) {
    analysisTimers.current.forEach(window.clearTimeout);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowAnalysis(true);
    setAnalysisStep(0);
    const stepDuration = reducedMotion ? 80 : 500;
    const first = window.setTimeout(() => setAnalysisStep(1), stepDuration);
    const second = window.setTimeout(() => setAnalysisStep(2), stepDuration * 2);
    const finish = window.setTimeout(() => {
      setState(finalState);
      setShowAnalysis(false);
      trackPlacementTestEvent("placement_test_complete", {
        placementLevel: finalState.result?.placement,
        confidence: finalState.result?.confidence,
        confirmationUsed: finalState.result?.confirmationUsed,
      });
    }, stepDuration * 3);
    analysisTimers.current = [first, second, finish];
  }

  useEffect(() => () => {
    analysisTimers.current.forEach(window.clearTimeout);
    if (timeoutTimer.current !== null) window.clearTimeout(timeoutTimer.current);
  }, []);

  useEffect(() => {
    if (state.phase === previousPhase.current) return;
    const oldPhase = previousPhase.current;
    previousPhase.current = state.phase;
    if (state.phase === "section_intro" && state.section) {
      trackPlacementTestEvent("placement_test_section_start", { section: state.section });
    }
    if (oldPhase === "confirmation_intro" && state.phase !== "confirmation_intro") {
      trackPlacementTestEvent("placement_test_confirmation_start");
    }
  }, [state.phase, state.section]);

  useEffect(() => {
    if (state.phase !== "question" || !state.question || state.questionDeadlineAt) return;
    if (questionStartFailed) return;
    if (autoStartKey.current === state.question.id) return;
    const questionId = state.question.id;
    autoStartKey.current = questionId;
    void sendAction({ action: "begin_question", questionId }, true).then((next) => {
      if (next) return;
      if (autoStartKey.current === questionId) autoStartKey.current = null;
      setQuestionStartFailed(true);
    });
  });

  useEffect(() => {
    const deadline = state.questionDeadlineAt ?? state.readingReadyAt;
    if (!deadline) {
      setRemainingSeconds(null);
      expiredDeadline.current = null;
      return;
    }
    const activeDeadline = deadline;

    function updateCountdown() {
      const remaining = Math.max(0, Math.ceil((Date.parse(activeDeadline) - Date.now()) / 1_000));
      setRemainingSeconds(remaining);
      if (
        remaining === 0 &&
        state.questionDeadlineAt &&
        expiredDeadline.current !== activeDeadline
      ) {
        expiredDeadline.current = activeDeadline;
        showTimeoutAndAdvance();
      }
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(timer);
  }, [state.questionDeadlineAt, state.readingReadyAt]);

  useEffect(() => {
    if (state.phase === "result" && state.result) {
      trackPlacementTestEvent("placement_test_result_view", {
        placementLevel: state.result.placement,
        confidence: state.result.confidence,
        confirmationUsed: state.result.confirmationUsed,
      });
    }
  }, [state.phase, state.result]);

  if (showAnalysis) {
    return (
      <CenteredStage>
        <Spinner />
        <p className="mt-6 text-xl font-black sm:text-2xl">{copy.analysis[analysisStep]}</p>
        <div className="mx-auto mt-6 flex w-28 justify-center gap-2" aria-hidden="true">
          {copy.analysis.map((_, index) => (
            <span key={index} className={`h-2 rounded-full transition-all duration-300 ${index <= analysisStep ? "w-7 bg-[#ec911f]" : "w-2 bg-[#ddd0ec]"}`} />
          ))}
        </div>
      </CenteredStage>
    );
  }

  if (state.phase === "welcome") {
    return (
      <CenteredStage>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#391b68] to-[#633b92] text-white shadow-[0_16px_34px_rgba(57,27,104,0.2)]">
          <SparkIcon />
        </div>
        <Eyebrow>{copy.assessmentLabel}</Eyebrow>
        <h1 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-black leading-[1.2] sm:text-5xl">{copy.welcomeTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#6d5889] sm:text-lg sm:leading-8">{copy.welcomeBody}</p>
        <div className="mx-auto mt-7 grid max-w-2xl grid-cols-3 gap-2 text-center text-xs font-black text-[#513477] sm:gap-3 sm:text-sm">
          <WelcomeFact value="36" label={locale === "ar" ? "سؤال" : "Questions"} />
          <WelcomeFact value="24–27" label={locale === "ar" ? "دقيقة" : "Minutes"} />
          <WelcomeFact value="3" label={locale === "ar" ? "مهارات" : "Skills"} />
        </div>
        <PrimaryButton disabled={busy} onClick={() => {
          trackPlacementTestEvent("placement_test_start", { locale });
          void sendAction({ action: "start" });
        }}>{copy.startNow}</PrimaryButton>
        <p className="mx-auto mt-4 max-w-lg text-xs font-bold leading-6 text-[#806b99]">{copy.autoSaveNote}</p>
      </CenteredStage>
    );
  }

  if (state.phase === "audio_check") {
    return (
      <AudioCheck
        title={copy.audioCheckTitle}
        body={copy.audioCheckBody}
        playLabel={copy.playCheck}
        continueLabel={copy.soundClear}
        busy={busy}
        onContinue={() => void sendAction({ action: "audio_check_complete" })}
      />
    );
  }

  if (state.phase === "section_intro" && state.section) {
    return (
      <SectionIntro
        section={state.section}
        title={copy.sectionIntroTitles[state.section]}
        label={copy.sections[state.section]}
        body={copy.sectionIntros[state.section]}
        buttonLabel={copy.beginSection}
        busy={busy}
        onContinue={() => void sendAction({ action: "section_continue", section: state.section! })}
      />
    );
  }

  if (state.phase === "confirmation_intro") {
    return (
      <CenteredStage>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f1e8fb] text-[#391b68]" aria-hidden="true"><CheckIcon /></div>
        <Eyebrow>{locale === "ar" ? "خطوة أخيرة" : "Final Check"}</Eyebrow>
        <h1 className="mt-5 text-balance text-3xl font-black sm:text-5xl">{copy.confirmationTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{copy.confirmationBody}</p>
        <PrimaryButton disabled={busy} onClick={() => void sendAction({ action: "confirmation_continue" })}>{copy.beginSection}</PrimaryButton>
      </CenteredStage>
    );
  }

  const layoutProps = {
    state,
    copy,
    remainingSeconds,
    toast,
    milestone,
    timeoutVisible,
    locale,
  };

  if (state.phase === "reading_period" && state.question) {
    return (
      <AssessmentLayout {...layoutProps}>
        <ReadingPeriod
          state={state}
          copy={copy}
          remainingSeconds={remainingSeconds}
          busy={busy}
          onBegin={() => void sendAction({ action: "begin_reading", questionId: state.question!.id })}
        />
      </AssessmentLayout>
    );
  }

  if (
    state.section === "listening" &&
    state.question &&
    (state.phase === "audio" || state.phase === "question")
  ) {
    return (
      <AssessmentLayout {...layoutProps}>
        <ListeningQuestion
          state={state}
          copy={copy}
          selected={selected}
          setSelected={setSelected}
          busy={busy}
          error={error}
          retryQuestionStart={questionStartFailed ? () => {
            setError(null);
            setQuestionStartFailed(false);
          } : undefined}
          sendAction={sendAction}
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && state.question && state.phase === "question") {
              void sendAction({ action: "answer", questionId: state.question.id, optionId: selected });
            }
          }}
        />
      </AssessmentLayout>
    );
  }

  if (state.phase === "question" && state.question) {
    return (
      <AssessmentLayout {...layoutProps}>
        <QuestionCard
          state={state}
          copy={copy}
          selected={selected}
          setSelected={setSelected}
          busy={busy}
          error={error}
          retryQuestionStart={questionStartFailed ? () => {
            setError(null);
            setQuestionStartFailed(false);
          } : undefined}
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && state.question) {
              void sendAction({ action: "answer", questionId: state.question.id, optionId: selected });
            }
          }}
        />
      </AssessmentLayout>
    );
  }

  if (state.phase === "result" && state.result) {
    return <ResultScreen locale={locale} state={state} />;
  }

  if (state.phase === "expired") {
    return <FatalState locale={locale} message={copy.expired} />;
  }

  return <FatalState locale={locale} message={copy.fatal} />;
}

function AssessmentLayout({
  state,
  copy,
  remainingSeconds,
  toast,
  milestone,
  timeoutVisible,
  locale,
  children,
}: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  remainingSeconds: number | null;
  toast: string | null;
  milestone: number | null;
  timeoutVisible: boolean;
  locale: PlacementLocale;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] bg-[#fbf9ff] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-30 border-b border-[#e4d9f0] bg-[#fbf9ff]/95 px-4 py-2.5 shadow-[0_8px_24px_rgba(57,27,104,0.04)] backdrop-blur-xl sm:px-6 sm:py-3">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-[#8a74a3]">{copy.assessmentLabel}</p>
              <p className="mt-0.5 truncate text-sm font-black text-[#391b68]">
                {state.section ? copy.sections[state.section] : copy.assessmentLabel}
                <span className="mx-1.5 text-[#b5a4c7]">·</span>
                {copy.questionLabel} {state.sectionQuestion}/{state.sectionTotal}
              </p>
            </div>
            <TimerBadge state={state} remainingSeconds={remainingSeconds} label={copy.timeRemaining} />
          </div>
          <ProgressJourney state={state} copy={copy} />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div key={state.question?.id ?? state.phase} className="motion-safe:animate-[placementQuestionIn_.28s_ease-out]">
          {children}
        </div>
      </div>
      {toast ? (
        <div role="status" className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border border-[#d8c8eb] bg-white px-4 py-2 text-xs font-black text-[#391b68] shadow-lg motion-safe:animate-[placementQuestionIn_.22s_ease-out]">{toast}</div>
      ) : null}
      {milestone ? <Milestone value={milestone} locale={locale} /> : null}
      {timeoutVisible ? <TimeoutOverlay copy={copy} /> : null}
    </div>
  );
}

function ProgressJourney({ state, copy }: { state: PublicAttemptState; copy: PlacementCopy }) {
  const steps = [
    { id: "start", label: copy.journey.start },
    { id: "languageUse", label: copy.journey.languageUse },
    { id: "reading", label: copy.journey.reading },
    { id: "listening", label: copy.journey.listening },
    { id: "result", label: copy.journey.result },
  ] as const;
  const activeStep = state.phase === "result"
    ? 4
    : state.section === "languageUse"
      ? 1
      : state.section === "reading"
        ? 2
        : state.section === "listening"
          ? 3
          : 0;

  return (
    <div className="relative mt-3" aria-label={copy.progressLabel}>
      <div className="absolute inset-x-[8%] top-2.5 h-0.5 overflow-hidden rounded-full bg-[#e3d8ef]" aria-hidden="true">
        <div className="h-full origin-left bg-gradient-to-r from-[#ec911f] to-[#6a4098] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${state.progressPercent}%` }} />
      </div>
      <ol className="relative grid grid-cols-5 gap-1">
        {steps.map((step, index) => {
          const reached = index <= activeStep;
          const current = index === activeStep;
          return (
            <li key={step.id} className="flex min-w-0 flex-col items-center text-center">
              <span className={`grid h-5 w-5 place-items-center rounded-full border-2 transition-all duration-300 ${current ? "border-[#ec911f] bg-[#ec911f] shadow-[0_0_0_4px_rgba(236,145,31,0.14)]" : reached ? "border-[#391b68] bg-[#391b68]" : "border-[#d8c8e7] bg-[#fbf9ff]"}`} aria-current={current ? "step" : undefined}>
                {reached ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className={`mt-1.5 w-full truncate text-[9px] font-black sm:text-[11px] ${current ? "text-[#391b68]" : "text-[#8b79a0]"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TimerBadge({ state, remainingSeconds, label }: { state: PublicAttemptState; remainingSeconds: number | null; label: string }) {
  if (remainingSeconds === null) return <span className="h-10 w-10" aria-hidden="true" />;
  const total = state.readingReadyAt
    ? state.question?.readingTimeSeconds ?? remainingSeconds
    : state.question?.timeLimitSeconds ?? remainingSeconds;
  const ratio = Math.max(0, Math.min(1, remainingSeconds / Math.max(1, total)));
  const warning = remainingSeconds <= 10;
  const urgent = remainingSeconds <= 5;
  const stroke = urgent ? "#b42318" : warning ? "#d97706" : "#391b68";
  const circumference = 2 * Math.PI * 15;

  return (
    <div className={`flex shrink-0 items-center gap-2 rounded-full border bg-white py-1 pe-3 ps-1 shadow-sm transition-colors ${urgent ? "border-red-200 text-red-700" : warning ? "border-orange-200 text-orange-700" : "border-[#ded1ed] text-[#391b68]"}`} aria-label={`${label}: ${remainingSeconds}`}>
      <span className="relative grid h-8 w-8 place-items-center" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#eee7f5" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none" />
        </svg>
        <ClockIcon />
      </span>
      <span className="min-w-7 text-center text-sm font-black tabular-nums">{remainingSeconds}</span>
    </div>
  );
}

function ReadingPeriod({ state, copy, remainingSeconds, busy, onBegin }: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  remainingSeconds: number | null;
  busy: boolean;
  onBegin: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-[26px] border border-[#ded1ed] bg-white shadow-[0_22px_65px_rgba(57,27,104,0.09)]">
      <div className="border-b border-[#eee6f5] bg-[#f6f1fb] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#391b68] shadow-sm"><BookIcon /></span>
          <div>
            <p className="text-sm font-black text-[#391b68]">{copy.readingTime}</p>
            <p className="mt-0.5 text-xs font-bold text-[#806b99]">{copy.sectionIntros.reading}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-8 sm:py-7">
        <PassageText text={state.question?.passage?.text ?? ""} />
        {!state.readingReadyAt ? (
          <PrimaryButton disabled={busy} onClick={onBegin}>{copy.readingTime}</PrimaryButton>
        ) : (
          <div className="mt-6 rounded-2xl border border-[#eadff3] bg-[#fcfaff] px-4 py-3 text-center text-sm font-black text-[#6d5889]">
            {copy.startQuestions} · <span className="tabular-nums text-[#391b68]">{remainingSeconds ?? 0}s</span>
          </div>
        )}
      </div>
    </section>
  );
}

function QuestionCard({ state, copy, selected, setSelected, busy, error, retryQuestionStart, onSubmit }: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  selected: SelectedOption;
  setSelected: (value: SelectedOption) => void;
  busy: boolean;
  error: string | null;
  retryQuestionStart?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const question = state.question!;
  const dialog = useRef<HTMLDialogElement>(null);
  const hasPassage = Boolean(question.passage);
  return (
    <form onSubmit={onSubmit} className={`transition duration-200 ${busy ? "translate-y-1 opacity-75" : "translate-y-0 opacity-100"} ${hasPassage ? "grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]" : "mx-auto max-w-3xl"}`}>
      {hasPassage ? (
        <aside className="hidden rounded-[24px] border border-[#ded1ed] bg-white p-7 shadow-[0_18px_50px_rgba(57,27,104,0.06)] lg:sticky lg:top-40 lg:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#391b68]"><BookIcon />{copy.sections.reading}</div>
          <PassageText text={question.passage?.text ?? ""} />
        </aside>
      ) : null}
      <QuestionSurface>
        <QuestionHeading state={state} copy={copy} onShowPassage={hasPassage ? () => dialog.current?.showModal() : undefined} />
        <AnswerOptions question={question} selected={selected} onSelect={setSelected} legend={copy.selectAnswer} />
        <InlineError error={error} retryLabel={copy.retry} onRetry={retryQuestionStart} />
        <StickySubmit disabled={!selected || busy || !state.questionDeadlineAt} busy={busy} copy={copy} />
        <p className="mt-3 text-center text-[11px] font-bold leading-5 text-[#8a78a0]">{copy.autoSaveNote}</p>
      </QuestionSurface>
      {hasPassage ? <ReadingDialog dialog={dialog} question={question} closeLabel={copy.closePassage} /> : null}
    </form>
  );
}

function ListeningQuestion({ state, copy, selected, setSelected, busy, error, retryQuestionStart, sendAction, onSubmit }: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  selected: SelectedOption;
  setSelected: (value: SelectedOption) => void;
  busy: boolean;
  error: string | null;
  retryQuestionStart?: () => void;
  sendAction: (action: PlacementAttemptAction, quiet?: boolean) => Promise<PublicAttemptState | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const audio = state.audio;
  const question = state.question!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastSynced = useRef(audio?.progressSeconds ?? 0);
  const completing = useRef(false);
  const playbackRequest = useRef(false);
  const serverPlaybackStarted = useRef(audio?.status === "playing");
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualProgress, setVisualProgress] = useState(audio?.progressSeconds ?? 0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playable = Boolean(audio && audio.startSeconds !== null && audio.endSeconds !== null && audio.expectedDurationSeconds !== null);
  const canSelect = Boolean(audio && (audio.status !== "not_started" || isPlaying));
  const canSubmit = state.phase === "question" && Boolean(state.questionDeadlineAt) && Boolean(selected);
  const firstSlot = question.blockId.split("-")[0];
  const isFollowUp = question.slotId !== firstSlot;

  useEffect(() => {
    lastSynced.current = audio?.progressSeconds ?? 0;
    completing.current = false;
    serverPlaybackStarted.current = audio?.status === "playing";
    setVisualProgress(audio?.progressSeconds ?? 0);
    setPlaybackError(null);
  }, [audio?.id, question.id]);

  useEffect(() => {
    if (!isPlaying) setVisualProgress(audio?.progressSeconds ?? 0);
  }, [audio?.progressSeconds, audio?.status, isPlaying]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  function stopProgressAnimation() {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  function animateProgress() {
    stopProgressAnimation();
    const update = () => {
      const element = audioRef.current;
      if (!element || !audio || audio.startSeconds === null || audio.endSeconds === null) return;
      const progress = Math.max(0, Math.min(audio.endSeconds - audio.startSeconds, element.currentTime - audio.startSeconds));
      setVisualProgress(progress);
      if (!element.paused && element.currentTime < audio.endSeconds) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    };
    frameRef.current = window.requestAnimationFrame(update);
  }

  async function startPlayback() {
    if (!audio || !playable || playbackRequest.current || isPlaying) return;
    const element = audioRef.current;
    if (!element) return;
    setPlaybackError(null);
    playbackRequest.current = true;
    const currentProgress = Math.max(0, element.currentTime - audio.startSeconds!);
    element.currentTime = audio.startSeconds! + Math.max(audio.progressSeconds, currentProgress);
    try {
      await element.play();
      if (audio.status === "not_started") {
        const next = await sendAction({ action: "audio_start", questionId: question.id });
        if (!next || next.audio?.status !== "playing" || audioRef.current !== element) {
          element.pause();
          setSelected(null);
          await sendAction({ action: "audio_failed", questionId: question.id }, true);
          return;
        }
      }
      serverPlaybackStarted.current = true;
    } catch {
      element.pause();
      setIsPlaying(false);
      setSelected(null);
      setPlaybackError(copy.audioUnavailable);
      await sendAction({ action: "audio_failed", questionId: question.id }, true);
    } finally {
      playbackRequest.current = false;
    }
  }

  async function syncAndComplete(progress: number) {
    if (completing.current || !audio || !serverPlaybackStarted.current) return;
    completing.current = true;
    const progressed = await sendAction({ action: "audio_progress", questionId: question.id, progressSeconds: progress }, true);
    if (!progressed) {
      completing.current = false;
      return;
    }
    const completed = await sendAction({ action: "audio_complete", questionId: question.id });
    if (!completed) completing.current = false;
  }

  function onTimeUpdate() {
    if (!audio || !audioRef.current || !serverPlaybackStarted.current || audio.startSeconds === null || audio.endSeconds === null) return;
    const element = audioRef.current;
    const progress = Math.max(0, element.currentTime - audio.startSeconds);
    if (progress - lastSynced.current >= 5) {
      lastSynced.current = progress;
      void sendAction({ action: "audio_progress", questionId: question.id, progressSeconds: progress }, true);
    }
    if (element.currentTime >= audio.endSeconds - 0.15) {
      element.pause();
      setVisualProgress(audio.endSeconds - audio.startSeconds);
      void syncAndComplete(audio.endSeconds - audio.startSeconds);
    }
  }

  const duration = audio?.expectedDurationSeconds ?? 0;
  const progressRatio = duration > 0 ? Math.min(1, visualProgress / duration) : 0;

  return (
    <form onSubmit={onSubmit} className={`mx-auto max-w-3xl transition duration-200 ${busy ? "translate-y-1 opacity-80" : "translate-y-0 opacity-100"}`}>
      <QuestionSurface>
        <div className="mb-5 rounded-2xl border border-[#e7dcf1] bg-[#f8f4fb] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#391b68] shadow-sm"><HeadphonesIcon size={23} /></span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.06em] text-[#8a74a3]">{isFollowUp ? copy.sharedAudio : copy.listeningPrompt}</p>
              {question.situation ? <p dir="ltr" className="mt-1.5 text-left text-sm font-bold leading-6 text-[#513477]">{question.situation}</p> : null}
            </div>
          </div>
        </div>

        <QuestionHeading state={state} copy={copy} />

        <div className={`mt-5 overflow-hidden rounded-2xl border p-4 transition-colors ${audio?.status === "completed" ? "border-[#d7c8e7] bg-[#f6f1fb]" : "border-[#d8c8eb] bg-white"}`}>
          {playable && audio ? (
            <>
              {audio.status !== "completed" ? (
                <audio
                  ref={audioRef}
                  src={audio.source}
                  preload="metadata"
                  onLoadedMetadata={() => {
                    if (audioRef.current && audio.startSeconds !== null) {
                      audioRef.current.currentTime = audio.startSeconds + audio.progressSeconds;
                      setVisualProgress(audio.progressSeconds);
                    }
                  }}
                  onTimeUpdate={onTimeUpdate}
                  onPlay={() => {
                    setIsPlaying(true);
                    animateProgress();
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    stopProgressAnimation();
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    stopProgressAnimation();
                    setVisualProgress(audio.expectedDurationSeconds ?? 0);
                    void syncAndComplete(audio.expectedDurationSeconds ?? 0);
                  }}
                  onError={() => {
                    setIsPlaying(false);
                    stopProgressAnimation();
                    setPlaybackError(copy.audioUnavailable);
                    void sendAction({ action: "audio_failed", questionId: question.id }, true);
                  }}
                />
              ) : null}

              <div className="flex items-center gap-3">
                {audio.status === "completed" ? (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#391b68] text-white"><CheckIcon /></span>
                ) : (
                  <button type="button" disabled={busy || isPlaying} onClick={() => void startPlayback()} className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#391b68] text-white shadow-[0_10px_24px_rgba(57,27,104,0.22)] transition duration-200 hover:bg-[#281343] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30" aria-label={copy.playAudio}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-xs font-black text-[#6d5889]">
                    <span>{audio.status === "completed" ? copy.audioComplete : isPlaying ? copy.audioPlaying : copy.playAudio}</span>
                    <span className="shrink-0 tabular-nums" dir="ltr">{formatTime(visualProgress)} / {formatTime(duration)}</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#e8deef]" dir="ltr" role="progressbar" aria-label={copy.audioPlaying} aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(visualProgress)}>
                    <div className="h-full origin-left rounded-full bg-gradient-to-r from-[#ec911f] to-[#6c4199]" style={{ transform: `scaleX(${progressRatio})` }} />
                  </div>
                </div>
                <AudioWaves playing={isPlaying} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-bold text-[#8a78a0]">
                <span>{audio.status === "not_started" ? copy.listeningLocked : audio.status === "completed" ? copy.audioComplete : copy.audioPlaying}</span>
                <span>{copy.audioOnce}</span>
              </div>
            </>
          ) : (
            <p role="alert" className="text-sm font-bold leading-6 text-orange-800">{copy.audioUnavailable}</p>
          )}
        </div>

        <AnswerOptions question={question} selected={selected} onSelect={setSelected} legend={copy.selectAnswer} disabled={!canSelect} />
        <InlineError error={error ?? playbackError} retryLabel={copy.retry} onRetry={retryQuestionStart} />
        <StickySubmit disabled={!canSubmit || busy} busy={busy} copy={copy} />
        <p className="mt-3 text-center text-[11px] font-bold leading-5 text-[#8a78a0]">{copy.autoSaveNote}</p>
      </QuestionSurface>
    </form>
  );
}

function QuestionSurface({ children }: { children: ReactNode }) {
  return <div className="rounded-[26px] border border-[#ded1ed] bg-white p-5 shadow-[0_22px_65px_rgba(57,27,104,0.09)] sm:p-7">{children}</div>;
}

function QuestionHeading({ state, copy, onShowPassage }: { state: PublicAttemptState; copy: PlacementCopy; onShowPassage?: () => void }) {
  const question = state.question!;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.07em] text-[#8a74a3]">{copy.questionLabel} {state.sectionQuestion}</span>
        {onShowPassage ? (
          <button type="button" onClick={onShowPassage} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8c8eb] bg-white px-3 text-xs font-black text-[#391b68] transition hover:bg-[#f7f2fb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#391b68]/15 lg:hidden"><BookIcon />{copy.showPassage}</button>
        ) : null}
      </div>
      {question.situation && question.section !== "listening" ? <p className="mb-4 rounded-2xl bg-[#f6f1fb] px-4 py-3 text-sm leading-6 text-[#6d5889]">{question.situation}</p> : null}
      <h1 dir="ltr" className="whitespace-pre-line text-left text-[21px] font-black leading-8 text-[#281343] sm:text-2xl sm:leading-9">{question.prompt}</h1>
    </div>
  );
}

function AnswerOptions({ question, selected, onSelect, legend, disabled = false }: {
  question: PublicQuestion;
  selected: SelectedOption;
  onSelect: (value: SelectedOption) => void;
  legend: string;
  disabled?: boolean;
}) {
  return (
    <fieldset className="mt-6 grid gap-3" dir="ltr" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      {question.options.map((option) => {
        const active = selected === option.id;
        return (
          <label key={option.id} className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] font-bold leading-6 transition duration-200 focus-within:ring-4 focus-within:ring-[#391b68]/15 ${disabled ? "cursor-not-allowed border-[#e7dfef] bg-[#faf8fc] text-[#9b8baa] opacity-70" : active ? "cursor-pointer border-[#391b68] bg-[#f1e8fb] text-[#281343] shadow-[inset_0_0_0_1px_#391b68,0_9px_22px_rgba(57,27,104,0.08)]" : "cursor-pointer border-[#ded1ed] bg-white text-[#513477] hover:-translate-y-0.5 hover:border-[#9e82be] active:translate-y-0"}`}>
            <input type="radio" name={`answer-${question.id}`} value={option.id} checked={active} disabled={disabled} onChange={() => onSelect(option.id)} className="sr-only" />
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black transition duration-200 ${active ? "bg-[#391b68] text-white" : disabled ? "bg-[#eee8f4] text-[#9b8baa]" : "bg-[#f4eef9] text-[#391b68] group-hover:bg-[#ebe1f4]"}`}>{active ? <CheckIcon size={17} /> : option.id}</span>
            <span className="min-w-0 flex-1">{option.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

function StickySubmit({ disabled, busy, copy }: { disabled: boolean; busy: boolean; copy: PlacementCopy }) {
  return (
    <div className="sticky bottom-2 z-20 mt-6 rounded-2xl bg-white/90 p-1.5 shadow-[0_-8px_28px_rgba(251,249,255,0.95)] backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
      <button type="submit" disabled={disabled} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#ec911f] px-5 text-base font-black text-white shadow-[0_12px_26px_rgba(236,145,31,0.2)] transition duration-200 hover:bg-[#d97f11] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">
        {busy ? copy.saving : copy.saveAnswer}<ArrowIcon />
      </button>
    </div>
  );
}

function InlineError({ error, retryLabel, onRetry }: { error: string | null; retryLabel: string; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      <p>{error}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="mt-3 min-h-10 rounded-xl border border-red-300 bg-white px-4 text-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200">{retryLabel}</button> : null}
    </div>
  );
}

function ReadingDialog({ dialog, question, closeLabel }: { dialog: React.RefObject<HTMLDialogElement | null>; question: PublicQuestion; closeLabel: string }) {
  return (
    <dialog ref={dialog} className="m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl rounded-[26px] border border-[#ded1ed] bg-white p-0 text-[#391b68] shadow-2xl backdrop:bg-[#281343]/55 backdrop:backdrop-blur-sm">
      <div className="max-h-[88dvh] overflow-y-auto p-5 sm:p-7">
        <button type="button" onClick={() => dialog.current?.close()} className="sticky top-0 float-end min-h-10 rounded-xl bg-[#391b68] px-4 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">{closeLabel}</button>
        <PassageText text={question.passage?.text ?? ""} />
      </div>
    </dialog>
  );
}

function ResultScreen({ locale, state }: { locale: PlacementLocale; state: PublicAttemptState }) {
  const copy = placementCopy[locale];
  const result = state.result!;
  const skillNames: Record<AssessmentSection, string> = copy.sections;
  const skillRows = [
    ["listening", result.listening],
    ["reading", result.reading],
    ["languageUse", result.languageUse],
  ] as const;
  const explanation = locale === "ar"
    ? result.placement === "B1" && !result.b2Readiness
      ? "أنت تجاوزت الأساسيات بشكل واضح، وعندك قاعدة مناسبة للعمل على B1. الأسئلة الأعلى صعوبة بتوضح إن الانتقال المباشر إلى B2 محتاج تثبيت بعض المهارات."
      : `أداؤك عبر المهارات الثلاث يدعم إن ${courseLabel(locale, result.placement)} هي نقطة البداية الأنسب.`
    : result.placement === "B1" && !result.b2Readiness
      ? "You have moved beyond the foundations and have a suitable base for B1. The upper-band items show that some skills still need strengthening before a direct B2 start."
      : `Your performance across all three skills supports ${courseLabel(locale, result.placement)} as the most suitable starting point.`;

  return (
    <section className="bg-[#fbf9ff] px-4 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[30px] border border-[#ded1ed] bg-white shadow-[0_28px_80px_rgba(57,27,104,0.11)]">
          <div className="bg-gradient-to-br from-[#391b68] to-[#5f388c] px-6 py-9 text-center text-white sm:px-10 sm:py-12">
            <p className="text-sm font-black text-[#f5cc96]">{copy.resultHeading}</p>
            <div className="mx-auto mt-5 grid h-32 w-32 place-items-center rounded-full border-[7px] border-white/15 bg-white text-5xl font-black text-[#391b68] shadow-[0_18px_45px_rgba(24,9,45,0.25)] motion-safe:animate-[placementReveal_.55s_ease-out]">{result.placement}</div>
            <h1 className="mt-5 text-balance text-3xl font-black sm:text-4xl">{courseLabel(locale, result.placement)}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-white/80 sm:leading-8">{explanation}</p>
          </div>

          <div className="p-5 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1e8fb] text-[#391b68]"><ChartIcon /></span>
              <h2 className="text-xl font-black text-[#391b68]">{copy.profileTitle}</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {skillRows.map(([skill, evidence], index) => (
                <div key={skill} className="rounded-2xl border border-[#e1d6ee] bg-[#fcfaff] p-5 motion-safe:animate-[placementQuestionIn_.3s_ease-out]" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#513477]">{skillNames[skill]}</p>
                    <span className="rounded-full bg-[#f1e8fb] px-2.5 py-1 text-xs font-black text-[#391b68]">{evidence.estimatedBand}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e0f3]">
                    <div className="h-full rounded-full bg-[#ec911f] transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${evidence.percent}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-[#806b99]">{evidence.correct} / {evidence.total} {locale === "ar" ? "إجابات صحيحة" : "correct answers"}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ResultFact icon={<StarIcon />} label={copy.strongest} value={skillNames[result.strongestSkill]} />
              <ResultFact icon={<TargetIcon />} label={copy.improve} value={skillNames[result.weakestSkill]} />
              <ResultFact icon={<ShieldIcon />} label={copy.confidence} value={copy.confidenceLabels[result.confidence]} />
            </div>

            <details className="mt-5 rounded-2xl border border-[#e1d6ee] bg-white p-5 text-start transition open:bg-[#fcfaff]">
              <summary className="cursor-pointer font-black text-[#391b68] focus-visible:outline-none">{copy.whyResult}</summary>
              <p className="mt-3 text-sm leading-7 text-[#6d5889]">{copy.whyBody}</p>
            </details>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[26px] border border-[#e3d7ef] bg-white p-6 shadow-[0_18px_50px_rgba(57,27,104,0.07)] sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div>
            <p className="text-sm font-black text-[#ec911f]">{copy.courseHeading}</p>
            <h2 className="mt-2 text-2xl font-black text-[#391b68] sm:text-3xl">{courseLabel(locale, result.placement)}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#6d5889]">{copy.courseBody}</p>
          </div>
          <Link href={`/${locale}#lead-form`} onClick={() => trackPlacementTestEvent("placement_test_sales_cta_click", { placementLevel: result.placement, confidence: result.confidence })} className="mt-6 inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ec911f] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(236,145,31,0.2)] transition hover:bg-[#d97f11] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30 sm:mt-0 sm:w-auto">{copy.salesCta}<ArrowIcon /></Link>
        </div>
      </div>
    </section>
  );
}

function AudioCheck({ title, body, playLabel, continueLabel, busy, onContinue }: { title: string; body: string; playLabel: string; continueLabel: string; busy: boolean; onContinue: () => void }) {
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  function playSample() {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(523.25, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.65);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.7);
    setPlaying(true);
    oscillator.addEventListener("ended", () => {
      setPlaying(false);
      setPlayed(true);
      void context.close();
    });
  }
  return (
    <CenteredStage>
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#f1e8fb] to-[#fff4e5] text-[#391b68] shadow-[0_14px_34px_rgba(57,27,104,0.12)]"><HeadphonesIcon /></div>
      <h1 className="mt-5 text-balance text-3xl font-black sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{body}</p>
      <button type="button" onClick={playSample} disabled={playing} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-2xl border border-[#9e82be] bg-white px-5 font-black text-[#391b68] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f7f2fb] disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#391b68]/15"><PlayIcon />{playing ? "…" : playLabel}<AudioWaves playing={playing} /></button>
      <PrimaryButton disabled={!played || busy} onClick={onContinue}>{continueLabel}</PrimaryButton>
    </CenteredStage>
  );
}

function SectionIntro({ section, title, label, body, buttonLabel, busy, onContinue }: { section: AssessmentSection; title: string; label: string; body: string; buttonLabel: string; busy: boolean; onContinue: () => void }) {
  return (
    <CenteredStage>
      <SectionIcon section={section} />
      <Eyebrow>{label}</Eyebrow>
      <h1 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-black leading-[1.2] sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{body}</p>
      <PrimaryButton disabled={busy} onClick={onContinue}>{buttonLabel}</PrimaryButton>
    </CenteredStage>
  );
}

function CenteredStage({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] items-center bg-[#fbf9ff] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[30px] border border-[#ded1ed] bg-white p-6 text-center shadow-[0_26px_80px_rgba(57,27,104,0.11)] motion-safe:animate-[placementQuestionIn_.32s_ease-out] sm:p-12">
        <div className="mx-auto mb-6 h-1 w-20 rounded-full bg-gradient-to-r from-[#391b68] to-[#ec911f]" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-[#ec911f] px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(236,145,31,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d97f11] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">{children}<ArrowIcon /></button>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="mt-5 inline-flex rounded-full border border-[#e2d6ee] bg-[#f4eef9] px-4 py-2 text-xs font-black uppercase tracking-[0.06em] text-[#391b68]">{children}</span>;
}

function PassageText({ text }: { text: string }) {
  return <div dir="ltr" className="mt-2 space-y-4 text-left text-[16px] leading-8 text-[#3f2b57]">{text.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
}

function ResultFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-[#f2eafb] p-4 text-start"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#391b68]">{icon}</span><div><p className="text-xs font-black text-[#806b99]">{label}</p><p className="mt-1 font-black text-[#391b68]">{value}</p></div></div>;
}

function WelcomeFact({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-[#e3d8f0] bg-[#fcfaff] px-2 py-3"><span className="block text-lg font-black text-[#391b68] sm:text-xl">{value}</span><span className="mt-0.5 block text-[#806b99]">{label}</span></div>;
}

function FatalState({ locale, message }: { locale: PlacementLocale; message: string }) {
  const copy = placementCopy[locale];
  return <CenteredStage><h1 className="text-3xl font-black">{message}</h1><Link href={`/${locale}/placement-test`} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center rounded-2xl bg-[#391b68] px-6 font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">{copy.backToRegister}</Link></CenteredStage>;
}

function TimeoutOverlay({ copy }: { copy: PlacementCopy }) {
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    overlay.current?.focus();
  }, []);
  return (
    <div ref={overlay} role="dialog" aria-modal="true" aria-labelledby="placement-timeout-title" aria-describedby="placement-timeout-body" tabIndex={-1} className="fixed inset-0 z-50 grid place-items-center bg-[#281343]/55 p-4 backdrop-blur-sm focus:outline-none">
      <div className="w-full max-w-sm rounded-[26px] border border-white/50 bg-white p-7 text-center shadow-2xl motion-safe:animate-[placementOverlay_.24s_ease-out]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff4e5] text-[#d97f11]"><ClockIcon size={26} /></span>
        <h2 id="placement-timeout-title" className="mt-4 text-2xl font-black text-[#391b68]">{copy.timeoutTitle}</h2>
        <p id="placement-timeout-body" className="mt-2 text-sm font-bold leading-7 text-[#6d5889]">{copy.timeoutBody}</p>
        <div className="mx-auto mt-5 h-1 w-24 overflow-hidden rounded-full bg-[#eee7f5]" aria-hidden="true"><div className="h-full w-full origin-left bg-[#ec911f] motion-safe:animate-[placementTimeout_1.15s_linear_forwards]" /></div>
      </div>
    </div>
  );
}

function Milestone({ value, locale }: { value: number; locale: PlacementLocale }) {
  const messages = locale === "ar"
    ? value === 25 ? ["بداية ممتازة 👏", "كمل بنفس التركيز."] : value === 50 ? ["عديت النص 🔥", "باقي أقل مما خلصت."] : ["Almost there 🚀", "آخر جزء والنتيجة قربت."]
    : value === 25 ? ["Great Start 👏", "Keep the same focus."] : value === 50 ? ["Halfway There 🔥", "Less remains than you completed."] : ["Almost There 🚀", "One final part before your result."];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#281343]/50 p-4 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/50 bg-white p-8 text-center shadow-2xl motion-safe:animate-[placementOverlay_.28s_ease-out]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#391b68] via-[#ec911f] to-[#391b68]" />
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f1e8fb] text-2xl font-black text-[#391b68]">{value}%</span>
        <p className="mt-5 text-2xl font-black text-[#391b68]">{messages[0]}</p>
        <p className="mt-2 font-bold text-[#6d5889]">{messages[1]}</p>
      </div>
    </div>
  );
}

function SectionIcon({ section }: { section: AssessmentSection }) {
  return <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#391b68] to-[#674096] text-white shadow-[0_14px_34px_rgba(57,27,104,0.2)]" aria-hidden="true">{section === "listening" ? <HeadphonesIcon /> : section === "reading" ? <BookIcon size={30} /> : <BoltIcon />}</span>;
}

function Spinner() {
  return <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-[#e2d6ef] border-t-[#ec911f] motion-reduce:animate-none" aria-hidden="true" />;
}

function AudioWaves({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-6 shrink-0 items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => <span key={bar} className={`w-0.5 rounded-full bg-[#ec911f] ${playing ? "motion-safe:animate-[placementWave_.72s_ease-in-out_infinite]" : "h-1.5"}`} style={{ height: playing ? `${9 + (bar % 2) * 7}px` : undefined, animationDelay: `${bar * 90}ms` }} />)}
    </span>
  );
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function HeadphonesIcon({ size = 34 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M6 13H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2zM18 13h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2z"/></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.4v13.2a1 1 0 0 0 1.53.85l10.28-6.6a1 1 0 0 0 0-1.7L9.53 4.55A1 1 0 0 0 8 5.4Z"/></svg>;
}

function PauseIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M6.5 5.5h4v13h-4zM13.5 5.5h4v13h-4z"/></svg>;
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}

function BookIcon({ size = 22 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z"/></svg>;
}

function BoltIcon() {
  return <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7z"/></svg>;
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 14 9l6 2-6 2-2 7-2-7-6-2 6-2z"/></svg>;
}

function ChartIcon() {
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
}

function StarIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>;
}

function TargetIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 5-5"/></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>;
}

async function postAction(action: PlacementAttemptAction) {
  const response = await fetch("/api/placement-test/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isStateResponse(body)) {
    const error = new Error("placement_action_failed") as ApiError;
    error.status = response.status;
    error.code = isErrorResponse(body) ? body.error : "attempt_unavailable";
    throw error;
  }
  return body.state;
}

function isStateResponse(value: unknown): value is { ok: true; state: PublicAttemptState } {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === true && "state" in value;
}

function isErrorResponse(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}
