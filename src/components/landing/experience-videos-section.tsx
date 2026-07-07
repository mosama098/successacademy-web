import { AnimatedSection } from "@/components/ui/animated-section";
import { SectionShell } from "./section-shell";
import type { LandingSectionProps } from "./types";
import { VideoFrame } from "./video-frame";

const videoSources = [
  {
    src: "/videos/online-learning.mp4",
    poster: "/videos/online-learning-poster.jpg",
  },
  {
    src: "/videos/practical-training.mp4",
    poster: "/videos/practical-training-poster.jpg",
  },
  {
    src: "/videos/success-manager.mp4",
    poster: "/videos/success-manager-poster.jpg",
  },
];

export function ExperienceVideosSection({ copy }: LandingSectionProps) {
  return (
    <SectionShell title={copy.experienceVideos.title} centered>
      <div className="grid gap-6 lg:grid-cols-3">
        {copy.experienceVideos.items.map((item, index) => (
          <AnimatedSection key={item.title} delay={index * 80}>
            <article className="strong-card h-full overflow-hidden p-4">
              <VideoFrame
                compact
                src={videoSources[index].src}
                poster={videoSources[index].poster}
                title={item.title}
                placeholder={item.placeholder}
              />
              <div className="p-4">
                <h3 className="text-xl font-black text-[#391B68]">{item.title}</h3>
                <p className="mt-2 text-[15px] font-bold leading-7 text-slate-600">{item.description}</p>
              </div>
            </article>
          </AnimatedSection>
        ))}
      </div>
    </SectionShell>
  );
}
