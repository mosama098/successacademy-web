import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

export function FinalCtaSection({ locale, copy }: LandingSectionProps) {
  return (
    <section className="bg-[#391B68] px-6 py-16 text-white lg:px-10 lg:py-24">
      <AnimatedSection className="mx-auto max-w-[1180px] text-center">
        <h2 className="mx-auto max-w-[820px] text-3xl font-black leading-tight lg:text-5xl">{copy.cta.title}</h2>
        <p className="mx-auto mt-5 max-w-[760px] text-[17px] font-bold leading-8 text-white/78">{copy.cta.description}</p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <CtaLink href={bookingHref} locale={locale} source="final_cta" className="h-[56px] px-8">
            {copy.cta.primary}
          </CtaLink>
          <CtaLink href={getWhatsAppHref(locale)} locale={locale} source="final_cta" event="whatsapp" variant="secondary" className="h-[56px] px-8">
            {copy.cta.secondary}
          </CtaLink>
        </div>
      </AnimatedSection>
    </section>
  );
}
