import type { CSSProperties, ReactNode } from "react";
import type { AssessmentSection, PlacementLocale } from "../types";

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
      {facts.map((fact, index) => (
        <div
          key={fact.kind}
          className="group relative min-w-0 overflow-hidden rounded-[20px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(244,239,244,0.78))] px-2.5 py-3 text-center shadow-[0_14px_35px_rgba(48,32,58,0.085),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#cdbdd4] hover:shadow-[0_18px_42px_rgba(48,32,58,0.12)] motion-safe:animate-[placementRevealUp_.42s_ease-out_both] motion-reduce:transition-none sm:px-3 sm:py-4"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-[14px] border border-white/70 bg-[#30223a] text-[#f4aa50] shadow-[0_9px_22px_rgba(45,32,56,0.2)] transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none" aria-hidden="true">
            <AssessmentFactIcon kind={fact.kind} />
          </span>
          <strong className="block truncate text-xl font-black leading-none tracking-[-0.02em] text-[#2f2237] sm:text-[27px]">{fact.value}</strong>
          <span className="mt-1.5 block truncate text-[10px] font-black text-[#786b7c] sm:text-xs">{fact.label}</span>
          <span className="absolute inset-x-[22%] bottom-0 h-0.5 rounded-full bg-[#ec911f] opacity-80" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export function AnimatedSkillIcon({ skill }: { skill: AssessmentSection }) {
  if (skill === "listening") {
    return (
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#30223a] text-[#f4aa50] shadow-[0_10px_24px_rgba(45,32,56,0.18)]" aria-hidden="true">
        <SkillGlyph skill="listening" size={25} />
        <span className="absolute -bottom-1 flex h-3 items-center gap-0.5 rounded-full border border-white/80 bg-white px-1.5 shadow-sm">
          {[5, 9, 6].map((height, index) => <span key={index} className="w-0.5 origin-center rounded-full bg-[#ec911f] motion-safe:animate-[placementWave_.75s_ease-in-out_infinite]" style={{ height, animationDelay: `${index * 90}ms` }} />)}
        </span>
      </span>
    );
  }

  if (skill === "reading") {
    return (
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-white/70 bg-[#f0e8f3] text-[#59366d] shadow-inner" aria-hidden="true">
        <SkillGlyph skill="reading" size={26} />
        <span className="absolute end-[9px] top-[13px] h-3 w-2 origin-left rounded-sm border-e border-[#ec911f] motion-safe:animate-[placementBookPage_1.8s_ease-in-out_infinite]" />
      </span>
    );
  }

  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-white/70 bg-[#fff4e5] text-[#4f315f] shadow-inner" aria-hidden="true">
      <SkillGlyph skill="languageUse" size={25} />
      <span className="absolute end-2.5 top-2.5 h-3.5 w-0.5 rounded-full bg-[#ec911f] motion-safe:animate-[placementTypingCursor_.9s_steps(2,end)_infinite]" />
    </span>
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
      <span className="absolute top-[22px] h-0.5 rounded-full bg-[linear-gradient(90deg,#ec911f,#6e438a)] transition-[width] duration-700 ease-out motion-reduce:transition-none" aria-hidden="true" style={{ insetInlineStart: "10%", width: `${(safeStep / 3) * 80}%` }} />
      <ol className="relative grid grid-cols-4 gap-1">
        {steps.map((step, index) => {
          const complete = index < safeStep;
          const current = index === safeStep;
          return (
            <li key={step.id} className="flex min-w-0 flex-col items-center text-center" aria-current={current ? "step" : undefined} data-state={current ? "active" : complete ? "complete" : "upcoming"}>
              <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-[10px] border transition-all duration-300 motion-reduce:transition-none ${current ? "border-[#ec911f] bg-[#30223a] text-white shadow-[0_0_0_4px_rgba(236,145,31,0.12)] motion-safe:animate-[placementJourneyPulse_1.8s_ease-in-out_infinite]" : complete ? "border-[#69467d] bg-[#69467d] text-white motion-safe:animate-[placementStageComplete_.32s_ease-out_both]" : "border-[#d3cad5] bg-[#f6f3f1] text-[#a397a6]"}`} aria-hidden="true">
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
      <OrbitToken className="left-[2%] top-[20%]" delay="0ms" skill="languageUse" />
      <OrbitToken className="right-[3%] top-[12%]" delay="180ms" skill="reading" />
      <OrbitToken className="bottom-[10%] left-[12%]" delay="340ms" skill="listening" />
      <div className="absolute bottom-[4%] right-[5%] flex h-12 items-end gap-1 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-lg backdrop-blur">
        {[7, 14, 22, 12, 26, 18, 9].map((height, index) => (
          <span key={index} className="w-1 rounded-full bg-[#ec911f] motion-safe:animate-[placementWave_.8s_ease-in-out_infinite]" style={{ height, animationDelay: `${index * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

function OrbitToken({ skill, className, delay }: { skill: AssessmentSection; className: string; delay: string }) {
  return (
    <span className={`absolute grid h-12 w-12 place-items-center rounded-2xl border border-white/85 bg-white/82 text-[#4c335d] shadow-[0_14px_35px_rgba(48,31,59,0.12)] backdrop-blur motion-safe:animate-[placementFloat_3.6s_ease-in-out_infinite] ${className}`} style={{ animationDelay: delay }}>
      <SkillGlyph skill={skill} size={23} />
    </span>
  );
}

function EnergyIcon() {
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M13.3 2.4 5.5 13h5.6l-.7 8.6L18.5 10h-5.8z" /></svg>;
}

function AssessmentFactIcon({ kind }: { kind: "questions" | "skills" | "duration" }) {
  if (kind === "questions") return <AssessmentChecklistIcon />;
  if (kind === "skills") return <SkillSpectrumIcon />;
  return <StopwatchIcon />;
}

function AssessmentChecklistIcon() {
  return <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="motion-safe:animate-[placementCardShuffle_1.4s_ease-out_1]" aria-hidden="true"><rect x="6" y="4" width="20" height="24" rx="5"/><path d="M11 10.5h10M11 16h10M11 21.5h7" opacity=".72"/><path d="m8.8 15.8 1.5 1.5 2.8-3" stroke="#ec911f" strokeWidth="2.2"/><path d="M12 4.5V3h8v1.5"/></svg>;
}

function SkillSpectrumIcon() {
  return <svg viewBox="0 0 32 32" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 8.5v15M8.5 13l7.5-4.5 7.5 4.5M8.5 13v8.5M23.5 13v8.5" opacity=".78"/><circle cx="16" cy="7" r="3.2" fill="#ec911f" stroke="none" className="motion-safe:animate-[placementSkillPop_.55s_ease-out_both]"/><circle cx="8.5" cy="23.5" r="3.2"/><circle cx="23.5" cy="23.5" r="3.2"/><path d="m7.1 23.4 1 1 1.8-2M21.8 24h3.4" stroke="#ec911f" strokeWidth="1.8"/></svg>;
}

function StopwatchIcon() {
  return <svg viewBox="0 0 32 32" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5h8M16 3.5v4M24.2 8.8l2-2"/><circle cx="16" cy="18" r="10"/><path d="M16 18V11" className="origin-[16px_18px] motion-safe:animate-[placementClockSweep_1.25s_ease-out_1]" stroke="#ec911f" strokeWidth="2.2"/><path d="M16 18l4 2"/><circle cx="16" cy="18" r="1.5" fill="#ec911f" stroke="none"/></svg>;
}

function SkillGlyph({ skill, size }: { skill: AssessmentSection; size: number }) {
  return skill === "listening"
    ? <ListeningIcon size={size} />
    : skill === "reading"
      ? <ReadingIcon size={size} />
      : <LanguageIcon size={size} />;
}

function LanguageIcon({ size = 15 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m4 19 5-14 5 14M6 14h6M15 10h5M17.5 7.5v5"/></svg>;
}

function ReadingIcon({ size = 15 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z"/></svg>;
}

function ListeningIcon({ size = 15 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M6 13H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2zM18 13h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2z"/></svg>;
}

function TrophyIcon() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/></svg>;
}

function JourneyCheckIcon() {
  return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}
