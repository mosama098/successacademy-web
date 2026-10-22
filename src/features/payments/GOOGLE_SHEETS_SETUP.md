# Payment Bookings Google Sheets setup

This integration is separate from the existing lead and placement webhook. Never point `PAYMENTS_SHEETS_WEBHOOK_URL` at `LEADS_WEBHOOK_URL`.

## Required server environment

- `PAYMENTS_SHEETS_WEBHOOK_URL`: deployed payment Apps Script web-app URL.
- `PAYMENTS_SHEETS_WEBHOOK_SECRET`: a dedicated random secret shared only with the payment Apps Script.
- `PAYMENTS_ORDER_ACCESS_SECRET`: a separate random secret of at least 32 characters. Domain-separated HMAC signatures also use it for 20-minute proof receipts.

No Spreadsheet or Drive folder ID is used by the Next.js application. The Apps Script in `scripts/google-apps-script/payment-bookings-webhook.gs` may be created from the new `Success Academy System` spreadsheet, but web-app requests always use `SpreadsheetApp.openById` with the Script Property `PAYMENTS_SPREADSHEET_ID`. There is no active-spreadsheet fallback.

## Spreadsheet tabs

Keep the three payment data tabs below. `setupPaymentAdminReview()` creates the fourth protected system tab used for conversion delivery:

1. `Bookings`
2. `Promo Codes`
3. `Promo Usage`
4. `Meta Purchase Outbox` (created/protected by setup; do not add customer fields)

`Bookings` header row:

```text
Booking_ID | Created_At | Full_Name | Phone | WhatsApp | Email | Age | Package | Start_Level | Target_Level | Hours | Sessions | Attendance_Type | Original_Price | Promo_Code | Discount_Amount | Final_Price | Payment_Method | Payment_Status | Payment_Verification | Payment_Proof_URL | Admin_Notes | Customer_Notes | Order_Snapshot | Idempotency_Key_Hash | Request_Fingerprint | Payment_Provider | Provider_Transaction_ID | Payment_Redirect_URL | Payment_Updated_At
```

`Promo Codes` header row:

```text
Code | Discount_Type | Discount_Value | Active | Start_Date | End_Date | Usage_Limit | Description
```

`Promo Usage` header row:

```text
Usage_ID | Created_At | Promo_Code | Booking_ID | Customer_Name | Customer_Phone | Discount_Amount | Status | Reserved_Until | Finalized_At | Released_At | Release_Reason
```

`Meta Purchase Outbox` header row:

```text
Event_ID | Booking_ID | Occurred_At | Status | Attempt_Count | Next_Attempt_At | Lease_ID | Lease_Until | Delivered_At | Last_Result | Updated_At
```

`Customer_Notes` is the optional customer-entered note. `Order_Snapshot`, `Idempotency_Key_Hash`, and `Request_Fingerprint` are internal fields. They may be hidden from the normal staff view, but their headers/data must remain intact. Protect these internal columns against routine staff edits; the Apps Script execution account still needs write access. Do not manually insert or edit booking/promo usage rows, because Bookings are the authoritative redemption record.

## Apps Script deployment

1. Open Extensions > Apps Script from the new spreadsheet.
2. Copy `scripts/google-apps-script/payment-bookings-webhook.gs` into the bound project.
3. In Project Settings > Script Properties add `PAYMENTS_SPREADSHEET_ID` (the new spreadsheet ID from its URL), `PAYMENTS_SHEETS_WEBHOOK_SECRET` (a dedicated random secret), and `PAYMENT_PROOFS_DRIVE_FOLDER_ID` (the private folder ID from its Drive URL). Phase 6A also requires server-only `NOTIFICATIONS_WEBHOOK_URL` and `NOTIFICATIONS_WEBHOOK_SECRET`; see `PHASE6_NOTIFICATIONS.md`. Meta Purchase wake-up requires `META_PURCHASE_DRAIN_URL` and `META_PURCHASE_DRAIN_SECRET`; Apps Script must never receive the Meta access token. The spreadsheet and folder must be accessible to the executing account; the folder must remain private.
4. Deploy > New deployment > Web app. Set **Execute as: Me** (the account with spreadsheet access and folder write access) and **Who has access: Anyone** (including anonymous callers). The Next.js server does not sign in to Google; the shared secret in the POST body is the application-level gate. Never expose the web-app URL or secret in client-side configuration.
5. Put the versioned deployment `/exec` URL in server-only `PAYMENTS_SHEETS_WEBHOOK_URL`, put the same dedicated secret in server-only `PAYMENTS_SHEETS_WEBHOOK_SECRET`, and configure a separate 32+ character server-only `PAYMENTS_ORDER_ACCESS_SECRET`. Do not expose any through `NEXT_PUBLIC_*` variables. The Spreadsheet and folder IDs are Script Properties only, not Next.js environment variables.
6. Keep the proof folder private. Give review access to staff through Google Drive permissions; the script never enables public link sharing.
7. For later script changes, create a new Apps Script version and edit the existing deployment to use it. Confirm the `/exec` URL still targets that deployment; do not use the development `/dev` URL for live traffic.

The webhook supports `create_order`, `find_order_by_idempotency`, `get_order`, `ensure_promo_reservation`, `commit_booking_transition`, `get_customer_for_order`, `get_promo`, `upload_payment_proof`, and the authenticated Meta outbox claim/complete/requeue actions. The separate `record_promo_usage` action is removed: a lifecycle row may only be derived from an existing booking. Under one script lock, `create_order` validates the promo, writes the Booking, and ensures exactly one Promo Usage row. A partial usage-write failure leaves the Booking as a conservative capacity use; a retry by idempotency hash repairs the missing row. Sheets is not an all-or-nothing transaction.

### Promo reservation lifecycle

`Status` is one of `reserved`, `payment_in_progress`, `pending_review`, `consumed`, or `released`. Only `released` does not occupy `Usage_Limit`. Capacity checks run under ScriptLock and first release stale `reserved` rows with `Release_Reason = reservation_expired`; they never time-release `payment_in_progress` or `pending_review`.

- Branch starts `reserved` for 72 hours.
- Card and installments start `reserved` for 60 minutes. Provider initiation calls `ensure_promo_reservation`; only the persisted successful hosted session changes the row to `payment_in_progress`.
- InstaPay and wallet proof is uploaded and signed before booking creation in the current checkout, so the created usage row starts directly as `pending_review` with `Reserved_Until` blank. It has no local review timer: elapsed time alone never releases it. Admin approval changes it to `consumed`; rejection changes it to `released` with `payment_rejected`.
- Authoritative provider Paid changes `payment_in_progress` to `consumed`. Authenticated terminal provider failure changes it to `released` with `provider_payment_failed`.
- A released booking may be re-reserved only when the current promo is active/in-window, has capacity, and exactly matches the private immutable `promoRedemption` definition stored in `Order_Snapshot`. The saved final price is never recalculated. Failure returns `promo_reservation_expired`.

Do not run an automatic age-only cleanup for `payment_in_progress`: PayTabs/EasyKash may still report a valid payment. Releasing abandoned provider sessions requires a later provider-authoritative reconciliation process.

### Current live schema

The live `Promo Usage` tab is already migrated to the exact 12-column header above and currently has no historical rows requiring backfill. Do not add, remove, or rename columns. A future migration with historical pre-lifecycle rows would require explicit business handling; do not infer or rewrite their state automatically.

InstaPay and Wallet uploads return a signed proof receipt, not a URL the browser may submit to the order API. The receipt binds the trusted Drive URL to the payment method and idempotency key, and expires after 20 minutes. Branch bookings have no proof. The order API resolves the URL only after verifying the receipt. No proof file is publicly shared.

## Activation checks

- Confirm all four header rows match exactly before accepting live traffic.
- Create a non-customer test booking in a staging copy of the spreadsheet.
- Retry the same idempotency key and confirm that no second booking or promo usage row appears.
- Confirm JPEG, PNG, and WebP proofs are written to the private Drive folder and only the Drive URL appears in `Bookings`.
- Confirm invalid secrets, invalid schemas, oversized files, and stale promo definitions fail closed.
- Add the official InstaPay destination/QR and wallet numbers only after the business confirms them. They are intentionally not invented by this code.

No provider payment, email, WhatsApp, or purchase analytics event is sent by setup. New bookings remain `Pending`; manual methods remain `Waiting Review`. Only an explicit authorized Sheet review can approve a manual payment. A first authoritative Paid transition is flushed before the script attempts the deterministic Meta outbox job. Tracking-sheet failures are swallowed and later repaired from authoritative Paid bookings by an order-specific claim or the scheduled reconciliation pass; delivery remains server-side and fail-open.

## Temporary create-order timing diagnostics

`PAYMENT_DIAGNOSTICS_ENABLED` is disabled in the production-ready Apps Script source. It does not change order, promo, lock, proof, or approval behavior. Enable it only for a controlled timeout investigation, then disable it again before rollout.

Each Apps Script console entry is one JSON object containing only `action`, `stage`, `elapsedMs`, `success`, and `diagnosticCode`. Action names are allowlisted. Logs never contain the shared secret, request body, customer fields, proof URL, order snapshot, access token, idempotency hash/key, or an exception message/stack. Logging failures are swallowed so diagnostics cannot block a booking.

For `create_order`, the trace covers request entry/parsing/authentication, ScriptLock request/acquisition, spreadsheet open, Bookings resolution/schema check, idempotency lookup, promo validation, booking write, each flush, Promo Usage ensure, response serialization, and completion. A stage emits `_start` and `_end`; failures emit `_failed` with a sanitized code. The principal storage codes are:

- `payment_sheet_open_failed`
- `payment_sheet_resolve_failed`
- `payment_sheet_schema_failed`
- `payment_lock_timeout`
- `payment_idempotency_lookup_failed`
- `payment_booking_write_failed`
- `payment_flush_failed`
- `payment_promo_usage_failed`
- `payment_response_serialization_failed`
- `payment_unknown_storage_error`

The existing application error remains unchanged; `diagnosticCode` is additive in the server-to-server Apps Script response and is not shown by the payment UI. If Apps Script terminates a run before an exception can be caught, use the final emitted stage: a `_start` without its matching `_end`/`_failed` identifies the operation that was still running. A browser/Next.js timeout does not prove that the sheet write failed, so do not submit a second booking with a new idempotency key while investigating.

The lock behavior is intentionally unchanged during diagnostics: `create_order`, `find_order_by_idempotency`, and `paymentAdminOnEdit` each acquire one ScriptLock with `tryLock(20000)`. None of their callees reacquires it. The 20-second wait is longer than the current Next.js request deadline and may explain an early application timeout under contention, but the timing trace must confirm that before behavior changes.

To activate these diagnostics, update the existing Web App deployment with **Deploy > Manage deployments > Edit > Version > New version > Deploy**. Keep the same deployment, execution account, access setting, Script Properties, and `/exec` URL. Do not rerun `setupPaymentAdminReview`; diagnostics do not change protection or dropdown configuration. After deployment, make exactly one controlled booking submission and inspect that single Apps Script execution's ordered console entries before retrying anything.

## Manual admin approval (Phase 5A.3)

Use the existing spreadsheet-bound payment Apps Script project and the same account that executes the web app. Only trusted payment reviewers should have spreadsheet edit access; this is an administrative interface, not a public form. Reviewers also need private Drive access to the proofs.

1. Add/backfill the Promo Usage lifecycle columns exactly as described above, then replace the script with the updated `scripts/google-apps-script/payment-bookings-webhook.gs` and save. Keep the existing Script Properties and the other tab headers unchanged.
2. Manually run `setupPaymentAdminReview` once from the editor as the web-app execution account. Authorize the requested spreadsheet access (and existing Drive permissions if prompted). This adds the four-value `Payment_Verification` dropdown and protects Bookings except `Payment_Verification` and `Admin_Notes`. It does not alter existing booking values. Re-run it after adding sheet capacity so new rows have validation and editable review cells. Do not remove existing internal headers or data.
3. In Apps Script **Triggers > Add Trigger**, choose `paymentAdminOnEdit`, deployment **Head**, event source **From spreadsheet**, event type **On edit**. Authorize as the same account. Install exactly one such trigger; check for duplicates under other installing accounts too. Enable failure notifications. Do not add a simple `onEdit` wrapper or a timed approval trigger.
4. Update the **existing Web App deployment**: Deploy > Manage deployments > Edit > Version > New version > Deploy. Keep Execute as Me, existing access settings, and the same `/exec` URL. This is required because order reads now reconstruct live status from the row. The installable edit trigger uses saved code separately from the versioned web app.

Installable triggers run with their creator's authorization; script/API writes do not generate edit events. See [Google's installable trigger documentation](https://developers.google.com/apps-script/guides/triggers/installable). Spreadsheet owners and script editors retain elevated powers: protection prevents accidental reviewer edits, not malicious owner changes. Keep owner/script access restricted. Do not edit system fields even as owner.

### Review one booking

- Find the full `Booking_ID`, or search its first eight characters from customer reference `SA-XXXXXXXX`. Prefixes are display aids, not unique authentication credentials; check the matching booking details if more than one row matches.
- For InstaPay/wallet, open the private `Payment_Proof_URL` and independently verify receipt of the funds. A screenshot alone is not confirmation of receipt.
- Change **only** `Payment_Verification`, one cell at a time, from `Waiting Review` to `Approved` or `Rejected`.
- Approved sets `Payment_Status` to `Paid`. Rejected sets it to `Rejected`. Branch approval is allowed without proof, but only after the reviewer actually receives the branch payment.
- InstaPay/wallet approval with an empty proof URL is reverted to `Waiting Review`, leaving status `Pending`, with a toast. Upload/create never approves anything.
- Paid and Rejected are terminal in this workflow. Regression attempts restore the verification matching the protected status. Bulk verification edits are reverted; unrelated edits are ignored. `Admin_Notes` is never overwritten.
- Refresh the existing secure success-page tab (or use its status refresh button). It refreshes every 30 seconds while visible. Paid/Approved is displayed as payment confirmed; Rejected/Rejected as unconfirmed. No login-free order access or new token mechanism is added.

### Status consistency and failures

`Order_Snapshot` remains the immutable creation snapshot, including its original timestamps. Every order read (including idempotent retries and customer-for-order reads) overlays current status from `Payment_Status` / `Payment_Verification`. Pending maps to pending/not_started; Paid/Approved to paid/paid; Rejected/Rejected to failed/failed. No approval timestamp or provider transaction ID is invented.

The trigger uses the existing ScriptLock and writes the adjacent status/verification cells together. Sheets is not a transactional database, and locks do not block human edits. Delayed events with a different current cell value are ignored. A missing/failed trigger or inconsistent status pair fails closed on reads, never claiming payment success. Inspect Apps Script Executions/failure notifications; restore the verification to the protected status's matching value, then retry a pending review from Waiting Review. Do not change Payment_Status to work around a failure. Paid or rejected decisions cannot be reversed through this feature.

No approval has been performed by the implementation/tests. Use the existing test booking manually only after setup and the new web-app version are applied.
