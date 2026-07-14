import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";
import { VideoFrame } from "./video-frame";

export function VideoPreviewSection({ locale, copy }: LandingSectionProps) {
  return (
    <section className="bg-white px-6 py-14 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <AnimatedSection>
          <span className="mx-auto flex w-[calc(100%-32px)] max-w-full items-center justify-center whitespace-normal rounded-full bg-[#391B68]/10 px-3 py-2 text-center text-[11px] font-black leading-5 text-[#391B68] sm:w-auto sm:max-w-max sm:px-4 sm:text-[13px] lg:mx-0 lg:inline-flex">
            {copy.hero.eyebrow}
          </span>
          <h2 className="mt-5 text-center text-3xl font-black leading-tight text-[#391B68] lg:text-start lg:text-5xl">{copy.videoPreview.title}</h2>
          <p className="mt-5 text-[17px] font-bold leading-8 text-slate-600">{copy.videoPreview.subtitle}</p>
          <CtaLink href={bookingHref} locale={locale} source="video_preview" className="mt-7 h-[56px] px-8">
            {copy.videoPreview.cta}
          </CtaLink>
        </AnimatedSection>
        <AnimatedSection delay={90}>
          <VideoFrame
            src="/videos/hero-journey.mp4"
            poster="/videos/hero-journey-poster.jpg"
            title={copy.videoPreview.title}
            placeholder={copy.videoPreview.placeholder}
          />
        </AnimatedSection>
      </div>
    </section>
  );
}

