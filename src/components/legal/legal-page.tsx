import { Fragment } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { sitePagesContent } from "@/content/site-pages";
import { trainingRules, TRAINING_TERMS_VERSION } from "@/content/training-rules";
import type { Locale } from "@/lib/i18n";
import { getCallHref, getWhatsAppHref, getWhatsAppMessage } from "@/lib/utm";

export function LegalPageContent({ locale }: { locale: Locale }) {
  const copy = sitePagesContent[locale].legal;

  return (
    <>
      <header className="border-b border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]">
        <div className="mx-auto max-w-[980px] text-center">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-4 py-2 text-[13px] font-black text-[#391B68]">
            {copy.badge}
          </span>
          <h1 className="mt-4 text-balance text-[34px] font-black leading-[1.2] text-[#391B68] sm:text-[42px] lg:text-[48px]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[680px] text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">
            {copy.description}
          </p>
          <p className="mt-4 text-[13px] font-bold text-[#82758B]">{copy.updated}</p>
        </div>
      </header>

      <div className="px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1100px] gap-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
          <nav
            aria-label={copy.navigationLabel}
            className="rounded-[20px] border border-[#391B68]/12 bg-white p-4 shadow-[0_10px_30px_rgba(57,27,104,0.05)] lg:sticky lg:top-[112px]"
          >
            <p className="mb-3 px-2 text-[14px] font-black text-[#391B68]">{copy.navigationLabel}</p>
            <ul className="grid grid-cols-1 gap-1.5 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-1">
              {copy.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-10 items-center rounded-xl border border-transparent px-3 py-2 text-[13.5px] font-bold leading-[1.4] text-[#665A70] transition-colors hover:border-[#391B68]/12 hover:bg-[#EEE9F4] hover:text-[#391B68] active:bg-[#DDD3E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid gap-4">
            {copy.sections.map((section) => (
              <Fragment key={section.id}>
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-[20px] border border-[#391B68]/12 bg-white p-5 shadow-[0_10px_30px_rgba(57,27,104,0.045)] sm:p-7"
                aria-labelledby={`${section.id}-heading`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                  <h2 id={`${section.id}-heading`} className="text-[24px] font-black leading-[1.4] text-[#391B68] sm:text-[27px]">{section.title}</h2>
                </div>
                <div className="mt-3 grid gap-3 text-[15px] font-medium leading-[1.85] text-[#5F5369] sm:text-[16px]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items ? (
                    <ul className="grid gap-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-[0.75em] size-1.5 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {section.id === "contact" ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <CtaLink
                      href={getWhatsAppHref(locale, getWhatsAppMessage(locale, "legal"))}
                      locale={locale}
                      source="legal_whatsapp"
                      event="whatsapp"
                      className="!min-h-[50px] !rounded-[14px] !px-4 !py-3"
                    >
                      {copy.whatsapp}
                    </CtaLink>
                    <CtaLink
                      href={getCallHref()}
                      locale={locale}
                      source="legal_call"
                      event="request_call"
                      variant="ghost"
                      className="!flex !min-h-[50px] !items-center !justify-center !rounded-[14px] !border-[#391B68]/30 !bg-white !text-[15px] !text-[#391B68] hover:!bg-[#EEE9F4]"
                    >
                      {copy.call}
                    </CtaLink>
                  </div>
                ) : null}
              </section>
              {section.id === "terms" ? <TrainingRulesSection /> : null}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TrainingRulesSection() {
  return (
    <section
      id="training-rules"
      lang="ar"
      dir="rtl"
      data-policy-version={TRAINING_TERMS_VERSION}
      className="min-w-0 scroll-mt-28 rounded-[20px] border border-[#391B68]/12 bg-white p-5 shadow-[0_10px_30px_rgba(57,27,104,0.045)] sm:p-7"
      aria-labelledby="training-rules-heading"
    >
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
        <h2 id="training-rules-heading" className="text-[24px] font-black leading-[1.4] text-[#391B68] sm:text-[27px]">{trainingRules.title}</h2>
      </div>
      <div className="mt-5 grid gap-6 text-[15px] font-medium leading-[1.85] text-[#5F5369] sm:text-[16px]">
        {trainingRules.groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[17px] font-black leading-[1.6] text-[#391B68] sm:text-[18px]">{group.title}</h3>
            <ol start={group.clauses[0].number} className="mt-3 grid list-decimal gap-3 ps-6">
              {group.clauses.map((clause) => (
                <li key={clause.number} value={clause.number} className="ps-1">
                  <strong>{clause.title}:</strong>{" "}
                  {clause.body.map((part, index) => typeof part === "string" ? part : <strong key={index}>{part.strong}</strong>)}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
