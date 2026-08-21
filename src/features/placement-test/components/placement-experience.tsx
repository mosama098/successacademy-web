import type { CSSProperties, ReactNode } from "react";
import type { PlacementLocale } from "../types";

export type PlacementMotionCategory = "short" | "normal" | "bonus" | "milestone" | "section";

export const placementMotionDurations: Record<PlacementMotionCategory, number> = {
  short: 720,
  normal: 950,
  bonus: 1_220,
  milestone: 1_450,
  section: 1_750,
};

type JourneyLabels = {
  languageUse: string;
  reading: string;
  listening: string;
  result: string;
};

export function AssessmentInfoCards({ locale }: { locale: PlacementLocale }) {
  const facts = locale === "ar"
    ? [
        { value: "36", label: "سؤال", kind: "questions" as const },
        { value: "3", label: "مهارات", kind: "skills" as const },
        { value: "24–27", label: "دقيقة", kind: "duration" as const },
      ]
    : [
        { value: "36", label: "Questions", kind: "questions" as const },
        { value: "3", label: "Skills", kind: "skills" as const },
        { value: "24–27", label: "Minutes", kind: "duration" as const },
      ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3" data-placement-info-cards>
      {facts.map((fact) => (
        <div key={fact.kind} className="group relative min-w-0 overflow-hidden rounded-[18px] border border-white/85 bg-white/68 px-2 py-3 text-center shadow-[0_12px_30px_rgba(49,34,59,0.075)] backdrop-blur sm:px-3 sm:py-3.5">
          <span className="mx-auto mb-1.5 grid h-8 w-10 place-items-center text-[#654479]" aria-hidden="true">
            {fact.kind === "questions" ? <QuestionCardsIcon /> : fact.kind === "skills" ? <SkillsIcon /> : <StopwatchIcon />}
          </span>
          <strong className="block truncate text-lg font-black leading-none text-[#2f2237] sm:text-2xl">{fact.value}</strong>
          <span className="mt-1 block truncate text-[10px] font-black text-[#817684] sm:text-xs">{fact.label}</span>
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,transparent,#ec911f,transparent)] opacity-70" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export function AssessmentJourney({
  labels,
  activeStep,
  locale,
  label,
}: {
  labels: JourneyLabels;
  activeStep: number;
  locale: PlacementLocale;
  label: string;
}) {
  const steps = [
    { id: "languageUse", label: labels.languageUse, icon: <LanguageIcon /> },
    { id: "reading", label: labels.reading, icon: <ReadingIcon /> },
    { id: "listening", label: labels.listening, icon: <ListeningIcon /> },
    { id: "result", label: labels.result, icon: <TrophyIcon /> },
  ] as const;
  const safeStep = Math.max(0, Math.min(3, activeStep));

  return (
    <nav className="relative rounded-[18px] border border-white/80 bg-white/58 px-2.5 py-2.5 shadow-[0_10px_28px_rgba(48,32,58,0.06)] backdrop-blur" aria-label={label} dir={locale === "ar" ? "rtl" : "ltr"} data-assessment-journey>
      <span className="absolute inset-x-[10%] top-[22px] h-0.5 rounded-full bg-[#d8d0da]" aria-hidden="true" />
      <span className="absolute top-[22px] h-0.5 rounded-full bg-[linear-gradient(90deg,#ec911f,#6e438a)] transition-[width] duration-700 motion-reduce:transition-none" aria-hidden="true" style={{ insetInlineStart: "10%", width: `${(safeStep / 3) * 80}%` }} />
      <ol className="relative grid grid-cols-4 gap-1">
        {steps.map((step, index) => {
          const complete = index < safeStep;
          const current = index === safeStep;
          return (
            <li key={step.id} className="flex min-w-0 flex-col items-center text-center" aria-current={current ? "step" : undefined}>
              <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-[10px] border transition-all duration-300 ${current ? "border-[#ec911f] bg-[#30223a] text-white shadow-[0_0_0_4px_rgba(236,145,31,0.12)]" : complete ? "border-[#69467d] bg-[#69467d] text-white" : "border-[#d3cad5] bg-[#f6f3f1] text-[#a397a6]"}`} aria-hidden="true">
                {complete ? <JourneyCheckIcon /> : step.icon}
              </span>
              <span className={`mt-1.5 w-full truncate text-[8px] font-black leading-tight sm:text-[10px] ${current ? "text-[#30223a]" : complete ? "text-[#66566c]" : "text-[#968b99]"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type JourneyEnergyProps = {
  value: number;
  label: string;
  compact?: boolean;
};

export function JourneyEnergy({ value, label, compact = false }: JourneyEnergyProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={`group flex items-center gap-2.5 ${compact ? "min-w-0" : "rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-[0_10px_28px_rgba(38,25,49,0.07)] backdrop-blur-xl"}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#2d2038] text-[#f3a443] shadow-[0_7px_18px_rgba(45,32,56,0.18)]" aria-hidden="true">
        <EnergyIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#756a79]">
          <span className="truncate">{label}</span>
          <strong className="shrink-0 text-xs text-[#32233e]">{safeValue}%</strong>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#ded8df]" aria-hidden="true">
          <span
            className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,#ec911f,#9c5a8d,#391b68)] shadow-[0_0_12px_rgba(236,145,31,0.3)] transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${safeValue}%` }}
          />
        </span>
      </span>
    </div>
  );
}

export function ExperienceBackdrop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden bg-[#f2efeb] ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_12%,rgba(104,66,133,0.16),transparent_32%),radial-gradient(circle_at_88%_78%,rgba(236,145,31,0.13),transparent_28%),linear-gradient(145deg,#f9f7f3_0%,#eee9ef_52%,#f6f0e8_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(rgba(57,27,104,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(57,27,104,0.035)_1px,transparent_1px)] [background-size:38px_38px]" aria-hidden="true" />
      {children}
    </div>
  );
}

export function CelebrationParticles({ dense = false }: { dense?: boolean }) {
  const particles = dense ? 18 : 10;
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: particles }, (_, index) => (
        <span
          key={index}
          className="absolute h-2 w-2 rounded-[3px] bg-[var(--particle-color)] motion-safe:animate-[placementParticle_1s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{
            "--particle-color": index % 3 === 0 ? "#ec911f" : index % 3 === 1 ? "#8f63aa" : "#fff4dc",
            insetInlineStart: `${8 + ((index * 37) % 84)}%`,
            top: `${52 + ((index * 17) % 34)}%`,
            animationDelay: `${(index % 5) * 45}ms`,
            transform: `rotate(${index * 29}deg)`,
          } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function ChallengeVisual({ label }: { label: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]" aria-label={label} role="img">
      <div className="absolute inset-[10%] rounded-full border border-white/70 bg-white/45 shadow-[0_30px_80px_rgba(43,28,55,0.12)] backdrop-blur-xl motion-safe:animate-[placementFloat_4.5s_ease-in-out_infinite]" />
      <div className="absolute inset-[20%] grid place-items-center rounded-full bg-[linear-gradient(145deg,#34233f,#5b3673)] text-white shadow-[0_24px_55px_rgba(44,29,57,0.3)]">
        <span className="absolute inset-3 rounded-full border border-white/15" />
        <span className="text-center">
          <span className="block text-4xl font-black text-[#f3a443]">36</span>
          <span className="mt-1 block text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Challenge</span>
        </span>
      </div>
      <OrbitToken className="left-[2%] top-[20%]" delay="0ms">A</OrbitToken>
      <OrbitToken className="right-[3%] top-[12%]" delay="180ms">?</OrbitToken>
      <OrbitToken className="bottom-[10%] left-[12%]" delay="340ms">Aa</OrbitToken>
      <div className="absolute bottom-[4%] right-[5%] flex h-12 items-end gap-1 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-lg backdrop-blur">
        {[7, 14, 22, 12, 26, 18, 9].map((height, index) => (
          <span key={index} className="w-1 rounded-full bg-[#ec911f] motion-safe:animate-[placementWave_.8s_ease-in-out_infinite]" style={{ height, animationDelay: `${index * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

function OrbitToken({ children, className, delay }: { children: ReactNode; className: string; delay: string }) {
  return (
    <span className={`absolute grid h-12 w-12 place-items-center rounded-2xl border border-white/80 bg-white/80 text-sm font-black text-[#4c335d] shadow-[0_14px_35px_rgba(48,31,59,0.12)] backdrop-blur motion-safe:animate-[placementFloat_3.6s_ease-in-out_infinite] ${className}`} style={{ animationDelay: delay }}>
      {children}
    </span>
  );
}

function EnergyIcon() {
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M13.3 2.4 5.5 13h5.6l-.7 8.6L18.5 10h-5.8z" /></svg>;
}

function QuestionCardsIcon() {
  return <svg viewBox="0 0 40 32" width="40" height="32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="motion-safe:animate-[placementCardShuffle_1.4s_ease-out_1]" aria-hidden="true"><rect x="6" y="7" width="22" height="18" rx="5" opacity=".42"/><rect x="12" y="4" width="22" height="20" rx="5" fill="#f8f4f2"/><path d="M20.5 11.2a3.4 3.4 0 0 1 6.5 1.4c0 2.6-3.3 2.7-3.3 4.8M23.7 20.2h.01" stroke="#ec911f" strokeWidth="2"/></svg>;
}

function SkillsIcon() {
  return <span className="flex items-center justify-center gap-0.5" aria-hidden="true"><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#efe8f1] text-[9px] font-black motion-safe:animate-[placementSkillPop_.55s_ease-out_both]">Aa</span><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#efe8f1] motion-safe:animate-[placementSkillPop_.55s_.12s_ease-out_both]"><ReadingIcon /></span><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#efe8f1] motion-safe:animate-[placementSkillPop_.55s_.24s_ease-out_both]"><ListeningIcon /></span></span>;
}

function StopwatchIcon() {
  return <svg viewBox="0 0 32 32" width="31" height="31" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3h8M16 3v4M24.5 8.5l2-2"/><circle cx="16" cy="18" r="10" fill="#f8f4f2"/><path d="M16 18V11" className="origin-[16px_18px] motion-safe:animate-[placementClockSweep_1.25s_ease-out_1]" stroke="#ec911f" strokeWidth="2.2"/><path d="M16 18l4 2"/></svg>;
}

function LanguageIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m4 19 5-14 5 14M6 14h6M15 10h5M17.5 7.5v5"/></svg>;
}

function ReadingIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z"/></svg>;
}

function ListeningIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M6 13H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2zM18 13h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2z"/></svg>;
}

function TrophyIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/></svg>;
}

function JourneyCheckIcon() {
  return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}
