import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LocalizedSectionProps } from "./types";

const onlineLearningContent = {
  ar: {
    facts: [
      "شرح Live بالكامل على Zoom",
      "Group من 7–10 أو Private 1:1",
      "كل محاضرة Live بتتسجل للمراجعة",
      "اختبار تحديد مستوى مجاني",
      "البرامج تبدأ من 2250 جنيه",
    ],
    eyebrow: "اختار تجربتك",
    title: "اختار طريقة الدراسة اللي تناسبك",
    description: "الاختيار بين Group وPrivate 1:1، والاتنين Live أونلاين بالكامل على Zoom.",
    cta: "اعرف مستواك مجانًا",
    formats: [
      {
        name: "Group",
        detail: "7–10 متدربين",
        points: ["تفاعل مباشر مع المدرب والمجموعة", "ممارسة Speaking وأنشطة جماعية", "سعر أقل من Private"],
      },
      {
        name: "Private 1:1",
        detail: "متدرب واحد مع مدرب واحد",
        points: ["اهتمام شخصي أكتر", "تركيز على مستواك وأهدافك", "سرعة وممارسة مناسبة ليك"],
      },
    ],
  },
  en: {
    facts: [
      "100% Live teaching on Zoom",
      "Group of 7–10 or Private 1:1",
      "Every Live session is recorded for review",
      "Free Placement Test",
      "Programmes start from 2250 EGP",
    ],
    eyebrow: "Choose Your Experience",
    title: "Choose the learning format that suits you",
    description: "Choose Group or Private 1:1. Both are delivered fully Live Online on Zoom.",
    cta: "Get Your Free Level Check",
    formats: [
      {
        name: "Group",
        detail: "7–10 learners",
        points: ["Live interaction with your trainer and group", "Speaking practice and group activities", "A lower price than Private"],
      },
      {
        name: "Private 1:1",
        detail: "One learner with one trainer",
        points: ["More personalised attention", "A focus on your level and goals", "An individual pace and more focused practice"],
      },
    ],
  },
} as const;

export function OnlineLearningSection({ locale }: LocalizedSectionProps) {
  const content = onlineLearningContent[locale];
  const isArabic = locale === "ar";

  return (
    <section className="bg-[#f8f6fb] px-5 py-12 sm:px-6 lg:px-8 lg:py-16" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1180px]">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" aria-label={isArabic ? "مميزات الدراسة الأونلاين" : "Online learning highlights"}>
          {content.facts.map((fact, index) => (
            <li key={fact} className={`flex min-h-20 items-center gap-2 rounded-lg border border-[#391B68]/10 bg-white px-3 py-3 text-sm font-black leading-6 text-[#391B68] shadow-[0_8px_22px_rgba(57,27,104,0.05)] ${index === content.facts.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EC911F] text-xs text-white" aria-hidden="true">✓</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>

        <div className="mt-14 text-center">
          <p className="text-sm font-black uppercase text-[#EC911F]">{content.eyebrow}</p>
          <h2 className="mx-auto mt-2 max-w-3xl text-balance text-3xl font-black leading-tight text-[#391B68] sm:text-4xl">{content.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-[#6B5E76]">{content.description}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {content.formats.map((format, index) => (
            <article key={format.name} className={`rounded-lg border p-6 sm:p-7 ${index === 0 ? "border-[#391B68]/15 bg-white" : "border-[#EC911F]/30 bg-[#fffaf4]"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-2xl font-black text-[#391B68]">{format.name}</h3>
                <span className="rounded-full bg-[#EEE9F4] px-3 py-1 text-sm font-black text-[#563a64]">{format.detail}</span>
              </div>
              <ul className="mt-5 space-y-3">
                {format.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[15px] font-semibold leading-7 text-[#5f5369]">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <CtaLink href={bookingHref} locale={locale} source="learning_formats" className="h-[54px] px-8">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
