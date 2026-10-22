# Meta Purchase delivery

Meta Purchase is a server-only side effect of the first authoritative Paid transition. Browser returns, status reads, proof uploads, pending callbacks, and payment initiation never create Purchase events.

## Flow

```text
verified provider callback / guarded manual approval
  -> authoritative Paid state flushed under the Apps Script lock
  -> deterministic outbox row recorded in a fail-open second write
  -> payment lock released
  -> authenticated drain wake-up
  -> server reloads the authoritative order and booking customer
  -> Meta Conversions API
  -> delivered, retryable, or permanent outbox state
```

The stable event ID is `meta:purchase:<Booking_ID>`. Retries reuse it, allowing Meta to deduplicate a response that was accepted upstream before the local delivery acknowledgement was saved.

The payment write is authoritative and is flushed before the outbox write. A missing, unavailable, or invalid tracking sheet therefore cannot reject or roll back a valid Paid transition. An order-specific drain claim repairs a missing row from the authoritative Paid booking, and each scheduled batch first reconciles any other missing deterministic jobs before delivery.

`custom_data.value` is deliberately fixed at `1000` and `currency` is `EGP`. This is an advertising measurement value only. The real booking price, promo-adjusted final price, and provider charge remain unchanged.

## Application environment

Server-only variables:

- `META_CAPI_ACCESS_TOKEN`
- `META_CAPI_DATASET_ID` (`META_CAPI_PIXEL_ID` is accepted as a legacy fallback)
- `META_PURCHASE_VALUE_EGP=1000`
- `META_CAPI_TEST_EVENT_CODE` (optional, staging verification only)
- `META_CAPI_DRAIN_SECRET` (at least 32 characters)
- `NEXT_PUBLIC_SITE_URL` (the canonical HTTPS production origin)

The sender uses `POST https://graph.facebook.com/v26.0/<dataset-id>/events` and passes the access token in the server-side `Authorization` header. Raw identity is never logged. Normalized email and phone are SHA-256 hashed before delivery.

## Apps Script properties

Apps Script does not contain Meta credentials. Configure only:

- `META_PURCHASE_DRAIN_URL=https://<production-origin>/api/payments/meta/drain`
- `META_PURCHASE_DRAIN_SECRET` (must exactly match the application variable)

Run `setupPaymentAdminReview()` once after installing the complete Apps Script source. It creates and protects the `Meta Purchase Outbox` sheet without changing the 30-column `Bookings` contract.

## Retry operation

Provider callbacks attempt one drain after the Paid transition. Manual approvals send one authenticated wake-up after releasing `ScriptLock`. Configure a scheduler to run every minute and POST `{ "limit": 10 }` to `/api/payments/meta/drain` with header `X-Success-Academy-Meta-Drain-Secret` so transient pending rows are retried without an always-running worker.

Transient network, timeout, rate-limit, and 5xx failures remain pending with capped backoff. Claims use a five-minute lease so the bounded order/customer reads, Meta request, and completion write cannot normally overlap another worker; an expired lease is recovered automatically. Invalid 4xx requests become `permanent_failure`; after correcting configuration, an authenticated POST with `{ "orderId": "<Booking_ID>", "retryPermanent": true }` requeues only that permanent failure. It cannot reset an active or pending job. Payment state is never reverted by either outcome.

## Provider callback configuration

- PayTabs receives `${NEXT_PUBLIC_SITE_URL}/api/payments/paytabs/callback` in every payment request. The browser return is `${NEXT_PUBLIC_SITE_URL}/api/payments/paytabs/return?...`.
- EasyKash receives only the browser return URL in the DirectPay request. Configure the merchant account callback to `${NEXT_PUBLIC_SITE_URL}/api/payments/easykash/callback`.

Provider browser returns remain UX-only redirects to the secured payment status page.
