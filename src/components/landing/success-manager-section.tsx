import { AnimatedSection } from "@/components/ui/animated-section";
import type { LandingSectionProps } from "./types";

export function SuccessManagerSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const cards = isArabic
    ? [
        {
          title: "متابعة على الالتزام",
          description: "حد يتابع تقدمك ويخليك عارف المطلوب منك كل يوم.",
        },
        {
          title: "مهام قصيرة",
          description: "تطبيقات بسيطة ومستمرة علشان التدريب يبقى عملي.",
        },
        {
          title: "استخدام حقيقي للغة",
          description: "مواقف وممارسة تخليك تستخدم الإنجليزي بدل ما تحفظه بس.",
        },
        {
          title: "تعديل الخطة عند الحاجة",
          description: "لو احتجت تغيير في السرعة أو التركيز، الخطة بتتظبط معاك.",
        },
      ]
    : [
        {
          title: "Accountability follow-up",
          description: "Someone keeps your next step clear and helps you stay consistent.",
        },
        {
          title: "Short tasks",
          description: "Simple practical tasks that turn training into a daily habit.",
        },
        {
          title: "Real language use",
          description: "Practice built around situations where you actually need English.",
        },
        {
          title: "Plan adjustments",
          description: "Your pace and focus can be adjusted when your progress needs it.",
        },
      ];

  return (
    <section className="bg-[#391B68] px-6 py-16 text-white lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-2 lg:items-center">
        <AnimatedSection className={isArabic ? "lg:col-start-2 lg:text-right" : ""}>
          <span className="rounded-full bg-white/10 px-4 py-2 text-[13px] font-black text-[#EC911F]">Success Manager</span>
          <h2 className="mt-5 text-3xl font-black leading-tight lg:text-5xl">{copy.successManager.title}</h2>
          <p className="mt-5 text-[17px] font-bold leading-8 text-white/78">{copy.successManager.description}</p>
        </AnimatedSection>

        <div className={`grid gap-4 ${isArabic ? "lg:col-start-1 lg:row-start-1" : ""}`}>
          {cards.map((card, index) => (
            <AnimatedSection key={card.title} delay={index * 70}>
              <div className="strong-card bg-white p-5 text-slate-950 hover:border-[#EC911F]/60 hover:bg-white">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EC911F] text-xl font-black text-white shadow-lg shadow-[#EC911F]/25">
                    ✓
                  </span>
                  <span className="block">
                    <strong className="block text-lg font-black leading-7 text-[#391B68]">{card.title}</strong>
                    <span className="mt-1 block text-[15px] font-bold leading-7 text-slate-600">{card.description}</span>
                  </span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
