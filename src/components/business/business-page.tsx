import { CorporateLeadForm } from "@/components/business/corporate-lead-form";
import { CtaLink } from "@/components/ui/cta-link";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";
import { getWhatsAppHref } from "@/lib/utm";

function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrustIcon({ index }: { index: number }) {
  const paths = [
    <><circle key="target-ring" cx="12" cy="12" r="8" /><circle key="target-core" cx="12" cy="12" r="3" /></>,
    <><rect key="screen" x="3" y="5" width="11" height="9" rx="2" /><path key="building" d="M17 9h4v10h-8v-5M6 18h11M8.5 14v4" strokeLinecap="round" /></>,
    <><path key="report" d="M5 3h10l4 4v14H5V3Z" strokeLinejoin="round" /><path key="chart" d="M9 16v-3m3 3V9m3 7v-5" strokeLinecap="round" /></>,
  ];

  return <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{paths[index]}</svg>;
}

function CorporateHeroVisual({ isArabic }: { isArabic: boolean }) {
  return (
    <svg className="h-auto w-full" viewBox="0 0 600 460" fill="none" role="img" aria-label={isArabic ? "تدريب إنجليزي احترافي لفريق عمل" : "Professional English training for a business team"}>
      <rect x="32" y="28" width="536" height="396" rx="28" fill="#FCFBFD" stroke="#D9CEE7" strokeWidth="4" />
      <path d="M33 82h534" stroke="#D9CEE7" strokeWidth="4" />
      <circle cx="65" cy="55" r="7" fill="#EC911F" />
      <circle cx="89" cy="55" r="7" fill="#D9CEE7" />
      <circle cx="113" cy="55" r="7" fill="#391B68" opacity=".35" />

      <rect x="70" y="116" width="314" height="188" rx="18" fill="white" stroke="#CFC2DD" strokeWidth="4" />
      <path d="M100 274h250" stroke="#E7E0EC" strokeWidth="4" strokeLinecap="round" />
      <rect x="106" y="190" width="28" height="62" rx="8" fill="#D9CEE7" />
      <rect x="151" y="164" width="28" height="88" rx="8" fill="#8B70A8" />
      <rect x="196" y="130" width="28" height="122" rx="8" fill="#391B68" />
      <path d="m259 225 32-35 30 18 40-55" stroke="#EC911F" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m342 151 20-1-2 20" stroke="#EC911F" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="410" y="116" width="120" height="144" rx="16" fill="#F1ECF5" />
      <path d="M438 150h64M438 178h48M438 206h58" stroke="#391B68" strokeWidth="8" strokeLinecap="round" opacity=".8" />
      <path d="m443 235 12 11 27-30" stroke="#EC911F" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="145" cy="346" r="24" fill="#6E548D" />
      <path d="M105 406c3-40 18-60 40-60s37 20 40 60" fill="#391B68" />
      <circle cx="258" cy="346" r="24" fill="#EC911F" />
      <path d="M218 406c3-40 18-60 40-60s37 20 40 60" fill="#6E548D" />
      <circle cx="371" cy="346" r="24" fill="#391B68" />
      <path d="M331 406c3-40 18-60 40-60s37 20 40 60" fill="#EC911F" />

      <circle cx="480" cy="324" r="25" fill="#391B68" />
      <path d="M448 405v-46c0-20 13-35 32-35s32 15 32 35v46" fill="#FFFFFF" stroke="#391B68" strokeWidth="6" />
      <path d="m474 363 10 10 22-24" stroke="#EC911F" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BenefitIcon({ index }: { index: number }) {
  const paths = [
    <path key="tailored" d="M4 7h16M7 4v6M4 17h16M16 14v6" strokeLinecap="round" />,
    <><path key="assessment-circle" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path key="assessment-check" d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></>,
    <><rect key="delivery-screen" x="3" y="5" width="12" height="10" rx="2" /><path key="delivery-building" d="M18 9h3v9h-7v-3M6 19h12M9 15v4" strokeLinecap="round" /></>,
    <><circle key="schedule-clock" cx="12" cy="12" r="9" /><path key="schedule-hand" d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></>,
    <><path key="report-page" d="M5 3h10l4 4v14H5V3Z" strokeLinejoin="round" /><path key="report-chart" d="M9 16v-3m3 3V9m3 7v-5" strokeLinecap="round" /></>,
    <><circle key="trainer-head" cx="12" cy="8" r="4" /><path key="trainer-body" d="M4.5 21c.6-5 3-7.5 7.5-7.5s6.9 2.5 7.5 7.5" strokeLinecap="round" /></>,
  ];

  return <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{paths[index]}</svg>;
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
  const coreBenefits = [0, 4];
  const supportingBenefits = [1, 2, 3, 5];

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-[#FBFAFC] px-5 py-11 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <span className="inline-flex rounded-full bg-[#EEE9F4] px-3.5 py-1.5 text-[13px] font-black text-[#391B68]">{copy.badge}</span>
            <h1 className="mt-4 max-w-[680px] whitespace-pre-line text-balance text-[35px] font-black leading-[1.2] text-[#391B68] sm:text-[43px] lg:text-[47px]">{copy.heroTitle}</h1>
            <p className="mt-4 max-w-[650px] text-[15px] font-semibold leading-[1.8] text-[#665A70] sm:text-[16px]">{copy.heroDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaLink href="#corporate-lead-form" locale={locale} source="business_hero" className="!min-h-[50px] !rounded-[14px] !px-6">{copy.heroCta}</CtaLink>
              <CtaLink href={getWhatsAppHref(locale)} locale={locale} source="corporate_hero_whatsapp" event="whatsapp" variant="ghost" className="!inline-flex !min-h-[48px] !items-center !justify-center !rounded-[13px] !border-[#391B68]/18 !bg-white !px-5 !text-[14px] !font-black !text-[#391B68] hover:!border-[#391B68]/40 hover:!bg-[#F4F0F7]">
                {copy.heroSecondaryCta}
              </CtaLink>
            </div>
            <ul className="mt-6 grid gap-0 overflow-hidden rounded-[15px] border border-[#391B68]/10 bg-white min-[430px]:grid-cols-2 sm:grid-cols-3">
              {copy.heroTrust.map((item, index) => (
                <li key={item} className="flex min-h-12 items-center gap-2.5 border-b border-[#391B68]/8 px-3 py-2 text-[12.5px] font-black leading-[1.45] text-[#564563] last:border-b-0 min-[430px]:last:col-span-2 sm:border-b-0 sm:border-e sm:last:col-span-1 sm:last:border-e-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[#EEE9F4] text-[#391B68]"><TrustIcon index={index} /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[480px] lg:max-w-[510px]"><CorporateHeroVisual isArabic={isArabic} /></div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16" aria-labelledby="business-benefits-title">
        <div className="mx-auto max-w-[1160px]">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 id="business-benefits-title" className="text-[30px] font-black leading-[1.25] text-[#391B68] sm:text-[37px]">{copy.benefitsTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.75] text-[#6B5E76] sm:text-[16px]">{copy.benefitsDescription}</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {coreBenefits.map((index) => (
              <article key={copy.benefits[index]} className="flex min-h-[112px] items-center gap-4 rounded-[19px] border border-[#391B68]/22 bg-[#F3EFF7] p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#391B68] text-white"><BenefitIcon index={index} /></span>
                <p className="text-[16px] font-black leading-[1.55] text-[#391B68] sm:text-[17px]">{copy.benefits[index]}</p>
              </article>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {supportingBenefits.map((index) => (
              <article key={copy.benefits[index]} className="flex min-h-[88px] items-center gap-3 rounded-[16px] border border-[#391B68]/11 bg-white p-4 shadow-[0_7px_20px_rgba(57,27,104,0.035)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#EEE9F4] text-[#391B68]"><BenefitIcon index={index} /></span>
                <p className="text-[13.5px] font-black leading-[1.5] text-[#51415E]">{copy.benefits[index]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16" aria-labelledby="business-audience-title">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto max-w-[700px] text-center">
            <h2 id="business-audience-title" className="text-[30px] font-black leading-[1.25] text-[#391B68] sm:text-[37px]">{copy.audienceTitle}</h2>
            <p className="mt-3 text-[15px] font-semibold leading-[1.75] text-[#6B5E76] sm:text-[16px]">{copy.audienceDescription}</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.audience.map((team, index) => {
              const highlighted = index < 2;
              return (
                <article key={team.title} className={`flex min-h-[112px] items-start gap-3.5 rounded-[17px] border p-4 ${highlighted ? "border-[#391B68]/24 bg-[#F4F0F7]" : "border-[#391B68]/11 bg-[#FBFAFC]"}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${highlighted ? "bg-[#391B68] text-white" : "bg-[#EEE9F4] text-[#391B68]"}`}><TeamIcon index={index} /></span>
                  <div>
                    <h3 className="text-[15px] font-black leading-[1.4] text-[#391B68]">{team.title}</h3>
                    <p className="mt-1.5 text-[13px] font-semibold leading-[1.55] text-[#6B5E76]">{team.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16" aria-labelledby="business-process-title">
        <div className="mx-auto max-w-[1160px]">
          <div className="text-center">
            <h2 id="business-process-title" className="text-[30px] font-black leading-[1.25] text-[#391B68] sm:text-[37px]">{copy.processTitle}</h2>
            <p className="mx-auto mt-3 max-w-[660px] text-[15px] font-semibold leading-[1.75] text-[#6B5E76] sm:text-[16px]">{copy.processDescription}</p>
          </div>
          <div className="relative mt-7">
            <span className="absolute bottom-4 start-[19px] top-4 w-px bg-[#CFC2DD] md:hidden" aria-hidden="true" />
            <span className="absolute inset-x-[9%] top-5 hidden h-0.5 bg-[#CFC2DD] md:block" aria-hidden="true" />
            <ol className="relative grid gap-3 md:grid-cols-5" dir={isArabic ? "rtl" : "ltr"}>
              {copy.process.map((step, index) => (
                <li key={step.title} className="relative grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 md:block">
                  <span className={`relative z-10 grid size-10 place-items-center rounded-full border-4 border-[#FBFAFC] text-[12px] font-black text-white md:mx-auto ${index === 0 ? "bg-[#EC911F]" : "bg-[#391B68]"}`} aria-hidden="true">{index + 1}</span>
                  <div className={`rounded-[16px] border px-4 py-3.5 md:mt-3 md:min-h-[130px] md:text-center ${index === 0 ? "border-[#EC911F]/35 bg-[#FFF8EF]" : index === copy.process.length - 1 ? "border-[#391B68]/24 bg-[#F3EFF7]" : "border-[#391B68]/11 bg-white"}`}>
                    <h3 className="text-[14.5px] font-black leading-[1.4] text-[#391B68]">{step.title}</h3>
                    <p className="mt-1.5 text-[12.5px] font-semibold leading-[1.55] text-[#6B5E76]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-[#391B68]/10 bg-[#F8F5FA] px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16" aria-labelledby="corporate-form-title">
        <div className="mx-auto grid max-w-[1160px] gap-6 lg:grid-cols-[minmax(0,1.95fr)_minmax(290px,1fr)] lg:items-start lg:gap-7" dir="ltr">
          <aside className="rounded-[21px] bg-[#391B68] p-6 text-white lg:order-2 lg:sticky lg:top-[108px] lg:p-7" dir={isArabic ? "rtl" : "ltr"}>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-black text-[#FFD9A4]">{copy.form.badge}</span>
            <h2 id="corporate-form-title" className="mt-4 text-[28px] font-black leading-[1.3] sm:text-[31px]">{copy.form.title}</h2>
            <p className="mt-3 text-[14.5px] font-semibold leading-[1.7] text-[#E7DFF1]">{copy.form.description}</p>
            <ul className="mt-5 grid gap-2.5 border-t border-white/15 pt-5">
              {copy.heroTrust.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-[13.5px] font-bold leading-[1.55] text-[#F0EAF5]">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px] bg-white/10 text-[#FFD9A4]"><TrustIcon index={index} /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-[12.5px] font-bold leading-[1.6] text-[#D9CEE7]">{copy.form.privacyReassurance}</p>
          </aside>
          <div className="min-w-0 lg:order-1" dir={isArabic ? "rtl" : "ltr"}><CorporateLeadForm locale={locale} copy={copy.form} /></div>
        </div>
      </section>

      <section className="bg-[#391B68] px-5 py-10 text-center text-white sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <h2 className="text-[28px] font-black leading-[1.3] sm:text-[35px]">{copy.finalTitle}</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-[15px] font-semibold leading-[1.7] text-[#E8E0F2]">{copy.finalDescription}</p>
          <CtaLink href="#corporate-lead-form" locale={locale} source="business_final" className="mt-5 !min-h-[50px] !rounded-[14px] !px-6">{copy.finalCta}</CtaLink>
        </div>
      </section>
    </>
  );
}
