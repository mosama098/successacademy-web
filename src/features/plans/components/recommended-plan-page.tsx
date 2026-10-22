"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import type { Locale } from "@/lib/i18n";
import {
  getAvailableTargets,
  getLearningPackages,
  getPlanRecommendation,
  getTargetForPackage,
  learningLevels,
  plannedPaymentMethods,
  type LearningLevel,
  type LearningPackage,
  type LearningPackageId,
  type PaymentMethodId,
  type PlanRecommendation,
  type ProgramType,
} from "../config";
import { plansCopy, type PlansCopy } from "../copy";

type RecommendedPlanPageProps = {
  locale: Locale;
  initialStartLevel: LearningLevel | null;
  initialTargetLevel: LearningLevel | null;
  initialProgramType: ProgramType;
  fromAssessment: boolean;
};

export function RecommendedPlanPage({
  locale,
  initialStartLevel,
  initialTargetLevel,
  initialProgramType,
  fromAssessment,
}: RecommendedPlanPageProps) {
  const copy = plansCopy[locale];
  const isArabic = locale === "ar";
  const startSectionRef = useRef<HTMLDivElement>(null);
  const stickyBoundaryRef = useRef<HTMLDivElement>(null);
  const [programType, setProgramType] = useState<ProgramType>(initialProgramType);
  const [startLevel, setStartLevel] = useState<LearningLevel | null>(initialStartLevel);
  const [targetLevel, setTargetLevel] = useState<LearningLevel | null>(() => {
    if (!initialStartLevel || !initialTargetLevel) return null;
    return getPlanRecommendation(initialProgramType, initialStartLevel, initialTargetLevel) ? initialTargetLevel : null;
  });
  const [showMobileAction, setShowMobileAction] = useState(true);
  const availableTargets = getAvailableTargets(startLevel);
  const recommendation = getPlanRecommendation(programType, startLevel, targetLevel);
  const packages = getLearningPackages(programType);
  const mobilePackages = recommendation
    ? [
        ...packages.filter((item) => item.id === recommendation.package.id),
        ...packages.filter((item) => item.id !== recommendation.package.id),
      ]
    : packages;
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG"),
    [locale],
  );

  useEffect(() => {
    const boundary = stickyBoundaryRef.current;
    if (!boundary || !recommendation || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileAction(!entry.isIntersecting),
      { rootMargin: "0px 0px 104px" },
    );
    observer.observe(boundary);
    return () => observer.disconnect();
  }, [recommendation]);

  function chooseStartLevel(level: LearningLevel) {
    if (fromAssessment) return;
    setStartLevel(level);
    setTargetLevel(null);
  }

  function chooseProgramType(value: ProgramType) {
    setProgramType(value);
    const url = new URL(window.location.href);
    url.searchParams.set("program", value);
    window.history.replaceState(window.history.state, "", url);
  }

  function focusStartSelection() {
    startSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    startSectionRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }

  const checkoutHref = recommendation ? getCheckoutHref(locale, recommendation) : null;

  return (
    <div className="relative overflow-hidden bg-[#f7f3ed] pb-28 text-[#34253e] lg:pb-0">
      <section className="px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4 lg:px-8">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[26px] border border-white/10 bg-[#321d43] text-white shadow-[0_22px_58px_rgba(50,29,67,0.2)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(236,145,31,0.14),transparent_25%),linear-gradient(120deg,rgba(255,255,255,0.05),transparent_44%)]" aria-hidden="true" />
          <div className="relative grid gap-3 px-5 py-4 sm:px-8 sm:py-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-8 lg:px-11 lg:py-7">
            <div>
              <Eyebrow tone="dark">{fromAssessment ? copy.hero.placementEyebrow : copy.hero.directEyebrow}</Eyebrow>
              <h1 className="mt-2.5 max-w-[700px] text-balance text-[27px] font-black leading-[1.15] text-white sm:text-[39px] lg:text-[45px]">
                {fromAssessment ? copy.hero.placementTitle : copy.hero.directTitle}
              </h1>
              <p className="mt-2 max-w-[650px] text-[13px] font-semibold leading-5 text-white/74 sm:text-base sm:leading-7">
                {fromAssessment && startLevel ? copy.hero.placementDescription(startLevel) : copy.hero.directDescription}
              </p>
            </div>

            <div className="space-y-3">
              <ProgramSelector copy={copy} value={programType} onChange={chooseProgramType} />
              <StartPointModule
                sectionRef={startSectionRef}
                locale={locale}
                copy={copy}
                startLevel={startLevel}
                fromAssessment={fromAssessment}
                onChoose={chooseStartLevel}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1120px]">
          <SectionHeading title={copy.goal.title} description={copy.goal.description} />
          {startLevel ? (
            <TargetSelector copy={copy} levels={availableTargets} selectedLevel={targetLevel} onSelect={setTargetLevel} />
          ) : (
            <button
              type="button"
              onClick={focusStartSelection}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-[18px] border border-dashed border-[#321d43]/25 bg-white/80 px-5 text-start text-sm font-black text-[#50325f] transition hover:border-[#321d43]/45 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20 sm:w-auto"
            >
              {copy.hero.chooseStart}
              <ArrowIcon rtl={isArabic} />
            </button>
          )}
        </div>
      </section>

      {recommendation ? (
        <section className="px-4 pb-7 sm:px-6 sm:pb-8 lg:px-8 lg:pb-9" aria-live="polite">
          <div className="mx-auto max-w-[1120px]">
            <PlanReveal
              locale={locale}
              copy={copy}
              recommendation={recommendation}
              checkoutHref={checkoutHref!}
              priceFormatter={priceFormatter}
            />
          </div>
        </section>
      ) : null}

      <section className="border-y border-[#321d43]/7 bg-[#fffdf9] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-[1120px]">
          <SectionHeading title={copy.benefits.title} description={copy.benefits.description} />
          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#321d43]/10 bg-[#f7f3ed] shadow-[0_16px_38px_rgba(50,29,67,0.07)]">
            <div className="grid md:grid-cols-2">
              {copy.benefits.groups.map((group, index) => (
                <article key={group.id} className={`flex items-start gap-3.5 p-4 sm:p-5 ${index > 0 ? "border-t border-[#321d43]/8" : ""} ${index % 2 === 1 ? "md:border-s" : ""} ${index === 1 ? "md:border-t-0" : ""}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#e9e0eb] text-[#563a64]"><BenefitIcon id={group.id} /></span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-black leading-5 text-[#34253e] sm:text-base">{group.title}</h3>
                    <ul className="mt-1.5 space-y-1 text-[12px] font-semibold leading-5 text-[#716675] sm:text-sm">
                      {group.details.map((detail) => <li key={detail} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#ec911f]" />{detail}</li>)}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-[1120px]">
          <SectionHeading title={copy.comparison.title} description={copy.comparison.description} />
          <p className="mt-4 flex items-center gap-2 text-xs font-black text-[#735c7b] md:hidden"><SwipeIcon />{copy.comparison.swipeHint}</p>
          <div dir="ltr" role="region" aria-label={copy.comparison.title} tabIndex={0} className="-mx-4 mt-3 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
            {mobilePackages.map((learningPackage) => (
              <PackageCard
                key={learningPackage.id}
                locale={locale}
                copy={copy}
                learningPackage={learningPackage}
                startLevel={startLevel}
                recommended={recommendation?.package.id === learningPackage.id}
                priceFormatter={priceFormatter}
                onChooseStart={focusStartSelection}
              />
            ))}
          </div>
          <div className="mt-5 hidden grid-cols-2 items-stretch gap-4 md:grid xl:grid-cols-4">
            {packages.map((learningPackage) => (
              <PackageCard
                key={learningPackage.id}
                locale={locale}
                copy={copy}
                learningPackage={learningPackage}
                startLevel={startLevel}
                recommended={recommendation?.package.id === learningPackage.id}
                priceFormatter={priceFormatter}
                onChooseStart={focusStartSelection}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-7 sm:px-6 sm:pb-8 lg:px-8 lg:pb-9">
        <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[24px] border border-[#321d43]/10 bg-[#ece5ee] p-4 shadow-[0_14px_34px_rgba(50,29,67,0.07)] sm:p-5 lg:grid lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-6">
          <div>
            <h2 className="text-[25px] font-black leading-tight text-[#34253e] sm:text-3xl">{copy.payment.title}</h2>
            <p className="mt-1.5 max-w-lg text-[13px] font-semibold leading-6 text-[#6d6271] sm:text-sm">{copy.payment.description}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-0 lg:grid-cols-5">
            {plannedPaymentMethods.map((method) => (
              <div key={method.id} className={`flex min-h-[64px] items-center gap-2.5 rounded-[17px] border border-white/90 bg-white/82 px-3 py-2 text-start shadow-[0_7px_18px_rgba(50,29,67,0.04)] lg:flex-col lg:justify-center lg:text-center ${method.id === "branch" ? "col-span-2 sm:col-span-1" : ""}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#321d43] text-[#f2ad57]"><PaymentIcon id={method.id} /></span>
                <p className="text-[12px] font-black leading-4 text-[#3d2a47]">{copy.paymentMethods[method.id].title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div ref={stickyBoundaryRef} className="h-px" aria-hidden="true" />

      <section className="border-t border-[#321d43]/7 bg-[#fffdf9] px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-[1120px]">
          <SectionHeading title={copy.faq.title} />
          <div className="mt-4 grid items-start gap-2 lg:grid-cols-2 lg:gap-3">
            {copy.faq.items.map((item) => (
              <details key={item.question} className="group self-start rounded-[18px] border border-[#321d43]/9 bg-[#f7f3ed] px-4 transition open:border-[#321d43]/22 open:bg-white open:shadow-[0_10px_24px_rgba(50,29,67,0.06)] sm:px-5">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-start text-[14px] font-black text-[#34253e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20 sm:min-h-[64px] sm:text-[15px] [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9dfec] text-[#593969] transition group-open:rotate-45 group-open:bg-[#321d43] group-open:text-white motion-reduce:transition-none"><PlusIcon /></span>
                </summary>
                <p className="max-w-3xl pb-4 pe-8 text-sm font-semibold leading-6 text-[#756b78]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {recommendation && showMobileAction ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#321d43]/10 bg-[#fffdf9]/96 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_34px_rgba(44,28,54,0.12)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-[#5d4a66]">{recommendation.package.name[locale]}</p>
              <p className="mt-0.5 text-lg font-black text-[#321d43]">{priceFormatter.format(recommendation.package.priceEgp)} <span className="text-[11px]">{copy.common.currency}</span></p>
            </div>
            <Link href={checkoutHref!} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#ec911f] px-4 text-sm font-black !text-white shadow-[0_10px_24px_rgba(236,145,31,0.22)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25">
              {copy.plan.primaryCta}<ArrowIcon rtl={isArabic} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StartPointModule({ sectionRef, locale, copy, startLevel, fromAssessment, onChoose }: {
  sectionRef: Ref<HTMLDivElement>;
  locale: Locale;
  copy: PlansCopy;
  startLevel: LearningLevel | null;
  fromAssessment: boolean;
  onChoose: (level: LearningLevel) => void;
}) {
  return (
    <div ref={sectionRef} className="rounded-[21px] border border-white/14 bg-white/[0.075] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm sm:p-4">
      {fromAssessment && startLevel ? (
        <div className="flex items-center gap-4 sm:gap-5">
          <LevelSeal level={startLevel} locked />
          <div className="min-w-0">
            <p className="text-base font-black text-white">{copy.hero.startLabel}</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold leading-5 text-white/64"><LockIcon />{copy.hero.lockedLabel}</p>
          </div>
        </div>
      ) : (
        <fieldset>
          <div className="flex items-center justify-between gap-3">
            <div>
              <legend className="text-base font-black text-white">{copy.hero.chooseStart}</legend>
              <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-white/60">{copy.hero.chooseStartHelp}</p>
            </div>
            {startLevel ? <LevelSeal level={startLevel} locked={false} compact /> : <StartCompass />}
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-2" dir="ltr">
            {learningLevels.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={startLevel === level}
                onClick={() => onChoose(level)}
                className={`min-h-12 rounded-[15px] border text-sm font-black transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30 motion-reduce:transform-none ${startLevel === level ? "scale-[1.03] border-[#f2a74c] bg-[#ec911f] text-white shadow-[0_8px_20px_rgba(236,145,31,0.22)]" : "border-white/15 bg-white/[0.075] text-white hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.13]"}`}
              >{level}</button>
            ))}
          </div>
          <Link href={`/${locale}/placement-test`} className="mt-2 inline-flex items-center gap-2 text-xs font-black !text-[#f7c889] underline decoration-white/28 underline-offset-4 transition hover:!text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">
            {copy.hero.assessmentCta}<ArrowIcon rtl={locale === "ar"} />
          </Link>
        </fieldset>
      )}
    </div>
  );
}

function ProgramSelector({ copy, value, onChange }: { copy: PlansCopy; value: ProgramType; onChange: (value: ProgramType) => void }) {
  return (
    <fieldset className="rounded-[21px] border border-white/14 bg-white/[0.075] p-3 backdrop-blur-sm sm:p-4">
      <legend className="px-1 text-sm font-black text-white">{copy.program.selectorLabel}</legend>
      <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup">
        {(["group", "private"] as const).map((option) => {
          const selected = value === option;
          return (
            <button key={option} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option)} className={`min-h-11 rounded-[14px] border px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30 ${selected ? "border-[#f2a74c] bg-[#ec911f] text-white" : "border-white/15 bg-white/[0.075] text-white hover:border-white/35 hover:bg-white/[0.13]"}`}>
              {copy.program.options[option]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function TargetSelector({ copy, levels, selectedLevel, onSelect }: { copy: PlansCopy; levels: LearningLevel[]; selectedLevel: LearningLevel | null; onSelect: (level: LearningLevel) => void }) {
  return (
    <fieldset className="mt-4">
      <legend className="sr-only">{copy.goal.title}</legend>
      <div className={`grid grid-cols-2 gap-2.5 lg:gap-3 ${levels.length === 1 ? "max-w-sm grid-cols-1" : "lg:grid-cols-4"}`}>
        {levels.map((level, index) => {
          const selected = selectedLevel === level;
          return (
            <button key={level} type="button" aria-pressed={selected} onClick={() => onSelect(level)} className={`group relative flex min-h-[74px] items-center gap-2.5 overflow-hidden rounded-[19px] border px-3 py-2.5 text-start transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/22 motion-reduce:transform-none sm:min-h-[80px] sm:gap-3 sm:px-4 ${selected ? "-translate-y-0.5 border-[#321d43] bg-[#321d43] text-white shadow-[0_16px_34px_rgba(50,29,67,0.17)]" : "border-[#321d43]/10 bg-white text-[#34253e] shadow-[0_8px_22px_rgba(50,29,67,0.05)] hover:-translate-y-0.5 hover:border-[#321d43]/26"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border sm:h-8 sm:w-8 ${selected ? "border-[#f3ad55] bg-[#ec911f] text-white" : "border-[#321d43]/10 bg-[#eee7f0] text-[#5b3b68]"}`}>{selected ? <CheckIcon /> : <span className="text-[10px] font-black sm:text-[11px]">{index + 1}</span>}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={`text-[22px] font-black leading-none sm:text-[26px] ${selected ? "text-white" : "text-[#321d43]"}`} dir="ltr">{level}</span>
                  <span className={`text-[10px] font-black sm:text-xs ${selected ? "text-white/72" : "text-[#67556e]"}`}>{copy.goal.finishLevel(level)}</span>
                </span>
                <span className={`mt-1 block text-[11px] font-semibold leading-4 sm:text-xs sm:leading-5 ${selected ? "text-white/62" : "text-[#756b78]"}`}>{copy.goal.outcomes[level]}</span>
              </span>
              <span className={`absolute inset-x-0 bottom-0 h-1 origin-start bg-[#ec911f] transition-transform duration-300 ${selected ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function PlanReveal({ locale, copy, recommendation, checkoutHref, priceFormatter }: { locale: Locale; copy: PlansCopy; recommendation: PlanRecommendation; checkoutHref: string; priceFormatter: Intl.NumberFormat }) {
  const isArabic = locale === "ar";
  const routeCopy = recommendation.requiredLevels === 1 ? copy.plan.singleLevelRoute(recommendation.startLevel) : copy.plan.route(recommendation.startLevel, recommendation.targetLevel);
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-[#563a64] bg-[#321d43] text-white shadow-[0_26px_68px_rgba(50,29,67,0.21)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(236,145,31,0.2),transparent_29%),linear-gradient(125deg,rgba(255,255,255,0.04),transparent_48%)]" aria-hidden="true" />
      <div className="relative grid gap-2 p-2.5 sm:gap-5 sm:p-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-7 lg:p-7">
        <div>
          <Eyebrow tone="dark">{copy.plan.eyebrow}</Eyebrow>
          <h2 className="mt-1.5 text-[26px] font-black leading-tight sm:text-3xl">{copy.plan.title}</h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-base font-black leading-6 text-white/94 sm:text-lg">{routeCopy}</p>
            <span className="text-xs font-black text-[#f3bd77]">{recommendation.package.name[locale]}</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-black text-white/75">{copy.program.options[recommendation.programType]}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" dir="ltr">
            {recommendation.levelsToStudy.map((level, index) => <span key={level} className="contents"><span className="grid h-7 min-w-7 place-items-center rounded-full border border-white/15 bg-white/[0.08] px-2 text-[10px] font-black">{level}</span>{index < recommendation.levelsToStudy.length - 1 ? <span className="text-xs text-[#f4ac52]">→</span> : null}</span>)}
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-y border-white/10 py-1.5 sm:grid-cols-4 sm:py-2">
            <PlanMetric label={copy.plan.hoursLabel} value={`${recommendation.requiredHours} ${copy.common.hours}`} />
            <PlanMetric label={copy.plan.sessionsLabel} value={`${recommendation.package.sessions} ${copy.common.sessions}`} />
            <PlanMetric label={copy.plan.durationLabel} value={copy.plan.estimatedDuration(recommendation.package.estimatedWeeks)} />
            <PlanMetric label={copy.program.sessionDurationLabel} value={copy.program.sessionDuration(recommendation.package.sessionDurationHours)} />
          </dl>
          <p className="mt-2 border-s-2 border-[#ec911f] ps-3 text-[12px] font-semibold leading-5 text-white/68 sm:text-[13px]">{copy.plan.reason(recommendation.package.name[locale], recommendation.startLevel, recommendation.targetLevel, recommendation.requiredLevels)}</p>
          {recommendation.targetLevel === "B2" ? <p className="mt-1.5 hidden text-[11px] font-bold text-[#f2c17f]/76 sm:block">{copy.plan.b2NextStep}</p> : null}
        </div>
        <div className="border-t border-white/10 pt-2 lg:border-s lg:border-t-0 lg:ps-7 lg:pt-0">
          <p className="text-xs font-bold text-white/52">{copy.plan.priceLabel}</p>
          <p className="mt-1 text-[34px] font-black leading-none text-white sm:text-[42px]">{priceFormatter.format(recommendation.package.priceEgp)} <span className="text-sm text-white/62">{copy.common.currency}</span></p>
          <Link href={checkoutHref} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ec911f] px-5 font-black !text-white shadow-[0_13px_28px_rgba(236,145,31,0.22)] transition hover:-translate-y-0.5 hover:bg-[#dc8517] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7c486]/30 motion-reduce:transform-none">{copy.plan.primaryCta}<ArrowIcon rtl={isArabic} /></Link>
        </div>
      </div>
    </article>
  );
}

function PackageCard({ locale, copy, learningPackage, startLevel, recommended, priceFormatter, onChooseStart }: { locale: Locale; copy: PlansCopy; learningPackage: LearningPackage; startLevel: LearningLevel | null; recommended: boolean; priceFormatter: Intl.NumberFormat; onChooseStart: () => void }) {
  const target = getTargetForPackage(startLevel, learningPackage.id as LearningPackageId);
  const checkoutHref = startLevel && target ? getCheckoutHref(locale, getPlanRecommendation(learningPackage.programType, startLevel, target)!) : null;
  const surface = recommended
    ? "border-[#563a64] bg-[#321d43] text-white shadow-[0_24px_54px_rgba(50,29,67,0.19)]"
    : "border-[#321d43]/9 bg-white text-[#34253e] shadow-[0_12px_32px_rgba(50,29,67,0.06)]";

  return (
    <article dir={locale === "ar" ? "rtl" : "ltr"} className={`relative flex min-h-[280px] w-[84vw] max-w-[326px] shrink-0 snap-start flex-col overflow-hidden rounded-[23px] border p-3.5 transition md:h-full md:min-h-[338px] md:w-auto md:max-w-none md:p-5 xl:min-h-[342px] ${surface} motion-reduce:transform-none`}>
      {recommended ? <div className="absolute inset-x-0 top-0 h-1.5 bg-[#ec911f]" aria-hidden="true" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${recommended ? "bg-white/10 text-white/75" : "bg-[#eee7f0] text-[#563a64]"}`}>{copy.program.options[learningPackage.programType]}</span>
          <h3 className={`mt-1 text-xl font-black leading-tight ${recommended ? "text-white" : "text-[#34253e]"}`}>{learningPackage.name[locale]}</h3>
        </div>
        {recommended ? <span className="shrink-0 md:flex md:h-12 md:items-start"><span className="inline-flex rounded-full bg-[#ec911f] px-3 py-1.5 text-[11px] font-black text-white">{copy.comparison.recommended}</span></span> : <span className="grid h-12 min-w-12 shrink-0 place-items-center rounded-[16px] bg-[#eee7f0] px-2 text-xs font-black text-[#553660]">{learningPackage.hours}h</span>}
      </div>
      <p className={`mt-1 min-h-[36px] max-w-[430px] text-xs font-semibold leading-5 md:mt-1.5 md:min-h-[48px] md:text-sm md:leading-6 ${recommended ? "text-white/64" : "text-[#716675]"}`}>{learningPackage.positioning[locale]}</p>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3 md:mt-3">
        <div>
          <p className={`text-[34px] font-black leading-none ${recommended ? "text-white" : "text-[#321d43]"}`}>{priceFormatter.format(learningPackage.priceEgp)} <span className={`text-xs ${recommended ? "text-white/58" : "text-[#756879]"}`}>{copy.common.currency}</span></p>
        </div>
        {recommended ? <span className="grid h-12 min-w-12 place-items-center rounded-[16px] bg-white/10 px-2 text-xs font-black text-[#f4b15d]">{learningPackage.hours}h</span> : null}
      </div>

      <dl className={`mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5 sm:grid-cols-4 md:mt-3 md:pt-3 ${recommended ? "border-white/10" : "border-[#321d43]/8"}`}>
        <PackageStat label={copy.plan.hoursLabel} value={`${learningPackage.hours} ${copy.common.hours}`} dark={recommended} />
        <PackageStat label={copy.plan.sessionsLabel} value={`${learningPackage.sessions} ${copy.common.sessions}`} dark={recommended} />
        <PackageStat label={copy.program.sessionDurationLabel} value={copy.program.sessionDuration(learningPackage.sessionDurationHours)} dark={recommended} />
        <PackageStat label={copy.plan.durationLabel} value={copy.plan.estimatedDuration(learningPackage.estimatedWeeks)} dark={recommended} />
      </dl>

      {checkoutHref ? <Link href={checkoutHref} className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/22 ${recommended ? "bg-[#ec911f] !text-white hover:bg-[#dc8517]" : "border border-[#321d43]/16 bg-[#f5f0f6] text-[#321d43] hover:border-[#321d43]/34 hover:bg-[#ece4ef]"}`}>{recommended ? copy.comparison.selectedPackage : copy.comparison.selectPackage}</Link> : startLevel ? <span className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-center text-xs font-black ${recommended ? "bg-white/[0.08] text-white/46" : "bg-[#f2eef3] text-[#897c8c]"}`}>{copy.comparison.unavailableForStart}</span> : <button type="button" onClick={onChooseStart} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-[#321d43]/16 px-4 text-sm font-black text-[#321d43] transition hover:bg-[#f3eef5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">{copy.comparison.chooseStartFirst}</button>}
    </article>
  );
}

function getCheckoutHref(locale: Locale, recommendation: PlanRecommendation) {
  const query = new URLSearchParams({ program: recommendation.programType, start: recommendation.startLevel, target: recommendation.targetLevel, package: recommendation.package.id });
  return `/${locale}/plans/checkout?${query.toString()}`;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) { return <div className="max-w-[720px]">{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<h2 className={`${eyebrow ? "mt-3" : ""} text-balance text-[26px] font-black leading-tight text-[#34253e] sm:text-[33px]`}>{title}</h2>{description ? <p className="mt-1.5 text-[14px] font-semibold leading-6 text-[#716675] sm:text-[15px] sm:leading-7">{description}</p> : null}</div>; }
function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) { return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] ${tone === "dark" ? "border border-white/12 bg-white/[0.07] text-[#f5c17d]" : "bg-[#ebe2ed] text-[#674570]"}`}><span className="h-1.5 w-1.5 rounded-full bg-[#ec911f]" aria-hidden="true" />{children}</span>; }
function LevelSeal({ level, locked, compact = false }: { level: LearningLevel; locked: boolean; compact?: boolean }) { const size = compact ? "h-12 w-12 text-base" : "h-[68px] w-[68px] text-[22px]"; return <span className={`relative grid ${size} shrink-0 place-items-center rounded-full border border-[#f5b35f]/45 bg-[#ec911f] font-black text-white shadow-[0_12px_26px_rgba(20,10,26,0.22)]`}>{level}{locked ? <span className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#321d43] bg-white text-[#321d43]"><LockIcon compact /></span> : null}</span>; }
function PlanMetric({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><dt className="text-[9px] font-bold text-white/48 sm:text-[10px]">{label}</dt><dd className="mt-0.5 text-[12px] font-black leading-5 text-white sm:text-[13px]">{value}</dd></div>; }
function PackageStat({ label, value, dark }: { label: string; value: string; dark: boolean }) { return <div className="min-w-0"><dt className={`text-[10px] font-bold leading-4 ${dark ? "text-white/46" : "text-[#8b7f8e]"}`}>{label}</dt><dd className={`mt-1 text-xs font-black leading-5 ${dark ? "text-white" : "text-[#4b3754]"}`}>{value}</dd></div>; }
function StartCompass() { return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-[#f4b15d]"><RouteIcon /></span>; }
function ArrowIcon({ rtl = false }: { rtl?: boolean }) { return <svg className={`h-4 w-4 ${rtl ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function CheckIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LockIcon({ compact = false }: { compact?: boolean }) { return <svg className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" /></svg>; }
function RouteIcon() { return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h2.8a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h.2" strokeLinecap="round" /><path d="m12 12 2.3 2.3L12 16.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function PlusIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>; }
function SwipeIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M5 12h14M8 9l-3 3 3 3M16 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

function BenefitIcon({ id }: { id: PlansCopy["benefits"]["groups"][number]["id"] }) {
  const paths: Record<typeof id, ReactNode> = {
    training: <><path d="M4 6.5h16v10H4z" /><path d="m9.5 10 4 2-4 2v-4Z" strokeLinejoin="round" /><path d="M8 20h8" strokeLinecap="round" /></>,
    tools: <><path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3v-12Z" /><path d="M8 8h6M8 12h6" strokeLinecap="round" /></>,
    support: <><path d="M5 13v-2a7 7 0 0 1 14 0v2" /><path d="M5 12H3.5v5H7v-5H5Zm14 0h1.5v5H17v-5h2ZM17 18c-1 1.2-2.7 2-5 2" strokeLinecap="round" /></>,
    progress: <><path d="M5 4h14v12H5z" /><path d="m9 20 3-4 3 4M8 8h8M8 12h5" strokeLinecap="round" strokeLinejoin="round" /></>,
  };
  return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{paths[id]}</svg>;
}

function PaymentIcon({ id }: { id: PaymentMethodId }) {
  if (id === "installments") return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 6h14v12H5z" /><path d="M8 10h8M8 14h4" strokeLinecap="round" /></svg>;
  if (id === "instapay") return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 7h4M5 17h4" strokeLinecap="round" /></svg>;
  if (id === "wallet") return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9H5.5A1.5 1.5 0 0 1 4 16.5v-9Z" /><path d="M4.5 7.5 16 4v3.5M15 12h5v3h-5a1.5 1.5 0 0 1 0-3Z" /></svg>;
  if (id === "branch") return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 9 8-5 8 5M5 20h14M7 9v8M12 9v8M17 9v8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17M7 14h3" strokeLinecap="round" /></svg>;
}
