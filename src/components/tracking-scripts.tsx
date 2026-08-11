import Script from "next/script";

const trackingIdPatterns = {
  gtm: /^GTM-[A-Z0-9]{4,20}$/,
  ga4: /^G-[A-Z0-9]{4,20}$/,
  meta: /^\d{5,30}$/,
  tiktok: /^[A-Z0-9]{10,40}$/i,
} as const;

type TrackingIdType = keyof typeof trackingIdPatterns;

export function getValidTrackingId(type: TrackingIdType, value: string | undefined) {
  const candidate = value?.trim();
  return candidate && trackingIdPatterns[type].test(candidate) ? candidate : undefined;
}

export function serializeForInlineScript(value: string) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function TrackingScripts() {
  const gtmId = getValidTrackingId("gtm", process.env.NEXT_PUBLIC_GTM_ID);
  const ga4Id = getValidTrackingId("ga4", process.env.NEXT_PUBLIC_GA4_ID);
  const metaPixelId = getValidTrackingId("meta", process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const tiktokPixelId = getValidTrackingId("tiktok", process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);

  return (
    <>
      {gtmId ? (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
              (function(w,d,s,l,i){var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer",${serializeForInlineScript(gtmId)});
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              title="Google Tag Manager"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {!gtmId && ga4Id ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag("js", new Date());
              gtag("config", ${serializeForInlineScript(ga4Id)}, { send_page_view: false });
            `}
          </Script>
        </>
      ) : null}

      {metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', ${serializeForInlineScript(metaPixelId)});
          `}
        </Script>
      ) : null}

      {tiktokPixelId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
              var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
              var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load(${serializeForInlineScript(tiktokPixelId)});
            }(window, document, 'ttq');
          `}
        </Script>
      ) : null}
    </>
  );
}
