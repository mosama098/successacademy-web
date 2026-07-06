"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { trackFaqOpen } from "@/lib/tracking";

export function FaqAccordion({
  items,
  locale,
}: {
  items: Array<{ question: string; answer: string }>;
  locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <button
            key={item.question}
            type="button"
            onClick={() => {
              setOpen(isOpen ? null : index);
              if (!isOpen) trackFaqOpen({ locale, question: item.question });
            }}
            className={`group rounded-xl border p-5 text-start transition duration-300 hover:-translate-y-1 hover:border-[#EC911F]/60 hover:shadow-xl hover:shadow-[#391B68]/8 ${
              isOpen ? "border-[#391B68]/30 bg-[#391B68]/5" : "border-slate-200 bg-white"
            }`}
          >
            <span className="flex items-center justify-between gap-4 text-lg font-black text-[#391B68]">
              {item.question}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#391B68] text-white transition group-hover:bg-[#E32F54]">
                {isOpen ? "−" : "+"}
              </span>
            </span>
            <span
              className={`grid transition-all duration-300 ${isOpen ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <span className="overflow-hidden leading-7 text-slate-600">{item.answer}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
