"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type GoalId = "work" | "university" | "travel";
type GoalIcon = GoalId;

type TextPart = {
  text: string;
  ltr?: boolean;
};

type GoalContent = {
  id: GoalId;
  tab: string;
  eyebrow: string;
  heading: TextPart[];
  situations: TextPart[][];
  closing: TextPart[];
  icon: GoalIcon;
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
    badge: "اختار هدفك",
    titleLead: "إنت بتتعلم إنجليزي عشان",
    titleHighlight: "توصل لإيه؟",
    description: "اختار أقرب هدف ليك، وشوف إزاي التدريب هيجهزك لمواقف حقيقية في حياتك.",
    ctaSupport: "قولنا هدفك… وإحنا نحدد لك البداية المناسبة.",
    cta: "ابدأ بتقييم مستواك",
    goals: [
      {
        id: "work",
        tab: "الشغل",
        eyebrow: "إنجليزي لشغلك",
        heading: [{ text: "من الإنترفيو للـ " }, { text: "Meeting", ltr: true }, { text: "…\nاتكلم بثقة في كل موقف" }],
        situations: [
          [{ text: "جاوب في مقابلة العمل من غير إجابات محفوظة." }],
          [{ text: "شارك في الـ " }, { text: "Meeting", ltr: true }, { text: " ووضح رأيك بثقة." }],
          [{ text: "اكتب " }, { text: "Emails", ltr: true }, { text: " ورسائل شغل واضحة واحترافية." }],
        ],
        closing: [{ text: "خطتك بتتبني على طبيعة شغلك ومستواك الحالي." }],
        icon: "work",
      },
      {
        id: "university",
        tab: "الجامعة",
        eyebrow: "إنجليزي لدراستك ومستقبلك",
        heading: [{ text: "من الـ " }, { text: "Presentation", ltr: true }, { text: " لأول فرصة شغل…\nجهّز نفسك من دلوقتي" }],
        situations: [
          [{ text: "قدّم " }, { text: "Presentation", ltr: true }, { text: " بثقة ومن غير توتر." }],
          [{ text: "افهم المراجع والمحتوى الدراسي بالإنجليزي." }],
          [{ text: "استعد للمنح، التدريب ومقابلات العمل." }],
        ],
        closing: [{ text: "تدريب يخدم دراستك ويفتح لك فرص أكتر بعد التخرج." }],
        icon: "university",
      },
      {
        id: "travel",
        tab: "السفر والحياة",
        eyebrow: "إنجليزي للسفر والمواقف اليومية",
        heading: [{ text: "من أول المطار لأي محادثة…\nاتصرّف بثقة" }],
        situations: [
          [{ text: "اتعامل في المطار، الفندق والمطاعم بسهولة." }],
          [{ text: "اسأل وافهم الرد من غير توتر أو ترجمة كل كلمة." }],
          [{ text: "ابدأ محادثة وكملها بثقة." }],
        ],
        closing: [{ text: "تدريب عملي يخليك تستخدم اللغة في حياتك، مش تحفظها بس." }],
        icon: "travel",
      },
    ],
  },
  en: {
    badge: "Choose Your Goal",
    titleLead: "What Do You Want English to",
    titleHighlight: "Help You Achieve?",
    description: "Choose the goal closest to you and see the real-life situations your training will prepare you for.",
    ctaSupport: "Tell us your goal, and we will help you find the right starting point.",
    cta: "Start Your Level Assessment",
    goals: [
      {
        id: "work",
        tab: "Work",
        eyebrow: "English for Work",
        heading: [{ text: "From the Interview to the Meeting…\nCommunicate with Confidence" }],
        situations: [
          [{ text: "Answer interview questions without memorised responses." }],
          [{ text: "Take part in meetings and explain your ideas confidently." }],
          [{ text: "Write clear and professional emails and workplace messages." }],
        ],
        closing: [{ text: "Your plan is built around your work needs and current level." }],
        icon: "work",
      },
      {
        id: "university",
        tab: "University",
        eyebrow: "English for University",
        heading: [{ text: "From Presentations to Your First Career Opportunity…\nPrepare from Now" }],
        situations: [
          [{ text: "Deliver presentations confidently and with less anxiety." }],
          [{ text: "Understand academic references and English study content." }],
          [{ text: "Prepare for scholarships, internships and job interviews." }],
        ],
        closing: [{ text: "Training that supports your studies and opens more opportunities after graduation." }],
        icon: "university",
      },
      {
        id: "travel",
        tab: "Travel & Everyday Life",
        eyebrow: "English for Travel and Everyday Life",
        heading: [{ text: "From the Airport to Any Conversation…\nHandle It with Confidence" }],
        situations: [
          [{ text: "Communicate easily at airports, hotels and restaurants." }],
          [{ text: "Ask questions and understand responses without translating every word." }],
          [{ text: "Start conversations and keep them going confidently." }],
        ],
        closing: [{ text: "Practical training helps you use English in real life instead of only memorising it." }],
        icon: "travel",
      },
    ],
  },
};

function GoalIcon({ icon }: { icon: GoalIcon }) {
  const className = "h-6 w-6";

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
    <section id="process" className="relative overflow-hidden bg-[#F8F6FB] px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute left-1/2 top-[62%] h-44 w-[460px] -translate-x-1/2 rounded-full bg-[#EC911F]/[0.045] blur-[70px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1140px]">
        <header className="mx-auto max-w-[860px] text-center">
          <span className="inline-flex rounded-full border border-[#EC911F]/25 bg-[#EC911F]/[0.08] px-4 py-2 text-[13px] font-black text-[#EC911F] sm:text-[14px]">
            {content.badge}
          </span>
          <h2 className="mt-3 text-[28px] font-black leading-[1.22] text-[#391B68] sm:text-[36px] lg:text-[42px] lg:leading-[1.18]">
            {content.titleLead}{" "}<span className="text-[#EC911F]">{content.titleHighlight}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[680px] text-[15px] font-bold leading-7 text-[#665d75] sm:text-[16px] lg:text-[17px]">
            {content.description}
          </p>
        </header>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-[#391B68] shadow-[0_18px_48px_rgba(57,27,104,0.18)] lg:rounded-[26px]">
          <div className="grid min-h-[56px] grid-cols-3 gap-1 border-b border-white/10 bg-white/[0.045] p-1.5 sm:min-h-[60px] sm:p-2" role="tablist" aria-label={content.badge}>
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
                  className={`min-h-[44px] rounded-[14px] px-1.5 py-1.5 text-[11px] font-black leading-4 transition-[background-color,color] duration-[220ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:px-3 sm:text-[13px] lg:text-[15px] ${selected ? "bg-[#EC911F] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  {goal.tab}
                </button>
              );
            })}
          </div>

          <div id={`goal-panel-${locale}`} role="tabpanel" aria-labelledby={`goal-tab-${activeGoal.id}-${locale}`} className="p-5 sm:p-7 lg:p-[18px]">
            <div key={activeGoal.id} className="goal-panel-enter grid items-center gap-7 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-8" dir="ltr">
              <div className={`${isArabic ? "lg:order-2" : "lg:order-1"}`} dir={isArabic ? "rtl" : "ltr"}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#EC911F]/15 text-[#EC911F]">
                    <GoalIcon icon={activeGoal.icon} />
                  </span>
                  <p className="text-[12px] font-black text-[#EC911F] sm:text-[13px]">{activeGoal.eyebrow}</p>
                </div>
                <h3 className="mt-2.5 max-w-[500px] whitespace-pre-line text-[24px] font-black leading-[1.25] text-white sm:text-[28px] lg:text-[28px]">
                  <RichText parts={activeGoal.heading} />
                </h3>
                <p className="mt-3 flex max-w-[460px] items-start gap-2.5 text-[15px] font-bold leading-6 text-white/70 sm:text-[16px]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                  <span><RichText parts={activeGoal.closing} /></span>
                </p>
                <div className="mt-4 lg:flex lg:items-center lg:gap-4">
                  <p className="mb-2 text-[13px] font-bold leading-5 text-white/65 sm:text-[14px] lg:mb-0 lg:max-w-[230px]">{content.ctaSupport}</p>
                  <CtaLink href={bookingHref} locale={locale} source={`goal_${activeGoal.id}`} className="h-[52px] w-full shrink-0 rounded-[15px] px-6 text-[15px] shadow-[0_8px_20px_rgba(236,145,31,0.18)] sm:w-auto sm:text-[16px]">
                    {content.cta}
                  </CtaLink>
                </div>
              </div>

              <div className={`${isArabic ? "lg:order-1" : "lg:order-2"}`} dir={isArabic ? "rtl" : "ltr"}>
                {activeGoal.situations.map((situation, index) => (
                  <div key={index} className={`flex min-h-[60px] items-center gap-3 py-2.5 sm:min-h-[64px] ${index > 0 ? "border-t border-white/10" : ""}`}>
                    <span className="shrink-0 text-[13px] font-black text-[#EC911F] [unicode-bidi:isolate] sm:text-[14px]" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                    <p className="text-[15px] font-bold leading-6 text-white sm:text-[17px] lg:text-[18px]">
                      <RichText parts={situation} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .goal-panel-enter { animation: goal-panel-enter 240ms ease-out both; }
        @keyframes goal-panel-enter {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .goal-panel-enter { animation: none; }
        }
      `}</style>
    </section>
  );
}
