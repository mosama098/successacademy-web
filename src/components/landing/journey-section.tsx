import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type JourneyIcon = "assessment" | "goal" | "plan" | "start";

type JourneyStep = {
  icon: JourneyIcon;
  title: string;
  description: string;
  managerPrefix?: string;
  managerSuffix?: string;
};

type JourneyContent = {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  description: string;
  finalLabel: string;
  ctaSupport: string;
  cta: string;
  steps: JourneyStep[];
};

const journeyContent: Record<"ar" | "en", JourneyContent> = {
  ar: {
    badge: "ابدأ بخطوات واضحة",
    titleLead: "من أول تقييم…",
    titleHighlight: "لحد ما تبدأ صح",
    description: "أربع خطوات واضحة تنقلك من التخمين لخطة تعلم مناسبة لمستواك وهدفك.",
    finalLabel: "بداية التدريب",
    ctaSupport: "أول خطوة هي إنك تعرف مستواك الحقيقي.",
    cta: "ابدأ بتقييم مجاني",
    steps: [
      { icon: "assessment", title: "قيّم مستواك الحقيقي", description: "تقييم يحدد نقطة البداية بدل ما تبدأ من مستوى غير مناسب." },
      { icon: "goal", title: "حدّد هدفك", description: "محادثة، شغل، سفر، دراسة أو مقابلات." },
      { icon: "plan", title: "اعرف خطتك", description: "نحدد لك نقطة البداية، طريقة التدريب والمواعيد المناسبة." },
      { icon: "start", title: "ابدأ بمتابعة مستمرة", description: "", managerPrefix: "تبدأ التدريب، والـ", managerSuffix: "يساعدك تلتزم وتكمل." },
    ],
  },
  en: {
    badge: "Your Starting Journey",
    titleLead: "From Your First Assessment…",
    titleHighlight: "To the Right Start",
    description: "Four clear steps take you from guessing your level to starting with a learning plan built around your goal.",
    finalLabel: "Training Begins",
    ctaSupport: "The first step is knowing your real level.",
    cta: "Start with a Free Assessment",
    steps: [
      { icon: "assessment", title: "Assess Your Real Level", description: "Find the right starting point instead of joining a level that does not suit you." },
      { icon: "goal", title: "Define Your Goal", description: "Conversation, work, travel, study or interviews." },
      { icon: "plan", title: "Get Your Plan", description: "We define your starting point, training approach and suitable schedule." },
      { icon: "start", title: "Start with Continuous Support", description: "Begin your training while your Success Manager helps you stay committed and keep progressing." },
    ],
  },
};

const pointClasses = [
  "bg-[#391B68] ring-[#391B68]/15",
  "bg-[#5B2D82] ring-[#5B2D82]/15",
  "bg-[#E32F54] ring-[#E32F54]/15",
  "bg-[#EC911F] ring-[#EC911F]/20",
];

function StepIcon({ icon }: { icon: JourneyIcon }) {
  const className = "h-6 w-6";

  if (icon === "assessment") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z" /><path d="M9 4V2h6v2M8 9h5M8 13h3" /><circle cx="16" cy="14" r="2.5" /><path d="m18 16 2 2" /></svg>;
  }
  if (icon === "goal") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m14.5 9.5 5-5M16 4.5h3.5V8" /></svg>;
  }
  if (icon === "plan") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 6 5-3 6 3 5-3v15l-5 3-6-3-5 3V6Z" /><path d="M9 3v15M15 6v15" /></svg>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></svg>;
}

function StepDescription({ step }: { step: JourneyStep }) {
  if (!step.managerPrefix) return <>{step.description}</>;

  return (
    <>
      {step.managerPrefix}{" "}
      <span className="[unicode-bidi:isolate]" dir="ltr">Success Manager</span>{" "}
      {step.managerSuffix}
    </>
  );
}

export function JourneySection({ locale }: LandingSectionProps) {
  const content = journeyContent[locale];
  const isArabic = locale === "ar";

  return (
    <section id="process" className="relative overflow-hidden bg-[#FBF9FC] px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-[96px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute left-1/2 top-[52%] h-52 w-[560px] -translate-x-1/2 rounded-full bg-[#391B68]/[0.04] blur-[80px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1220px]">
        <header className="mx-auto max-w-[860px] text-center">
          <span className="inline-flex rounded-full border border-[#EC911F]/25 bg-[#EC911F]/[0.08] px-4 py-2 text-[14px] font-black text-[#EC911F] sm:text-[15px]">
            {content.badge}
          </span>
          <h2 className="mt-4 text-[31px] font-black leading-[1.18] text-[#391B68] sm:text-[40px] lg:text-[48px]">
            <span className="block">{content.titleLead}</span>
            <span className="block text-[#E32F54]">{content.titleHighlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[740px] text-[17px] font-bold leading-8 text-slate-600 lg:text-[18px]">
            {content.description}
          </p>
        </header>

        <div className="relative mt-12 hidden lg:block" dir={isArabic ? "rtl" : "ltr"}>
          <div className={`absolute inset-x-[12.5%] top-7 h-px from-[#391B68] via-[#E32F54] to-[#EC911F] opacity-70 ${isArabic ? "bg-gradient-to-l" : "bg-gradient-to-r"}`} aria-hidden="true" />
          {[25, 50, 75].map((position) => (
            <span
              key={position}
              className={`absolute top-[23px] z-[1] h-2.5 w-2.5 border-e-2 border-t-2 border-[#E32F54]/55 ${isArabic ? "rotate-[-135deg]" : "rotate-45"}`}
              style={{ left: `${position}%` }}
              aria-hidden="true"
            />
          ))}
          <div className="relative grid grid-cols-4 gap-6">
            {content.steps.map((step, index) => (
              <article key={step.title} className="group relative min-w-0 text-center">
                <span className={`relative z-[2] mx-auto grid h-14 w-14 place-items-center rounded-full text-[15px] font-black text-white ring-8 shadow-[0_8px_18px_rgba(57,27,104,0.16)] transition-transform duration-[240ms] group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${pointClasses[index]}`} dir="ltr">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={`mx-auto mt-6 max-w-[270px] rounded-[18px] px-4 py-4 transition-[border-color,background-color,transform] duration-[240ms] group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${index === 3 ? "border border-[#EC911F]/25 bg-[#EC911F]/[0.07]" : "border border-transparent bg-white/45"}`}>
                  <span className="mx-auto grid h-9 w-9 place-items-center text-[#391B68]"><StepIcon icon={step.icon} /></span>
                  {index === 3 ? <span className="mt-2 inline-flex rounded-full bg-[#EC911F]/10 px-2.5 py-1 text-[11px] font-black text-[#EC911F]">{content.finalLabel}</span> : null}
                  <h3 className="mt-2 text-[21px] font-black leading-7 text-[#391B68]">{step.title}</h3>
                  <p className={`mt-2 text-[16px] font-bold text-slate-600 ${isArabic ? "leading-[1.7]" : "leading-[1.55]"}`}>
                    <StepDescription step={step} />
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mt-10 hidden md:block lg:hidden" dir={isArabic ? "rtl" : "ltr"}>
          <div className="pointer-events-none absolute inset-x-[25%] top-[25%] h-px bg-[#391B68]/20" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-[25%] top-[75%] h-px bg-[#E32F54]/20" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[25%] left-1/2 top-[25%] w-px bg-[#391B68]/15" aria-hidden="true" />
          <div className="relative grid grid-cols-2 gap-x-8 gap-y-10">
            {content.steps.map((step, index) => (
              <article key={step.title} className={`relative rounded-[18px] border p-5 ${index === 3 ? "border-[#EC911F]/25 bg-[#EC911F]/[0.07]" : "border-[#391B68]/10 bg-white/70"}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-[14px] font-black text-white ring-4 ${pointClasses[index]}`} dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[#391B68]"><StepIcon icon={step.icon} /></span>
                  {index === 3 ? <span className="ms-auto rounded-full bg-[#EC911F]/10 px-2.5 py-1 text-[11px] font-black text-[#EC911F]">{content.finalLabel}</span> : null}
                </div>
                <h3 className="mt-4 text-[20px] font-black text-[#391B68]">{step.title}</h3>
                <p className="mt-2 text-[15px] font-bold leading-7 text-slate-600"><StepDescription step={step} /></p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mt-9 md:hidden" dir={isArabic ? "rtl" : "ltr"}>
          <div className={`absolute bottom-10 top-6 w-px bg-gradient-to-b from-[#391B68] via-[#E32F54] to-[#EC911F] opacity-55 ${isArabic ? "right-[23px]" : "left-[23px]"}`} aria-hidden="true" />
          <div className="space-y-4">
            {content.steps.map((step, index) => (
              <article key={step.title} className={`relative flex min-h-[116px] gap-4 ${isArabic ? "pr-[62px]" : "pl-[62px]"}`}>
                <span className={`absolute top-3 z-[2] grid h-12 w-12 place-items-center rounded-full text-[13px] font-black text-white ring-4 ${pointClasses[index]} ${isArabic ? "right-0" : "left-0"}`} dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                <span className={`absolute top-9 h-px w-4 bg-[#391B68]/25 ${isArabic ? "right-12" : "left-12"}`} aria-hidden="true" />
                <div className={`w-full rounded-[17px] border px-4 py-4 ${index === 3 ? "border-[#EC911F]/25 bg-[#EC911F]/[0.07]" : "border-[#391B68]/10 bg-white/65"}`}>
                  <div className="flex items-center gap-2 text-[#391B68]">
                    <StepIcon icon={step.icon} />
                    {index === 3 ? <span className="ms-auto rounded-full bg-[#EC911F]/10 px-2 py-1 text-[10px] font-black text-[#EC911F]">{content.finalLabel}</span> : null}
                  </div>
                  <h3 className="mt-2 text-[19px] font-black leading-6 text-[#391B68]">{step.title}</h3>
                  <p className="mt-1.5 text-[15px] font-bold leading-6 text-slate-600"><StepDescription step={step} /></p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5 lg:mt-9">
          <p className="text-[15px] font-black text-[#391B68] sm:text-[16px]">{content.ctaSupport}</p>
          <CtaLink href={bookingHref} locale={locale} source="starting_journey" className="h-[56px] w-full rounded-2xl px-7 text-[16px] sm:w-auto">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

