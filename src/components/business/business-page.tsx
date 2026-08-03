import Image from "next/image";
import { CorporateLeadForm } from "@/components/business/corporate-lead-form";
import { CtaLink } from "@/components/ui/cta-link";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function CheckIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BusinessPageContent({ locale }: { locale: Locale }) {
  const copy = sitePagesContent[locale].business;
  const isArabic = locale === "ar";

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]">
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-[#EEE9F4] px-4 py-2 text-[13px] font-black text-[#391B68]">{copy.badge}</span>
            <h1 className="mt-4 text-balance text-[36px] font-black leading-[1.18] text-[#391B68] sm:text-[45px] lg:text-[52px]">{copy.heroTitle}</h1>
            <p className="mt-5 max-w-[650px] text-[16px] font-semibold leading-[1.8] text-[#665A70] sm:text-[17px]">{copy.heroDescription}</p>
            <CtaLink href="#corporate-lead-form" locale={locale} source="business_hero" className="mt-6 !min-h-[52px] !rounded-[15px] !px-6">
              {copy.heroCta}
            </CtaLink>
          </div>
          <div className="relative mx-auto h-[300px] w-full max-w-[470px] sm:h-[370px] lg:h-[420px]" aria-hidden="true">
            <div className="absolute inset-x-[12%] bottom-[8%] h-[70%] rounded-full bg-[#EEE9F4] opacity-70" />
            <Image
              src="/images/trainer-model.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 440px, 90vw"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-benefits-title">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-[680px]">
            <h2 id="business-benefits-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.benefitsTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.benefitsDescription}</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.benefits.map((benefit) => (
              <div key={benefit} className="flex min-h-[92px] items-center gap-3 rounded-[18px] border border-[#391B68]/12 bg-white p-4 shadow-[0_8px_24px_rgba(57,27,104,0.045)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#EEE9F4] text-[#391B68]"><CheckIcon /></span>
                <p className="text-[14.5px] font-black leading-[1.55] text-[#493A58]">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-audience-title">
        <div className="mx-auto grid max-w-[1120px] gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12">
          <div>
            <h2 id="business-audience-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.audienceTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.audienceDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {copy.audience.map((team) => (
              <div key={team} className="grid min-h-[74px] place-items-center rounded-[16px] border border-[#391B68]/12 bg-[#FBFAFC] px-3 text-center text-[14px] font-black leading-[1.45] text-[#391B68]">
                {team}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-process-title">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <h2 id="business-process-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.processTitle}</h2>
            <p className="mx-auto mt-3 max-w-[660px] text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.processDescription}</p>
          </div>
          <ol className="mt-8 grid gap-3 md:grid-cols-5">
            {copy.process.map((step, index) => (
              <li key={step.title} className="rounded-[18px] border border-[#391B68]/12 bg-white p-4 shadow-[0_8px_24px_rgba(57,27,104,0.045)]">
                <span className="grid size-9 place-items-center rounded-full bg-[#391B68] text-[13px] font-black text-white" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-4 text-[16px] font-black leading-[1.45] text-[#391B68]">{step.title}</h3>
                <p className="mt-2 text-[13.5px] font-semibold leading-[1.65] text-[#6B5E76]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]" aria-labelledby="corporate-form-title">
        <div className="mx-auto grid max-w-[1120px] gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-9">
          <div className="rounded-[22px] bg-[#391B68] p-6 text-white lg:sticky lg:top-[112px] lg:p-8">
            <span className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-black text-[#FFD9A4]">{copy.form.badge}</span>
            <h2 id="corporate-form-title" className="mt-4 text-[30px] font-black leading-[1.3] sm:text-[35px]">{copy.form.title}</h2>
            <p className="mt-4 text-[15px] font-semibold leading-[1.75] text-[#E7DFF1]">{copy.form.description}</p>
            <div className="mt-6 border-t border-white/15 pt-5 text-[13.5px] font-bold leading-[1.7] text-[#D7CBE6]">
              {isArabic ? "هنراجع طلبك ونرتب معاك مكالمة قصيرة لفهم احتياج الفريق." : "We will review your request and arrange a short conversation to understand your team’s needs."}
            </div>
          </div>
          <CorporateLeadForm locale={locale} copy={copy.form} />
        </div>
      </section>

      <section className="bg-[#391B68] px-5 py-11 text-center text-white sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-[29px] font-black leading-[1.3] sm:text-[36px]">{copy.finalTitle}</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-[15px] font-semibold leading-[1.75] text-[#E8E0F2] sm:text-[16px]">{copy.finalDescription}</p>
          <CtaLink href="#corporate-lead-form" locale={locale} source="business_final" className="mt-5 !min-h-[52px] !rounded-[15px] !px-6">
            {copy.finalCta}
          </CtaLink>
        </div>
      </section>
    </>
  );
}
