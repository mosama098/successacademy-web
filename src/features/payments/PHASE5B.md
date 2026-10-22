# Phase 5B: customer-facing manual payments

Phase 5B adds public payment instructions for InstaPay, Vodafone Cash and the Success Academy Dokki branch. Public business details live in `manual-payment-config.ts`; pricing and status remain server-authoritative. InstaPay and Vodafone Cash still require the existing signed private proof-upload flow. A proof upload records a Pending / Waiting Review booking and never confirms payment.

Branch bookings require no proof. The displayed 72-hour hold is customer-facing policy copy only. This phase does not add an expiry timestamp, scheduled job, automatic cancellation, new Sheet state or background infrastructure. Branch orders continue to use Payment_Status `Pending` and Payment_Verification `Waiting Review` until an authorized reviewer records the real branch payment through the existing workflow.

The existing Apps Script lock / Next.js timeout reliability investigation remains a separate production-hardening item. Phase 5B does not change ScriptLock behavior, retries, storage contracts, Google Sheets schema, status reconstruction, idempotency, promo logic or order-access security.

No PayTabs, EasyKash, notification delivery or automatic enrollment is introduced here.
