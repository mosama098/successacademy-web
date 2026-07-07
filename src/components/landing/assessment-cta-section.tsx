import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

export function AssessmentCtaSection({ locale, copy }: LandingSectionProps) {
  return (
    <section id="assessment" className="bg-white px-6 py-16 lg:px-10 lg:py-24">
      <AnimatedSection className="mx-auto grid max-w-[1180px] gap-8 rounded-[32px] bg-[#391B68] p-7 text-white shadow-2xl shadow-[#391B68]/25 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <div>
          <span className="rounded-full bg-white/10 px-4 py-2 text-[13px] font-black text-[#EC911F]">
            {copy.nav.assessment}
          </span>
          <h2 className="mt-5 text-3xl font-black leading-tight lg:text-5xl">{copy.assessment.title}</h2>
          <p className="mt-5 text-[17px] font-bold leading-8 text-white/80">{copy.assessment.description}</p>
        </div>
        <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-xl">
          <ul className="grid gap-4">
            {copy.assessment.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-[16px] font-black leading-7">
                <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#EC911F]" />
                {bullet}
              </li>
            ))}
          </ul>
          <CtaLink href={bookingHref} locale={locale} source="assessment_section" className="mt-6 h-[56px] w-full">
            {copy.assessment.cta}
          </CtaLink>
        </div>
      </AnimatedSection>
    </section>
  );
}
