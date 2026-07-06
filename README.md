# Success Academy Website

Bilingual Arabic/English marketing funnel for Success Academy.

The website is focused on lead capture for a free external English level assessment. It does not include an internal exam, CRM, LMS, TMS, student portal, instructor portal, admin dashboard, or payment flow.

## Routes

- `/` redirects to `/ar`
- `/ar` Arabic landing page
- `/en` English landing page
- `/ar/thank-you` Arabic confirmation page
- `/en/thank-you` English confirmation page
- `/api/leads` lead capture API

## Run locally

```bash
npm install
npm run dev
```

## Production check

```bash
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill only the values you need.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CALL_NUMBER=
LEADS_WEBHOOK_URL=
LEADS_WEBHOOK_SECRET=
```

## Lead webhook

The form submits to `/api/leads`. The API validates the lead, adds metadata and status, then forwards it to `LEADS_WEBHOOK_URL`.

This webhook can be connected to Google Sheets through Google Apps Script, n8n, Make, Zapier, or another automation layer. Keep Google credentials and Sheet IDs outside the frontend.

If `LEADS_WEBHOOK_SECRET` is set, the API sends it as:

```http
x-leads-secret: <secret>
```

If `LEADS_WEBHOOK_URL` is missing in development, the API returns a safe development response and logs the payload. In production, the API returns a configuration error so the UI can show the WhatsApp fallback.

## Tracking

Tracking IDs are optional and loaded only when environment variables exist.

- Google Tag Manager: `NEXT_PUBLIC_GTM_ID`
- Google Analytics 4: `NEXT_PUBLIC_GA4_ID`
- Meta Pixel: `NEXT_PUBLIC_META_PIXEL_ID`
- TikTok Pixel: `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

If both GTM and GA4 IDs are present, GTM is used for Google loading to avoid duplicate page views.

Tracked events include page view, CTA click, form start, assessment time select, successful lead submit, WhatsApp click, request call click, language switch, and FAQ open.
