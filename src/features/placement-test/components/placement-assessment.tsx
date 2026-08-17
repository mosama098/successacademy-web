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
  AssessmentSection,
  PlacementAttemptAction,
  PlacementLocale,
  PublicAttemptState,
} from "../types";

type PlacementAssessmentProps = {
  locale: PlacementLocale;
  initialState: PublicAttemptState;
};

type ApiError = Error & { status?: number; code?: string };

export function PlacementAssessment({ locale, initialState }: PlacementAssessmentProps) {
  const copy = placementCopy[locale];
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [questionStartFailed, setQuestionStartFailed] = useState(false);
  const previousPhase = useRef(state.phase);
  const autoStartKey = useRef<string | null>(null);
  const expiredDeadline = useRef<string | null>(null);
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
        window.setTimeout(() => setToast(null), 1_200);
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
          window.setTimeout(() => setMilestone(null), 1_600);
        }
      }
      return next;
    } catch (caught) {
      const apiError = caught as ApiError;
      if (apiError.status === 409 && apiError.code === "question_expired") {
        setToast(copy.timeout);
        await refreshState();
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

  function startAnalysis(finalState: PublicAttemptState) {
    analysisTimers.current.forEach(window.clearTimeout);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowAnalysis(true);
    setAnalysisStep(0);
    const stepDuration = reducedMotion ? 80 : 520;
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

  useEffect(() => () => analysisTimers.current.forEach(window.clearTimeout), []);

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

    function updateCountdown() {
      const remaining = Math.max(0, Math.ceil((Date.parse(deadline!) - Date.now()) / 1_000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && expiredDeadline.current !== deadline) {
        expiredDeadline.current = deadline;
        if (state.questionDeadlineAt) setToast(copy.timeout);
        void refreshState();
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
    return <CenteredCard><Spinner /><p className="mt-6 text-xl font-black">{copy.analysis[analysisStep]}</p></CenteredCard>;
  }

  if (state.phase === "welcome") {
    return (
      <CenteredCard>
        <Eyebrow>English Placement Assessment</Eyebrow>
        <h1 className="mt-5 text-balance text-3xl font-black leading-tight sm:text-5xl">{copy.welcomeTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{copy.welcomeBody}</p>
        <PrimaryButton disabled={busy} onClick={() => {
          trackPlacementTestEvent("placement_test_start", { locale });
          void sendAction({ action: "start" });
        }}>{copy.startNow}</PrimaryButton>
      </CenteredCard>
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
      <CenteredCard>
        <SectionIcon section={state.section} />
        <Eyebrow>{copy.sections[state.section]}</Eyebrow>
        <h1 className="mt-4 text-3xl font-black sm:text-5xl">{copy.sections[state.section]}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{copy.sectionIntros[state.section]}</p>
        <PrimaryButton disabled={busy} onClick={() => void sendAction({ action: "section_continue", section: state.section! })}>{copy.beginSection}</PrimaryButton>
      </CenteredCard>
    );
  }

  if (state.phase === "confirmation_intro") {
    return (
      <CenteredCard>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f1e8fb] text-3xl" aria-hidden="true">✓</span>
        <h1 className="mt-5 text-3xl font-black sm:text-5xl">{copy.confirmationTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{copy.confirmationBody}</p>
        <PrimaryButton disabled={busy} onClick={() => void sendAction({ action: "confirmation_continue" })}>{copy.beginSection}</PrimaryButton>
      </CenteredCard>
    );
  }

  if (state.phase === "reading_period" && state.question) {
    return (
      <AssessmentLayout state={state} copy={copy} remainingSeconds={remainingSeconds}>
        <div className="rounded-3xl border border-[#ded1ed] bg-white p-5 shadow-[0_18px_55px_rgba(57,27,104,0.08)] sm:p-8">
          <Eyebrow>{copy.readingTime}</Eyebrow>
          <PassageText text={state.question.passage?.text ?? ""} />
          {!state.readingReadyAt ? (
            <PrimaryButton disabled={busy} onClick={() => void sendAction({ action: "begin_reading", questionId: state.question!.id })}>{copy.readingTime}</PrimaryButton>
          ) : (
            <p className="mt-6 text-center text-sm font-bold text-[#6d5889]">{copy.startQuestions} · {remainingSeconds ?? 0}s</p>
          )}
        </div>
      </AssessmentLayout>
    );
  }

  if (state.phase === "audio" && state.question) {
    return (
      <AssessmentLayout state={state} copy={copy} remainingSeconds={remainingSeconds}>
        <AudioQuestion
          state={state}
          copy={copy}
          busy={busy}
          error={error}
          sendAction={sendAction}
        />
      </AssessmentLayout>
    );
  }

  if (state.phase === "question" && state.question) {
    return (
      <AssessmentLayout state={state} copy={copy} remainingSeconds={remainingSeconds}>
        <QuestionCard
          state={state}
          selected={selected}
          setSelected={setSelected}
          busy={busy}
          error={error}
          saveLabel={copy.saveAnswer}
          savingLabel={copy.saving}
          showPassageLabel={copy.showPassage}
          closePassageLabel={copy.closePassage}
          retryLabel={copy.retry}
          retryQuestionStart={questionStartFailed ? () => {
            setError(null);
            setQuestionStartFailed(false);
          } : undefined}
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && state.question) void sendAction({ action: "answer", questionId: state.question.id, optionId: selected });
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

  function AssessmentLayout({
    state: current,
    copy: currentCopy,
    remainingSeconds: remaining,
    children,
  }: {
    state: PublicAttemptState;
    copy: typeof copy;
    remainingSeconds: number | null;
    children: ReactNode;
  }) {
    const warning = remaining !== null && remaining <= 10;
    const urgent = remaining !== null && remaining <= 5;
    return (
      <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-30 border-b border-[#e4d9f0] bg-[#fbf9ff]/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-4 text-xs font-black text-[#6d5889] sm:text-sm">
              <span>{current.section ? currentCopy.sections[current.section] : "Assessment"} · {current.sectionQuestion} / {current.sectionTotal}</span>
              {remaining !== null ? <span className={`rounded-full px-3 py-1 ${urgent ? "bg-red-100 text-red-700" : warning ? "bg-orange-100 text-orange-700" : "bg-[#efe7f8] text-[#391b68]"}`}>{remaining}s</span> : null}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e0f3]" role="progressbar" aria-label="Assessment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={current.progressPercent}>
              <div className="h-full rounded-full bg-[#ec911f] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${current.progressPercent}%` }} />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
        {toast ? <div role="status" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#391b68] px-5 py-3 text-sm font-black text-white shadow-xl">{toast}</div> : null}
        {milestone ? <Milestone value={milestone} locale={locale} /> : null}
      </div>
    );
  }
}

function QuestionCard({ state, selected, setSelected, busy, error, saveLabel, savingLabel, showPassageLabel, closePassageLabel, retryLabel, retryQuestionStart, onSubmit }: {
  state: PublicAttemptState;
  selected: "A" | "B" | "C" | "D" | null;
  setSelected: (value: "A" | "B" | "C" | "D") => void;
  busy: boolean;
  error: string | null;
  saveLabel: string;
  savingLabel: string;
  showPassageLabel: string;
  closePassageLabel: string;
  retryLabel: string;
  retryQuestionStart?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const question = state.question!;
  const dialog = useRef<HTMLDialogElement>(null);
  const hasPassage = Boolean(question.passage);
  return (
    <form onSubmit={onSubmit} className={hasPassage ? "grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" : "mx-auto max-w-3xl"}>
      {hasPassage ? (
        <div className="hidden rounded-3xl border border-[#ded1ed] bg-white p-7 shadow-[0_18px_55px_rgba(57,27,104,0.07)] lg:block">
          <PassageText text={question.passage?.text ?? ""} />
        </div>
      ) : null}
      <div className="rounded-3xl border border-[#ded1ed] bg-white p-5 shadow-[0_18px_55px_rgba(57,27,104,0.08)] sm:p-7">
        {question.situation ? <p className="mb-4 rounded-2xl bg-[#f6f1fb] px-4 py-3 text-sm leading-6 text-[#6d5889]">{question.situation}</p> : null}
        {hasPassage ? <button type="button" onClick={() => dialog.current?.showModal()} className="mb-4 inline-flex min-h-11 items-center rounded-xl border border-[#d8c8eb] px-4 text-sm font-black lg:hidden">{showPassageLabel}</button> : null}
        <h1 dir="ltr" className="whitespace-pre-line text-left text-xl font-black leading-8 text-[#281343] sm:text-2xl">{question.prompt}</h1>
        <fieldset className="mt-6 grid gap-3" dir="ltr">
          <legend className="sr-only">Choose one answer</legend>
          {question.options.map((option) => (
            <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] font-bold leading-6 transition focus-within:ring-4 focus-within:ring-[#391b68]/15 ${selected === option.id ? "border-[#391b68] bg-[#f1e8fb] text-[#281343] shadow-[inset_0_0_0_1px_#391b68]" : "border-[#ded1ed] bg-white text-[#513477] hover:border-[#9e82be]"}`}>
              <input type="radio" name="answer" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} className="sr-only" />
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${selected === option.id ? "bg-[#391b68] text-white" : "bg-[#f4eef9] text-[#391b68]"}`}>{selected === option.id ? "✓" : option.id}</span>
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
        {error ? (
          <div role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <p>{error}</p>
            {retryQuestionStart ? (
              <button type="button" onClick={retryQuestionStart} className="mt-3 min-h-11 rounded-xl border border-red-300 bg-white px-4 text-red-800 focus-visible:outline-none">
                {retryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
        <button type="submit" disabled={!selected || busy} className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#ec911f] px-5 text-base font-black text-white transition hover:bg-[#d97f11] disabled:cursor-not-allowed disabled:opacity-45">{busy ? savingLabel : saveLabel}</button>
      </div>
      {hasPassage ? (
        <dialog ref={dialog} className="m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-[#ded1ed] bg-white p-0 text-[#391b68] backdrop:bg-[#281343]/55">
          <div className="max-h-[88dvh] overflow-y-auto p-5 sm:p-7">
            <button type="button" onClick={() => dialog.current?.close()} className="sticky top-0 float-end rounded-xl bg-[#391b68] px-4 py-2 text-sm font-black text-white">{closePassageLabel}</button>
            <PassageText text={question.passage?.text ?? ""} />
          </div>
        </dialog>
      ) : null}
    </form>
  );
}

function AudioQuestion({ state, copy, busy, error, sendAction }: {
  state: PublicAttemptState;
  copy: (typeof placementCopy)[PlacementLocale];
  busy: boolean;
  error: string | null;
  sendAction: (action: PlacementAttemptAction, quiet?: boolean) => Promise<PublicAttemptState | null>;
}) {
  const audio = state.audio;
  const question = state.question!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSynced = useRef(audio?.progressSeconds ?? 0);
  const completing = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playable = Boolean(audio && audio.startSeconds !== null && audio.endSeconds !== null && audio.expectedDurationSeconds !== null);

  async function startPlayback() {
    if (!audio || !playable) return;
    const next = await sendAction({ action: "audio_start", questionId: question.id });
    if (!next || !audioRef.current) return;
    const element = audioRef.current;
    element.currentTime = audio.startSeconds! + audio.progressSeconds;
    try {
      await element.play();
    } catch {
      setIsPlaying(false);
      await sendAction({ action: "audio_failed", questionId: question.id }, true);
    }
  }

  async function syncAndComplete(progress: number) {
    if (completing.current || !audio) return;
    completing.current = true;
    await sendAction({ action: "audio_progress", questionId: question.id, progressSeconds: progress }, true);
    await sendAction({ action: "audio_complete", questionId: question.id });
  }

  function onTimeUpdate() {
    if (!audio || !audioRef.current || audio.startSeconds === null || audio.endSeconds === null) return;
    const element = audioRef.current;
    const progress = Math.max(0, element.currentTime - audio.startSeconds);
    if (progress - lastSynced.current >= 5) {
      lastSynced.current = progress;
      void sendAction({ action: "audio_progress", questionId: question.id, progressSeconds: progress }, true);
    }
    if (element.currentTime >= audio.endSeconds - 0.15) {
      element.pause();
      void syncAndComplete(audio.endSeconds - audio.startSeconds);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-[#ded1ed] bg-white p-6 text-center shadow-[0_18px_55px_rgba(57,27,104,0.08)] sm:p-9">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f1e8fb] text-[#391b68]"><HeadphonesIcon /></span>
      <p dir="ltr" className="mt-5 text-left text-sm leading-6 text-[#6d5889]">{question.situation}</p>
      {playable && audio ? (
        <>
          <audio
            ref={audioRef}
            src={audio.source}
            preload="metadata"
            onLoadedMetadata={() => {
              if (audioRef.current && audio.startSeconds !== null) audioRef.current.currentTime = audio.startSeconds + audio.progressSeconds;
            }}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              void syncAndComplete(audio.expectedDurationSeconds ?? 0);
            }}
            onError={() => void sendAction({ action: "audio_failed", questionId: question.id }, true)}
          />
          <button type="button" disabled={busy || audio.status === "completed"} onClick={() => void startPlayback()} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#391b68] px-5 text-base font-black text-white transition hover:bg-[#281343] disabled:opacity-55">
            <PlayIcon />{busy ? copy.audioLoading : isPlaying ? copy.audioPlaying : copy.playAudio}
          </button>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e0f3]">
            <div className="h-full bg-[#ec911f] transition-[width]" style={{ width: `${Math.min(100, (audio.progressSeconds / (audio.expectedDurationSeconds ?? 1)) * 100)}%` }} />
          </div>
        </>
      ) : (
        <p role="alert" className="mt-6 rounded-2xl bg-orange-50 px-4 py-4 text-sm font-bold leading-6 text-orange-800">{copy.audioUnavailable}</p>
      )}
      {error ? <p role="alert" className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
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
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-[30px] border border-[#ded1ed] bg-white p-6 text-center shadow-[0_24px_75px_rgba(57,27,104,0.1)] sm:p-10">
        <p className="text-sm font-black text-[#6d5889]">{copy.resultHeading}</p>
        <div className="mx-auto mt-5 grid h-32 w-32 place-items-center rounded-full border-8 border-[#f1e8fb] bg-[#391b68] text-5xl font-black text-white shadow-[0_18px_40px_rgba(57,27,104,0.22)] motion-safe:animate-[placementReveal_.5s_ease-out]">{result.placement}</div>
        <h1 className="mt-5 text-3xl font-black sm:text-4xl">{courseLabel(locale, result.placement)}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-8 text-[#6d5889]">{explanation}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {skillRows.map(([skill, evidence]) => (
            <div key={skill} className="rounded-2xl border border-[#e1d6ee] bg-[#fcfaff] p-5 text-start">
              <p className="text-sm font-black text-[#6d5889]">{skillNames[skill]}</p>
              <p className="mt-2 text-2xl font-black text-[#391b68]">{evidence.percent}%</p>
              <p className="mt-1 text-xs font-bold text-[#806b99]">{locale === "ar" ? "تقدير داخلي" : "Internal estimate"}: {evidence.estimatedBand}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 text-start sm:grid-cols-3">
          <ResultFact label={copy.strongest} value={skillNames[result.strongestSkill]} />
          <ResultFact label={copy.improve} value={skillNames[result.weakestSkill]} />
          <ResultFact label={copy.confidence} value={copy.confidenceLabels[result.confidence]} />
        </div>

        <details className="mt-6 rounded-2xl border border-[#e1d6ee] bg-white p-5 text-start">
          <summary className="cursor-pointer font-black">{copy.whyResult}</summary>
          <p className="mt-3 text-sm leading-7 text-[#6d5889]">{copy.whyBody}</p>
        </details>
      </div>

      <div className="mt-6 rounded-[28px] bg-[#391b68] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
        <div>
          <p className="text-sm font-black text-[#f3c98e]">{copy.courseHeading}</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">{courseLabel(locale, result.placement)}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/75">{copy.courseBody}</p>
        </div>
        <Link href={`/${locale}#lead-form`} onClick={() => trackPlacementTestEvent("placement_test_sales_cta_click", { placementLevel: result.placement, confidence: result.confidence })} className="mt-6 inline-flex min-h-14 w-full shrink-0 items-center justify-center rounded-2xl bg-[#ec911f] px-6 text-base font-black text-white transition hover:bg-[#d97f11] sm:mt-0 sm:w-auto">{copy.salesCta}</Link>
      </div>
    </section>
  );
}

function AudioCheck({ title, body, playLabel, continueLabel, busy, onContinue }: { title: string; body: string; playLabel: string; continueLabel: string; busy: boolean; onContinue: () => void }) {
  const [played, setPlayed] = useState(false);
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
    oscillator.addEventListener("ended", () => void context.close());
    setPlayed(true);
  }
  return (
    <CenteredCard>
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f1e8fb] text-[#391b68]"><HeadphonesIcon /></span>
      <h1 className="mt-5 text-3xl font-black sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-[#6d5889] sm:text-lg">{body}</p>
      <button type="button" onClick={playSample} className="mt-7 inline-flex min-h-13 w-full max-w-md items-center justify-center gap-3 rounded-2xl border border-[#9e82be] bg-white px-5 font-black text-[#391b68] transition hover:bg-[#f7f2fb]"><PlayIcon />{playLabel}</button>
      <PrimaryButton disabled={!played || busy} onClick={onContinue}>{continueLabel}</PrimaryButton>
    </CenteredCard>
  );
}

function CenteredCard({ children }: { children: ReactNode }) {
  return <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6"><div className="w-full rounded-[30px] border border-[#ded1ed] bg-white p-6 text-center shadow-[0_22px_70px_rgba(57,27,104,0.1)] sm:p-12">{children}</div></section>;
}

function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center rounded-2xl bg-[#ec911f] px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(236,145,31,0.22)] transition hover:bg-[#d97f11] disabled:cursor-not-allowed disabled:opacity-45">{children}</button>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#f1e8fb] px-4 py-2 text-sm font-black text-[#391b68]">{children}</span>;
}

function PassageText({ text }: { text: string }) {
  return <div dir="ltr" className="mt-5 space-y-4 text-left text-[16px] leading-8 text-[#3f2b57]">{text.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
}

function ResultFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f2eafb] p-4"><p className="text-xs font-black text-[#806b99]">{label}</p><p className="mt-1 font-black text-[#391b68]">{value}</p></div>;
}

function FatalState({ locale, message }: { locale: PlacementLocale; message: string }) {
  const copy = placementCopy[locale];
  return <CenteredCard><h1 className="text-3xl font-black">{message}</h1><Link href={`/${locale}/placement-test`} className="mx-auto mt-7 inline-flex min-h-14 w-full max-w-md items-center justify-center rounded-2xl bg-[#391b68] px-6 font-black text-white">{copy.backToRegister}</Link></CenteredCard>;
}

function Milestone({ value, locale }: { value: number; locale: PlacementLocale }) {
  const messages = locale === "ar"
    ? value === 25 ? ["بداية ممتازة 👏", "كمل بنفس التركيز."] : value === 50 ? ["عديت النص 🔥", "باقي أقل مما خلصت."] : ["قربت تخلص 🚀", "آخر جزء والنتيجة قربت."]
    : value === 25 ? ["Great Start 👏", "Keep the same focus."] : value === 50 ? ["Halfway There 🔥", "Less remains than you completed."] : ["Almost There 🚀", "One final part before your result."];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#281343]/45 p-4 backdrop-blur-sm"><div className="rounded-3xl bg-white p-8 text-center shadow-2xl"><p className="text-2xl font-black text-[#391b68]">{messages[0]}</p><p className="mt-2 text-[#6d5889]">{messages[1]}</p></div></div>;
}

function SectionIcon({ section }: { section: AssessmentSection }) {
  return <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#391b68] text-3xl text-white" aria-hidden="true">{section === "listening" ? "♫" : section === "reading" ? "Aa" : "✓"}</span>;
}

function Spinner() {
  return <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-[#e2d6ef] border-t-[#ec911f] motion-reduce:animate-none" aria-hidden="true" />;
}

function HeadphonesIcon() {
  return <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M6 13H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2zM18 13h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2z"/></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.4v13.2a1 1 0 0 0 1.53.85l10.28-6.6a1 1 0 0 0 0-1.7L9.53 4.55A1 1 0 0 0 8 5.4Z"/></svg>;
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
