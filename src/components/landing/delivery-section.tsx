import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref } from "./types";
import type { LandingSectionProps } from "./types";

const deliveryCopy = {
  ar: {
    title: "اختار الطريقة اللي تساعدك تلتزم",
    subtitle:
      "سواء جدولك مزدحم أو بتحب الحضور، المهم إن التدريب يكون واضح، عملي، وفيه متابعة تخليك تكمل.",
    onlineLabel: "أونلاين",
    online:
      "مناسب لو يومك مزدحم. تدريب منظم، متابعة، وممارسة عملية من غير ما الموضوع يبقى مجرد مشاهدة محاضرات.",
    onlineBullets: ["مواعيد مرنة", "متابعة واضحة", "مهام قصيرة للتطبيق"],
    branchLabel: "فرع الدقي",
    branch: "مناسب لو الحضور بيساعدك تلتزم أكتر. بيئة تدريب واضحة، تفاعل مباشر، ومواعيد حسب المتاح.",
    branchBullets: ["حضور يساعد على الالتزام", "تدريب وتفاعل مباشر", "خطة مناسبة لمستواك"],
    cta: "اعرف أنسب اختيار ليك",
    note: "ابدأ بالتقييم، وبعدها فريق المتابعة يساعدك تختار الأنسب.",
  },
  en: {
    title: "Choose the format that helps you stay committed",
    subtitle:
      "Whether your schedule is packed or in-person training keeps you focused, the important part is clear, practical training with follow-up that helps you continue.",
    onlineLabel: "Online",
    online:
      "A strong fit if your day is busy. Structured training, follow-up, and practical practice so it does not become just watching lessons.",
    onlineBullets: ["Flexible time options", "Clear follow-up", "Short practice tasks"],
    branchLabel: "Dokki branch",
    branch:
      "A good fit if attending in person helps you stay committed. A clear training environment, direct interaction, and available time options.",
    branchBullets: ["Attendance that supports commitment", "Direct training and interaction", "A plan that fits your level"],
    cta: "Find the right option for you",
    note: "Start with the level check, then the follow-up team helps you choose what fits.",
  },
};

function DeliveryCard({
  marker,
  title,
  text,
  bullets,
}: {
  marker: string;
  title: string;
  text: string;
  bullets: string[];
}) {
  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/80 bg-white p-7 shadow-xl shadow-[#391B68]/8 transition duration-300 hover:-translate-y-1 hover:border-[#EC911F]/40 hover:shadow-2xl hover:shadow-[#391B68]/12">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#EC911F] via-[#E32F54] to-[#391B68] opacity-80" />
      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#391B68] text-xl font-black text-white shadow-lg shadow-[#391B68]/20 transition group-hover:scale-105">
          {marker}
        </span>
        <h3 className="text-2xl font-black text-[#391B68]">{title}</h3>
      </div>
      <p className="text-[16px] font-bold leading-8 text-slate-600">{text}</p>
      <ul className="mt-6 grid gap-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-3 rounded-2xl bg-[#391B68]/5 px-4 py-3 text-sm font-black text-slate-700 transition group-hover:bg-[#EC911F]/10">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EC911F] text-xs text-white">✓</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DeliverySection({ locale, copy }: LandingSectionProps) {
  const sectionCopy = deliveryCopy[locale];

  return (
    <section className="bg-white px-6 py-14 lg:px-10 lg:py-20">
      <AnimatedSection className="mx-auto max-w-[1180px] overflow-hidden rounded-[36px] border border-[#391B68]/10 bg-gradient-to-br from-[#f7f3ff] via-white to-[#fff7ed] p-6 shadow-2xl shadow-[#391B68]/10 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#E32F54] shadow-sm">
              {copy.assessment.cta}
            </span>
            <h2 className="text-3xl font-black leading-tight text-[#391B68] lg:text-5xl">{sectionCopy.title}</h2>
            <p className="mt-5 text-[17px] font-bold leading-8 text-slate-600">{sectionCopy.subtitle}</p>
            <p className="mt-6 rounded-3xl border border-[#391B68]/10 bg-white/75 p-5 text-[15px] font-black leading-7 text-[#391B68]">
              {sectionCopy.note}
            </p>
            <CtaLink href={bookingHref} locale={locale} source="delivery_cta" className="mt-6">
              {sectionCopy.cta}
            </CtaLink>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <DeliveryCard marker="01" title={sectionCopy.onlineLabel} text={sectionCopy.online} bullets={sectionCopy.onlineBullets} />
            <DeliveryCard marker="02" title={sectionCopy.branchLabel} text={sectionCopy.branch} bullets={sectionCopy.branchBullets} />
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
