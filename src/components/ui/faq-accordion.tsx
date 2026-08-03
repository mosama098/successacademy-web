"use client";

import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { trackFaqOpen } from "@/lib/tracking";

const headerCopy: Record<Locale, { badge: string; description: string }> = {
  ar: {
    badge: "أسئلة شائعة",
    description: "كل اللي محتاج تعرفه قبل ما تبدأ، في إجابات واضحة وسريعة.",
  },
  en: {
    badge: "Frequently Asked Questions",
    description:
      "Everything you need to know before you start, with clear and straightforward answers.",
  },
};

export function FaqAccordion({
  items,
  locale,
}: {
  items: Array<{ question: string; answer: string }>;
  locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const accordionId = useId().replace(/:/g, "");
  const copy = headerCopy[locale];

  return (
    <div>
      <div className="-mt-5 mb-8 text-center lg:-mt-10 lg:mb-0 lg:flex lg:items-center lg:justify-center lg:gap-4">
        <span className="inline-flex items-center rounded-full border border-[#391B68]/10 bg-[#391B68]/[0.06] px-3.5 py-1.5 text-[13px] font-black text-[#391B68] lg:py-1 lg:text-sm">
          {copy.badge}
        </span>
        <p className="mx-auto mt-3 max-w-[680px] text-[15px] font-semibold leading-7 text-[#391B68]/70 lg:mx-0 lg:mt-0 lg:text-[16px] lg:leading-6">
          {copy.description}
        </p>
      </div>

      <div className="grid auto-rows-min items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {items.map((item, index) => {
          const isOpen = open === index;
          const buttonId = `${accordionId}-faq-${index + 1}-button`;
          const answerId = `${accordionId}-faq-${index + 1}-answer`;

          return (
            <article
              key={item.question}
              className={`self-start overflow-hidden rounded-[20px] border transition-[border-color,background-color,box-shadow] duration-[260ms] motion-reduce:transition-none ${
                isOpen
                  ? "border-[#391B68]/25 bg-[#F7F3FB] shadow-[0_14px_32px_rgba(57,27,104,0.08)]"
                  : "border-[#391B68]/12 bg-white shadow-[0_8px_22px_rgba(57,27,104,0.045)]"
              }`}
            >
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => {
                    setOpen(isOpen ? null : index);
                    if (!isOpen) trackFaqOpen({ locale, question: item.question });
                  }}
                  className="group flex min-h-[74px] w-full scroll-mb-[150px] scroll-mt-24 items-center justify-between gap-3 px-4 py-3 text-start text-[16px] font-black leading-[1.45] text-[#391B68] outline-none transition-colors hover:bg-[#391B68]/[0.025] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#EC911F] md:min-h-[82px] md:px-[18px] lg:min-h-[80px] lg:px-5 lg:text-[17px]"
                >
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition-colors duration-[260ms] motion-reduce:transition-none lg:h-10 lg:w-10 ${
                      isOpen ? "bg-[#EC911F]" : "bg-[#391B68] group-hover:bg-[#391B68]/90"
                    }`}
                  >
                    <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
                    <span
                      className={`absolute h-3.5 w-0.5 rounded-full bg-current transition-transform duration-[260ms] motion-reduce:transition-none ${
                        isOpen ? "scale-y-0" : "scale-y-100"
                      }`}
                    />
                  </span>
                </button>
              </h3>

              <div
                id={answerId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="mx-4 border-t border-[#391B68]/10 pb-4 pt-3 text-[14px] font-semibold leading-7 text-[#391B68]/70 md:mx-[18px] lg:mx-5 lg:pb-[18px] lg:text-[15px]">
                    {item.answer}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
