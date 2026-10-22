# Phase 4A: enrollment and booking operations

Historical proposal, superseded by [Phase 4B](./PHASE4B.md). Do not provision the extra tabs or collect the extra personal fields below for the current implementation.

## Activation status

Local foundation only. No live spreadsheet is provisioned, no Apps Script is deployed and no payment or notification provider is connected. Existing lead/placement Sheets are not used. The Sheets backend must implement and pass the contract below before accepting real customers. Until then missing configuration or incomplete acknowledgements fail closed with a friendly unavailable response.

## Data ownership and flow

Payment form -> existing Order API -> shared enrollment validator -> server identity context -> OrderService -> coordinated OrderRepository booking commit.

CustomerService prepares an immutable registration snapshot from validated enrollment data and server plan data. CustomerRepository/GoogleSheetsCustomerRepository read it separately by order ID for future authorized operations. Customer writes are deliberately included in the order transaction, not a separate HTTP insert that can leave orphaned customers. No customer API is exposed publicly.

New financial records contain only an opaque customer ID/identity source, never name, phone, WhatsApp, email, age, address or lead reference. The existing nullable Order.customer contact fields are null for new records. Historical orders remain readable; nothing migrates, removes or rewrites existing PII.

Customers is a per-booking registration snapshot keyed uniquely by order_id, with customer_id for joining. A known existing lead can have several booking snapshots. A direct visitor's existing server-generated checkout ID is tied to the retry key. No unauthenticated phone/email merging is performed. This is intake, not identity/phone ownership verification or an authentication system.

## Enrollment validation

Name, Egyptian mobile, Egyptian WhatsApp, email, age, gender, governorate/city, attendance and consent are mandatory. Age is a whole number 1-120, an input sanity range, not an eligibility policy. Gender accepts male, female or prefer_not_to_say. Branch attendance additionally requires a bounded full address and the existing dokki branch. Online registrations discard irrelevant address/branch values.

English level, previous experience and learning goal are optional; learning goals are work/travel/study/conversation/personal_development. Self-reported English level never changes the placement-derived study start. No extra customer attributes are accepted. Course details and monetary snapshots are server-owned. Neither customer details nor access tokens are saved in browser storage.

## Spreadsheet contracts

Exact snake_case columns are exported from server/sheets-schema.ts. API/domain fields remain camelCase; the backend maps them to columns and stores typed values rather than formatted display strings.

- Customers: customer_id, created_at, full_name, phone, whatsapp, email, age, gender, governorate, address, branch, english_level, previous_experience, learning_goal, package_name, start_level, target_level, attendance_type, order_id, payment_status, source, utm_source, utm_campaign, utm_content.
- Promo Codes: promo_id, code, type, value, active, start_date, end_date, max_uses, used_count, allowed_packages, created_at, created_by.
- Promo Usage: usage_id, promo_code, order_id, customer_id, discount_amount, used_at.
- Payment Transactions: transaction_id, order_id, provider, payment_method, amount, status, provider_transaction_id, created_at, updated_at, failure_reason.
- Payment Verification: verification_id, order_id, payment_method, proof_reference, amount, review_status, reviewed_by, review_date, notes.
- Audit Log: event_id, order_id, event_type, old_value, new_value, timestamp, actor.
- Notification Outbox: event_id, order_id, customer_id, event_type, channel, template, created_at, status.

Orders retain package, pricing and legal snapshots, operational status, opaque customer ID, currency, amount, retry hash and request fingerprint. Do not map legacy nullable contact properties into new payment sheets. Preserve marketing attribution in Orders; extra utm_medium/fbclid are available there. Source records identity-context origin; campaign fields are customer/browser assertions, not verified attribution.

Amounts in domain transaction/verification/payment models use integer EGP piastres. Sheet amount columns use EGP and convert exactly once at the adapter boundary; currency is fixed EGP in this phase. Order pricing and discount columns use EGP numbers. Verification maps proofFileId to proof_reference, claimedAmountMinor to amount, status to review_status and reviewedAt to review_date. Proofs must be private file references, not public image URLs. No uploads/review endpoints or transaction writes are activated here.

## Atomic booking protocol

Authenticated server POST to the separately configured private payment endpoint:

`{ secret, domain: "payments", action: "create_booking", payload: { contractVersion: 1, order, event, records: { customer, promoUsage, audit, notification }, promo } }`

1. Validate the secret, schema version, relationships, immutable amounts and contact-free order. Lock the shared order/promo namespace.
2. Resolve idempotency first. Same key/fingerprint returns the original committed booking without new rows or changed snapshots. Same key/different fingerprint is a conflict, never an overwrite. All read actions must hide incomplete journal entries.
3. Revalidate promo definition, time, package, value and usage capacity under the lock. Check unique order usage and the journal count, not just the editable cached counter. Block inconsistent counters/journal state for reconciliation; never silently free usage.
4. Commit Customers, Orders, Payment Events, Audit Log, Notification Outbox and optional Promo Usage/counter as one recoverable booking operation. A simple sequence of appendRow calls is insufficient. LockService alone does not provide crash atomicity: use an atomic batch or durable transaction journal with recovery. Recovery replays the same immutable intent once, never creates a second order or use.
5. Acknowledge only a fully committed booking:

```json
{
  "success": true,
  "data": {
    "order": "<stored Order object>",
    "created": true,
    "bookingCommit": {
      "version": 1,
      "orderId": "<stored order id>",
      "customerId": "<stored customer id>",
      "requestFingerprint": "<stored fingerprint>",
      "customerSaved": true,
      "eventSaved": true,
      "auditSaved": true,
      "notificationPrepared": true,
      "promoUsageId": "<promo-use:orderId or null>"
    }
  }
}
```

The adapter requires these fields even without a promo, and has no fallback to create_order. On retry created is false and all identifiers refer to the original booking. Promo usage ID is deterministically promo-use:orderId. A timeout is an unknown outcome; the UI retains the same retry key. Do not report success or create a fresh key automatically.

commit_booking_transition receives order/event/audit, expectedStatus and customerPaymentStatus. Compare-and-set against expectedStatus, preserve all price/consent/package/customer snapshots, update the Customers payment-status projection and append event/audit together. Return order plus transitionCommit containing auditId, customerUpdated:true and eventSaved:true. No public status-changing endpoint is added. Provider callbacks remain closed.

## Notifications and audit

prepareBookingNotification creates only an admin-email intent with opaque IDs. prepareAdminBookingEmail builds plain text on demand from the separate Customer record: name, phone, email, package, start/target, attendance, payment status, order ID and date. It rejects mismatched customer/order pairs. It does not send, contain HTML, assume a recipient address or claim delivery.

Existing NotificationService interfaces remain the future Email/WhatsApp/Calendar extension points. Intent event types include booking_created/payment_confirmed/enrollment_activated. Future workers must deduplicate by event ID, require verified payment evidence for payment_confirmed, and keep provider delivery IDs and retry state separately. Course enrollment is still distinct from a booking or payment.

Audit records use server IDs/time/actor and operational status only, without PII, secrets, card details or raw request bodies. They are append-only and commit with the associated write. No console/request-body logging is added.

## Before real-customer activation

- Prove atomicity, replay recovery and last-use concurrency against the real Sheets backend, not only mocks.
- Restrict the spreadsheet and endpoint; enforce trusted proxy headers, shared/edge rate limiting, least privilege, backups, retention and access auditing. The existing per-process rate limiter is not distributed abuse prevention.
- A new retry key/device can intentionally create a new booking. Cross-device duplicate detection requires verified identity/business rules; do not merge customer assertions blindly.
- Decide usage-release policy for abandoned/cancelled orders; currently reservations remain consumed.
- Review collection/retention, access and minor-enrollment policy with the business before accepting real sensitive customer data. Existing legal pages are not changed.
- No database, real transactions, notification delivery, enrollment activation, dashboard or provider integrations are included.

## Future dashboard / database

Join by customer_id and order_id. Count distinct customer IDs (not rows) for customers, Orders for bookings, verified paid Orders for revenue, Promo Usage for discounts, and marketing fields for attributed sources. Pending bookings are not revenue. During PostgreSQL migration split customer identities, immutable registration snapshots, orders/pricing, usage, events, outbox and enrollments; add unique idempotency/usage/event keys and foreign keys inside a database transaction. Preserve historical prices and accepted policy versions.

## Validation

Payment tests use in-memory repositories/injected fetch stubs only. They test field validation, conditional branch data, same-key concurrency, immutable snapshots, journal-backed limits, incomplete acknowledgements, private reads and no PII in financial/outbox/audit payloads. They do not prove live Google Sheets atomicity.
