# Success Academy Website

Bilingual Arabic/English marketing funnel for Success Academy.

The website combines the Success Academy marketing funnel with a secure English placement assessment. It does not include a CRM, LMS, TMS, student portal, instructor portal, admin dashboard, or payment flow.

## Routes

- `/` redirects to `/ar`
- `/ar` Arabic landing page
- `/en` English landing page
- `/ar/thank-you` Arabic confirmation page
- `/en/thank-you` English confirmation page
- `/ar/placement-test` Arabic placement registration
- `/en/placement-test` English placement registration
- `/ar/placement-test/assessment` Arabic assessment experience
- `/en/placement-test/assessment` English assessment experience
- `/api/leads` lead capture API
- `/api/placement-test/attempt` secure attempt state and answer API

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
Keep `.env.local` untracked, and configure the same values in the production hosting platform. Restart the local server or redeploy after changing environment variables.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CALL_NUMBER=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_TIKTOK_URL=
NEXT_PUBLIC_YOUTUBE_URL=
NEXT_PUBLIC_LINKEDIN_URL=
LEADS_WEBHOOK_URL=
LEADS_WEBHOOK_SECRET=
PLACEMENT_TEST_DATA_DIR=
```

## Lead webhook

The form submits to `/api/leads`. The API validates the lead, adds metadata and status, then forwards it to `LEADS_WEBHOOK_URL`.

This webhook can be connected to Google Sheets through Google Apps Script, n8n, Make, Zapier, or another automation layer. Keep Google credentials and Sheet IDs outside the frontend.

`LEADS_WEBHOOK_URL` and `LEADS_WEBHOOK_SECRET` are server-only variables. The API includes the secret only in the server-to-server JSON payload sent to the webhook. Never expose either value through a `NEXT_PUBLIC_` variable.

If either webhook variable is missing, the API returns a configuration error and does not forward or simulate a successful lead submission.

## Tracking

Tracking IDs are optional and loaded only when environment variables exist.

- Google Tag Manager: `NEXT_PUBLIC_GTM_ID`
- Google Analytics 4: `NEXT_PUBLIC_GA4_ID`
- Meta Pixel: `NEXT_PUBLIC_META_PIXEL_ID`
- TikTok Pixel: `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

GA4 is currently managed through Google Tag Manager. Keep `NEXT_PUBLIC_GA4_ID` empty while the GA4 tag is installed in GTM. If both IDs are configured, the application loads GTM only and suppresses the direct GA4 loader to avoid duplicate page views.

Tracked events include page view, CTA click, form start, assessment time select, successful lead submit, WhatsApp click, request call click, language switch, and FAQ open.

## Placement assessment persistence

Placement attempts are stored server-side as one atomic JSON record per opaque attempt-token hash.
The records contain an opaque lead reference rather than the student's name, phone number, or email.

- Development defaults to `.data/placement-test`.
- Production defaults to `/app/data/placement-test`.
- `PLACEMENT_TEST_DATA_DIR` may override the server-only path when needed.
- Production mounts `/opt/successacademy-web/.placement-data` at the default container path so
  autosaved answers and resume state survive container replacement.

Keep this directory private and writable only by the deployment/runtime account. It must never be
served as a public asset directory.
