# Phase 6A notification events

Phase 6A emits authenticated server-to-server events only. It does not send email, Telegram or WhatsApp itself and does not change booking, proof, pricing, approval or status-storage behavior.

## Architecture

```text
Checkout -> Next.js order API -> Google Sheets booking commit
                                      |
                                      +-> booking.created -> n8n webhook

Admin Sheet edit -> paymentAdminOnEdit -> Paid/Approved or Rejected/Rejected commit
                                              |
                                              +-> payment.approved/payment.rejected -> n8n webhook

n8n webhook -> authenticate -> validate v1 -> persistent eventId dedup -> eventType switch
                                                               |-> Brevo customer email
                                                               |-> Brevo admin email
                                                               +-> Telegram admin message
```

The business write is authoritative. Next.js waits for the Sheets booking acknowledgement before delivery. Apps Script writes and flushes the status pair under `ScriptLock`, releases the lock, and only then calls n8n. Notification errors are sanitized and fail open: they never roll back a booking or payment decision, change a customer response, or create a second booking.

Delivery is at least once. An idempotent checkout retry can resend the same logical event after a previous timeout. n8n must persist event IDs before sending any channel message.

## Configuration

Next.js server environment only:

```text
NOTIFICATIONS_WEBHOOK_URL=
NOTIFICATIONS_WEBHOOK_SECRET=
```

Apps Script Properties use the same exact names and values:

```text
NOTIFICATIONS_WEBHOOK_URL
NOTIFICATIONS_WEBHOOK_SECRET
```

Use an HTTPS n8n production webhook URL and a dedicated random secret of at least 32 characters. Requests use `X-Success-Academy-Webhook-Secret: <secret>` with the raw secret value and no Bearer prefix. The secret is never in a query string, payload, browser bundle or log. No `NEXT_PUBLIC_*` notification variable is permitted. Next.js aborts delivery after 2.5 seconds. Apps Script does not expose a configurable request timeout; its synchronous `UrlFetchApp` call occurs after lock release, and n8n should acknowledge quickly before doing channel work asynchronously.

## Event contract v1

Every event has this exact top-level shape:

```json
{
  "version": 1,
  "eventId": "notification:booking.created:<Booking_ID>",
  "eventType": "booking.created",
  "occurredAt": "ISO-8601 timestamp",
  "source": "checkout",
  "booking": {
    "bookingId": "Booking_ID",
    "reference": "SA-XXXXXXXX",
    "locale": "ar",
    "createdAt": "ISO-8601 timestamp",
    "package": "package display name",
    "startLevel": "A1",
    "targetLevel": "B2",
    "hours": 120,
    "sessions": 40,
    "attendanceType": "online",
    "originalPriceEgp": 7000,
    "promoCode": null,
    "discountAmountEgp": 0,
    "finalPriceEgp": 7000,
    "paymentMethod": "instapay",
    "paymentStatus": "Pending",
    "paymentVerification": "Waiting Review",
    "paymentContext": {
      "kind": "manual_transfer",
      "proofReceived": true,
      "reservationHours": null,
      "branchAddress": null,
      "branchMapsUrl": null,
      "branchWorkingHours": null
    }
  },
  "customer": {
    "fullName": "approved customer field",
    "phone": "approved customer field",
    "whatsapp": "approved customer field",
    "email": "approved customer field"
  }
}
```

`eventType` is one of `booking.created`, `payment.approved`, or `payment.rejected`. `source` is `checkout` for creation and `payment_admin` for payment decisions. The version-1 contract retains `payment_admin` for compatibility when an authenticated PayTabs or EasyKash callback makes the decision; provider decisions are distinguished by `paymentMethod: card` or `installments` and `paymentVerification: Not Required`.

Branch events use `paymentContext.kind: branch`, `proofReceived: false`, `reservationHours: 72`, the Dokki address, Maps URL, and daily/Friday hours. InstaPay and Vodafone use `manual_transfer` and communicate whether proof was received without disclosing its location. Non-manual payments use `payment_preference` with `paymentVerification: Not Required`; for card and installment decisions the authenticated gateway callback, never the browser return, is authoritative.

Only `fullName`, `phone`, `whatsapp`, and `email` are authorized customer fields. `Payment_Proof_URL` is deliberately omitted from every event, including internal admin notifications. `Order_Snapshot`, idempotency hashes/keys, request fingerprints, access tokens, secrets, raw answers and credentials are prohibited.

## Stable IDs and duplicate suppression

IDs are deterministic:

```text
notification:booking.created:<Booking_ID>
notification:payment.approved:<Booking_ID>
notification:payment.rejected:<Booking_ID>
```

In Phase 6B, n8n must authenticate and validate first, then atomically insert `eventId` into a persistent Data Table/Data Store with a unique key. If it already exists, return a successful duplicate acknowledgement without sending. Do not use workflow memory or execution-local static data. Record only the event ID, type, received timestamp and final routing status needed for operations; do not duplicate the customer payload unnecessarily.

## n8n Phase 6B blueprint

1. Create one production Webhook node accepting POST only.
2. Check the `X-Success-Academy-Webhook-Secret` header against the dedicated n8n credential/secret. Reject missing or incorrect values before processing the body.
3. Validate `version === 1`, allowlisted `eventType` and `source`, required booking fields, locale, payment status pair, and exactly the four allowed customer fields. Reject unknown sensitive fields.
4. Insert `eventId` into a persistent n8n Data Table/Data Store using a unique key. Stop successfully on duplicates.
5. Switch on `eventType`.
6. Build locale-specific customer email data. Never pass customer PII to Telegram beyond the minimum internal template below.
7. Send the customer email through Brevo, then both admin emails, then the concise Arabic Telegram message. Record per-channel outcome in the persistent event record.
8. Return a fast 2xx acknowledgement. Configure controlled n8n retries around channel nodes without re-entering the webhook or bypassing event deduplication.

Do not connect n8n during Phase 6A and do not assume credentials already exist.

## Message requirements

For an InstaPay/Vodafone `booking.created` customer email, use the booking locale and include booking received, friendly reference, package, final amount, method, proof received, payment under review, and confirmation to follow. Never claim Paid.

For Branch creation, state that no online charge occurred, the booking is held for 72 hours, payment is completed at the Dokki branch, and include:

- `54 شارع مصدق – الدور الأول – امام هارديز – الدقي الجيزة`
- `https://share.google/FG28DyvPaSVj6KpWj`
- Every day 1:00 PM to 9:00 PM; Friday closed.

For `payment.approved`, use the booking locale and say payment and booking are confirmed, with reference, package, amount and method. For `payment.rejected`, use calm language: verification was not possible, review the transaction details or contact normal customer service, with reference, amount and method. Do not use fraud language.

Admin email recipients are `Sergen0098@gmail.com` and `ahmedosos449@gmail.com`. Admin Telegram can be Arabic only and should contain event heading, reference, customer name, phone, package, amount, method and state. It must not dump the full event. No proof URL is available by design.

## Brevo setup

Keep the Brevo API credential only in n8n. Configure the verified sender as `Success Academy <info@successacademy.training>`. Route the customer email to the event `customer.email` and choose Arabic/English from `booking.locale`. Configure the two admin recipients separately. Never add a Brevo key to Next.js ENV, Apps Script Properties or source code.

## Telegram setup

1. Create a bot with BotFather.
2. Create or select a private admin chat/group and add the bot.
3. Obtain the chat ID using Telegram's supported update/API flow without posting it publicly.
4. Store the bot token as an n8n Telegram credential and the chat ID in n8n configuration.
5. Test with synthetic data, then restrict bot/group membership.

Never put the bot token or chat ID in this repository, Next.js ENV, Apps Script Properties, event payloads or logs.

## Observability and failure behavior

Logs contain only `eventType`, `eventId`, result, HTTP status, elapsed time and a safe diagnostic code. They never contain customer fields, payload/body, authorization header, secret, proof information or exception text. n8n unavailability leaves the committed business state intact. Phase 6A has no notification outbox or automatic application retry; idempotent checkout replay resends the stable creation event, while n8n owns channel retries and persistent deduplication.

## Manual Phase 6B checklist

- Create the n8n production webhook and authentication check.
- Generate one dedicated 32+ character shared secret and configure it in n8n, Next.js server ENV and Apps Script Properties.
- Configure a persistent unique `eventId` table and duplicate path.
- Add strict v1 schema validation and reject unexpected customer fields.
- Configure Brevo sender, customer locale templates and the two admin recipients.
- Create/configure the private Telegram bot/chat and concise Arabic templates.
- Test all three event types with synthetic records, duplicate deliveries, n8n downtime and channel failures.
- Confirm customer templates never receive internal-only data and that no logs contain PII.
- Update the existing Apps Script deployment/trigger code and production server configuration only during a separately approved deployment task.
- Add WhatsApp later as an n8n route; do not modify booking or payment core for it.
