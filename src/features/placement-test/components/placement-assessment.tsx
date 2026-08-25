"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { trackPlacementTestEvent } from "@/lib/tracking";
import { courseLabel, placementCopy } from "../copy";
import {
  AnimatedSkillIcon,
  AssessmentInfoCards,
  AssessmentJourney,
  CelebrationParticles,
  ChallengeVisual,
  ExperienceBackdrop,
  JourneyEnergy,
  placementMotionDurations,
  type PlacementMotionCategory,
} from "./placement-experience";
import { getPlacementWhatsAppHref } from "@/lib/utm";
import type {
  AssessmentOption,
  AssessmentSection,
  PlacementAttemptAction,
  PlacementProfile,
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
type QuestionTransition = "idle" | "exiting" | "reward" | "entering";
type RewardMoment = {
  id: number;
  message: string;
  detail: string | null;
  bonus: boolean;
  duration: PlacementMotionCategory;
};

export function PlacementAssessment({ locale, initialState }: PlacementAssessmentProps) {
  const copy = placementCopy[locale];
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState<SelectedOption>(null);
  const [listeningSelections, setListeningSelections] = useState<Record<string, AssessmentOption["id"]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [reward, setReward] = useState<RewardMoment | null>(null);
  const [timeoutVisible, setTimeoutVisible] = useState(false);
  const [questionTransition, setQuestionTransition] = useState<QuestionTransition>("idle");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [questionStartFailed, setQuestionStartFailed] = useState(false);
  const previousPhase = useRef(state.phase);
  const previousListeningBlock = useRef<string | null>(null);
  const autoStartKey = useRef<string | null>(null);
  const expiredDeadline = useRef<string | null>(null);
  const timeoutActive = useRef(false);
  const timeoutTimer = useRef<number | null>(null);
  const sectionTimer = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const milestoneTimer = useRef<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const analysisTimers = useRef<number[]>([]);

  async function sendAction(action: PlacementAttemptAction, quiet = false) {
    const animateQuestionExit = action.action === "answer";
    const exitStartedAt = animateQuestionExit ? performance.now() : 0;
    if (animateQuestionExit) setQuestionTransition("exiting");
    if (!quiet) {
      setBusy(true);
      setError(null);
    }
    try {
      const next = await postAction(action);
      if (animateQuestionExit && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const remainingExit = Math.max(0, 180 - (performance.now() - exitStartedAt));
        if (remainingExit > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingExit));
      }
      const previousProgress = state.progressPercent;
      if (action.action === "answer") {
        const completedAnswers = next.status === "completed"
          ? next.overallTotal
          : Math.max(1, next.overallQuestion - 1);
        const bonus = completedAnswers > 0 && completedAnswers % 5 === 0;
        const rewardMessage = copy.rewardMessages[(completedAnswers - 1) % copy.rewardMessages.length];
        setQuestionTransition("reward");
        setReward({
          id: completedAnswers,
          message: rewardMessage.text,
          detail: bonus ? copy.bonusMessages[Math.floor(completedAnswers / 5 - 1) % copy.bonusMessages.length] : null,
          bonus,
          duration: bonus ? "bonus" : rewardMessage.duration,
        });
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await new Promise((resolve) => window.setTimeout(resolve, placementMotionDurations[bonus ? "bonus" : rewardMessage.duration]));
        }
        setReward(null);

        if (state.status !== "completed" && next.status === "completed") startAnalysis(next);
        else setState(next);
        setSelected(null);
        setQuestionTransition("entering");
        if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
        transitionTimer.current = window.setTimeout(() => setQuestionTransition("idle"), 280);
        if (state.section && next.section !== state.section) {
          trackPlacementTestEvent("placement_test_section_complete", {
            section: state.section,
          });
        }
        const crossed = [20, 40, 50, 70, 90].find(
          (point) => previousProgress < point && next.progressPercent >= point,
        );
        if (crossed) {
          setMilestone(crossed);
          trackPlacementTestEvent("placement_test_progress", {
            progressPercent: crossed,
            section: next.section,
          });
          if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
          milestoneTimer.current = window.setTimeout(() => setMilestone(null), placementMotionDurations.milestone);
        }
      } else {
        if (state.status !== "completed" && next.status === "completed") startAnalysis(next);
        else setState(next);
      }
      return next;
    } catch (caught) {
      if (animateQuestionExit) setQuestionTransition("idle");
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
    if (sectionTimer.current !== null) window.clearTimeout(sectionTimer.current);
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
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
    if (state.phase !== "section_intro" && state.phase !== "confirmation_intro") return;
    if (sectionTimer.current !== null) window.clearTimeout(sectionTimer.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionTimer.current = window.setTimeout(() => {
      if (state.phase === "section_intro" && state.section) {
        void sendAction({ action: "section_continue", section: state.section });
      } else if (state.phase === "confirmation_intro") {
        void sendAction({ action: "confirmation_continue" });
      }
    }, reducedMotion ? 80 : placementMotionDurations.section);
    return () => {
      if (sectionTimer.current !== null) window.clearTimeout(sectionTimer.current);
      sectionTimer.current = null;
    };
  }, [state.phase, state.section]);

  useEffect(() => {
    const blockId = state.section === "listening" ? state.question?.blockId ?? null : null;
    if (!blockId || previousListeningBlock.current === blockId) return;
    previousListeningBlock.current = blockId;
    setListeningSelections({});
  }, [state.question?.blockId, state.section]);

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
        expiredDeadline.current !== activeDeadline
      ) {
        expiredDeadline.current = activeDeadline;
        if (state.questionDeadlineAt) showTimeoutAndAdvance();
        else if (state.readingReadyAt) void refreshState();
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

  const renderStage = (content: ReactNode) => (
    <PlacementExitGuard
      active={state.status === "in_progress"}
      copy={copy}
      locale={locale}
    >
      {content}
    </PlacementExitGuard>
  );

  if (showAnalysis) {
    return renderStage(
      <CenteredStage>
        <Spinner />
        <p className="mt-6 text-xl font-black sm:text-2xl">{copy.analysis[analysisStep]}</p>
        <div className="mx-auto mt-6 flex w-28 justify-center gap-2" aria-hidden="true">
          {copy.analysis.map((_, index) => (
            <span key={index} className={`h-2 rounded-full transition-all duration-300 ${index <= analysisStep ? "w-7 bg-[#ec911f]" : "w-2 bg-[#ddd0ec]"}`} />
          ))}
        </div>
      </CenteredStage>,
    );
  }

  if (state.phase === "welcome") {
    return renderStage(
      <AssessmentWelcome locale={locale} copy={copy} busy={busy} onStart={() => {
          trackPlacementTestEvent("placement_test_start", { locale });
          void sendAction({ action: "start" });
        }} />,
    );
  }

  if (state.phase === "audio_check") {
    return renderStage(
      <AudioCheck
        title={copy.audioCheckTitle}
        body={copy.audioCheckBody}
        playLabel={copy.playCheck}
        continueLabel={copy.soundClear}
        busy={busy}
        onContinue={() => void sendAction({ action: "audio_check_complete" })}
      />,
    );
  }

  if (state.phase === "section_intro" && state.section) {
    return renderStage(
      <SectionMoment
        section={state.section}
        title={copy.sectionIntroTitles[state.section]}
        label={state.section === "languageUse"
          ? copy.assessmentLabel
          : state.section === "reading"
            ? copy.sectionComplete.languageUse
            : copy.sectionComplete.reading}
        body={copy.sectionIntros[state.section]}
        error={error}
        retryLabel={copy.retry}
        onRetry={() => void sendAction({ action: "section_continue", section: state.section! })}
      />,
    );
  }

  if (state.phase === "confirmation_intro") {
    return renderStage(
      <SectionMoment
        title={copy.confirmationTitle}
        label={locale === "ar" ? "خطوة أخيرة" : "Final Check"}
        body={copy.confirmationBody}
        error={error}
        retryLabel={copy.retry}
        onRetry={() => void sendAction({ action: "confirmation_continue" })}
      />,
    );
  }

  const layoutProps = {
    state,
    copy,
    remainingSeconds,
    milestone,
    timeoutVisible,
    locale,
    questionTransition,
    reward,
  };

  if (
    state.section === "reading" &&
    state.question &&
    (state.phase === "reading_period" || state.phase === "question")
  ) {
    return renderStage(
      <AssessmentLayout {...layoutProps}>
        <ReadingQuestion
          state={state}
          copy={copy}
          selected={selected}
          setSelected={(value) => {
            setSelected(value);
            if (state.phase === "reading_period" && state.question) {
              void sendAction({ action: "begin_question", questionId: state.question.id }, true);
            }
          }}
          remainingSeconds={remainingSeconds}
          busy={busy}
          error={error}
          retryQuestionStart={questionStartFailed ? () => {
            setError(null);
            setQuestionStartFailed(false);
          } : undefined}
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && state.question && state.phase === "question") {
              void sendAction({ action: "answer", questionId: state.question.id, optionId: selected });
            }
          }}
        />
      </AssessmentLayout>,
    );
  }

  if (
    state.section === "listening" &&
    state.question &&
    (state.phase === "audio" || state.phase === "question")
  ) {
    return renderStage(
      <AssessmentLayout {...layoutProps}>
        <ListeningQuestion
          state={state}
          copy={copy}
          selections={listeningSelections}
          setSelection={(questionId, value) => {
            setListeningSelections((current) => ({ ...current, [questionId]: value }));
          }}
          busy={busy}
          error={error}
          retryQuestionStart={questionStartFailed ? () => {
            setError(null);
            setQuestionStartFailed(false);
          } : undefined}
          sendAction={sendAction}
          onSubmit={(event) => {
            event.preventDefault();
            const listeningSelection = state.question ? listeningSelections[state.question.id] : null;
            if (listeningSelection && state.question && state.phase === "question") {
              void sendAction({ action: "answer", questionId: state.question.id, optionId: listeningSelection });
            }
          }}
        />
      </AssessmentLayout>,
    );
  }

  if (state.phase === "question" && state.question) {
    return renderStage(
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
      </AssessmentLayout>,
    );
  }

  if (state.phase === "result" && state.result) {
    return renderStage(<ResultScreen locale={locale} state={state} />);
  }

  if (state.phase === "expired") {
    return renderStage(<FatalState locale={locale} message={copy.expired} />);
  }

  return renderStage(<FatalState locale={locale} message={copy.fatal} />);
}

type ExitDestination =
  | { kind: "href"; href: string }
  | { kind: "history" };

function PlacementExitGuard({
  active,
  copy,
  locale,
  children,
}: {
  active: boolean;
  copy: PlacementCopy;
  locale: PlacementLocale;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const destination = useRef<ExitDestination | null>(null);
  const bypass = useRef(false);
  const stayButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!active) return;
    const sentinelKey = "__placementExitGuard";
    const currentHistoryState = window.history.state;
    const historyState = currentHistoryState && typeof currentHistoryState === "object"
      ? currentHistoryState as Record<string, unknown>
      : {};
    if (!historyState[sentinelKey]) {
      window.history.pushState({ ...historyState, [sentinelKey]: true }, "", window.location.href);
    }

    function showExitPrompt(nextDestination: ExitDestination) {
      destination.current = nextDestination;
      setCopied(false);
      setOpen(true);
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (bypass.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.download || anchor.target === "_blank") {
        return;
      }
      const targetUrl = new URL(anchor.href, window.location.href);
      if (!/^https?:$/.test(targetUrl.protocol) || targetUrl.href === window.location.href) return;
      event.preventDefault();
      showExitPrompt({ kind: "href", href: targetUrl.href });
    }

    function handlePopState() {
      if (bypass.current) {
        bypass.current = false;
        return;
      }
      showExitPrompt({ kind: "history" });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
      const latestState = window.history.state;
      if (
        !bypass.current &&
        latestState &&
        typeof latestState === "object" &&
        (latestState as Record<string, unknown>)[sentinelKey]
      ) {
        bypass.current = true;
        window.history.back();
      }
    };
  }, [active]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    stayButton.current?.focus();
    return () => previousFocus.current?.focus();
  }, [open]);

  function stay() {
    if (destination.current?.kind === "history") {
      const currentHistoryState = window.history.state;
      const historyState = currentHistoryState && typeof currentHistoryState === "object"
        ? currentHistoryState as Record<string, unknown>
        : {};
      window.history.pushState(
        { ...historyState, __placementExitGuard: true },
        "",
        window.location.href,
      );
    }
    destination.current = null;
    setOpen(false);
  }

  function leave() {
    const nextDestination = destination.current;
    if (!nextDestination) return;
    bypass.current = true;
    setOpen(false);
    if (nextDestination.kind === "history") window.history.back();
    else window.location.assign(nextDestination.href);
  }

  async function copyCurrentUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      {children}
      {active && open ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#21152b]/48 px-4 backdrop-blur-[6px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) stay();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            dir={copy.direction}
            className="w-full max-w-md rounded-[26px] border border-white/80 bg-[#fbf9f6] p-5 text-[#30223a] shadow-[0_30px_90px_rgba(35,20,47,0.3)] motion-safe:animate-[placementOverlay_.24s_cubic-bezier(.22,.8,.22,1)] sm:p-6"
            onKeyDown={(event) => {
              if (event.key === "Escape") stay();
            }}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f4eaf7] text-[#391b68]" aria-hidden="true">
                <ExitIcon />
              </span>
              <div>
                <h2 id={titleId} className="text-xl font-black sm:text-2xl">{copy.exitTitle}</h2>
                <p id={bodyId} className="mt-2 text-sm font-semibold leading-6 text-[#746779]">{copy.exitBody}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyCurrentUrl()}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] border border-[#d9c9df] bg-white px-4 text-sm font-black text-[#391b68] transition hover:border-[#bda6c8] hover:bg-[#f8f2fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec911f] focus-visible:ring-offset-2"
            >
              <CopyIcon />
              {copied ? copy.exitCopied : copy.exitCopyUrl}
            </button>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                ref={stayButton}
                type="button"
                onClick={stay}
                className="min-h-12 rounded-[15px] bg-[#391b68] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(57,27,104,0.2)] transition hover:bg-[#2f1658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec911f] focus-visible:ring-offset-2"
              >
                {copy.exitStay}
              </button>
              <button
                type="button"
                onClick={leave}
                className="min-h-12 rounded-[15px] px-4 text-sm font-black text-[#756979] transition hover:bg-[#eee7f0] hover:text-[#391b68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec911f] focus-visible:ring-offset-2"
              >
                {copy.exitLeave}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function AssessmentLayout({
  state,
  copy,
  remainingSeconds,
  milestone,
  timeoutVisible,
  locale,
  questionTransition,
  reward,
  children,
}: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  remainingSeconds: number | null;
  milestone: number | null;
  timeoutVisible: boolean;
  locale: PlacementLocale;
  questionTransition: QuestionTransition;
  reward: RewardMoment | null;
  children: ReactNode;
}) {
  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)] pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 px-3 pt-2.5 sm:px-6 sm:pt-4">
        <div className="mx-auto max-w-6xl rounded-[22px] border border-white/75 bg-[#faf8f5]/82 px-3 py-2.5 shadow-[0_16px_45px_rgba(39,27,48,0.09)] backdrop-blur-2xl sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-[#30223a] text-[#f4a445] shadow-[0_8px_20px_rgba(48,34,58,0.22)] motion-safe:animate-[placementEnergyPulse_1.2s_ease-out]" aria-hidden="true"><BoltIcon size={19} /></span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#867a89]">{copy.assessmentLabel}</p>
                <p className="mt-0.5 truncate text-[13px] font-black text-[#2a1e32]">
                  {state.section ? copy.sections[state.section] : copy.assessmentLabel}
                  <span className="mx-1.5 text-[#b4aab7]">·</span>
                  {state.sectionQuestion}/{state.sectionTotal}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <TimerBadge state={state} remainingSeconds={remainingSeconds} label={copy.timeRemaining} />
              <Link
                href={`/${locale}`}
                aria-label={copy.exitAction}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#e4dbe6] bg-white/80 text-[#695b70] transition hover:border-[#cdbbd5] hover:bg-white hover:text-[#391b68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec911f] focus-visible:ring-offset-2"
              >
                <ExitIcon />
              </Link>
            </div>
          </div>
          <div className="mt-2.5 grid items-center gap-2.5 sm:grid-cols-[minmax(220px,0.8fr)_1.2fr]">
            <JourneyEnergy value={state.progressPercent} label={copy.energyLabel} compact />
            <ProgressJourney state={state} copy={copy} locale={locale} />
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:py-7">
        <div
          className={`will-change-transform transition-[transform,opacity,filter] ease-[cubic-bezier(.22,.8,.22,1)] motion-reduce:transition-none ${questionTransition === "exiting" ? "translate-y-3 scale-[0.985] opacity-0 blur-[2px] duration-180" : questionTransition === "reward" ? "scale-[0.985] opacity-0 duration-150" : "translate-y-0 scale-100 opacity-100 blur-0 duration-280"} ${questionTransition === "entering" ? "motion-safe:animate-[placementQuestionIn_.28s_cubic-bezier(.22,.8,.22,1)]" : ""}`}
        >
          {children}
        </div>
      </main>
      {reward ? <MotivationBurst reward={reward} locale={locale} /> : null}
      {milestone ? <Milestone value={milestone} locale={locale} /> : null}
      {timeoutVisible ? <TimeoutOverlay copy={copy} /> : null}
    </ExperienceBackdrop>
  );
}

function ProgressJourney({ state, copy, locale }: { state: PublicAttemptState; copy: PlacementCopy; locale: PlacementLocale }) {
  const activeStep = state.phase === "result"
    ? 3
    : state.section === "languageUse"
      ? 0
      : state.section === "reading"
        ? 1
        : state.section === "listening"
          ? 2
          : 0;

  return <AssessmentJourney labels={copy.journey} activeStep={activeStep} locale={locale} label={copy.progressLabel} />;
}

function TimerBadge({ state, remainingSeconds, label }: { state: PublicAttemptState; remainingSeconds: number | null; label: string }) {
  if (!state.questionDeadlineAt || remainingSeconds === null || remainingSeconds <= 0) return null;
  const total = state.question?.timeLimitSeconds ?? remainingSeconds;
  const ratio = Math.max(0, Math.min(1, remainingSeconds / Math.max(1, total)));
  const warning = remainingSeconds <= 10;
  const urgent = remainingSeconds <= 5;
  const stroke = urgent ? "#b42318" : warning ? "#d97706" : "#391b68";
  const circumference = Math.PI * 2 * 15;

  return (
    <div className={`flex h-10 shrink-0 items-center gap-1.5 rounded-[14px] border bg-white/75 pe-2 ps-1 shadow-sm backdrop-blur transition-colors ${urgent ? "border-red-200 text-red-700" : warning ? "border-orange-200 text-orange-700" : "border-white text-[#372641]"}`} aria-label={`${label}: ${remainingSeconds}`}>
      <span className="relative grid h-8 w-8 place-items-center" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e7e1e7" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none" />
        </svg>
        <ClockIcon size={13} />
      </span>
      <span className="min-w-6 text-center text-sm font-black tabular-nums">{remainingSeconds}</span>
    </div>
  );
}

function ReadingQuestion({ state, copy, selected, setSelected, remainingSeconds, busy, error, retryQuestionStart, onSubmit }: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  selected: SelectedOption;
  setSelected: (value: SelectedOption) => void;
  remainingSeconds: number | null;
  busy: boolean;
  error: string | null;
  retryQuestionStart?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const question = state.question!;
  const dialog = useRef<HTMLDialogElement>(null);
  const preparing = state.phase === "reading_period";
  const sharedPassage = question.blockId !== question.slotId;
  return (
    <form onSubmit={onSubmit} className="grid items-start gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
      <aside className="hidden max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-[28px] border border-white/70 bg-[#e7e1e7]/90 p-7 shadow-[0_24px_60px_rgba(36,25,46,0.1)] backdrop-blur lg:sticky lg:top-36 lg:block">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#d9d0de] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#391b68] shadow-sm"><BookIcon /></span>
            <div>
              <p className="text-sm font-black text-[#2f223b]">{copy.sections.reading}</p>
              <p className="mt-0.5 text-xs font-bold text-[#756581]">{copy.questionLabel} {state.sectionQuestion}/{state.sectionTotal}</p>
            </div>
          </div>
          {preparing && remainingSeconds !== null ? <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black tabular-nums text-[#704293]">{copy.readingPreparation} · {remainingSeconds}s</span> : null}
        </div>
        <PassageText text={question.passage?.text ?? ""} />
      </aside>
      <QuestionSurface>
        {preparing ? (
          <div className="mb-5 flex items-start gap-3 rounded-[18px] bg-[#ece6ed] px-4 py-3 text-start shadow-inner">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#30223a] text-[#f2a143]"><BookIcon size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-[#4c365f]">{copy.readingPreparation}</p>
                <span className="shrink-0 text-sm font-black tabular-nums text-[#704293]">{remainingSeconds ?? 0}s</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-5 text-[#756581]">{copy.readingPreparationHint}</p>
            </div>
          </div>
        ) : null}
        {!sharedPassage ? (
          <div className="mb-5 rounded-[20px] bg-[#e8e2e8] px-4 py-4 shadow-inner lg:hidden">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-[#4c365f]"><BookIcon size={18} />{copy.sections.reading}</div>
            <PassageText text={question.passage?.text ?? ""} />
          </div>
        ) : null}
        <QuestionHeading state={state} copy={copy} onShowPassage={sharedPassage ? () => dialog.current?.showModal() : undefined} />
        <AnswerOptions question={question} selected={selected} onSelect={setSelected} legend={copy.selectAnswer} />
        <InlineError error={error} retryLabel={copy.retry} onRetry={retryQuestionStart} />
        <StickySubmit disabled={!selected || busy || !state.questionDeadlineAt} busy={busy} copy={copy} />
      </QuestionSurface>
      {sharedPassage ? <ReadingDialog dialog={dialog} question={question} closeLabel={copy.closePassage} preparationLabel={preparing && remainingSeconds !== null ? `${copy.readingPreparation} · ${remainingSeconds}s` : undefined} /> : null}
    </form>
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
  return (
    <form onSubmit={onSubmit} className={`mx-auto max-w-4xl transition duration-150 ${busy ? "opacity-80" : "opacity-100"}`}>
      <QuestionSurface>
        <QuestionHeading state={state} copy={copy} />
        <AnswerOptions question={question} selected={selected} onSelect={setSelected} legend={copy.selectAnswer} />
        <InlineError error={error} retryLabel={copy.retry} onRetry={retryQuestionStart} />
        <StickySubmit disabled={!selected || busy || !state.questionDeadlineAt} busy={busy} copy={copy} />
      </QuestionSurface>
    </form>
  );
}

function ListeningQuestion({ state, copy, selections, setSelection, busy, error, retryQuestionStart, sendAction, onSubmit }: {
  state: PublicAttemptState;
  copy: PlacementCopy;
  selections: Record<string, AssessmentOption["id"]>;
  setSelection: (questionId: string, value: AssessmentOption["id"]) => void;
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
  const blockQuestions = state.listeningBlockQuestions.length > 0 ? state.listeningBlockQuestions : [question];
  const isSharedBlock = blockQuestions.length > 1;
  const blockQuestionIndex = Math.max(0, blockQuestions.findIndex((blockQuestion) => blockQuestion.id === question.id));
  const previewingSharedBlock = isSharedBlock && audio?.status !== "completed";
  const selected = selections[question.id] ?? null;
  const playable = Boolean(audio && audio.startSeconds !== null && audio.endSeconds !== null && audio.expectedDurationSeconds !== null);
  const canSelect = Boolean(audio && (isSharedBlock ? audio.status === "completed" : audio.status !== "not_started" || isPlaying));
  const canSubmit = state.phase === "question" && Boolean(state.questionDeadlineAt) && Boolean(selected);

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
          await sendAction({ action: "audio_failed", questionId: question.id }, true);
          return;
        }
      }
      serverPlaybackStarted.current = true;
    } catch {
      element.pause();
      setIsPlaying(false);
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

  const player = (
    <div className={`relative overflow-hidden rounded-[22px] p-4 transition-colors ${audio?.status === "completed" ? "bg-[#e8e3eb]" : isPlaying ? "bg-[#33243d] text-white shadow-[0_18px_45px_rgba(45,31,55,0.2)]" : "bg-[#ebe6eb]"}`}>
      {isPlaying ? <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(236,145,31,0.18),transparent_38%)]" aria-hidden="true" /> : null}
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

          <div className="relative flex items-center gap-3">
            {audio.status === "completed" ? (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#391b68] text-white"><CheckIcon /></span>
            ) : (
              <button type="button" disabled={busy || isPlaying} onClick={() => void startPlayback()} className={`relative flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#30223a] text-white shadow-[0_10px_24px_rgba(40,28,49,0.25)] transition duration-200 hover:scale-[1.02] hover:bg-[#3d2949] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30 ${audio.status === "not_started" ? "min-w-[148px] px-5" : "w-14"}`} aria-label={audio.status === "not_started" ? copy.startListening : copy.playAudio}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                {audio.status === "not_started" ? <span className="text-sm font-black">{copy.startListening}</span> : null}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className={`flex items-center justify-between gap-3 text-xs font-black ${isPlaying ? "text-white/75" : "text-[#6d5889]"}`}>
                <span>{audio.status === "completed" ? copy.audioComplete : isPlaying ? copy.audioPlaying : copy.listenCarefully}</span>
                <span className="shrink-0 tabular-nums" dir="ltr">{formatTime(visualProgress)} / {formatTime(duration)}</span>
              </div>
              <div className={`mt-2.5 h-2 overflow-hidden rounded-full ${isPlaying ? "bg-white/12" : "bg-[#d8d0dc]"}`} dir="ltr" role="progressbar" aria-label={copy.audioPlaying} aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(visualProgress)}>
                <div className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#ec911f,#d8a4eb)] will-change-transform" style={{ transform: `scaleX(${progressRatio})` }} />
              </div>
            </div>
            <AudioWaves playing={isPlaying} />
          </div>
          <div className={`relative mt-3 flex items-center justify-between gap-3 text-[11px] font-bold ${isPlaying ? "text-white/55" : "text-[#8a78a0]"}`}>
            <span>{audio.status === "not_started" ? isSharedBlock ? copy.listeningPreviewReady : copy.listeningLocked : audio.status === "completed" ? copy.listeningBlockReview : copy.audioPlaying}</span>
            <span>{copy.audioOnce}</span>
          </div>
        </>
      ) : (
        <p role="alert" className="text-sm font-bold leading-6 text-orange-800">{copy.audioUnavailable}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className={`mx-auto max-w-5xl transition duration-200 ${busy ? "opacity-80" : "opacity-100"}`}>
      <QuestionSurface>
        <div className="mb-4 rounded-[20px] bg-[#e8e2e8] p-4 shadow-inner">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#30223a] text-[#f2a143] shadow-md"><HeadphonesIcon size={23} /></span>
            <div className="min-w-0">
              {isSharedBlock ? <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#513477] shadow-sm">{copy.listeningBlockMeta.replace("{count}", String(blockQuestions.length))}</span> : null}
              <p className={`${isSharedBlock ? "mt-2" : ""} text-sm font-black text-[#513477]`}>{isSharedBlock ? copy.listeningBlockCount.replace("{count}", String(blockQuestions.length)) : copy.listeningPrompt}</p>
              {isSharedBlock ? <p className="mt-1 text-xs font-bold leading-5 text-[#756581]">{copy.listeningBlockPreview}</p> : null}
              {question.situation ? <p dir="ltr" className="mt-1.5 text-left text-sm font-bold leading-6 text-[#513477]">{question.situation}</p> : null}
            </div>
          </div>
        </div>
        {isSharedBlock ? (
          previewingSharedBlock ? (
            <>
              <ListeningBlockPreview questions={blockQuestions} copy={copy} />
              <div className="mt-4">{player}</div>
            </>
          ) : (
            <>
              {player}
              <section key={question.id} className="mt-4 rounded-[20px] border border-[#8b65a0] bg-white/85 p-4 shadow-[0_12px_32px_rgba(53,35,64,0.09)] motion-safe:animate-[placementQuestionIn_.28s_cubic-bezier(.22,.8,.22,1)] sm:p-5" aria-label={`${copy.questionLabel} ${blockQuestionIndex + 1}`} data-listening-block-current-question>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#30223a] px-3 py-1 text-[10px] font-black text-white">{copy.listeningQuestionCounter.replace("{current}", String(blockQuestionIndex + 1)).replace("{count}", String(blockQuestions.length))}</span>
                  <span className="text-[10px] font-black text-[#c66e08]">{copy.sharedAudio}</span>
                </div>
                <h2 dir="ltr" className="text-left text-[21px] font-black leading-[1.42] text-[#241a2b] sm:text-[25px]">{question.prompt}</h2>
                <AnswerOptions question={question} selected={selected} onSelect={(value) => value && setSelection(question.id, value)} legend={copy.selectAnswer} disabled={!canSelect} />
              </section>
            </>
          )
        ) : (
          <>
            <QuestionHeading state={state} copy={copy} />
            <div className="mt-5">{player}</div>
            <AnswerOptions question={question} selected={selected} onSelect={(value) => value && setSelection(question.id, value)} legend={copy.selectAnswer} disabled={!canSelect} />
          </>
        )}
        <InlineError error={error ?? playbackError} retryLabel={copy.retry} onRetry={retryQuestionStart} />
        <StickySubmit disabled={!canSubmit || busy} busy={busy} copy={copy} />
      </QuestionSurface>
    </form>
  );
}

function ListeningBlockPreview({ questions, copy }: { questions: PublicQuestion[]; copy: PlacementCopy }) {
  return (
    <section className="rounded-[22px] border border-white/80 bg-white/72 p-3.5 shadow-[0_16px_38px_rgba(48,32,58,0.08)] backdrop-blur sm:p-4" data-listening-block-preview>
      <ol className="space-y-2.5">
        {questions.map((previewQuestion, index) => (
          <li key={previewQuestion.id} className="rounded-[16px] border border-[#ded4e2] bg-[#f5f1f5] px-3.5 py-3 motion-safe:animate-[placementRevealUp_.32s_ease-out_both]" style={{ animationDelay: `${index * 70}ms` }}>
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a6b98]">{copy.questionLabel} {index + 1}</span>
            <p dir="ltr" className="mt-1.5 text-left text-[15px] font-black leading-6 text-[#2d2036] sm:text-base">{previewQuestion.prompt}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function QuestionSurface({ children }: { children: ReactNode }) {
  return <section className="relative overflow-hidden rounded-[28px] border border-white/75 bg-[linear-gradient(145deg,rgba(255,254,251,0.94),rgba(245,241,244,0.92))] p-5 shadow-[0_28px_70px_rgba(39,27,48,0.13),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-xl sm:p-7 lg:p-8"><span className="absolute -start-16 -top-24 h-52 w-52 rounded-full bg-[#8c5aac]/10 blur-3xl" aria-hidden="true" /><span className="absolute end-0 top-0 h-24 w-1 bg-[linear-gradient(#ec911f,transparent)]" aria-hidden="true" /><div className="relative">{children}</div></section>;
}

function QuestionHeading({ state, copy, onShowPassage }: { state: PublicAttemptState; copy: PlacementCopy; onShowPassage?: () => void }) {
  const question = state.question!;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#30223a] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm">{copy.questionLabel} {state.sectionQuestion}</span>
        {onShowPassage ? (
          <button type="button" onClick={onShowPassage} className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#30223a] px-3.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(45,31,55,0.18)] transition hover:-translate-y-0.5 hover:bg-[#3d2949] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25 lg:hidden"><BookIcon />{copy.showPassage}</button>
        ) : null}
      </div>
      {question.situation && question.section !== "listening" ? <p className="mb-4 rounded-[18px] bg-[#e8e2e8] px-4 py-3 text-sm font-semibold leading-6 text-[#66566c] shadow-inner">{question.situation}</p> : null}
      <h1 dir="ltr" className="whitespace-pre-line text-left text-[22px] font-black leading-[1.42] tracking-[-0.005em] text-[#241a2b] sm:text-[26px] sm:leading-[1.36]">{question.prompt}</h1>
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
    <fieldset className="mt-6 grid gap-2.5 sm:gap-3" dir="ltr" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      {question.options.map((option) => {
        const active = selected === option.id;
        return (
          <label key={option.id} className={`group relative flex min-h-[62px] items-center gap-3 overflow-hidden rounded-[18px] border px-3.5 py-3 text-left text-[15px] font-bold leading-6 transition-[transform,box-shadow,border-color,background-color] duration-200 focus-within:ring-4 focus-within:ring-[#ec911f]/18 sm:px-4 ${disabled ? "cursor-not-allowed border-transparent bg-[#ebe7eb] text-[#948a97] opacity-75" : active ? "cursor-pointer border-[#68427f] bg-[linear-gradient(100deg,#e9e0ed,#fffaf4)] text-[#24182e] shadow-[0_14px_30px_rgba(52,34,64,0.13),0_0_0_1px_rgba(236,145,31,0.1)_inset] motion-safe:animate-[placementOptionSelect_.22s_ease-out]" : "cursor-pointer border-white/75 bg-white/68 text-[#4d3b57] shadow-[0_7px_20px_rgba(43,30,52,0.055)] hover:-translate-y-0.5 hover:border-white hover:bg-white hover:shadow-[0_12px_28px_rgba(43,30,52,0.1)] active:translate-y-0 active:scale-[0.99]"}`}>
            {active ? <span className="absolute inset-y-0 start-0 w-1 bg-[#ec911f]" aria-hidden="true" /> : null}
            <input type="radio" name={`answer-${question.id}`} value={option.id} checked={active} disabled={disabled} onChange={() => onSelect(option.id)} className="sr-only" />
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[13px] text-sm font-black transition duration-200 ${active ? "bg-[#30223a] text-white shadow-[0_7px_16px_rgba(45,31,55,0.22)]" : disabled ? "bg-[#ded8df] text-[#9b8baa]" : "bg-[#f3eff1] text-[#5b3a72] shadow-sm group-hover:bg-[#ece4ef]"}`}>{active ? <span className="motion-safe:animate-[placementCheckDraw_.24s_cubic-bezier(.2,.9,.2,1)]"><CheckIcon size={17} /></span> : option.id}</span>
            <span className="min-w-0 flex-1">{option.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

function StickySubmit({ disabled, busy, copy }: { disabled: boolean; busy: boolean; copy: PlacementCopy }) {
  return (
    <div className="sticky bottom-2 z-20 mt-5 rounded-[20px] bg-[#f7f3f4]/88 p-1.5 shadow-[0_-14px_34px_rgba(247,243,244,0.95)] backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
      <button type="submit" disabled={disabled} className="group relative inline-flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-[17px] bg-[#30223a] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(45,31,55,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3b2947] active:translate-y-0 active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-[#d9d2da] disabled:text-[#918693] disabled:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">
        {!disabled ? <span className="absolute inset-y-0 start-0 w-1 bg-[#ec911f]" aria-hidden="true" /> : null}
        <span className={`grid h-8 w-8 place-items-center rounded-xl transition ${disabled ? "bg-white/20" : "bg-[#ec911f] text-white group-hover:rotate-6"}`}><BoltIcon size={17} /></span>
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

function ReadingDialog({ dialog, question, closeLabel, preparationLabel }: { dialog: React.RefObject<HTMLDialogElement | null>; question: PublicQuestion; closeLabel: string; preparationLabel?: string }) {
  return (
    <dialog ref={dialog} className="mb-0 mt-auto max-h-[86dvh] w-full max-w-xl rounded-t-[28px] border border-[#d8cfde] bg-[#f8f6f9] p-0 text-[#391b68] shadow-2xl backdrop:bg-[#201628]/60 backdrop:backdrop-blur-sm sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-[28px]">
      <div className="max-h-[86dvh] overflow-y-auto p-5 sm:p-7">
        <div className="sticky top-0 z-10 -mx-2 mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f8f6f9]/95 px-2 py-2 backdrop-blur">
          {preparationLabel ? <span className="text-xs font-black text-[#704293]">{preparationLabel}</span> : <span />}
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-10 rounded-xl bg-[#391b68] px-4 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">{closeLabel}</button>
        </div>
        <PassageText text={question.passage?.text ?? ""} />
      </div>
    </dialog>
  );
}

function ResultScreen({ locale, state }: { locale: PlacementLocale; state: PublicAttemptState }) {
  const copy = placementCopy[locale];
  const result = state.result!;
  const [revealStep, setRevealStep] = useState(0);
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
  const salesBridge = locale === "ar"
    ? `بما إن أنسب بداية ليك هي ${result.placement}، نقدر نساعدك تبدأ بالمستوى المناسب من غير ما تضيع وقت في مستوى أعلى أو أقل من احتياجك.`
    : `Because ${result.placement} is your best starting point, we can help you begin at the right level without losing time in a course above or below what you need.`;
  const whatsAppMessage = buildPlacementWhatsAppMessage(locale, result, skillNames);
  const whatsAppHref = getPlacementWhatsAppHref(locale, whatsAppMessage);

  function trackSalesCta(ctaType: "homepage" | "whatsapp") {
    trackPlacementTestEvent("placement_test_sales_cta_click", {
      locale,
      placementLevel: result.placement,
      ctaType,
    });
  }

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRevealStep(4);
      return;
    }
    const timers = [
      window.setTimeout(() => setRevealStep(1), 180),
      window.setTimeout(() => setRevealStep(2), 560),
      window.setTimeout(() => setRevealStep(3), 900),
      window.setTimeout(() => setRevealStep(4), 1_180),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="relative px-4 py-4 sm:px-6 sm:py-7 motion-safe:animate-[placementResultScene_.55s_ease-out_both]">
        {revealStep >= 1 ? <CelebrationParticles dense /> : null}
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[28px] bg-[#2f2138] px-5 py-6 text-center text-white shadow-[0_34px_90px_rgba(39,26,48,0.3)] sm:px-9 sm:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(160,103,190,0.42),transparent_45%),radial-gradient(circle_at_90%_95%,rgba(236,145,31,0.22),transparent_32%)]" aria-hidden="true" />
            <div className="relative">
              <p className={`text-sm font-black text-[#f5b25d] transition duration-300 ${revealStep >= 1 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>{copy.resultComplete}</p>
              <p className={`mt-2 text-[13px] font-bold text-white/60 transition duration-300 ${revealStep >= 1 ? "opacity-100" : "opacity-0"}`}>{copy.resultHeading}</p>
              <div className={`relative mx-auto mt-3 grid h-30 w-30 place-items-center rounded-full border border-white/15 bg-white/8 shadow-[0_0_70px_rgba(236,145,31,0.16)] transition-opacity sm:h-32 sm:w-32 ${revealStep >= 2 ? "opacity-100 motion-safe:animate-[placementResultBadge_.7s_cubic-bezier(.2,.85,.2,1)_both]" : "opacity-0"}`}>
                <span className="absolute inset-3 rounded-full border border-[#ec911f]/40" />
                <span className="text-5xl font-black tracking-[-0.04em] text-white">{result.placement}</span>
              </div>
              <h1 className={`mt-3 text-balance text-3xl font-black transition duration-300 sm:text-4xl ${revealStep >= 2 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>{courseLabel(locale, result.placement)}</h1>
              <p className={`mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-white/65 transition duration-300 sm:text-[15px] ${revealStep >= 2 ? "opacity-100" : "opacity-0"}`}>{copy.resultBasis}</p>
              <div className={`mx-auto mt-3 max-w-md transition duration-300 ${revealStep >= 2 ? "opacity-100" : "opacity-0"}`}><JourneyEnergy value={100} label={copy.energyLabel} /></div>
            </div>
          </div>

          <div className={`relative mt-3 rounded-[24px] border border-white/75 bg-white/72 p-4 shadow-[0_24px_65px_rgba(43,29,52,0.11)] backdrop-blur-xl transition duration-500 sm:p-6 ${revealStep >= 3 ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#30223a] text-[#f2a143]"><ChartIcon /></span>
              <h2 className="text-xl font-black text-[#2d2036]">{copy.profileTitle}</h2>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {skillRows.map(([skill, evidence], index) => (
                <div key={skill} className="rounded-[18px] border border-white/80 bg-[#f3eff2] p-3.5 shadow-[0_10px_28px_rgba(44,29,53,0.065)] motion-safe:animate-[placementRevealUp_.38s_ease-out_both]" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center gap-3">
                    <AnimatedSkillIcon skill={skill} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-[#766979]">{skillNames[skill]}</p>
                      <p className="mt-0.5 truncate text-base font-black text-[#35243f]">{copy.qualitativeLabels[evidence.estimatedBand]}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#d9d1da]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#ec911f,#76508c)] transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${evidence.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
              <ResultFact icon={<StarIcon />} label={copy.strongest} value={skillNames[result.strongestSkill]} />
              <ResultFact icon={<TargetIcon />} label={copy.improve} value={skillNames[result.weakestSkill]} />
              <ResultFact icon={<ShieldIcon />} label={copy.confidence} value={copy.confidenceLabels[result.confidence]} />
            </div>
            <details className="mt-3 rounded-[18px] bg-[#eee9ed] p-3.5 text-start transition open:bg-white/80">
              <summary className="cursor-pointer font-black text-[#3e2a4a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">{copy.whyResult}</summary>
              <p className="mt-3 text-sm leading-7 text-[#6d606f]">{copy.whyBody}</p>
              <p className="mt-2 text-sm leading-7 text-[#6d606f]">{explanation}</p>
            </details>
          </div>

          <div className={`mt-3 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#fffaf2,#ede6ef)] p-4 shadow-[0_20px_55px_rgba(43,29,52,0.1)] transition duration-500 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-7 sm:p-6 ${revealStep >= 4 ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#c66e08]">{copy.courseHeading}</p>
              <h2 className="mt-2 text-2xl font-black text-[#30223a] sm:text-3xl">{courseLabel(locale, result.placement)}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#6d606f]">{salesBridge}</p>
            </div>
            <div className="mt-4 grid min-w-0 gap-2.5 sm:mt-0 sm:w-[250px]">
              <Link href={`/${locale}`} onClick={() => trackSalesCta("homepage")} className="group inline-flex min-h-13 w-full min-w-0 items-center justify-center gap-2.5 rounded-[16px] bg-[#30223a] px-4 text-sm font-black !text-white shadow-[0_14px_30px_rgba(45,31,55,0.2)] transition hover:-translate-y-0.5 hover:bg-[#3b2947] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ec911f] transition group-hover:rotate-6"><BoltIcon size={17} /></span><span className="min-w-0">{copy.homepageCta}</span><ArrowIcon /></Link>
              <a href={whatsAppHref} target="_blank" rel="noopener noreferrer" onClick={() => trackSalesCta("whatsapp")} className="inline-flex min-h-13 w-full min-w-0 items-center justify-center gap-2.5 rounded-[16px] border border-[#6f4b82]/25 bg-white/80 px-4 text-sm font-black text-[#30223a] shadow-sm transition hover:-translate-y-0.5 hover:border-[#6f4b82]/45 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6f4b82]/18"><WhatsAppIcon /><span className="min-w-0">{copy.whatsappCta}</span></a>
            </div>
          </div>
        </div>
      </section>
    </ExperienceBackdrop>
  );
}

function AssessmentWelcome({ locale, copy, busy, onStart }: { locale: PlacementLocale; copy: PlacementCopy; busy: boolean; onStart: () => void }) {
  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-4 px-4 py-6 sm:px-6 sm:py-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
        <div className="relative z-10 motion-safe:animate-[placementPageEnter_.5s_cubic-bezier(.22,.8,.22,1)_both]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#5e486a] shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#ec911f] shadow-[0_0_0_4px_rgba(236,145,31,0.12)]" />
            {copy.assessmentLabel}
          </div>
          <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2.25rem,7vw,4.5rem)] font-black leading-[1.05] tracking-[-0.02em] text-[#291e31]">{copy.welcomeTitle}</h1>
          <p className="mt-4 max-w-xl text-[15px] font-semibold leading-7 text-[#6f6473] sm:text-lg sm:leading-8">{copy.welcomeBody}</p>
          <div className="mt-6 max-w-xl"><AssessmentInfoCards locale={locale} /></div>
          <div className="mt-3 max-w-xl">
            <AssessmentJourney labels={copy.journey} activeStep={0} locale={locale} label={copy.progressLabel} />
          </div>
          <button type="button" disabled={busy} onClick={onStart} className="group mt-5 inline-flex min-h-14 w-full max-w-xl items-center justify-center gap-3 overflow-hidden rounded-[18px] bg-[#ec911f] px-6 text-base font-black text-white shadow-[0_16px_35px_rgba(236,145,31,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#d98213] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 transition group-hover:rotate-6"><BoltIcon size={18} /></span>
            {copy.startNow}
            <ArrowIcon />
          </button>
          <p className="mt-3 max-w-xl text-center text-[11px] font-bold leading-5 text-[#7e7281]">{copy.autoSaveNote}</p>
        </div>
        <div className="order-first mx-auto w-full max-w-[210px] sm:max-w-[240px] lg:order-none lg:max-w-none motion-safe:animate-[placementPageEnter_.55s_.08s_cubic-bezier(.22,.8,.22,1)_both]">
          <ChallengeVisual label={copy.assessmentLabel} />
        </div>
      </section>
    </ExperienceBackdrop>
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
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl items-center px-4 py-7 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-[30px] border border-white/75 bg-[#30223a] p-6 text-center text-white shadow-[0_30px_85px_rgba(40,27,49,0.25)] sm:p-10 motion-safe:animate-[placementPageEnter_.4s_ease-out]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(154,100,187,0.32),transparent_42%),radial-gradient(circle_at_85%_90%,rgba(236,145,31,0.2),transparent_30%)]" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-44 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-[#f2a143] shadow-inner">
              <AudioWaves playing={playing} count={12} />
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#30223a]"><HeadphonesIcon size={26} /></span>
              <AudioWaves playing={playing} count={12} />
            </div>
            <h1 className="mt-6 text-balance text-3xl font-black sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-white/68 sm:text-base sm:leading-8">{body}</p>
            <button type="button" onClick={playSample} disabled={playing} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-[17px] border border-white/15 bg-white/10 px-5 font-black text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30"><PlayIcon />{playing ? "…" : playLabel}</button>
            <button type="button" disabled={!played || busy} onClick={onContinue} className="mx-auto mt-3 inline-flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-[17px] bg-[#ec911f] px-6 font-black text-white shadow-[0_14px_30px_rgba(236,145,31,0.22)] transition hover:bg-[#d98213] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">{continueLabel}<ArrowIcon /></button>
          </div>
        </div>
      </section>
    </ExperienceBackdrop>
  );
}

function SectionMoment({ section, title, label, body, error, retryLabel, onRetry }: { section?: AssessmentSection; title: string; label: string; body: string; error: string | null; retryLabel: string; onRetry: () => void }) {
  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8 text-center">
        <div className="relative w-full max-w-lg motion-safe:animate-[placementSectionMoment_1.75s_cubic-bezier(.22,.8,.22,1)]">
          <div className="absolute inset-x-[20%] top-1/2 h-24 -translate-y-1/2 rounded-full bg-[#6d4388]/20 blur-3xl" aria-hidden="true" />
          <div className="relative">
            {section ? <SectionIcon section={section} /> : <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#30223a] text-[#f3a443] shadow-[0_18px_42px_rgba(45,31,55,0.24)]"><CheckIcon size={26} /></span>}
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#806f86]">{label}</p>
            <h1 className="mx-auto mt-2 text-balance text-3xl font-black leading-tight text-[#2a1e32] sm:text-5xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#716675] sm:text-base">{body}</p>
            <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-white/80 shadow-inner" aria-hidden="true"><span className="block h-full w-full origin-left bg-[linear-gradient(90deg,#ec911f,#785093)] motion-safe:animate-[placementTransitionBar_1.75s_linear_forwards]" /></div>
            {error ? <div className="mx-auto mt-5 max-w-sm"><InlineError error={error} retryLabel={retryLabel} onRetry={onRetry} /></div> : null}
          </div>
        </div>
      </section>
    </ExperienceBackdrop>
  );
}

function CenteredStage({ children }: { children: ReactNode }) {
  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="flex min-h-[calc(100dvh-4rem)] items-center px-4 py-7 sm:px-6">
        <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[30px] bg-[#30223a] p-7 text-center text-white shadow-[0_30px_85px_rgba(40,27,49,0.28)] motion-safe:animate-[placementQuestionIn_.32s_ease-out] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(148,94,179,0.32),transparent_46%),radial-gradient(circle_at_90%_90%,rgba(236,145,31,0.18),transparent_32%)]" aria-hidden="true" />
          <div className="relative">{children}</div>
        </div>
      </section>
    </ExperienceBackdrop>
  );
}

function PassageText({ text }: { text: string }) {
  return <div dir="ltr" className="mt-2 space-y-4 text-left text-[16px] leading-8 text-[#3f2b57]">{text.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
}

function ResultFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-h-16 items-center gap-2.5 rounded-[16px] bg-[#eee9ed] p-3 text-start shadow-inner"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#30223a] text-[#f2a143]">{icon}</span><div className="min-w-0"><p className="text-[10px] font-black text-[#837586]">{label}</p><p className="mt-0.5 truncate text-sm font-black text-[#35243f]">{value}</p></div></div>;
}

function buildPlacementWhatsAppMessage(
  locale: PlacementLocale,
  result: PlacementProfile,
  skillNames: Record<AssessmentSection, string>,
) {
  if (locale === "ar") {
    return `أهلاً فريق Success Academy 👋

أنا خلصت English Placement Test على الموقع.

🎯 المستوى المناسب لبدايتي: ${result.placement}
⭐ أقوى مهارة عندي: ${skillNames[result.strongestSkill]}
📚 أهم مهارة محتاجة تركيز: ${skillNames[result.weakestSkill]}

حابب أعرف تفاصيل المستوى المناسب ليا، المواعيد المتاحة، وطريقة الحجز.

ممكن تساعدوني أبدأ بالخطوة المناسبة؟ 😊`;
  }

  return `Hi Success Academy team 👋

I completed the English Placement Test on the website.

🎯 My recommended starting level: ${result.placement}
⭐ My strongest area: ${skillNames[result.strongestSkill]}
📚 My main area to improve: ${skillNames[result.weakestSkill]}

I would like to know more about the right level, available schedules, and how to book.

Could you help me take the right next step? 😊`;
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
    <div ref={overlay} role="dialog" aria-modal="true" aria-labelledby="placement-timeout-title" aria-describedby="placement-timeout-body" tabIndex={-1} className="fixed inset-0 z-50 grid place-items-center bg-[#211827]/58 p-4 backdrop-blur-md focus:outline-none">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/15 bg-[#30223a] p-7 text-center text-white shadow-[0_28px_80px_rgba(20,13,25,0.38)] motion-safe:animate-[placementOverlay_.24s_ease-out]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,145,31,0.2),transparent_42%)]" aria-hidden="true" />
        <div className="relative">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ec911f] text-white shadow-[0_0_0_8px_rgba(236,145,31,0.1)] motion-safe:animate-[placementEnergyPulse_1s_ease-out]"><ClockIcon size={26} /></span>
          <h2 id="placement-timeout-title" className="mt-4 text-2xl font-black">{copy.timeoutTitle}</h2>
          <p id="placement-timeout-body" className="mt-2 text-sm font-bold leading-7 text-white/65">{copy.timeoutBody}</p>
          <div className="mx-auto mt-5 h-1 w-24 overflow-hidden rounded-full bg-white/12" aria-hidden="true"><div className="h-full w-full origin-left bg-[#ec911f] motion-safe:animate-[placementTimeout_1.15s_linear_forwards]" /></div>
        </div>
      </div>
    </div>
  );
}

function MotivationBurst({ reward, locale }: { reward: RewardMoment; locale: PlacementLocale }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center p-4" role="status" aria-live="polite">
      <div className={`relative min-w-48 overflow-hidden rounded-[24px] px-7 py-5 text-center text-white shadow-[0_26px_65px_rgba(32,21,39,0.3)] motion-safe:animate-[placementRewardBurst_.62s_cubic-bezier(.2,.85,.2,1)_both] ${reward.bonus ? "bg-[linear-gradient(135deg,#7b4b92,#30223a)]" : "bg-[#30223a]"}`} style={{ animationDuration: `${placementMotionDurations[reward.duration]}ms` }}>
        {reward.bonus ? <CelebrationParticles /> : null}
        <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ec911f]/60 motion-safe:animate-[placementRewardRing_.55s_ease-out_both]" aria-hidden="true" />
        <div className="relative">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-[14px] bg-[#ec911f] text-white shadow-lg"><BoltIcon size={19} /></span>
          <p className="mt-2 text-xl font-black">{reward.message}</p>
          {reward.detail ? <p className="mt-1 text-xs font-black text-[#ffd59f]">{reward.detail}</p> : <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-white/50">{locale === "ar" ? "طاقة التقدم زادت" : "Journey energy gained"}</p>}
        </div>
      </div>
    </div>
  );
}

function Milestone({ value, locale }: { value: number; locale: PlacementLocale }) {
  const messages = locale === "ar"
    ? value === 20 ? ["بداية قوية 👏", "كمل بنفس الطاقة."] : value === 40 ? ["ممتاز، كمل بنفس التركيز ✨", "أنت ماشي بثبات."] : value === 50 ? ["عديت النص 🔥", "باقي أقل مما خلصت."] : value === 70 ? ["قربت جدًا 🚀", "آخر جزء والنتيجة قربت."] : ["فاضل كام خطوة بس ⚡", "ركز في آخر تحدي."]
    : value === 20 ? ["Strong Start 👏", "Keep the same energy."] : value === 40 ? ["Excellent Focus ✨", "You are moving steadily."] : value === 50 ? ["Halfway There 🔥", "Less remains than you completed."] : value === 70 ? ["Almost There 🚀", "One final part before your result."] : ["Only a Few Steps Left ⚡", "Stay focused for the final challenge."];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#211827]/52 p-4 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-white/15 bg-[#30223a] p-8 text-center text-white shadow-[0_30px_85px_rgba(20,13,25,0.4)] motion-safe:animate-[placementOverlay_.3s_ease-out]">
        <CelebrationParticles />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(148,94,179,0.35),transparent_48%)]" aria-hidden="true" />
        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#ec911f]/40 bg-white/8 text-2xl font-black text-[#ffc37d] shadow-[0_0_35px_rgba(236,145,31,0.18)]">{value}%</span>
          <p className="mt-5 text-2xl font-black">{messages[0]}</p>
          <p className="mt-2 font-bold text-white/62">{messages[1]}</p>
        </div>
      </div>
    </div>
  );
}

function SectionIcon({ section }: { section: AssessmentSection }) {
  return <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#30223a] text-[#f3a443] shadow-[0_18px_42px_rgba(45,31,55,0.24)]" aria-hidden="true">{section === "listening" ? <HeadphonesIcon /> : section === "reading" ? <BookIcon size={30} /> : <BoltIcon size={28} />}</span>;
}

function Spinner() {
  return <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-[#e2d6ef] border-t-[#ec911f] motion-reduce:animate-none" aria-hidden="true" />;
}

function AudioWaves({ playing, count = 4 }: { playing: boolean; count?: number }) {
  return (
    <span className="flex h-6 shrink-0 items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: count }, (_, bar) => <span key={bar} className={`w-0.5 rounded-full bg-[#ec911f] ${playing ? "motion-safe:animate-[placementWave_.72s_ease-in-out_infinite]" : "h-1.5"}`} style={{ height: playing ? `${7 + ((bar * 7) % 15)}px` : undefined, animationDelay: `${bar * 65}ms` }} />)}
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

function WhatsAppIcon() {
  return <svg viewBox="0 0 32 32" width="21" height="21" fill="currentColor" className="shrink-0 text-[#3f7550]" aria-hidden="true"><path d="M16.04 3A12.8 12.8 0 0 0 5.1 22.47L3 29l6.75-2.04A12.84 12.84 0 1 0 16.04 3Zm0 23.37c-2.1 0-4.15-.62-5.9-1.78l-.42-.27-4 1.2 1.24-3.88-.28-.44a10.55 10.55 0 1 1 9.36 5.17Zm5.79-7.9c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.58a9.53 9.53 0 0 1-1.77-2.2c-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.25-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.31-1.11 1.08-1.11 2.64s1.14 3.07 1.29 3.28c.16.21 2.24 3.42 5.42 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.14-.29-.22-.61-.38Z"/></svg>;
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

function BoltIcon({ size = 30 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7z"/></svg>;
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

function ExitIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10"/><path d="M14.5 8.5 18 12l-3.5 3.5M18 12H9"/></svg>;
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
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
