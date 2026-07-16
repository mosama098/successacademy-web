"use client";

import { useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type ComparisonMode = "traditional" | "success";
type FeatureIcon = "book" | "group" | "project" | "trainer" | "clock" | "session" | "support";

type ComparisonFeature = {
  key: string;
  icon: FeatureIcon;
  category: string;
  traditional: { statement: string; highlight?: string; highlightDir?: "ltr" | "rtl" };
  success: { statement: string; highlight?: string; highlightDir?: "ltr" | "rtl" };
};

type ComparisonContent = {
  badge: string;
  title: string;
  subtitle: string;
  hint: string;
  traditional: string;
  success: string;
  coreAdvantage: string;
  supportLine: string;
  cta: string;
  regionLabel: string;
  features: ComparisonFeature[];
};

const comparisonContent: Record<"ar" | "en", ComparisonContent> = {
  ar: {
    badge: "شوف الفرق بنفسك",
    title: "نفس كلمة «كورس»… بس مش نفس النظام",
    subtitle: "بدّل بين التجربتين وشوف إيه اللي فعلًا يخليك تتعلم وتكمل.",
    hint: "بدّل وشوف الفرق",
    traditional: "كورس تقليدي",
    success: "Success System",
    coreAdvantage: "نقطة القوة الأساسية",
    supportLine: "ابدأ من مستواك الحقيقي، مش من تخمين.",
    cta: "ابدأ بتقييم مجاني",
    regionLabel: "مقارنة تجربة التعلم",
    features: [
      {
        key: "curriculum",
        icon: "book",
        category: "المنهج",
        traditional: { statement: "منهج واحد للجميع" },
        success: { statement: "منهج مخصص لمستواك وهدفك" },
      },
      {
        key: "group",
        icon: "group",
        category: "المجموعة",
        traditional: { statement: "عدد كبير وتفاعل أقل" },
        success: { statement: "طلاب فقط في المجموعة", highlight: "7–10", highlightDir: "ltr" },
      },
      {
        key: "application",
        icon: "project",
        category: "التطبيق",
        traditional: { statement: "معلومات من غير تطبيق عملي" },
        success: { statement: "مشروع عملي يثبت استخدامك للغة", highlight: "كل 15 ساعة", highlightDir: "rtl" },
      },
      {
        key: "trainers",
        icon: "trainer",
        category: "المحاضرون",
        traditional: { statement: "شرح تقليدي وملاحظات محدودة" },
        success: { statement: "محاضرون متميزون وملاحظات عملية" },
      },
      {
        key: "schedule",
        icon: "clock",
        category: "المواعيد",
        traditional: { statement: "مواعيد ثابتة تتحكم في يومك" },
        success: { statement: "مواعيد مرنة تناسب جدولك" },
      },
      {
        key: "sessions",
        icon: "session",
        category: "المحاضرات",
        traditional: { statement: "المحاضرة تنتهي ومش بتقدر ترجع لها" },
        success: { statement: "راجع محاضراتك في أي وقت", highlight: "Live + Recorded", highlightDir: "ltr" },
      },
      {
        key: "support",
        icon: "support",
        category: "المتابعة",
        traditional: { statement: "بعد المحاضرة أنت لوحدك" },
        success: { statement: "متابعة مستمرة تساعدك تلتزم وتكمل", highlight: "Success Manager", highlightDir: "ltr" },
      },
    ],
  },
  en: {
    badge: "See the Difference",
    title: "Same Word “Course” — A Completely Different System",
    subtitle: "Switch between both experiences and see what actually helps you learn and keep progressing.",
    hint: "Switch and see the difference",
    traditional: "Traditional Course",
    success: "Success System",
    coreAdvantage: "Core Advantage",
    supportLine: "Start from your real level, not a guess.",
    cta: "Start with a Free Assessment",
    regionLabel: "Learning experience comparison",
    features: [
      {
        key: "curriculum",
        icon: "book",
        category: "Curriculum",
        traditional: { statement: "One programme for everyone" },
        success: { statement: "A programme tailored to your level and goal" },
      },
      {
        key: "group",
        icon: "group",
        category: "Group Size",
        traditional: { statement: "Large classes with less interaction" },
        success: { statement: "Learners only in each group", highlight: "7–10", highlightDir: "ltr" },
      },
      {
        key: "application",
        icon: "project",
        category: "Practical Application",
        traditional: { statement: "Learning without real application" },
        success: { statement: "A practical project that proves real language use", highlight: "Every 15 Hours", highlightDir: "ltr" },
      },
      {
        key: "trainers",
        icon: "trainer",
        category: "Trainers",
        traditional: { statement: "Standard teaching with limited feedback" },
        success: { statement: "Experienced trainers with actionable feedback" },
      },
      {
        key: "schedule",
        icon: "clock",
        category: "Schedule",
        traditional: { statement: "Fixed schedules control your day" },
        success: { statement: "Flexible schedules that fit your routine" },
      },
      {
        key: "sessions",
        icon: "session",
        category: "Sessions",
        traditional: { statement: "The live session ends with no replay" },
        success: { statement: "Revisit your sessions anytime", highlight: "Live + Recorded", highlightDir: "ltr" },
      },
      {
        key: "support",
        icon: "support",
        category: "Support",
        traditional: { statement: "You are on your own after class" },
        success: { statement: "Continuous support that keeps you committed and progressing", highlight: "Success Manager", highlightDir: "ltr" },
      },
    ],
  },
};

function FeatureIcon({ icon }: { icon: FeatureIcon }) {
  const common = "h-7 w-7";

  if (icon === "book") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>;
  }
  if (icon === "group") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" /><circle cx="17.5" cy="9" r="2.2" /><path d="M15.5 14.5c2.9-.8 4.7.5 5 3.5" /></svg>;
  }
  if (icon === "project") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13l2.2 2.2L15.5 10" /></svg>;
  }
  if (icon === "trainer") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M3.5 20c.4-4 1.9-6 4.5-6s4.1 2 4.5 6M14 5h7v10h-6M17 9h2M17 12h2" /></svg>;
  }
  if (icon === "clock") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  }
  if (icon === "session") {
    return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
  }
  return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 4.5 6v5c0 4.7 2.8 8.2 7.5 10 4.7-1.8 7.5-5.3 7.5-10V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
}

export function ProblemSection({ locale }: LandingSectionProps) {
  const [mode, setMode] = useState<ComparisonMode>("success");
  const content = comparisonContent[locale];
  const isArabic = locale === "ar";
  const isSuccess = mode === "success";

  return (
    <section id="why" className="overflow-hidden bg-[#F8F6FB] px-5 pb-[80px] pt-[72px] sm:px-6 sm:py-20 lg:px-8 lg:py-[84px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1360px]">
        <header className="mx-auto max-w-[900px] text-center">
          <span className="inline-flex rounded-full border border-[#EC911F]/25 bg-[#EC911F]/[0.08] px-5 py-2 text-[15px] font-black text-[#EC911F] sm:text-[16px]">
            {content.badge}
          </span>
          <h2 className="mt-4 text-[30px] font-black leading-[1.2] text-[#391B68] sm:text-[40px] lg:text-[48px]">
            {content.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[720px] text-[17px] font-bold leading-8 text-slate-600 lg:text-[18px]">
            {content.subtitle}
          </p>
        </header>

        <div
          className={`relative mt-8 overflow-hidden rounded-[28px] border p-4 shadow-[0_24px_70px_rgba(57,27,104,0.12)] transition-[background-color,border-color,box-shadow] duration-[260ms] sm:p-6 lg:mt-10 lg:p-7 ${
            isSuccess ? "border-[#391B68]/15 bg-[#fdfcff] shadow-[0_28px_75px_rgba(57,27,104,0.15)]" : "border-slate-200 bg-[#f4f2f6]"
          }`}
        >
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 transition-opacity duration-300 ${isSuccess ? "bg-[linear-gradient(90deg,#391B68,#E32F54,#EC911F)] opacity-100" : "bg-slate-300 opacity-60"}`} aria-hidden="true" />

          <div className="flex flex-col items-center">
            <span className="mb-2 text-[13px] font-black text-slate-500 sm:text-sm">{content.hint}</span>
            <div className="relative grid h-[56px] w-full max-w-[500px] grid-cols-2 rounded-full border border-[#391B68]/12 bg-white p-1 shadow-[inset_0_1px_3px_rgba(57,27,104,0.08),0_8px_24px_rgba(57,27,104,0.08)] sm:h-[60px]" role="group" aria-label={content.regionLabel} dir="ltr">
              <span
                className={`pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full shadow-[0_8px_20px_rgba(57,27,104,0.18)] transition-transform duration-[260ms] motion-reduce:transition-none ${
                  isSuccess ? "translate-x-full bg-[#391B68]" : "translate-x-0 bg-slate-600"
                }`}
                aria-hidden="true"
              />
              <button
                type="button"
                aria-pressed={!isSuccess}
                onClick={() => setMode("traditional")}
                className={`relative z-10 rounded-full px-3 text-[14px] font-black transition-colors duration-[260ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] sm:text-[16px] ${!isSuccess ? "text-white" : "text-slate-600 hover:text-[#391B68]"}`}
                dir={isArabic ? "rtl" : "ltr"}
              >
                {content.traditional}
              </button>
              <button
                type="button"
                aria-pressed={isSuccess}
                onClick={() => setMode("success")}
                className={`relative z-10 rounded-full px-3 text-[14px] font-black transition-colors duration-[260ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] sm:text-[16px] ${isSuccess ? "text-white" : "text-slate-600 hover:text-[#391B68]"}`}
                dir="ltr"
              >
                {content.success}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-4" aria-live="polite" aria-atomic="true">
            {content.features.map((feature, index) => {
              const isCore = index === content.features.length - 1;
              return (
                <article
                  key={feature.key}
                  style={{ transitionDelay: `${index * 25}ms` }}
                  className={`group relative flex min-h-[88px] items-center gap-3.5 overflow-hidden rounded-2xl border p-4 transition-[background-color,border-color,box-shadow,transform] duration-[260ms] motion-reduce:transform-none motion-reduce:transition-none sm:min-h-[100px] sm:p-5 md:rounded-[20px] ${
                    isCore ? "md:col-span-2 md:flex md:h-[128px] md:min-h-0 md:items-center lg:col-span-3" : "md:block md:h-[148px] md:min-h-0"
                  } ${
                    isCore && isSuccess
                      ? "border-[#391B68] bg-[#391B68] text-white shadow-[0_18px_36px_rgba(57,27,104,0.22)]"
                      : isSuccess
                        ? "border-[#391B68]/14 bg-white text-[#391B68] shadow-[0_12px_28px_rgba(57,27,104,0.08)] md:-translate-y-0.5"
                        : "border-slate-200 bg-[#ebe8ee] text-slate-700"
                  }`}
                >
                  {isSuccess && !isCore ? <span className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,#EC911F,#E32F54)] opacity-70" aria-hidden="true" /> : null}
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-[260ms] md:h-12 md:w-12 ${
                    isCore && isSuccess
                      ? "bg-white/12 text-[#EC911F]"
                      : isSuccess
                        ? "bg-[#391B68]/[0.07] text-[#391B68]"
                        : "bg-white/70 text-slate-500"
                  }`}>
                    <FeatureIcon icon={feature.icon} />
                  </div>

                  <div className={`min-w-0 flex-1 ${isCore ? "md:flex md:items-center md:gap-6" : "md:mt-3"}`}>
                    <div className={isCore ? "md:min-w-[190px]" : ""}>
                      <span className={`text-[12px] font-black uppercase tracking-[0.08em] sm:text-[13px] ${isCore && isSuccess ? "text-white/65" : "text-slate-500"}`}>
                        {feature.category}
                      </span>
                      {isCore && isSuccess ? (
                        <span className={`ms-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black sm:text-xs ${isSuccess ? "bg-[#EC911F] text-white" : "bg-white/75 text-slate-600"}`}>
                          {content.coreAdvantage}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid flex-1">
                      {(["traditional", "success"] as ComparisonMode[]).map((itemMode) => {
                        const item = feature[itemMode];
                        const visible = mode === itemMode;

                        return (
                          <div
                            key={itemMode}
                            aria-hidden={!visible}
                            className={`col-start-1 row-start-1 transition-[opacity,transform] duration-[260ms] motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"}`}
                          >
                            {item.highlight ? (
                              <strong className={`mt-1 block text-[22px] font-black leading-7 [unicode-bidi:isolate] sm:text-[24px] md:text-[27px] ${isCore && isSuccess ? "text-[#EC911F]" : "text-[#E32F54]"}`} dir={item.highlightDir ?? (isArabic ? "rtl" : "ltr")}>
                                {item.highlight}
                              </strong>
                            ) : null}
                            <p className={`mt-1 text-[17px] font-black leading-6 sm:text-[18px] sm:leading-7 md:text-[19px] ${isCore && isSuccess ? "text-white" : isSuccess ? "text-[#391B68]" : "text-slate-700"}`}>
                              {item.statement}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!isCore ? (
                    <span className={`absolute end-4 top-4 hidden h-6 w-6 place-items-center rounded-full text-sm font-black md:grid ${isSuccess ? "bg-[#391B68] text-white" : "bg-white text-slate-500"}`} aria-hidden="true">
                      {isSuccess ? "✓" : "−"}
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5 lg:mt-9">
          <p className="text-[16px] font-black text-[#391B68] sm:text-[17px]">{content.supportLine}</p>
          <CtaLink href={bookingHref} locale={locale} source="success_system_switch" className="h-[56px] w-full px-8 text-[16px] sm:w-auto">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

