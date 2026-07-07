import { LeadForm } from "@/components/lead-form";
import { AssessmentCtaSection } from "@/components/landing/assessment-cta-section";
import { DeliverySection } from "@/components/landing/delivery-section";
import { ExperienceVideosSection } from "@/components/landing/experience-videos-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { HeroSection } from "@/components/landing/hero-section";
import { JourneySection } from "@/components/landing/journey-section";
import { Navbar } from "@/components/landing/navbar";
import { ProblemSection } from "@/components/landing/problem-section";
import { SectionShell } from "@/components/landing/section-shell";
import { SuccessManagerSection } from "@/components/landing/success-manager-section";
import { VideoPreviewSection } from "@/components/landing/video-preview-section";
import { PageTracker } from "@/components/page-tracker";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { StickyMobileCta } from "@/components/ui/sticky-mobile-cta";
import { content } from "@/content";
import { localeDirection, type Locale } from "@/lib/i18n";

type LandingPageProps = {
  locale: Locale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const copy = content[locale];

  return (
    <main lang={locale} dir={localeDirection[locale]} className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <PageTracker locale={locale} page="landing" />
      <Navbar locale={locale} copy={copy} />
      <HeroSection locale={locale} copy={copy} />
      <VideoPreviewSection locale={locale} copy={copy} />
      <ProblemSection locale={locale} copy={copy} />
      <JourneySection locale={locale} copy={copy} />
      <ExperienceVideosSection locale={locale} copy={copy} />
      <AssessmentCtaSection locale={locale} copy={copy} />
      <DeliverySection locale={locale} copy={copy} />
      <SuccessManagerSection locale={locale} copy={copy} />
      <LeadForm locale={locale} copy={copy.form} />
      <SectionShell id="faq" title={copy.faq.title} centered>
        <FaqAccordion items={copy.faq.items} locale={locale} />
      </SectionShell>
      <FinalCtaSection locale={locale} copy={copy} />
      <FooterSection locale={locale} copy={copy} />
      <StickyMobileCta locale={locale} copy={copy.sticky} />
    </main>
  );
}
