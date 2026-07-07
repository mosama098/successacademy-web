import type { LandingContent } from "@/content";

export function FormAside({ copy, isArabic }: { copy: LandingContent["form"]; isArabic: boolean }) {
  const bullets = isArabic
    ? ["بياناتك لفريق المتابعة فقط", "التقييم مجاني وخارجي", "البرامج تبدأ من 1750 جنيه"]
    : ["Your details go only to the team", "The level check is free and external", "Programs start from 1750 EGP"];

  return (
    <aside className={`order-2 ${isArabic ? "lg:col-start-2" : ""} rounded-[32px] bg-[#391B68] p-8 text-white shadow-2xl shadow-[#391B68]/25 lg:sticky lg:top-28 lg:order-none`}>
      <span className="rounded-full bg-white/10 px-4 py-2 text-[13px] font-black text-[#EC911F]">
        {isArabic ? "تسجيل التقييم" : "Assessment registration"}
      </span>
      <h2 className="mt-6 text-3xl font-black leading-tight lg:text-4xl">{copy.title}</h2>
      <p className="mt-4 text-[17px] font-bold leading-8 text-white/78">{copy.subtitle}</p>
      <div className="mt-7 grid gap-4">
        {bullets.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-[16px] font-black">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EC911F] text-white">✓</span>
            {item}
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-white p-4 text-[15px] font-black leading-7 text-[#391B68]">{copy.fallback}</p>
    </aside>
  );
}
