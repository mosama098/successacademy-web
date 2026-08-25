"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import {
  getAvailableTargets,
  getPlanRecommendation,
  learningLevels,
  learningPackages,
  type LearningLevel,
} from "../config";
import { plansCopy } from "../copy";

type RecommendedPlanPageProps = {
  locale: Locale;
  initialCurrentLevel: LearningLevel | null;
  fromAssessment: boolean;
};

export function RecommendedPlanPage({
  locale,
  initialCurrentLevel,
  fromAssessment,
}: RecommendedPlanPageProps) {
  const copy = plansCopy[locale];
  const isArabic = locale === "ar";
  const [currentLevel, setCurrentLevel] = useState<LearningLevel | null>(initialCurrentLevel);
  const [targetLevel, setTargetLevel] = useState<LearningLevel | null>(null);
  const availableTargets = getAvailableTargets(currentLevel);
  const recommendation = getPlanRecommendation(currentLevel, targetLevel);
  const priceFormatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG");

  function chooseCurrentLevel(level: LearningLevel) {
    setCurrentLevel(level);
    setTargetLevel(null);
  }

  const checkoutHref = recommendation
    ? `/${locale}/plans/checkout?current=${recommendation.currentLevel}&target=${recommendation.targetLevel}&package=${recommendation.package.id}`
    : null;

  return (
    <div className="relative overflow-hidden bg-[#f8f6f4]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_15%_10%,rgba(236,145,31,0.13),transparent_31%),radial-gradient(circle_at_85%_14%,rgba(57,27,104,0.14),transparent_34%)]" aria-hidden="true" />

      <section className="relative px-5 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#391b68]/12 bg-white/75 px-3 py-1.5 text-xs font-black text-[#604778] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#ec911f]" aria-hidden="true" />
              {fromAssessment ? copy.assessedBadge : copy.badge}
            </div>
            <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2.15rem,5vw,4.2rem)] font-black leading-[1.08] text-[#2f1f3d]">
              {fromAssessment ? copy.heroTitle : copy.directHeroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-[#6d6370] sm:text-lg sm:leading-8">
              {copy.heroDescription}
            </p>
          </div>

          <div className="relative rounded-[26px] border border-white/80 bg-white/72 p-5 shadow-[0_28px_70px_rgba(52,35,63,0.12)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#a56318]">{copy.currentLevel}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#756a78]">{copy.currentHelp}</p>
              </div>
              {currentLevel ? (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-[#391b68] text-2xl font-black text-white shadow-[0_13px_28px_rgba(57,27,104,0.24)]">
                  {currentLevel}
                </span>
              ) : null}
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">{copy.chooseCurrent}</legend>
              <div className="grid grid-cols-4 gap-2" dir="ltr">
                {learningLevels.map((level) => {
                  const selected = currentLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => chooseCurrentLevel(level)}
                      className={`min-h-12 rounded-[14px] border text-sm font-black transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25 ${
                        selected
                          ? "border-[#391b68] bg-[#391b68] text-white shadow-[0_9px_22px_rgba(57,27,104,0.18)]"
                          : "border-[#391b68]/12 bg-[#f4f0f6] text-[#493458] hover:-translate-y-0.5 hover:border-[#391b68]/30 hover:bg-white"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading title={copy.journeyTitle} description={copy.journeyDescription} />
          <LearningJourney currentLevel={currentLevel} targetLevel={targetLevel} locale={locale} />
        </div>
      </section>

      <section className="relative px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-8">
          <div className="rounded-[26px] border border-[#391b68]/10 bg-white p-5 shadow-[0_18px_50px_rgba(52,35,63,0.08)] sm:p-7">
            <SectionHeading title={copy.goalTitle} description={copy.goalDescription} align="start" />

            {!currentLevel ? (
              <div className="mt-6 rounded-[18px] bg-[#f4eff6] px-4 py-5 text-sm font-bold leading-7 text-[#6b5875]">
                {copy.chooseCurrent}
              </div>
            ) : availableTargets.length ? (
              <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">{copy.targetLabel}</legend>
                {availableTargets.map((level) => {
                  const selected = targetLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTargetLevel(level)}
                      className={`group flex min-h-[76px] items-center justify-between gap-4 rounded-[18px] border px-4 text-start transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25 ${
                        selected
                          ? "border-[#ec911f] bg-[#fff5e7] shadow-[0_12px_28px_rgba(236,145,31,0.13)]"
                          : "border-[#391b68]/12 bg-[#faf8fb] hover:-translate-y-0.5 hover:border-[#391b68]/28 hover:bg-white"
                      }`}
                    >
                      <span>
                        <span className="block text-[11px] font-black uppercase tracking-[0.08em] text-[#8a748f]">{copy.targetLabel}</span>
                        <span className="mt-1 block text-xl font-black text-[#352442]">{level}</span>
                      </span>
                      <span className={`grid h-9 w-9 place-items-center rounded-full transition ${selected ? "bg-[#ec911f] text-white" : "bg-[#ece6ef] text-[#5a4068] group-hover:bg-[#391b68] group-hover:text-white"}`}>
                        {selected ? <CheckIcon /> : <ArrowIcon rtl={isArabic} />}
                      </span>
                    </button>
                  );
                })}
              </fieldset>
            ) : (
              <div className="mt-6 rounded-[20px] border border-[#ec911f]/20 bg-[#fff7ed] p-5">
                <p className="font-black text-[#4a304d]">{copy.noHigherTarget}</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-[#786879]">{copy.noHigherTargetBody}</p>
              </div>
            )}
          </div>

          <div aria-live="polite">
            {recommendation ? (
              <article className="relative overflow-hidden rounded-[28px] bg-[#30213a] p-5 text-white shadow-[0_28px_75px_rgba(48,33,58,0.24)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(236,145,31,0.27),transparent_36%),radial-gradient(circle_at_10%_100%,rgba(135,90,159,0.38),transparent_36%)]" aria-hidden="true" />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f2aa4c]">{copy.planEyebrow}</p>
                      <h2 className="mt-2 text-2xl font-black sm:text-3xl">{copy.planTitle}</h2>
                    </div>
                    <div className="rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-center backdrop-blur">
                      <span className="block text-[11px] font-bold text-white/60">{copy.pathLabel}</span>
                      <span className="mt-1 block text-lg font-black" dir="ltr">{recommendation.currentLevel} → {recommendation.targetLevel}</span>
                    </div>
                  </div>

                  <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PlanMetric label={copy.targetLevel} value={recommendation.targetLevel} icon={<TargetIcon />} />
                    <PlanMetric label={copy.requiredHours} value={`${recommendation.package.hours} ${copy.hoursSuffix}`} icon={<ClockIcon />} />
                    <PlanMetric label={copy.sessions} value={`${recommendation.package.sessions} ${copy.sessionsSuffix}`} icon={<SessionsIcon />} />
                    <PlanMetric label={copy.price} value={`${priceFormatter.format(recommendation.package.priceEgp)} ${copy.currency}`} icon={<PriceIcon />} />
                  </dl>

                  <div className="mt-6 flex flex-col gap-4 border-t border-white/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-white/55">{copy.packageName}</p>
                      <p className="mt-1 text-lg font-black">{recommendation.package.hours} {copy.packageSuffix}</p>
                    </div>
                    <Link
                      href={checkoutHref!}
                      className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-[17px] bg-[#ec911f] px-6 font-black !text-white shadow-[0_14px_30px_rgba(236,145,31,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d98213] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f6bd73]/35"
                    >
                      {copy.primaryCta}
                      <ArrowIcon rtl={isArabic} />
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="grid min-h-[330px] place-items-center rounded-[28px] border border-dashed border-[#391b68]/18 bg-white/55 p-6 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#eee8f1] text-[#604272]"><CompassIcon /></span>
                  <h2 className="mt-4 text-xl font-black text-[#3c2948]">{copy.planTitle}</h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#756979]">{copy.planPlaceholder}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading title={copy.comparisonTitle} description={copy.comparisonDescription} />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {learningPackages.map((item) => {
              const recommended = recommendation?.package.id === item.id;
              return (
                <article key={item.id} className={`relative rounded-[22px] border p-5 transition ${recommended ? "border-[#ec911f] bg-[#fff8ed] shadow-[0_18px_44px_rgba(236,145,31,0.13)]" : "border-[#391b68]/10 bg-white shadow-[0_12px_32px_rgba(52,35,63,0.055)]"}`}>
                  {recommended ? <span className="absolute -top-3 start-4 rounded-full bg-[#ec911f] px-3 py-1 text-[11px] font-black text-white">{copy.recommended}</span> : null}
                  <p className="text-2xl font-black text-[#382746]">{item.hours} <span className="text-sm text-[#756779]">{copy.packageSuffix}</span></p>
                  <p className="mt-2 text-sm font-bold text-[#7a6e7d]">{item.sessions} {copy.sessionsSuffix}</p>
                  <div className="mt-5 border-t border-[#391b68]/9 pt-4">
                    <span className="text-xl font-black text-[#391b68]">{priceFormatter.format(item.priceEgp)}</span>
                    <span className="ms-1 text-xs font-black text-[#7a6e7d]">{copy.currency}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ title, description, align = "center" }: { title: string; description: string; align?: "center" | "start" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "text-start"}>
      <h2 className="text-2xl font-black text-[#352442] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-7 text-[#766a79] sm:text-[15px]">{description}</p>
    </div>
  );
}

function LearningJourney({ currentLevel, targetLevel, locale }: { currentLevel: LearningLevel | null; targetLevel: LearningLevel | null; locale: Locale }) {
  const currentIndex = currentLevel ? learningLevels.indexOf(currentLevel) : -1;
  const targetIndex = targetLevel ? learningLevels.indexOf(targetLevel) : currentIndex;
  const activeEnd = Math.max(currentIndex, targetIndex);

  return (
    <ol className="relative mt-7 grid grid-cols-4 gap-2 rounded-[24px] border border-white/80 bg-white/65 px-3 py-5 shadow-[0_18px_45px_rgba(52,35,63,0.07)] backdrop-blur sm:px-7 sm:py-7" dir={locale === "ar" ? "rtl" : "ltr"} aria-label="Learning levels">
      <span className="absolute inset-x-[12.5%] top-[41px] h-1 rounded-full bg-[#e5dfe8] sm:top-[49px]" aria-hidden="true" />
      {learningLevels.map((level, index) => {
        const completed = currentIndex >= 0 && index >= currentIndex && index <= activeEnd;
        const isCurrent = currentLevel === level;
        const isTarget = targetLevel === level;
        return (
          <li key={level} className="relative z-10 text-center">
            <span className={`mx-auto grid h-10 w-10 place-items-center rounded-full border-4 text-xs font-black transition duration-300 sm:h-12 sm:w-12 sm:text-sm ${isTarget ? "border-[#fff1dd] bg-[#ec911f] text-white shadow-[0_0_0_5px_rgba(236,145,31,0.12)]" : isCurrent ? "border-[#e8e0ee] bg-[#391b68] text-white shadow-[0_0_0_5px_rgba(57,27,104,0.09)]" : completed ? "border-[#eee8f1] bg-[#735184] text-white" : "border-[#f4f1f5] bg-[#e5dfe8] text-[#766779]"}`}>
              {level}
            </span>
            <span className={`mt-2 block text-[10px] font-black sm:text-xs ${isCurrent || isTarget ? "text-[#422e50]" : "text-[#8a7e8d]"}`}>
              {isCurrent ? (locale === "ar" ? "الحالي" : "Current") : isTarget ? (locale === "ar" ? "الهدف" : "Target") : "\u00a0"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function PlanMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[17px] border border-white/10 bg-white/8 p-3.5 backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/10 text-[#f1a64a]">{icon}</span>
      <dt className="mt-3 text-[11px] font-bold text-white/55">{label}</dt>
      <dd className="mt-1 text-sm font-black text-white">{value}</dd>
    </div>
  );
}

function ArrowIcon({ rtl = false }: { rtl?: boolean }) {
  return <svg className={`h-4 w-4 ${rtl ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CompassIcon() {
  return <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" strokeLinejoin="round" /></svg>;
}

function TargetIcon() {
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 5-5M16 4h4v4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ClockIcon() {
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SessionsIcon() {
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h16M7 3.5v4M17 3.5v4M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M8 12h3v3H8z" /></svg>;
}

function PriceIcon() {
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h16v10H4z" strokeLinejoin="round" /><path d="M8 7.5V5h8v2.5M8 12.5h.01M16 12.5h.01" strokeLinecap="round" /></svg>;
}

