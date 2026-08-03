import { AnimatedSection } from "@/components/ui/animated-section";

export function SectionShell({
  id,
  title,
  subtitle,
  centered,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1180px]">
        <AnimatedSection className={`mb-10 max-w-[760px] ${centered ? "mx-auto text-center" : ""}`}>
          <h2 className="text-3xl font-black leading-tight text-[#391B68] lg:text-5xl">{title}</h2>
          {subtitle ? <p className="mt-5 text-[17px] font-bold leading-8 text-slate-600">{subtitle}</p> : null}
        </AnimatedSection>
        {children}
      </div>
    </section>
  );
}

