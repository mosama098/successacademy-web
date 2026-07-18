import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type LayerIcon = "book" | "group" | "trainer" | "session" | "project" | "clock";

type StackLayer = {
  icon: LayerIcon;
  category: string;
  title: string;
  description: string;
  token?: string;
  suffix?: string;
};

type StackContent = {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  titleTail: string;
  description: string;
  statement: string;
  ctaSupport: string;
  cta: string;
  managerDescription: string;
  managerMobileDescription: string;
  managerLabel: string;
  layers: StackLayer[];
};

const stackContent: Record<"ar" | "en", StackContent> = {
  ar: {
    badge: "نظام مصمم عشان تكمّل",
    titleLead: "مش مجرد كورس…",
    titleHighlight: "نظام كامل",
    titleTail: " حوالين تقدّمك",
    description: "كل جزء في البرنامج معمول عشان يقوّي الجزء اللي بعده؛ من منهج مناسب لمستواك، لتطبيق عملي، لمتابعة تخليك تفضل مكمل.",
    statement: "كل خطوة بتبني على اللي قبلها.",
    ctaSupport: "ابدأ من مستواك الحقيقي، مش من تخمين.",
    cta: "ابدأ بتقييم مجاني",
    managerDescription: "متابعة تربط كل خطوة ببعضها",
    managerMobileDescription: "متابعة تربط كل خطوة ببعضها من البداية للنهاية",
    managerLabel: "من البداية للنهاية",
    layers: [
      { icon: "book", category: "المنهج", title: "منهج مخصص", description: "يبدأ من مستواك وهدفك" },
      { icon: "group", category: "المجموعة", title: "", token: "7–10", suffix: "طلاب", description: "مساحة حقيقية للكلام والتفاعل" },
      { icon: "trainer", category: "المحاضرون", title: "محاضرون متميزون", description: "شرح واضح وملاحظات عملية" },
      { icon: "session", category: "المحاضرات", title: "", token: "Live + Recorded", description: "مرونة من غير ما يفوتك المحتوى" },
      { icon: "project", category: "التطبيق", title: "مشروع كل 15 ساعة", description: "تطبيق حقيقي يثبت استخدامك للغة" },
      { icon: "clock", category: "المواعيد", title: "مواعيد مرنة", description: "تتعلم في الوقت المناسب ليومك" },
    ],
  },
  en: {
    badge: "A System Built to Keep You Moving",
    titleLead: "Not Just a Course…",
    titleHighlight: "A Complete System",
    titleTail: " Built Around Your Progress",
    description: "Every part of the programme is designed to strengthen the next—from a tailored curriculum and real practice to the support that keeps you moving.",
    statement: "Every step builds on the one before it.",
    ctaSupport: "Start from your real level, not a guess.",
    cta: "Start with a Free Assessment",
    managerDescription: "Support that connects every step",
    managerMobileDescription: "Support that connects every step from start to finish",
    managerLabel: "From Start to Finish",
    layers: [
      { icon: "book", category: "Curriculum", title: "Tailored Programme", description: "Built around your level and goal" },
      { icon: "group", category: "Group Size", title: "", token: "7–10", suffix: "Learners", description: "More room to speak and participate" },
      { icon: "trainer", category: "Trainers", title: "Experienced Trainers", description: "Clear teaching and actionable feedback" },
      { icon: "session", category: "Sessions", title: "", token: "Live + Recorded", description: "Flexible access without missing content" },
      { icon: "project", category: "Application", title: "A Project Every 15 Hours", description: "Real practice that proves language use" },
      { icon: "clock", category: "Schedule", title: "Flexible Timings", description: "Learn at times that fit your routine" },
    ],
  },
};

function LayerIcon({ icon, className = "h-6 w-6" }: { icon: LayerIcon | "support"; className?: string }) {
  if (icon === "book") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>;
  }
  if (icon === "group") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" /><circle cx="17.5" cy="9" r="2.2" /><path d="M15.5 14.5c2.9-.8 4.7.5 5 3.5" /></svg>;
  }
  if (icon === "trainer") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M3.5 20c.4-4 1.9-6 4.5-6s4.1 2 4.5 6M14 5h7v10h-6M17 9h2M17 12h2" /></svg>;
  }
  if (icon === "session") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
  }
  if (icon === "project") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13l2.2 2.2L15.5 10" /></svg>;
  }
  if (icon === "clock") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 4.5 6v5c0 4.7 2.8 8.2 7.5 10 4.7-1.8 7.5-5.3 7.5-10V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
}

const arabicOffsets = ["", "-translate-x-0.5 md:-translate-x-[3px] lg:-translate-x-1", "-translate-x-1 md:-translate-x-[6px] lg:-translate-x-2", "-translate-x-1 md:-translate-x-[6px] lg:-translate-x-2", "-translate-x-0.5 md:-translate-x-[3px] lg:-translate-x-1", ""];
const englishOffsets = ["", "translate-x-0.5 md:translate-x-[3px] lg:translate-x-1", "translate-x-1 md:translate-x-[6px] lg:translate-x-2", "translate-x-1 md:translate-x-[6px] lg:translate-x-2", "translate-x-0.5 md:translate-x-[3px] lg:translate-x-1", ""];

export function ProblemSection({ locale }: LandingSectionProps) {
  const content = stackContent[locale];
  const isArabic = locale === "ar";
  const offsets = isArabic ? arabicOffsets : englishOffsets;

  return (
    <section id="why" className="relative overflow-hidden bg-[#F8F6FB] px-5 py-16 sm:px-6 sm:py-[72px] lg:px-8 lg:py-20" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute inset-y-20 start-[48%] hidden w-[360px] rounded-full bg-[#391B68]/[0.04] blur-[70px] lg:block" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid items-start gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.41fr)_minmax(0,0.59fr)] lg:gap-14" dir="ltr">
          <div className={`${isArabic ? "lg:order-2" : "lg:order-1"} lg:pt-2`} dir={isArabic ? "rtl" : "ltr"}>
            <span className="inline-flex rounded-full border border-[#EC911F]/25 bg-[#EC911F]/[0.08] px-4 py-2 text-[14px] font-black text-[#EC911F] sm:text-[15px]">
              {content.badge}
            </span>
            <h2 className="mt-4 max-w-[520px] text-[32px] font-black leading-[1.16] text-[#391B68] sm:text-[40px] lg:text-[46px] lg:leading-[1.1]">
              <span className="block">{content.titleLead}</span>
              <span className="block"><span className="text-[#E32F54]">{content.titleHighlight}</span>{content.titleTail}</span>
            </h2>
            <p className={`mt-5 max-w-[500px] text-[17px] font-bold text-slate-600 sm:text-[18px] ${isArabic ? "leading-[1.75]" : "leading-[1.62]"}`}>
              {content.description}
            </p>
            <p className="mt-4 flex items-center gap-3 text-[15px] font-black text-[#391B68] sm:text-[16px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
              {content.statement}
            </p>

            <div className="mt-6 hidden lg:block">
              <p className="mb-3 text-[14px] font-black text-[#391B68]">{content.ctaSupport}</p>
              <CtaLink href={bookingHref} locale={locale} source="success_stack" className="h-[54px] rounded-2xl px-7 text-[16px]">
                {content.cta}
              </CtaLink>
            </div>
          </div>

          <div className={`${isArabic ? "lg:order-1" : "lg:order-2"}`} dir={isArabic ? "rtl" : "ltr"}>
            <div className="relative mx-auto max-w-[700px]">
              <div className={`absolute inset-y-0 z-10 w-9 rounded-[20px] bg-[#391B68] shadow-[0_12px_30px_rgba(57,27,104,0.18)] md:w-[72px] lg:w-[92px] lg:rounded-[22px] ${isArabic ? "right-0" : "left-0"}`}>
                <div className="flex h-full flex-col items-center justify-center gap-5 px-1.5 py-3 text-center text-white md:px-2 md:py-4 lg:gap-4 lg:px-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-[#EC911F] md:h-10 md:w-10 lg:h-9 lg:w-9">
                    <LayerIcon icon="support" className="h-5 w-5 md:h-6 md:w-6 lg:h-5 lg:w-5" />
                  </span>
                  <div className="hidden min-w-0 md:block lg:hidden">
                    <strong className="block text-[15px] font-black leading-5 [unicode-bidi:isolate] lg:text-[17px]" dir="ltr">Success Manager</strong>
                    <p className="mt-2 text-[11px] font-bold leading-4 text-white/75 lg:text-[12px]">{content.managerDescription}</p>
                  </div>
                  <div className="hidden min-w-0 lg:block">
                    <strong className="block text-[17px] font-black leading-[1.15] text-white [unicode-bidi:isolate]" dir="ltr">
                      <span className="block">Success</span>
                      <span className="block">Manager</span>
                    </strong>
                    <p className="mt-2.5 text-[11px] font-bold leading-[1.45] text-white/75">
                      {isArabic ? "متابعة تربط كل خطوة باللي بعدها" : content.managerDescription}
                    </p>
                  </div>
                  <span className="hidden text-[10px] font-black leading-4 text-[#EC911F] md:block lg:text-[10px]">{content.managerLabel}</span>
                </div>
              </div>

              <div className={`space-y-2 ${isArabic ? "pr-11 md:pr-20 lg:pr-24" : "pl-11 md:pl-20 lg:pl-24"}`}>
                {content.layers.map((layer, index) => (
                  <div key={layer.category} className="group relative">
                    <span className={`absolute top-1/2 z-0 h-px w-[26px] -translate-y-1/2 bg-[#391B68]/15 transition-colors duration-[220ms] group-hover:bg-[#EC911F]/55 motion-reduce:transition-none md:w-11 lg:w-[50px] ${isArabic ? "right-[-26px] md:right-[-44px] lg:right-[-50px]" : "left-[-26px] md:left-[-44px] lg:left-[-50px]"}`} aria-hidden="true" />
                    <span className={`absolute top-1/2 z-20 h-2 w-2 -translate-y-1/2 rounded-full border border-[#391B68]/40 bg-[#EC911F]/65 transition-colors duration-[220ms] group-hover:bg-[#EC911F]/90 motion-reduce:transition-none lg:h-1.5 lg:w-1.5 ${isArabic ? "right-[-30px] md:right-[-48px] lg:right-[-53px]" : "left-[-30px] md:left-[-48px] lg:left-[-53px]"}`} aria-hidden="true" />
                    <div className={offsets[index]}>
                    <article className={`relative z-[1] flex min-h-[90px] items-center gap-3 rounded-[16px] border border-[#391B68]/[0.08] px-3.5 py-2.5 shadow-[0_5px_16px_rgba(57,27,104,0.045)] transition-[transform,border-color,box-shadow] duration-[220ms] group-hover:border-[#391B68]/15 group-hover:shadow-[0_7px_18px_rgba(57,27,104,0.06)] motion-reduce:transform-none motion-reduce:transition-none md:min-h-[72px] md:px-3.5 md:py-2 lg:min-h-[68px] ${isArabic ? "lg:group-hover:-translate-x-0.5" : "lg:group-hover:translate-x-0.5"} ${index % 2 === 0 ? "bg-white" : "bg-[#f5f2f8]"} ${isArabic ? "" : "flex-row-reverse"}`}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#391B68]/[0.07] text-[#391B68]">
                        <LayerIcon icon={layer.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 md:text-[12px]">{layer.category}</span>
                        <h3 className="mt-0.5 text-[17px] font-black leading-6 text-[#391B68] md:text-[18px]">
                          {layer.token ? <span className="text-[#E32F54] [unicode-bidi:isolate]" dir="ltr">{layer.token}</span> : layer.title}
                          {layer.suffix ? <span> {layer.suffix}</span> : null}
                        </h3>
                        <p className="mt-0.5 text-[14px] font-bold leading-5 text-slate-600 md:text-[15px]">{layer.description}</p>
                      </div>
                      <span className="shrink-0 text-[13px] font-black text-[#EC911F] md:text-[14px]" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                    </article>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-[18px] bg-[#391B68] p-4 text-white shadow-[0_14px_32px_rgba(57,27,104,0.18)] md:hidden">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#EC911F]">
                <LayerIcon icon="support" />
              </span>
              <div className="min-w-0">
                <strong className="block text-[20px] font-black text-[#EC911F] [unicode-bidi:isolate]" dir="ltr">Success Manager</strong>
                <p className="mt-1 text-[15px] font-bold leading-6 text-white/85">{content.managerMobileDescription}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 lg:hidden">
          <p className="mb-3 text-[15px] font-black text-[#391B68]">{content.ctaSupport}</p>
          <CtaLink href={bookingHref} locale={locale} source="success_stack" className="h-[56px] w-full rounded-2xl px-6 text-[17px] sm:w-auto sm:px-8">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

