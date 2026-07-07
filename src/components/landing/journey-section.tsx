import { AnimatedSection } from "@/components/ui/animated-section";
import type { LandingSectionProps } from "./types";

export function JourneySection({ copy }: LandingSectionProps) {
  return (
    <section id="process" className="bg-[#391B68]/[0.06] px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1180px]">
        <AnimatedSection className="mx-auto mb-12 max-w-[760px] text-center">
          <h2 className="text-3xl font-black leading-tight text-[#391B68] lg:text-5xl">{copy.steps.title}</h2>
          <p className="mx-auto mt-5 max-w-[680px] text-[17px] font-bold leading-8 text-slate-600">{copy.steps.subtitle}</p>
        </AnimatedSection>
        <div className="relative grid gap-6 lg:grid-cols-4">
          <div className="absolute left-[10%] right-[10%] top-10 hidden h-1 rounded-full bg-gradient-to-r from-[#EC911F] via-[#E32F54] to-[#391B68] lg:block" />
          {copy.steps.items.map((item, index) => (
            <AnimatedSection key={item.title} delay={index * 90} className="relative">
              <article className="strong-card h-full p-6">
                <span className="mb-5 grid h-16 w-16 place-items-center rounded-full border-8 border-white bg-gradient-to-br from-[#EC911F] to-[#E32F54] text-xl font-black text-white shadow-xl">
                  {index + 1}
                </span>
                <h3 className="text-xl font-black text-[#391B68]">{item.title}</h3>
                <p className="mt-3 text-base font-bold leading-7 text-slate-600">{item.description}</p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
