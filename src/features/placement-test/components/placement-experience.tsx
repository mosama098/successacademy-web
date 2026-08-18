import type { CSSProperties, ReactNode } from "react";

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
