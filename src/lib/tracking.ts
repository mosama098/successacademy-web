"use client";

export type TrackingPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: TrackingPayload[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track?: (event: string, payload?: TrackingPayload) => void;
      page?: () => void;
    };
  }
}

function googleEvent(name: string, payload: TrackingPayload = {}) {
  window.dataLayer?.push({ event: name, ...payload });
  window.gtag?.("event", name, payload);
}

function metaEvent(name: string, payload: TrackingPayload = {}, standard = false) {
  window.fbq?.(standard ? "track" : "trackCustom", name, payload);
}

function tiktokEvent(name: string, payload: TrackingPayload = {}) {
  window.ttq?.track?.(name, payload);
}

export function trackPageView(payload: TrackingPayload = {}) {
  googleEvent("page_view", payload);
  window.fbq?.("track", "PageView", payload);
  window.ttq?.page?.();
}

export function trackCTAClick(payload: TrackingPayload = {}) {
  googleEvent("cta_click", payload);
  metaEvent("CTA_Click", payload);
  tiktokEvent("ClickButton", payload);
}

export function trackFormStart(payload: TrackingPayload = {}) {
  googleEvent("lead_form_start", payload);
  metaEvent("LeadFormStart", payload);
  tiktokEvent("ClickButton", payload);
}

export function trackFormSubmit(payload: TrackingPayload = {}) {
  googleEvent("generate_lead", payload);
  metaEvent("Lead", payload, true);
  tiktokEvent("SubmitForm", payload);
}

export function trackWhatsAppClick(payload: TrackingPayload = {}) {
  googleEvent("whatsapp_click", payload);
  metaEvent("Contact", payload, true);
  tiktokEvent("Contact", payload);
}

export function trackRequestCallClick(payload: TrackingPayload = {}) {
  googleEvent("request_call_click", payload);
  metaEvent("RequestCall", payload);
  tiktokEvent("RequestCall", payload);
}

export function trackAssessmentTimeSelect(payload: TrackingPayload = {}) {
  googleEvent("assessment_time_select", payload);
  metaEvent("AssessmentTimeSelect", payload);
  tiktokEvent("AssessmentTimeSelect", payload);
}

export function trackLanguageSwitch(payload: TrackingPayload = {}) {
  googleEvent("language_switch", payload);
  metaEvent("LanguageSwitch", payload);
  tiktokEvent("LanguageSwitch", payload);
}

export function trackFaqOpen(payload: TrackingPayload = {}) {
  googleEvent("faq_open", payload);
  metaEvent("FAQOpen", payload);
  tiktokEvent("FAQOpen", payload);
}

export function trackPlacementTestEvent(
  name:
    | "placement_test_registration_complete"
    | "placement_test_start"
    | "placement_test_section_start"
    | "placement_test_progress"
    | "placement_test_section_complete"
    | "placement_test_confirmation_start"
    | "placement_test_complete"
    | "placement_test_result_view"
    | "placement_test_sales_cta_click",
  payload: TrackingPayload = {},
) {
  googleEvent(name, payload);
  metaEvent(name, payload);
  tiktokEvent(name, payload);
}
