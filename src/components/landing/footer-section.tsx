import type { LandingSectionProps } from "./types";

export function FooterSection({ copy }: LandingSectionProps) {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 pb-24 lg:px-10 md:pb-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-2 text-[15px] font-bold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-black text-[#391B68]">{copy.footer.slogan}</p>
        <p>{copy.footer.rights}</p>
      </div>
    </footer>
  );
}
