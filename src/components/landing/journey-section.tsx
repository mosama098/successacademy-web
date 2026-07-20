"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type GoalId = "work" | "university" | "travel";
type GoalIcon = "work" | "university" | "travel";

type TextPart = {
  text: string;
  ltr?: boolean;
};

type GoalContent = {
  id: GoalId;
  tab: string;
  eyebrow: string;
  heading: string;
  situations: TextPart[][];
  closing: TextPart[];
  icon: GoalIcon;
  accent: "orange" | "pink";
};

type SectionContent = {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  description: string;
  ctaSupport: string;
  cta: string;
  goals: GoalContent[];
};

const sectionContent: Record<"ar" | "en", SectionContent> = {
  ar: {
    badge: "هدفك هو بداية خطتك",
    titleLead: "إنت مش بتتعلم إنجليزي عشان تخلّص كورس",
    titleHighlight: "إنت بتتعلمه عشان تستخدمه وقت ما تحتاجه",
    description: "اختار هدفك، وشوف المهارات اللي هنساعدك تبنيها في مواقف حقيقية.",
    ctaSupport: "قولنا هدفك… وإحنا نحدد لك البداية المناسبة.",
    cta: "ابدأ بتقييم مستواك",
    goals: [
      {
        id: "work",
        tab: "الشغل",
        eyebrow: "إنجليزي يخدم شغلك",
        heading: "اتكلم بثقة في المواقف اللي بتفرق في شغلك",
        situations: [
          [{ text: "جاوب في مقابلة عمل من غير ما تحفظ إجابات." }],
          [{ text: "شارك في " }, { text: "Meeting", ltr: true }, { text: " وعبّر عن رأيك بوضوح." }],
          [{ text: "اكتب " }, { text: "Emails", ltr: true }, { text: " ورسائل شغل بشكل احترافي." }],
        ],
        closing: [{ text: "خطة التدريب بتتبني على طبيعة شغلك ومستواك الحالي." }],
        icon: "work",
        accent: "orange",
      },
      {
        id: "university",
        tab: "الجامعة",
        eyebrow: "إنجليزي لدراستك ومستقبلك",
        heading: "استخدم الإنجليزي في دراستك وفرصك الجاية",
        situations: [
          [{ text: "قدّم " }, { text: "Presentation", ltr: true }, { text: " بثقة ومن غير توتر." }],
          [{ text: "افهم مراجع ومحتوى دراسي بالإنجليزي." }],
          [{ text: "استعد للتدريب، المنح ومقابلات العمل." }],
        ],
        closing: [{ text: "مش مجرد " }, { text: "Grammar", ltr: true }, { text: "؛ تدريب يخدم دراستك ومستقبلك." }],
        icon: "university",
        accent: "pink",
      },
      {
        id: "travel",
        tab: "السفر والحياة",
        eyebrow: "إنجليزي للمواقف اليومية",
        heading: "اتعامل براحة في المواقف اليومية",
        situations: [
          [{ text: "اتكلم في المطار، الفندق والمطاعم." }],
          [{ text: "اسأل وتفهم الرد من غير توتر." }],
          [{ text: "ابدأ محادثة وكملها بثقة." }],
        ],
        closing: [{ text: "تدريب عملي يخليك تستخدم اللغة بدل ما تترجم كل كلمة." }],
        icon: "travel",
        accent: "orange",
      },
    ],
  },
  en: {
    badge: "Your Goal Shapes Your Plan",
    titleLead: "You Are Not Learning English Just to Finish a Course",
    titleHighlight: "You Are Learning It to Use It When It Matters",
    description: "Choose your goal and see the skills we help you build for real-life situations.",
    ctaSupport: "Tell us your goal, and we will help you find the right starting point.",
    cta: "Start Your Level Assessment",
    goals: [
      {
        id: "work",
        tab: "Work",
        eyebrow: "English for Your Career",
        heading: "Communicate Confidently in the Moments That Matter at Work",
        situations: [
          [{ text: "Answer interview questions without memorising scripted responses." }],
          [{ text: "Take part in meetings and express your ideas clearly." }],
          [{ text: "Write professional emails and workplace messages." }],
        ],
        closing: [{ text: "Your training plan is built around your current level and professional needs." }],
        icon: "work",
        accent: "orange",
      },
      {
        id: "university",
        tab: "University",
        eyebrow: "English for Study and Opportunity",
        heading: "Use English in Your Studies and Future Opportunities",
        situations: [
          [{ text: "Deliver presentations with greater confidence." }],
          [{ text: "Understand academic references and English learning content." }],
          [{ text: "Prepare for internships, scholarships and job interviews." }],
        ],
        closing: [{ text: "Not just grammar—training that supports your studies and your future." }],
        icon: "university",
        accent: "pink",
      },
      {
        id: "travel",
        tab: "Travel & Everyday Life",
        eyebrow: "English for Real Life",
        heading: "Handle Everyday Situations with Confidence",
        situations: [
          [{ text: "Communicate at airports, hotels and restaurants." }],
          [{ text: "Ask questions and understand the response without panic." }],
          [{ text: "Start conversations and keep them going confidently." }],
        ],
        closing: [{ text: "Practical training helps you use the language instead of translating every word." }],
        icon: "travel",
        accent: "orange",
      },
    ],
  },
};

function GoalIcon({ icon }: { icon: GoalIcon }) {
  const className = "h-7 w-7";

  if (icon === "work") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></svg>;
  }
  if (icon === "university") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 12v5c3 2.5 7 2.5 10 0v-5M21 9v6" /></svg>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 19c4-6 7-9 16-14M14 5h6v6" /><circle cx="6" cy="17" r="3" /><path d="M9 17h4" /></svg>;
}

function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) => part.ltr ? (
        <span key={`${part.text}-${index}`} className="[unicode-bidi:isolate]" dir="ltr">{part.text}</span>
      ) : part.text)}
    </>
  );
}

export function JourneySection({ locale }: LandingSectionProps) {
  const content = sectionContent[locale];
  const isArabic = locale === "ar";
  const [activeId, setActiveId] = useState<GoalId>("work");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeGoal = content.goals.find((goal) => goal.id === activeId) ?? content.goals[0];

  const selectTab = (index: number) => {
    const nextIndex = (index + content.goals.length) % content.goals.length;
    setActiveId(content.goals[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = content.goals.length - 1;
    if (event.key === "ArrowRight") nextIndex = index + (isArabic ? -1 : 1);
    if (event.key === "ArrowLeft") nextIndex = index + (isArabic ? 1 : -1);

    if (nextIndex !== null) {
      event.preventDefault();
      selectTab(nextIndex);
    }
  };

  return (
    <section id="process" className="relative overflow-hidden bg-[#FBF9FC] px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-[96px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute left-1/2 top-[58%] h-72 w-[680px] -translate-x-1/2 rounded-full bg-[#391B68]/[0.045] blur-[90px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1220px]">
        <header className="mx-auto max-w-[980px] text-center">
          <span className="inline-flex rounded-full border border-[#EC911F]/25 bg-[#EC911F]/[0.08] px-4 py-2 text-[14px] font-black text-[#EC911F] sm:text-[15px]">
            {content.badge}
          </span>
          <h2 className="mt-4 text-[30px] font-black leading-[1.2] text-[#391B68] sm:text-[40px] lg:text-[48px] lg:leading-[1.16]">
            <span className="block">{content.titleLead}</span>
            <span className="mt-1 block text-[#E32F54]">{content.titleHighlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[740px] text-[17px] font-bold leading-8 text-slate-600 lg:text-[18px]">
            {content.description}
          </p>
        </header>

        <div
          className="mx-auto mt-8 grid min-h-[58px] w-full max-w-[760px] grid-cols-3 rounded-[20px] border border-[#391B68]/12 bg-white/75 p-1.5 shadow-[0_10px_28px_rgba(57,27,104,0.08)] sm:min-h-[62px]"
          role="tablist"
          aria-label={content.badge}
        >
          {content.goals.map((goal, index) => {
            const selected = goal.id === activeId;
            return (
              <button
                key={goal.id}
                ref={(node) => { tabRefs.current[index] = node; }}
                id={`goal-tab-${goal.id}-${locale}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`goal-panel-${locale}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(goal.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`relative min-h-[48px] rounded-[15px] px-2 py-2 text-[12px] font-black leading-5 transition-[background-color,color,box-shadow] duration-[240ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] motion-reduce:transition-none sm:text-[14px] lg:text-[16px] ${selected ? "bg-[#391B68] text-white shadow-[0_8px_20px_rgba(57,27,104,0.18)]" : "text-[#391B68] hover:bg-[#391B68]/[0.06]"}`}
              >
                {goal.tab}
                {selected ? <span className="absolute inset-x-1/3 bottom-1 h-0.5 rounded-full bg-[#EC911F]" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        <div
          id={`goal-panel-${locale}`}
          role="tabpanel"
          aria-labelledby={`goal-tab-${activeGoal.id}-${locale}`}
          className="mt-5 overflow-hidden rounded-[24px] border border-[#391B68]/12 bg-white/90 p-5 shadow-[0_22px_58px_rgba(57,27,104,0.11)] sm:p-8 lg:min-h-[390px] lg:rounded-[30px] lg:p-10"
        >
          <div key={activeGoal.id} className="goal-panel-enter grid items-center gap-8 lg:grid-cols-2 lg:gap-14" dir="ltr">
            <div className={`${isArabic ? "lg:order-2" : "lg:order-1"}`} dir={isArabic ? "rtl" : "ltr"}>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${activeGoal.accent === "pink" ? "bg-[#E32F54]/10 text-[#E32F54]" : "bg-[#EC911F]/10 text-[#EC911F]"}`}>
                <GoalIcon icon={activeGoal.icon} />
              </span>
              <p className={`mt-5 text-[13px] font-black ${activeGoal.accent === "pink" ? "text-[#E32F54]" : "text-[#EC911F]"}`}>
                {activeGoal.eyebrow}
              </p>
              <h3 className="mt-2 max-w-[500px] text-[27px] font-black leading-[1.25] text-[#391B68] sm:text-[32px] lg:text-[37px]">
                {activeGoal.heading}
              </h3>
              <p className="mt-5 flex max-w-[500px] items-start gap-3 text-[16px] font-bold leading-7 text-slate-600 lg:text-[17px]">
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${activeGoal.accent === "pink" ? "bg-[#E32F54]" : "bg-[#EC911F]"}`} aria-hidden="true" />
                <span><RichText parts={activeGoal.closing} /></span>
              </p>
              <div className="mt-6">
                <p className="mb-3 text-[14px] font-black text-[#391B68] sm:text-[15px]">{content.ctaSupport}</p>
                <CtaLink href={bookingHref} locale={locale} source={`goal_${activeGoal.id}`} className="h-[56px] w-full rounded-2xl px-7 text-[16px] sm:w-auto">
                  {content.cta}
                </CtaLink>
              </div>
            </div>

            <div className={`${isArabic ? "lg:order-1" : "lg:order-2"}`} dir={isArabic ? "rtl" : "ltr"}>
              {activeGoal.situations.map((situation, index) => (
                <div key={index} className={`flex min-h-[82px] items-center gap-4 py-4 ${index > 0 ? "border-t border-[#391B68]/10" : ""}`}>
                  <span className={`shrink-0 text-[14px] font-black [unicode-bidi:isolate] ${activeGoal.accent === "pink" ? "text-[#E32F54]" : "text-[#EC911F]"}`} dir="ltr">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`h-px w-5 shrink-0 ${activeGoal.accent === "pink" ? "bg-[#E32F54]/45" : "bg-[#EC911F]/45"}`} aria-hidden="true" />
                  <p className="text-[17px] font-black leading-7 text-[#391B68] lg:text-[19px]">
                    <RichText parts={situation} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .goal-panel-enter {
          animation: goal-panel-enter 260ms ease-out both;
        }
        @keyframes goal-panel-enter {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .goal-panel-enter { animation: none; }
        }
      `}</style>
    </section>
  );
}

