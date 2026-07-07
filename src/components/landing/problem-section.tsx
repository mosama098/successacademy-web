import { AnimatedSection } from "@/components/ui/animated-section";
import { SectionShell } from "./section-shell";
import type { LandingSectionProps } from "./types";

export function ProblemSection({ copy }: LandingSectionProps) {
  return (
    <SectionShell id="why" title={copy.why.title} subtitle={copy.why.subtitle} centered>
      <div className="grid gap-6 md:grid-cols-3">
        {copy.why.items.map((item, index) => (
          <AnimatedSection key={item.title} delay={index * 80}>
            <article className="strong-card h-full p-8">
              <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#391B68] text-xl font-black text-white shadow-lg shadow-[#391B68]/20">
                {index + 1}
              </span>
              <h3 className="text-xl font-black leading-7 text-[#391B68]">{item.title}</h3>
              <p className="mt-4 text-base font-bold leading-8 text-slate-600">{item.description}</p>
            </article>
          </AnimatedSection>
        ))}
      </div>
    </SectionShell>
  );
}
