import { CorporateLeadForm } from "@/components/business/corporate-lead-form";
import { CtaLink } from "@/components/ui/cta-link";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CorporateHeroIllustration() {
  return (
    <svg className="h-auto w-full" viewBox="0 0 620 480" fill="none" role="img" aria-label="Corporate English training illustration">
      <rect x="53" y="40" width="514" height="376" rx="44" fill="#F5F1F8" />
      <rect x="112" y="78" width="396" height="228" rx="24" fill="white" stroke="#D9CEE7" strokeWidth="8" />
      <rect x="143" y="108" width="201" height="20" rx="10" fill="#391B68" />
      <rect x="143" y="148" width="127" height="14" rx="7" fill="#CFC2DD" />
      <path d="M155 251h314" stroke="#E6DDEC" strokeWidth="6" strokeLinecap="round" />
      <path d="M174 230v-45M222 230v-27M270 230v-61M318 230v-37" stroke="#EC911F" strokeWidth="18" strokeLinecap="round" />
      <path d="m373 207 31-34 28 19 49-56" stroke="#391B68" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m464 138 17-2-1 18" stroke="#391B68" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="190" cy="334" r="31" fill="#EC911F" />
      <path d="M137 413c3-53 23-79 53-79s50 26 53 79" fill="#391B68" />
      <circle cx="310" cy="334" r="31" fill="#D9CEE7" />
      <path d="M257 413c3-53 23-79 53-79s50 26 53 79" fill="#6D548B" />
      <circle cx="430" cy="334" r="31" fill="#391B68" />
      <path d="M377 413c3-53 23-79 53-79s50 26 53 79" fill="#EC911F" />
      <path d="M82 416h456" stroke="#391B68" strokeWidth="10" strokeLinecap="round" />
      <circle cx="528" cy="86" r="42" fill="#EC911F" />
      <path d="m509 86 13 13 26-29" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BenefitIcon({ index }: { index: number }) {
  const common = "size-5";
  const paths = [
    <path key="tailored" d="M4 7h16M7 4v6M4 17h16M16 14v6" strokeLinecap="round" />,
    <><path key="assessment-circle" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path key="assessment-check" d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></>,
    <><rect key="delivery-screen" x="3" y="5" width="12" height="10" rx="2" /><path key="delivery-building" d="M18 9h3v9h-7v-3M6 19h12M9 15v4" strokeLinecap="round" /></>,
    <><circle key="schedule-clock" cx="12" cy="12" r="9" /><path key="schedule-hand" d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></>,
    <><path key="report-page" d="M5 3h10l4 4v14H5V3Z" strokeLinejoin="round" /><path key="report-chart" d="M9 16v-3m3 3V9m3 7v-5" strokeLinecap="round" /></>,
    <><circle key="trainer-head" cx="12" cy="8" r="4" /><path key="trainer-body" d="M4.5 21c.6-5 3-7.5 7.5-7.5s6.9 2.5 7.5 7.5" strokeLinecap="round" /></>,
  ];

  return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{paths[index]}</svg>;
}

function TeamIcon({ index }: { index: number }) {
  const paths = [
    <path key="sales" d="M4 18 9 13l3 3 8-9m-5 0h5v5" strokeLinecap="round" strokeLinejoin="round" />,
    <><path key="service-headset" d="M4 13v-2a8 8 0 0 1 16 0v2" /><path key="service-ears" d="M4 13h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5ZM17 19c-1 2-3 2-5 2" /></>,
    <><circle key="hr-head" cx="9" cy="8" r="3" /><path key="hr-body" d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M16 8h5m-2.5-2.5v5" strokeLinecap="round" /></>,
    <><path key="management-table" d="M4 20h16M7 20v-7h10v7" /><circle key="management-head" cx="12" cy="7" r="3" /></>,
    <><path key="operations-gear" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path key="operations-spokes" d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" strokeLinecap="round" /></>,
    <><path key="onboarding-door" d="M6 21V4h11v17M10 12h7" /><path key="onboarding-arrow" d="m13 9 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></>,
  ];

  return <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{paths[index]}</svg>;
}

export function BusinessPageContent({ locale }: { locale: Locale }) {
  const copy = sitePagesContent[locale].business;
  const isArabic = locale === "ar";

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]">
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-[#EEE9F4] px-4 py-2 text-[13px] font-black text-[#391B68]">{copy.badge}</span>
            <h1 className="mt-4 text-balance text-[36px] font-black leading-[1.18] text-[#391B68] sm:text-[45px] lg:text-[50px]">{copy.heroTitle}</h1>
            <p className="mt-5 max-w-[650px] text-[16px] font-semibold leading-[1.8] text-[#665A70] sm:text-[17px]">{copy.heroDescription}</p>
            <CtaLink href="#corporate-lead-form" locale={locale} source="business_hero" className="mt-6 !min-h-[52px] !rounded-[15px] !px-6">{copy.heroCta}</CtaLink>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {copy.heroTrust.map((item) => (
                <div key={item} className="flex min-h-12 items-center gap-2 rounded-[13px] border border-[#391B68]/10 bg-[#FBFAFC] px-3 text-[12.5px] font-black leading-[1.45] text-[#564563]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EEE9F4] text-[#391B68]"><CheckIcon className="size-3.5" /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-[500px]" aria-hidden="true"><CorporateHeroIllustration /></div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-benefits-title">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-[680px]">
            <h2 id="business-benefits-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.benefitsTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.benefitsDescription}</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.benefits.map((benefit, index) => {
              const highlighted = index === 0 || index === 4;
              return (
                <div key={benefit} className={`flex min-h-[96px] items-center gap-3 rounded-[18px] border p-4 shadow-[0_8px_24px_rgba(57,27,104,0.045)] ${highlighted ? "border-[#391B68]/24 bg-[#F5F1F8]" : "border-[#391B68]/12 bg-white"}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${highlighted ? "bg-[#391B68] text-white" : "bg-[#EEE9F4] text-[#391B68]"}`}><BenefitIcon index={index} /></span>
                  <p className="text-[14.5px] font-black leading-[1.55] text-[#493A58]">{benefit}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-audience-title">
        <div className="mx-auto grid max-w-[1120px] gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12">
          <div>
            <h2 id="business-audience-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.audienceTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.audienceDescription}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.audience.map((team, index) => {
              const highlighted = index < 2;
              return (
                <div key={team.title} className={`min-h-[128px] rounded-[17px] border p-4 ${highlighted ? "border-[#391B68]/24 bg-[#F5F1F8]" : "border-[#391B68]/12 bg-[#FBFAFC]"}`}>
                  <span className={`grid size-9 place-items-center rounded-[11px] ${highlighted ? "bg-[#391B68] text-white" : "bg-[#EEE9F4] text-[#391B68]"}`}><TeamIcon index={index} /></span>
                  <h3 className="mt-3 text-[15px] font-black leading-[1.4] text-[#391B68]">{team.title}</h3>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-[1.55] text-[#6B5E76]">{team.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[68px]" aria-labelledby="business-process-title">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <h2 id="business-process-title" className="text-[31px] font-black leading-[1.25] text-[#391B68] sm:text-[38px]">{copy.processTitle}</h2>
            <p className="mx-auto mt-3 max-w-[660px] text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.processDescription}</p>
          </div>
          <div className="relative mt-8">
            <div className="absolute inset-x-[8%] top-[22px] hidden h-px bg-[#CFC2DD] md:block" aria-hidden="true" />
            <svg className={`absolute top-[15px] hidden size-4 text-[#EC911F] md:block ${isArabic ? "left-[7%] rotate-180" : "right-[7%]"}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <ol className="relative grid gap-3 md:grid-cols-5" dir={isArabic ? "rtl" : "ltr"}>
              {copy.process.map((step, index) => (
                <li key={step.title} className={`relative rounded-[18px] border p-4 shadow-[0_8px_24px_rgba(57,27,104,0.045)] ${index === 0 ? "border-[#EC911F]/45 bg-[#FFF8EF]" : index === copy.process.length - 1 ? "border-[#391B68]/25 bg-[#F5F1F8]" : "border-[#391B68]/12 bg-white"}`}>
                  <span className={`grid size-11 place-items-center rounded-full text-[13px] font-black text-white ${index === 0 ? "bg-[#EC911F]" : "bg-[#391B68]"}`} aria-hidden="true">{index + 1}</span>
                  <h3 className="mt-4 text-[16px] font-black leading-[1.45] text-[#391B68]">{step.title}</h3>
                  <p className="mt-2 text-[13.5px] font-semibold leading-[1.65] text-[#6B5E76]">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]" aria-labelledby="corporate-form-title">
        <div className="mx-auto grid max-w-[1120px] gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-9">
          <div className="rounded-[22px] bg-[#391B68] p-6 text-white lg:sticky lg:top-[112px] lg:p-8">
            <span className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-black text-[#FFD9A4]">{copy.form.badge}</span>
            <h2 id="corporate-form-title" className="mt-4 text-[30px] font-black leading-[1.3] sm:text-[35px]">{copy.form.title}</h2>
            <p className="mt-4 text-[15px] font-semibold leading-[1.75] text-[#E7DFF1]">{copy.form.description}</p>
            <ul className="mt-6 grid gap-3 border-t border-white/15 pt-5">
              {copy.heroTrust.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13.5px] font-bold leading-[1.6] text-[#E7DFF1]">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[#FFD9A4]"><CheckIcon className="size-3.5" /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <CorporateLeadForm locale={locale} copy={copy.form} />
        </div>
      </section>

      <section className="bg-[#391B68] px-5 py-11 text-center text-white sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-[29px] font-black leading-[1.3] sm:text-[36px]">{copy.finalTitle}</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-[15px] font-semibold leading-[1.75] text-[#E8E0F2] sm:text-[16px]">{copy.finalDescription}</p>
          <CtaLink href="#corporate-lead-form" locale={locale} source="business_final" className="mt-5 !min-h-[52px] !rounded-[15px] !px-6">{copy.finalCta}</CtaLink>
        </div>
      </section>
    </>
  );
}
