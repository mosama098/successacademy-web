const PAYMENT_CONTRACT_VERSION = 3;
const NOTIFICATION_EVENT_VERSION = 1;
const META_PURCHASE_LEASE_MS = 5 * 60 * 1000;
// Temporary local/staging diagnostics. Disable before any production rollout.
const PAYMENT_DIAGNOSTICS_ENABLED = false;
const PAYMENT_HEADERS = Object.freeze({
  Bookings: [
    "Booking_ID", "Created_At", "Full_Name", "Phone", "WhatsApp", "Email", "Age",
    "Package", "Start_Level", "Target_Level", "Hours", "Sessions", "Attendance_Type",
    "Original_Price", "Promo_Code", "Discount_Amount", "Final_Price", "Payment_Method",
    "Payment_Status", "Payment_Verification", "Payment_Proof_URL", "Admin_Notes", "Customer_Notes",
    "Order_Snapshot", "Idempotency_Key_Hash", "Request_Fingerprint",
    "Payment_Provider", "Provider_Transaction_ID", "Payment_Redirect_URL", "Payment_Updated_At",
  ],
  "Promo Codes": [
    "Code", "Discount_Type", "Discount_Value", "Active", "Start_Date", "End_Date", "Usage_Limit", "Description",
  ],
  "Promo Usage": [
    "Usage_ID", "Created_At", "Promo_Code", "Booking_ID", "Customer_Name", "Customer_Phone", "Discount_Amount",
    "Status", "Reserved_Until", "Finalized_At", "Released_At", "Release_Reason",
  ],
  "Meta Purchase Outbox": [
    "Event_ID", "Booking_ID", "Occurred_At", "Status", "Attempt_Count", "Next_Attempt_At",
    "Lease_ID", "Lease_Until", "Delivered_At", "Last_Result", "Updated_At",
  ],
});

function doPost(event) {
  const trace = PAYMENT_DIAGNOSTICS_ENABLED ? { action: "unknown", startedAt: Date.now(), failureCode: null } : null;
  paymentTrace_(trace, "doPost_entered", null);
  try {
    const request = JSON.parse(event && event.postData ? event.postData.contents : "null");
    if (trace) trace.action = paymentActionName_(request && request.action);
    paymentTrace_(trace, "payload_parsed", true);
    if (!request || request.domain !== "payments" || typeof request.action !== "string") return paymentDiagnosticReply_({ success: false, error: "invalid_request" }, trace);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("PAYMENTS_SHEETS_WEBHOOK_SECRET") || "";
    if (!expectedSecret || request.secret !== expectedSecret) return paymentDiagnosticReply_({ success: false, error: "unauthorized" }, trace);
    paymentTrace_(trace, "authentication_passed", true);

    switch (request.action) {
      case "create_order": return paymentDiagnosticReply_(createOrder_(request.payload, trace), trace);
      case "find_order_by_idempotency": return paymentDiagnosticReply_(findOrderByIdempotency_(request.payload, trace), trace);
      case "get_order": return paymentDiagnosticReply_(getOrder_(request.payload, trace), trace);
      case "ensure_promo_reservation": return paymentDiagnosticReply_(ensurePromoReservation_(request.payload, trace), trace);
      case "commit_booking_transition": return paymentDiagnosticReply_(commitBookingTransition_(request.payload, trace), trace);
      case "get_customer_for_order": return paymentDiagnosticReply_(getCustomerForOrder_(request.payload, trace), trace);
      case "claim_meta_purchase_job": return paymentDiagnosticReply_(claimMetaPurchaseJob_(request.payload, trace), trace);
      case "complete_meta_purchase_job": return paymentDiagnosticReply_(completeMetaPurchaseJob_(request.payload, trace), trace);
      case "requeue_meta_purchase_job": return paymentDiagnosticReply_(requeueMetaPurchaseJob_(request.payload, trace), trace);
      case "reconcile_meta_purchase_jobs": return paymentDiagnosticReply_(reconcileMetaPurchaseJobs_(request.payload, trace), trace);
      case "get_promo": return paymentDiagnosticReply_(getPromo_(request.payload, trace), trace);
      case "upload_payment_proof": return paymentDiagnosticReply_(uploadPaymentProof_(request.payload), trace);
      default: return paymentDiagnosticReply_({ success: false, error: "unsupported_action" }, trace);
    }
  } catch (error) {
    const diagnosticCode = trace && trace.failureCode
      ? trace.failureCode
      : paymentDiagnosticCodeForError_(error);
    if (trace && !trace.failureCode) trace.failureCode = diagnosticCode;
    paymentTrace_(trace, "doPost_failed", false, diagnosticCode);
    return paymentDiagnosticReply_({ success: false, error: safeErrorCode_(error) }, trace);
  }
}

function createOrder_(payload, trace) {
  requireContract_(payload);
  const booking = requireObject_(payload.booking, "invalid_booking");
  const order = requireObject_(payload.order, "invalid_order");
  const orderSnapshot = parseOrder_(booking.Order_Snapshot);
  normalizeOrder_(order);
  const notification = requireObject_(payload.notification, "invalid_notification");
  if (notification.eventType !== "booking.created" || notification.orderId !== orderSnapshot.id) throw new Error("invalid_notification");
  validateRow_("Bookings", booking);
  if (booking.Booking_ID !== orderSnapshot.id || order.id !== orderSnapshot.id
    || booking.Idempotency_Key_Hash !== orderSnapshot.idempotencyKeyHash
    || booking.Request_Fingerprint !== orderSnapshot.requestFingerprint
    || order.programType !== orderSnapshot.programType) throw new Error("invalid_booking");

  return withPaymentLock_(function () {
    const sheet = paymentSheet_("Bookings", trace);
    const existing = paymentStage_(trace, "idempotency_lookup", "payment_idempotency_lookup_failed", function () {
      return findRow_(sheet, "Idempotency_Key_Hash", booking.Idempotency_Key_Hash);
    });
    if (existing) {
      const stored = currentBookingOrder_(existing);
      if (stored.requestFingerprint !== orderSnapshot.requestFingerprint) return { success: false, error: "idempotency_conflict" };
      paymentStage_(trace, "promo_usage_ensure", "payment_promo_usage_failed", function () { return ensurePromoUsageForBooking_(existing, trace, payload.promoUsage); });
      paymentStage_(trace, "flush", "payment_flush_failed", function () { SpreadsheetApp.flush(); });
      return { success: true, data: orderResult_(stored, false) };
    }
    if (paymentStage_(trace, "booking_id_lookup", "payment_booking_lookup_failed", function () {
      return findRow_(sheet, "Booking_ID", booking.Booking_ID);
    })) throw new Error("invalid_booking");

    paymentStage_(trace, "promo_validation", "payment_promo_validation_failed", function () {
      if (payload.promoUsage) {
        validatePromoRedemption_(payload.promo, payload.promoUsage, booking, trace);
      } else if (booking.Promo_Code) {
        throw new Error("promo_changed");
      }
    });

    paymentStage_(trace, "booking_row_write", "payment_booking_write_failed", function () { appendRow_(sheet, "Bookings", booking); });
    paymentStage_(trace, "flush", "payment_flush_failed", function () { SpreadsheetApp.flush(); });
    paymentStage_(trace, "promo_usage_ensure", "payment_promo_usage_failed", function () { return ensurePromoUsageForBooking_(booking, trace, payload.promoUsage); });
    paymentStage_(trace, "flush", "payment_flush_failed", function () { SpreadsheetApp.flush(); });
    return { success: true, data: orderResult_(orderSnapshot, true) };
  }, trace);
}

function orderResult_(order, created) {
  return {
    order: order,
    created: created,
    bookingCommit: {
      version: PAYMENT_CONTRACT_VERSION,
      orderId: order.id,
      requestFingerprint: order.requestFingerprint,
      bookingSaved: true,
      promoUsageBookingId: order.pricing && order.pricing.promoCode ? order.id : null,
    },
  };
}

function findOrderByIdempotency_(payload, trace) {
  const hash = string_(payload && payload.idempotencyKeyHash);
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("invalid_request");
  return withPaymentLock_(function () {
    const sheet = paymentSheet_("Bookings", trace);
    const row = paymentStage_(trace, "idempotency_lookup", "payment_idempotency_lookup_failed", function () {
      return findRow_(sheet, "Idempotency_Key_Hash", hash);
    });
    if (row) paymentStage_(trace, "promo_usage_ensure", "payment_promo_usage_failed", function () { return ensurePromoUsageForBooking_(row, trace); });
    paymentStage_(trace, "flush", "payment_flush_failed", function () { SpreadsheetApp.flush(); });
    return { success: true, data: { order: row ? currentBookingOrder_(row) : null } };
  }, trace);
}

function getOrder_(payload, trace) {
  const orderId = string_(payload && payload.orderId);
  if (!orderId || orderId.length > 128) throw new Error("invalid_request");
  const sheet = paymentSheet_("Bookings", trace);
  const row = paymentStage_(trace, "booking_lookup", "payment_booking_lookup_failed", function () { return findRow_(sheet, "Booking_ID", orderId); });
  return { success: true, data: { order: row ? currentBookingOrder_(row) : null } };
}

function commitBookingTransition_(payload, trace) {
  requireContract_(payload);
  const incoming = requireObject_(payload.order, "invalid_order");
  normalizeOrder_(incoming);
  const event = requireObject_(payload.event, "invalid_event");
  const expectedStatus = string_(payload.expectedStatus);
  if (!incoming.id || incoming.id !== event.orderId || event.previousStatus !== expectedStatus
    || incoming.status !== event.status || !validAutomatedProvider_(incoming.payment.method, incoming.payment.provider)) {
    throw new Error("invalid_transition");
  }
  return withPaymentLock_(function () {
    const sheet = paymentSheet_("Bookings", trace);
    const booking = findRow_(sheet, "Booking_ID", incoming.id);
    if (!booking) throw new Error("order_not_found");
    const current = currentBookingOrder_(booking);
    if (current.status !== expectedStatus) return { success: false, error: "order_conflict" };
    const allowed = {
      pending: ["waiting_payment"],
      waiting_payment: ["paid", "failed"],
      failed: ["waiting_payment"],
    };
    if (!allowed[current.status] || allowed[current.status].indexOf(incoming.status) < 0) throw new Error("invalid_transition");
    if (!sameImmutableOrder_(current, incoming)) throw new Error("invalid_transition");
    const transactionId = string_(incoming.payment.transactionId).trim();
    const redirectUrl = string_(incoming.payment.redirectUrl).trim();
    const provider = string_(incoming.payment.provider);
    const transactionRequired = provider === "paytabs" || incoming.status === "paid" || incoming.status === "failed";
    if ((transactionRequired && !transactionId) || transactionId.length > 256 || /[\u0000-\u001f\u007f]/.test(transactionId)
      || !validProviderRedirect_(provider, redirectUrl) || redirectUrl.length > 2048) {
      throw new Error("invalid_transition");
    }
    if (current.status === "waiting_payment" && current.payment.transactionId
      && transactionId !== current.payment.transactionId) throw new Error("invalid_transition");
    const promoTarget = incoming.status === "waiting_payment" ? "payment_in_progress"
      : incoming.status === "paid" ? "consumed" : "released";
    transitionPromoUsageForBooking_(booking, promoTarget, Date.now(), trace, "provider_payment_failed");
    const paymentStatus = incoming.status === "paid" ? "Paid" : incoming.status === "failed" ? "Rejected" : "Pending";
    const row = findRowNumber_(sheet, "Booking_ID", incoming.id);
    if (!row) throw new Error("order_not_found");
    booking.Payment_Status = paymentStatus;
    booking.Payment_Verification = "Not Required";
    booking.Payment_Provider = provider;
    booking.Provider_Transaction_ID = transactionId;
    booking.Payment_Redirect_URL = redirectUrl;
    booking.Payment_Updated_At = string_(incoming.updatedAt);
    sheet.getRange(row, 1, 1, PAYMENT_HEADERS.Bookings.length)
      .setValues([PAYMENT_HEADERS.Bookings.map(function (header) { return booking[header]; })]);
    SpreadsheetApp.flush();
    if (incoming.status === "paid") recordMetaPurchaseOutboxSafely_(booking, string_(incoming.updatedAt));
    return { success: true, data: {
      order: currentBookingOrder_(booking),
      transitionCommit: { orderId: incoming.id, statusSaved: true },
    } };
  }, trace);
}

function ensureMetaPurchaseOutbox_(booking, occurredAt) {
  const orderId = string_(booking.Booking_ID);
  const eventId = "meta:purchase:" + orderId;
  const sheet = paymentSheet_("Meta Purchase Outbox");
  const existing = findRow_(sheet, "Event_ID", eventId);
  if (existing) {
    if (String(existing.Booking_ID) !== orderId) throw new Error("invalid_meta_outbox");
    return false;
  }
  const timestamp = nullableIso_(occurredAt || new Date().toISOString());
  appendRow_(sheet, "Meta Purchase Outbox", {
    Event_ID: eventId,
    Booking_ID: orderId,
    Occurred_At: timestamp,
    Status: "pending",
    Attempt_Count: 0,
    Next_Attempt_At: timestamp,
    Lease_ID: "",
    Lease_Until: "",
    Delivered_At: "",
    Last_Result: "queued",
    Updated_At: timestamp,
  });
  return true;
}

function recordMetaPurchaseOutboxSafely_(booking, occurredAt) {
  const eventId = "meta:purchase:" + String(booking.Booking_ID || "");
  try {
    ensureMetaPurchaseOutbox_(booking, occurredAt);
    SpreadsheetApp.flush();
    return true;
  } catch (_error) {
    metaPurchaseOutboxLog_(eventId, "pending", "outbox_write_failed");
    return false;
  }
}

function reconcileMetaPurchaseJobs_(payload, trace) {
  requireContract_(payload);
  return withPaymentLock_(function () {
    const bookings = paymentSheet_("Bookings", trace);
    paymentSheet_("Meta Purchase Outbox", trace);
    let created = 0;
    if (bookings.getLastRow() >= 2) {
      const rows = bookings.getRange(2, 1, bookings.getLastRow() - 1, PAYMENT_HEADERS.Bookings.length).getValues();
      rows.forEach(function (values) {
        const booking = {};
        PAYMENT_HEADERS.Bookings.forEach(function (header, index) { booking[header] = values[index]; });
        if (booking.Booking_ID && metaPurchaseBookingPaid_(booking)
          && ensureMetaPurchaseOutbox_(booking, String(booking.Payment_Updated_At || booking.Created_At))) created += 1;
      });
    }
    SpreadsheetApp.flush();
    return { success: true, data: { reconciled: true, created: created } };
  }, trace);
}

function metaPurchaseOutboxLog_(eventId, result, diagnosticCode) {
  try {
    console.log(JSON.stringify({
      scope: "meta_purchase_outbox", eventId: eventId, result: result, diagnosticCode: diagnosticCode,
    }));
  } catch (ignored) {}
}

function claimMetaPurchaseJob_(payload, trace) {
  requireContract_(payload);
  const requestedOrderId = payload.orderId === null || payload.orderId === undefined ? "" : string_(payload.orderId);
  if (requestedOrderId && !/^[A-Za-z0-9_-]{1,128}$/.test(requestedOrderId)) throw new Error("invalid_request");
  return withPaymentLock_(function () {
    const now = Date.now();
    const outbox = paymentSheet_("Meta Purchase Outbox", trace);
    let job = requestedOrderId ? findRow_(outbox, "Booking_ID", requestedOrderId) : null;
    if (requestedOrderId && !job) {
      const booking = findRow_(paymentSheet_("Bookings", trace), "Booking_ID", requestedOrderId);
      if (!booking || !metaPurchaseBookingPaid_(booking)) return { success: true, data: { job: null } };
      ensureMetaPurchaseOutbox_(booking, String(booking.Payment_Updated_At || new Date(now).toISOString()));
      job = findRow_(outbox, "Booking_ID", requestedOrderId);
    }
    if (!job) job = firstDueMetaPurchaseJob_(outbox, now);
    if (!job || !metaPurchaseJobDue_(job, now)) return { success: true, data: { job: null } };
    const booking = findRow_(paymentSheet_("Bookings", trace), "Booking_ID", job.Booking_ID);
    if (!booking || !metaPurchaseBookingPaid_(booking)) return { success: true, data: { job: null } };
    const leaseId = Utilities.getUuid();
    const updatedAt = new Date(now).toISOString();
    job.Status = "processing";
    job.Attempt_Count = Number(job.Attempt_Count || 0) + 1;
    job.Lease_ID = leaseId;
    job.Lease_Until = new Date(now + META_PURCHASE_LEASE_MS).toISOString();
    job.Updated_At = updatedAt;
    writeMetaPurchaseJob_(outbox, job);
    SpreadsheetApp.flush();
    return { success: true, data: { job: {
      eventId: String(job.Event_ID), orderId: String(job.Booking_ID), occurredAt: String(job.Occurred_At),
      attemptCount: Number(job.Attempt_Count), leaseId: leaseId,
    } } };
  }, trace);
}

function completeMetaPurchaseJob_(payload, trace) {
  requireContract_(payload);
  const eventId = string_(payload.eventId);
  const leaseId = string_(payload.leaseId);
  const outcome = string_(payload.outcome);
  const diagnosticCode = string_(payload.diagnosticCode);
  if (!/^meta:purchase:[A-Za-z0-9_-]{1,128}$/.test(eventId) || !leaseId
    || ["delivered", "retryable", "permanent"].indexOf(outcome) < 0
    || !/^[a-z0-9_]{1,64}$/.test(diagnosticCode)) throw new Error("invalid_request");
  return withPaymentLock_(function () {
    const sheet = paymentSheet_("Meta Purchase Outbox", trace);
    const job = findRow_(sheet, "Event_ID", eventId);
    if (!job || String(job.Status) !== "processing" || String(job.Lease_ID) !== leaseId) throw new Error("invalid_meta_outbox");
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    job.Status = outcome === "delivered" ? "delivered" : outcome === "permanent" ? "permanent_failure" : "pending";
    job.Next_Attempt_At = outcome === "retryable" ? new Date(now + metaPurchaseRetryDelay_(Number(job.Attempt_Count))).toISOString() : "";
    job.Lease_ID = "";
    job.Lease_Until = "";
    job.Delivered_At = outcome === "delivered" ? timestamp : "";
    job.Last_Result = diagnosticCode;
    job.Updated_At = timestamp;
    writeMetaPurchaseJob_(sheet, job);
    SpreadsheetApp.flush();
    return { success: true, data: { completed: true, eventId: eventId } };
  }, trace);
}

function requeueMetaPurchaseJob_(payload, trace) {
  requireContract_(payload);
  const orderId = string_(payload.orderId);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) throw new Error("invalid_request");
  return withPaymentLock_(function () {
    const outbox = paymentSheet_("Meta Purchase Outbox", trace);
    const job = findRow_(outbox, "Booking_ID", orderId);
    if (!job) throw new Error("invalid_meta_outbox");
    if (String(job.Status) === "delivered") return { success: true, data: { requeued: true, orderId: orderId } };
    if (String(job.Status) !== "permanent_failure") throw new Error("invalid_meta_outbox");
    const timestamp = new Date().toISOString();
    job.Status = "pending";
    job.Next_Attempt_At = timestamp;
    job.Lease_ID = "";
    job.Lease_Until = "";
    job.Last_Result = "manual_requeue";
    job.Updated_At = timestamp;
    writeMetaPurchaseJob_(outbox, job);
    SpreadsheetApp.flush();
    return { success: true, data: { requeued: true, orderId: orderId } };
  }, trace);
}

function firstDueMetaPurchaseJob_(sheet, now) {
  if (sheet.getLastRow() < 2) return null;
  const headers = PAYMENT_HEADERS["Meta Purchase Outbox"];
  const bookings = paymentSheet_("Bookings");
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (let index = 0; index < rows.length; index += 1) {
    const job = {};
    headers.forEach(function (header, cell) { job[header] = rows[index][cell]; });
    if (metaPurchaseJobDue_(job, now)) {
      const booking = findRow_(bookings, "Booking_ID", job.Booking_ID);
      if (booking && metaPurchaseBookingPaid_(booking)) return job;
    }
  }
  return null;
}

function metaPurchaseJobDue_(job, now) {
  const status = String(job && job.Status || "");
  if (status === "pending") return !job.Next_Attempt_At || Date.parse(String(job.Next_Attempt_At)) <= now;
  return status === "processing" && job.Lease_Until && Date.parse(String(job.Lease_Until)) <= now;
}

function metaPurchaseBookingPaid_(booking) {
  if (String(booking.Payment_Status) !== "Paid") return false;
  const manual = ["instapay", "wallet", "branch"].indexOf(String(booking.Payment_Method)) >= 0;
  return String(booking.Payment_Verification) === (manual ? "Approved" : "Not Required");
}

function writeMetaPurchaseJob_(sheet, job) {
  validateRow_("Meta Purchase Outbox", job);
  const row = findRowNumber_(sheet, "Event_ID", job.Event_ID);
  if (!row) throw new Error("invalid_meta_outbox");
  sheet.getRange(row, 1, 1, PAYMENT_HEADERS["Meta Purchase Outbox"].length)
    .setValues([PAYMENT_HEADERS["Meta Purchase Outbox"].map(function (header) { return job[header]; })]);
}

function metaPurchaseRetryDelay_(attemptCount) {
  const delays = [60, 300, 1800, 7200, 43200, 86400];
  return delays[Math.min(Math.max(1, attemptCount), delays.length) - 1] * 1000;
}

function sameImmutableOrder_(current, incoming) {
  const fields = ["id", "locale", "createdAt", "programType", "customer", "packageSnapshot", "legalConsent", "pricing", "promoRedemption",
    "attendance", "marketing", "idempotencyKeyHash", "requestFingerprint", "notes"];
  if (fields.some(function (key) { return JSON.stringify(current[key]) !== JSON.stringify(incoming[key]); })) return false;
  const paymentFields = ["method", "currency", "amountMinor", "proofLink"];
  return paymentFields.every(function (key) { return JSON.stringify(current.payment[key]) === JSON.stringify(incoming.payment[key]); });
}

function validAutomatedProvider_(method, provider) {
  return (method === "card" && provider === "paytabs")
    || (method === "installments" && provider === "easykash");
}

function validProviderRedirect_(provider, redirectUrl) {
  if (provider === "paytabs") return /^https:\/\/secure-egypt\.paytabs\.com\//.test(redirectUrl);
  if (provider === "easykash") return /^https:\/\/easykash\.net(?:[/?#]|$)/i.test(redirectUrl);
  return false;
}

function getCustomerForOrder_(payload, trace) {
  const orderId = string_(payload && payload.orderId);
  const row = findRow_(paymentSheet_("Bookings", trace), "Booking_ID", orderId);
  if (!row) return { success: true, data: { customer: null } };
  const order = currentBookingOrder_(row);
  return { success: true, data: { customer: {
    customerId: order.customer.id, orderId: order.id, createdAt: order.createdAt,
    name: row.Full_Name, phone: row.Phone, whatsapp: row.WhatsApp, email: row.Email,
    age: Number(row.Age), notes: row.Customer_Notes || null, packageName: row.Package,
    startLevel: row.Start_Level, targetLevel: row.Target_Level, attendance: row.Attendance_Type,
    paymentStatus: order.payment.status, source: order.customer.identitySource, marketing: order.marketing,
  } } };
}

function getPromo_(payload, trace) {
  return withPaymentLock_(function () { return getPromoUnlocked_(payload, trace); }, trace);
}

function getPromoUnlocked_(payload, trace) {
  const code = normalizeCode_(payload && payload.code);
  const row = findPromoRowByCode_(paymentSheet_("Promo Codes", trace), code);
  if (!row) return { success: true, data: { promo: null } };
  const type = String(row.Discount_Type || "").trim().toLowerCase();
  if (type !== "fixed" && type !== "percentage") throw new Error("promo_invalid");
  const value = promoValue_(row.Discount_Value, type);
  const maxUses = nullableInteger_(row.Usage_Limit);
  const startDate = nullableIso_(row.Start_Date);
  const endDate = nullableIso_(row.End_Date);
  if (startDate && endDate && Date.parse(startDate) >= Date.parse(endDate)) throw new Error("promo_invalid");
  const promo = {
    code: code,
    type: type,
    value: value,
    active: boolean_(row.Active),
    startDate: startDate,
    endDate: endDate,
    maxUses: maxUses,
    usedCount: promoUseCount_(code, trace),
    allowedPackages: [],
  };
  return { success: true, data: { promo: promo } };
}

function ensurePromoUsage_(usage, trace) {
  validateRow_("Promo Usage", usage);
  const sheet = paymentSheet_("Promo Usage", trace);
  const byUsage = findRow_(sheet, "Usage_ID", usage.Usage_ID);
  const byBooking = findRow_(sheet, "Booking_ID", usage.Booking_ID);
  const existing = byUsage || byBooking;
  if (existing) {
    if (existing.Usage_ID !== usage.Usage_ID || existing.Booking_ID !== usage.Booking_ID
      || existing.Promo_Code !== usage.Promo_Code || Number(existing.Discount_Amount) !== Number(usage.Discount_Amount)
      || String(existing.Created_At) !== String(usage.Created_At)) {
      throw new Error("promo_changed");
    }
    return false;
  }
  appendRow_(sheet, "Promo Usage", usage);
  return true;
}

function ensurePromoUsageForBooking_(booking, trace, suppliedUsage) {
  if (!booking.Promo_Code) return false;
  const expected = promoUsageForBooking_(booking);
  if (suppliedUsage) {
    validateRow_("Promo Usage", suppliedUsage);
    if (JSON.stringify(suppliedUsage) !== JSON.stringify(expected)) throw new Error("promo_changed");
  }
  return ensurePromoUsage_(expected, trace);
}

function promoUsageForBooking_(booking) {
  const order = parseOrder_(booking.Order_Snapshot);
  const method = String(booking.Payment_Method || "");
  if (order.payment.method !== method) throw new Error("invalid_booking");
  const pendingReview = method === "instapay" || method === "wallet";
  if (pendingReview && !String(booking.Payment_Proof_URL || "").trim()) throw new Error("invalid_booking");
  return {
    Usage_ID: "promo-use:" + booking.Booking_ID,
    Created_At: booking.Created_At,
    Promo_Code: booking.Promo_Code,
    Booking_ID: booking.Booking_ID,
    Customer_Name: booking.Full_Name,
    Customer_Phone: booking.Phone,
    Discount_Amount: booking.Discount_Amount,
    Status: pendingReview ? "pending_review" : "reserved",
    Reserved_Until: pendingReview ? "" : promoReservationUntil_(booking.Created_At, method),
    Finalized_At: "",
    Released_At: "",
    Release_Reason: "",
  };
}

function promoReservationUntil_(from, method) {
  const startedAt = Date.parse(String(from));
  const duration = method === "branch" ? 72 * 60 * 60 * 1000
    : ["card", "installments"].indexOf(method) >= 0 ? 60 * 60 * 1000 : 0;
  if (!Number.isFinite(startedAt) || !duration) throw new Error("invalid_booking");
  return new Date(startedAt + duration).toISOString();
}

function ensurePromoReservation_(payload, trace) {
  requireContract_(payload);
  const orderId = string_(payload && payload.orderId);
  if (!orderId || orderId.length > 128) throw new Error("invalid_request");
  return withPaymentLock_(function () {
    const booking = findRow_(paymentSheet_("Bookings", trace), "Booking_ID", orderId);
    if (!booking) throw new Error("order_not_found");
    if (!booking.Promo_Code) return { success: true, data: { orderId: orderId, reservationReady: true, status: null } };
    ensurePromoUsageForBooking_(booking, trace);
    const now = Date.now();
    releaseExpiredPromoReservations_(normalizeCode_(booking.Promo_Code), now, trace);
    let usage = findRow_(paymentSheet_("Promo Usage", trace), "Booking_ID", orderId);
    const status = promoUsageStatus_(usage && usage.Status);
    if (status === "released") {
      try {
        usage = reacquirePromoReservation_(booking, usage, now, trace);
      } catch (error) {
        throw new Error("promo_reservation_expired");
      }
    } else if (status !== "reserved" && status !== "payment_in_progress") {
      throw new Error("promo_reservation_expired");
    }
    SpreadsheetApp.flush();
    return { success: true, data: { orderId: orderId, reservationReady: true, status: usage.Status } };
  }, trace);
}

function validatePromoRedemption_(guard, usage, booking, trace) {
  const code = normalizeCode_(booking.Promo_Code);
  if (!guard || guard.code !== code || usage.Promo_Code !== code || usage.Booking_ID !== booking.Booking_ID) throw new Error("promo_changed");
  const response = getPromoUnlocked_({ code: code }, trace);
  const promo = response.data.promo;
  if (!promo) throw new Error("promo_changed");
  if (!promo.active) throw new Error("promo_inactive");
  if (promo.type !== guard.type || Number(promo.value) !== Number(guard.value)
    || promo.startDate !== guard.startDate || promo.endDate !== guard.endDate
    || promo.maxUses !== guard.maxUses
    || JSON.stringify(promo.allowedPackages) !== JSON.stringify(guard.allowedPackages)) throw new Error("promo_changed");
  const now = Date.now();
  if (promo.startDate && now < Date.parse(promo.startDate)) throw new Error("promo_not_started");
  if (promo.endDate && now >= Date.parse(promo.endDate)) throw new Error("promo_expired");
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new Error("promo_limit_reached");
  const originalMinor = Math.round(Number(booking.Original_Price) * 100);
  const valueMinor = Math.round(Number(promo.value) * 100);
  const discountMinor = Math.min(originalMinor, promo.type === "fixed"
    ? valueMinor : Math.floor((originalMinor * valueMinor + 5000) / 10000));
  if (discountMinor / 100 !== Number(booking.Discount_Amount)
    || (originalMinor - discountMinor) / 100 !== Number(booking.Final_Price)) throw new Error("promo_changed");
}

function reacquirePromoReservation_(booking, usage, now, trace) {
  const order = parseOrder_(booking.Order_Snapshot);
  const guard = order.promoRedemption;
  if (!guard) throw new Error("promo_changed");
  validatePromoRedemption_(guard, usage, booking, trace);
  usage.Status = "reserved";
  usage.Reserved_Until = promoReservationUntil_(new Date(now).toISOString(), String(booking.Payment_Method || ""));
  usage.Finalized_At = "";
  usage.Released_At = "";
  usage.Release_Reason = "";
  writePromoUsage_(usage, trace);
  return usage;
}

function transitionPromoUsageForBooking_(booking, targetStatus, now, trace, releaseReason) {
  if (!booking.Promo_Code) return;
  ensurePromoUsageForBooking_(booking, trace);
  let usage = findRow_(paymentSheet_("Promo Usage", trace), "Booking_ID", booking.Booking_ID);
  let status = promoUsageStatus_(usage && usage.Status);
  if (targetStatus === "payment_in_progress") {
    if (status === "reserved" && promoReservationExpired_(usage, now)) {
      releasePromoUsage_(usage, now, "reservation_expired", trace);
      status = "released";
    }
    if (status === "released") {
      try {
        usage = reacquirePromoReservation_(booking, usage, now, trace);
        status = "reserved";
      } catch (error) {
        throw new Error("promo_reservation_expired");
      }
    }
    if (status !== "reserved" && status !== "payment_in_progress") throw new Error("promo_reservation_expired");
    if (status === "reserved") {
      usage.Status = "payment_in_progress";
      usage.Finalized_At = "";
      usage.Released_At = "";
      usage.Release_Reason = "";
      writePromoUsage_(usage, trace);
    }
    return;
  }
  if (targetStatus === "consumed") {
    if (status === "consumed") return;
    if (status === "reserved" && promoReservationExpired_(usage, now)) {
      releasePromoUsage_(usage, now, "reservation_expired", trace);
      status = "released";
    }
    if (status !== "payment_in_progress" && status !== "pending_review" && status !== "reserved") {
      if (status !== "released") throw new Error("promo_reservation_expired");
      try {
        usage = reacquirePromoReservation_(booking, usage, now, trace);
      } catch (error) {
        throw new Error("promo_reservation_expired");
      }
    }
    usage.Status = "consumed";
    usage.Finalized_At = new Date(now).toISOString();
    usage.Released_At = "";
    usage.Release_Reason = "";
    writePromoUsage_(usage, trace);
    return;
  }
  if (targetStatus === "released") {
    if (status === "consumed") throw new Error("order_conflict");
    if (status === "released") return;
    releasePromoUsage_(usage, now, releaseReason || "payment_rejected", trace);
  }
}

function releaseExpiredPromoReservations_(code, now, trace) {
  const sheet = paymentSheet_("Promo Usage", trace);
  if (sheet.getLastRow() < 2) return;
  const headers = PAYMENT_HEADERS["Promo Usage"];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  rows.forEach(function (values, index) {
    const usage = {};
    headers.forEach(function (header, cell) { usage[header] = values[cell]; });
    if (String(usage.Promo_Code || "").trim().toUpperCase() !== code
      || promoUsageStatus_(usage.Status) !== "reserved" || !promoReservationExpired_(usage, now)) return;
    releasePromoUsage_(usage, now, "reservation_expired", trace, index + 2);
  });
}

function promoReservationExpired_(usage, now) {
  const deadline = Date.parse(String(usage && usage.Reserved_Until || ""));
  return Number.isFinite(deadline) && deadline <= now;
}

function releasePromoUsage_(usage, now, reason, trace, rowNumber) {
  if (promoUsageStatus_(usage.Status) === "consumed") return;
  usage.Status = "released";
  usage.Finalized_At = "";
  usage.Released_At = new Date(now).toISOString();
  usage.Release_Reason = reason;
  writePromoUsage_(usage, trace, rowNumber);
}

function writePromoUsage_(usage, trace, rowNumber) {
  validateRow_("Promo Usage", usage);
  const sheet = paymentSheet_("Promo Usage", trace);
  const row = rowNumber || findRowNumber_(sheet, "Booking_ID", usage.Booking_ID);
  if (!row) throw new Error("promo_changed");
  sheet.getRange(row, 1, 1, PAYMENT_HEADERS["Promo Usage"].length)
    .setValues([PAYMENT_HEADERS["Promo Usage"].map(function (header) { return usage[header]; })]);
}

function promoUsageStatus_(value) {
  const status = String(value || "");
  if (["reserved", "payment_in_progress", "pending_review", "consumed", "released"].indexOf(status) >= 0) return status;
  // Existing pre-lifecycle rows are conservative permanent uses until deliberately migrated.
  if (!status) return "consumed";
  throw new Error("promo_changed");
}

function uploadPaymentProof_(payload) {
  requireContract_(payload);
  const configuredFolderId = PropertiesService.getScriptProperties().getProperty("PAYMENT_PROOFS_DRIVE_FOLDER_ID") || "";
  if (!configuredFolderId) throw new Error("proof_storage_unavailable");
  const uploadKeyHash = string_(payload.uploadKeyHash);
  const fileName = string_(payload.fileName);
  const mimeType = string_(payload.mimeType);
  const contentBase64 = string_(payload.contentBase64);
  if (!/^[a-f0-9]{64}$/.test(uploadKeyHash) || !new RegExp("^payment-proof-" + uploadKeyHash + "\\.(jpg|png|webp)$").test(fileName)
    || ["image/jpeg", "image/png", "image/webp"].indexOf(mimeType) < 0 || !contentBase64 || contentBase64.length > 7 * 1024 * 1024) {
    throw new Error("invalid_payment_proof");
  }
  const bytes = Utilities.base64Decode(contentBase64);
  if (!validImageSignature_(bytes, mimeType) || bytes.length < 1 || bytes.length > 5 * 1024 * 1024) throw new Error("invalid_payment_proof");
  const folder = DriveApp.getFolderById(configuredFolderId);
  const existing = folder.getFilesByName(fileName);
  const file = existing.hasNext() ? existing.next() : folder.createFile(Utilities.newBlob(bytes, mimeType, fileName));
  return { success: true, data: { proofUrl: file.getUrl() } };
}

function validImageSignature_(bytes, mimeType) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && byte_(bytes[0]) === 0xff && byte_(bytes[1]) === 0xd8 && byte_(bytes[2]) === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && byte_(bytes[0]) === 0x89 && byte_(bytes[1]) === 0x50 && byte_(bytes[2]) === 0x4e && byte_(bytes[3]) === 0x47;
  return bytes.length >= 12 && String.fromCharCode(byte_(bytes[0]), byte_(bytes[1]), byte_(bytes[2]), byte_(bytes[3])) === "RIFF"
    && String.fromCharCode(byte_(bytes[8]), byte_(bytes[9]), byte_(bytes[10]), byte_(bytes[11])) === "WEBP";
}

function byte_(value) { return value < 0 ? value + 256 : value; }

// Run manually as the web-app execution account. This does not install a trigger or change booking values.
function setupPaymentAdminReview() {
  setupMetaPurchaseOutbox_();
  const sheet = paymentSheet_("Bookings");
  const verification = sheet.getRange(2, PAYMENT_HEADERS.Bookings.indexOf("Payment_Verification") + 1, sheet.getMaxRows() - 1, 1);
  verification.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["Waiting Review", "Approved", "Rejected", "Not Required"], true)
    .setAllowInvalid(false).build());
  const description = "Payment bookings: system-owned data";
  const protection = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .filter(function (item) { return item.getDescription() === description; })[0]
    || sheet.protect().setDescription(description);
  protection.setWarningOnly(false);
  protection.addEditor(Session.getEffectiveUser());
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
  protection.setUnprotectedRanges([
    verification,
    sheet.getRange(2, PAYMENT_HEADERS.Bookings.indexOf("Admin_Notes") + 1, sheet.getMaxRows() - 1, 1),
  ]);
}

function setupMetaPurchaseOutbox_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("PAYMENTS_SPREADSHEET_ID") || "";
  if (!spreadsheetId) throw new Error("missing_spreadsheet_id");
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const name = "Meta Purchase Outbox";
  const headers = PAYMENT_HEADERS[name];
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const actual = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
    if (actual.join("\u001f") !== headers.join("\u001f")) throw new Error("invalid_sheet_schema");
  }
  const description = "Meta Purchase Outbox: system-owned data";
  const protection = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    .filter(function (item) { return item.getDescription() === description; })[0]
    || sheet.protect().setDescription(description);
  protection.setWarningOnly(false);
  protection.addEditor(Session.getEffectiveUser());
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
  protection.setUnprotectedRanges([]);
}

// Installable spreadsheet On edit trigger only; never called by a public webhook action.
function paymentAdminOnEdit(event) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("PAYMENTS_SPREADSHEET_ID") || "";
  if (!spreadsheetId || !event || !event.triggerUid || !event.source || !event.range
    || event.source.getId() !== spreadsheetId || event.range.getSheet().getName() !== "Bookings") return;
  const verificationColumn = PAYMENT_HEADERS.Bookings.indexOf("Payment_Verification") + 1;
  const range = event.range;
  if (range.getColumn() > verificationColumn || range.getLastColumn() < verificationColumn || range.getLastRow() < 2) return;
  let sideEffects = { notificationEvent: null, metaPurchaseOrderId: null };
  try {
    const committedSideEffects = withPaymentLock_(function () {
      const sheet = paymentSheet_("Bookings");
      if (sheet.getSheetId() !== range.getSheet().getSheetId()) return;
      let committedNotification = null;
      let metaPurchaseOrderId = null;
      let metaPurchaseBooking = null;
      let metaPurchaseOccurredAt = null;
      const singleCell = range.getNumRows() === 1 && range.getNumColumns() === 1 && range.getRow() > 1;
      for (let rowIndex = Math.max(2, range.getRow()); rowIndex <= Math.min(range.getLastRow(), sheet.getLastRow()); rowIndex += 1) {
        const values = sheet.getRange(rowIndex, 1, 1, PAYMENT_HEADERS.Bookings.length).getValues()[0];
        const booking = {};
        PAYMENT_HEADERS.Bookings.forEach(function (key, index) { booking[key] = values[index]; });
        if (!booking.Booking_ID) continue;
        const manual = ["instapay", "wallet", "branch"].indexOf(booking.Payment_Method) >= 0;
        const safeVerification = manual ? { Pending: "Waiting Review", Paid: "Approved", Rejected: "Rejected" }[booking.Payment_Status] : "Not Required";
        if (!safeVerification) throw new Error("invalid_booking_status");
        const cell = sheet.getRange(rowIndex, verificationColumn, 1, 1);
        if (!singleCell) {
          cell.setValue(safeVerification);
          event.source.toast("Review one Payment_Verification cell at a time. No payment decision was applied.", "Payment review", 8);
          continue;
        }
        // Ignore delayed events if a newer human edit has already replaced their value.
        if (String(booking.Payment_Verification) !== String(event.value || "")) return;
        const requested = booking.Payment_Verification;
        if (!manual || booking.Payment_Status !== "Pending") {
          cell.setValue(safeVerification);
          if (requested !== safeVerification) event.source.toast("This payment cannot be changed through this review workflow.", "Payment review", 8);
          return;
        }
        if (requested === "Waiting Review") return;
        if (event.oldValue !== "Waiting Review" || ["Approved", "Rejected"].indexOf(requested) < 0) {
          cell.setValue("Waiting Review");
          event.source.toast("Start from Waiting Review and choose Approved or Rejected.", "Payment review", 8);
          return;
        }
        if (requested === "Approved" && booking.Payment_Method !== "branch" && !String(booking.Payment_Proof_URL || "").trim()) {
          cell.setValue("Waiting Review");
          event.source.toast("Payment proof is missing. Payment remains Pending / Waiting Review.", "Payment review", 8);
          return;
        }
        if (requested === "Approved") {
          metaPurchaseOrderId = String(booking.Booking_ID);
          metaPurchaseBooking = booking;
          metaPurchaseOccurredAt = new Date().toISOString();
        }
        try {
          transitionPromoUsageForBooking_(booking, requested === "Approved" ? "consumed" : "released", Date.now(), null, "payment_rejected");
        } catch (promoError) {
          if (safeErrorCode_(promoError) !== "promo_reservation_expired") throw promoError;
          cell.setValue("Waiting Review");
          event.source.toast("The promo reservation expired and could not be reacquired. Review the offer before approving payment.", "Promo reservation", 10);
          return;
        }
        // Write the two adjacent mutable cells together. The creation snapshot and notes never change.
        const paymentStatus = requested === "Approved" ? "Paid" : "Rejected";
        sheet.getRange(rowIndex, verificationColumn - 1, 1, 2)
          .setValues([[paymentStatus, requested]]);
        booking.Payment_Status = paymentStatus;
        booking.Payment_Verification = requested;
        committedNotification = paymentDecisionNotification_(booking, requested);
        event.source.toast(requested === "Approved" ? "Payment marked Paid after your approval." : "Payment marked Rejected.", "Payment review", 6);
      }
      // Commit the authoritative payment state first. Tracking is a fail-open,
      // repairable side effect and must never reject a valid approval.
      SpreadsheetApp.flush();
      if (metaPurchaseBooking) recordMetaPurchaseOutboxSafely_(metaPurchaseBooking, metaPurchaseOccurredAt);
      return { notificationEvent: committedNotification, metaPurchaseOrderId: metaPurchaseOrderId };
    });
    if (committedSideEffects) sideEffects = committedSideEffects;
  } catch (error) {
    event.source.toast("Review was not completed. Check the trigger execution, then retry from Waiting Review. Do not edit Payment_Status.", "Payment review error", 10);
    throw new Error(safeErrorCode_(error));
  }
  // Network delivery is deliberately outside ScriptLock and cannot undo the committed payment state.
  if (sideEffects.notificationEvent) emitNotificationEventSafely_(sideEffects.notificationEvent);
  if (sideEffects.metaPurchaseOrderId) emitMetaPurchaseWakeSafely_(sideEffects.metaPurchaseOrderId);
}

function emitMetaPurchaseWakeSafely_(orderId) {
  const startedAt = Date.now();
  const eventId = "meta:purchase:" + String(orderId);
  try {
    const properties = PropertiesService.getScriptProperties();
    const webhookUrl = properties.getProperty("META_PURCHASE_DRAIN_URL") || "";
    const webhookSecret = properties.getProperty("META_PURCHASE_DRAIN_SECRET") || "";
    if (!/^https:\/\//.test(webhookUrl) || webhookSecret.length < 32) {
      metaPurchaseWakeLog_(eventId, "pending", null, "configuration_missing", Date.now() - startedAt);
      return;
    }
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: { "X-Success-Academy-Meta-Drain-Secret": webhookSecret },
      payload: JSON.stringify({ orderId: String(orderId) }),
      muteHttpExceptions: true,
      followRedirects: false,
    });
    const status = response.getResponseCode();
    metaPurchaseWakeLog_(eventId, status >= 200 && status < 300 ? "accepted" : "pending", status,
      status >= 200 && status < 300 ? null : "http_rejected", Date.now() - startedAt);
  } catch (_error) {
    metaPurchaseWakeLog_(eventId, "pending", null, "network_error", Date.now() - startedAt);
  }
}

function metaPurchaseWakeLog_(eventId, result, httpStatus, diagnosticCode, elapsedMs) {
  try {
    console.log(JSON.stringify({
      scope: "meta_purchase_wake", eventId: eventId, result: result,
      httpStatus: httpStatus, diagnosticCode: diagnosticCode, elapsedMs: elapsedMs,
    }));
  } catch (ignored) {}
}

function paymentDecisionNotification_(booking, verification) {
  const eventType = verification === "Approved" ? "payment.approved" : "payment.rejected";
  return notificationEventFromBooking_(booking, eventType, "payment_admin", new Date().toISOString());
}

function notificationEventFromBooking_(booking, eventType, source, occurredAt) {
  const order = parseOrder_(booking.Order_Snapshot);
  const method = String(booking.Payment_Method || "");
  const branch = method === "branch";
  if ((order.locale !== "ar" && order.locale !== "en") || ["instapay", "wallet", "branch"].indexOf(method) < 0) {
    throw new Error("invalid_notification_booking");
  }
  return {
    version: NOTIFICATION_EVENT_VERSION,
    eventId: "notification:" + eventType + ":" + booking.Booking_ID,
    eventType: eventType,
    occurredAt: occurredAt,
    source: source,
    booking: {
      bookingId: String(booking.Booking_ID),
      reference: "SA-" + String(booking.Booking_ID).split("-")[0].toUpperCase(),
      locale: order.locale,
      createdAt: String(booking.Created_At),
      package: String(booking.Package),
      startLevel: String(booking.Start_Level),
      targetLevel: String(booking.Target_Level),
      hours: Number(booking.Hours),
      sessions: Number(booking.Sessions),
      attendanceType: String(booking.Attendance_Type),
      originalPriceEgp: Number(booking.Original_Price),
      promoCode: booking.Promo_Code ? String(booking.Promo_Code) : null,
      discountAmountEgp: Number(booking.Discount_Amount),
      finalPriceEgp: Number(booking.Final_Price),
      paymentMethod: method,
      paymentStatus: String(booking.Payment_Status),
      paymentVerification: String(booking.Payment_Verification),
      paymentContext: {
        kind: branch ? "branch" : "manual_transfer",
        proofReceived: Boolean(String(booking.Payment_Proof_URL || "").trim()),
        reservationHours: branch ? 72 : null,
        branchAddress: branch ? "54 شارع مصدق – الدور الأول – أمام هارديز – الدقي، الجيزة" : null,
        branchMapsUrl: branch ? "https://share.google/FG28DyvPaSVj6KpWj" : null,
        branchWorkingHours: branch ? { daily: "Every day 1:00 PM - 9:00 PM", friday: "Friday closed" } : null,
      },
    },
    customer: {
      fullName: String(booking.Full_Name),
      phone: String(booking.Phone),
      whatsapp: String(booking.WhatsApp),
      email: String(booking.Email),
    },
  };
}

function emitNotificationEventSafely_(notificationEvent) {
  const startedAt = Date.now();
  try {
    const properties = PropertiesService.getScriptProperties();
    const webhookUrl = properties.getProperty("NOTIFICATIONS_WEBHOOK_URL") || "";
    const webhookSecret = properties.getProperty("NOTIFICATIONS_WEBHOOK_SECRET") || "";
    if (!/^https:\/\//.test(webhookUrl) || webhookSecret.length < 32) {
      notificationLog_(notificationEvent, "failure", null, "configuration_missing", Date.now() - startedAt);
      return;
    }
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: { "X-Success-Academy-Webhook-Secret": webhookSecret },
      payload: JSON.stringify(notificationEvent),
      muteHttpExceptions: true,
      followRedirects: false,
    });
    const status = response.getResponseCode();
    notificationLog_(notificationEvent, status >= 200 && status < 300 ? "success" : "failure", status,
      status >= 200 && status < 300 ? null : "http_rejected", Date.now() - startedAt);
  } catch (error) {
    notificationLog_(notificationEvent, "failure", null, "network_error", Date.now() - startedAt);
  }
}

function notificationLog_(notificationEvent, result, httpStatus, diagnosticCode, elapsedMs) {
  try {
    console.log(JSON.stringify({
      scope: "notification",
      eventType: notificationEvent.eventType,
      eventId: notificationEvent.eventId,
      result: result,
      httpStatus: httpStatus,
      diagnosticCode: diagnosticCode,
      elapsedMs: elapsedMs,
    }));
  } catch (ignored) {}
}

function currentBookingOrder_(booking) {
  const order = parseOrder_(booking.Order_Snapshot);
  if (order.id !== booking.Booking_ID || order.payment.method !== booking.Payment_Method) throw new Error("invalid_booking_status");
  const manual = ["instapay", "wallet", "branch"].indexOf(booking.Payment_Method) >= 0;
  const status = booking.Payment_Status;
  const verification = booking.Payment_Verification;
  if (manual) {
    if (status === "Pending" && verification === "Waiting Review") {
      order.status = "pending";
      order.payment.status = "not_started";
    } else if (status === "Paid" && verification === "Approved"
      && (booking.Payment_Method === "branch" || String(booking.Payment_Proof_URL || "").trim())) {
      order.status = "paid";
      order.payment.status = "paid";
    } else if (status === "Rejected" && verification === "Rejected") {
      order.status = "failed";
      order.payment.status = "failed";
    } else {
      throw new Error("invalid_booking_status");
    }
  } else {
    const provider = String(booking.Payment_Provider || "");
    const transactionId = String(booking.Provider_Transaction_ID || "");
    const redirectUrl = String(booking.Payment_Redirect_URL || "");
    if (!provider && !transactionId && !redirectUrl && status === "Pending" && verification === "Not Required") {
      order.status = "pending";
      order.payment.status = "not_started";
    } else {
      if (!validAutomatedProvider_(order.payment.method, provider) || !validProviderRedirect_(provider, redirectUrl)
        || (provider === "paytabs" && !transactionId)) throw new Error("invalid_booking_status");
      order.payment.provider = provider;
      order.payment.transactionId = transactionId || null;
      order.payment.redirectUrl = redirectUrl;
      if (status === "Pending" && verification === "Not Required") {
        order.status = "waiting_payment";
        order.payment.status = "waiting_payment";
      } else if (status === "Paid" && verification === "Not Required") {
        if (!transactionId) throw new Error("invalid_booking_status");
        order.status = "paid";
        order.payment.status = "paid";
      } else if (status === "Rejected" && verification === "Not Required") {
        if (!transactionId) throw new Error("invalid_booking_status");
        order.status = "failed";
        order.payment.status = "failed";
      } else throw new Error("invalid_booking_status");
    }
  }
  order.updatedAt = String(booking.Payment_Updated_At || order.updatedAt);
  return order;
}

function paymentSheet_(name, trace) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("PAYMENTS_SPREADSHEET_ID") || "";
  if (!spreadsheetId) throw new Error("missing_spreadsheet_id");
  const spreadsheet = paymentStage_(trace, "spreadsheet_open", "payment_sheet_open_failed", function () {
    return SpreadsheetApp.openById(spreadsheetId);
  });
  const sheetStage = { Bookings: "bookings_sheet_resolve", "Promo Codes": "promo_codes_sheet_resolve", "Promo Usage": "promo_usage_sheet_resolve",
    "Meta Purchase Outbox": "meta_purchase_outbox_sheet_resolve" }[name];
  const sheet = paymentStage_(trace, sheetStage, "payment_sheet_resolve_failed", function () {
    const resolved = spreadsheet.getSheetByName(name);
    if (!resolved) throw new Error("missing_sheet");
    return resolved;
  });
  const expected = PAYMENT_HEADERS[name];
  paymentStage_(trace, "sheet_headers_validate", "payment_sheet_schema_failed", function () {
    const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
    if (actual.join("\u001f") !== expected.join("\u001f")) throw new Error("invalid_sheet_schema");
  });
  return sheet;
}

function validateRow_(name, row) {
  requireObject_(row, "invalid_row");
  const expected = PAYMENT_HEADERS[name];
  if (Object.keys(row).length !== expected.length || expected.some(function (header) { return !Object.prototype.hasOwnProperty.call(row, header); })) {
    throw new Error("invalid_row");
  }
}

function appendRow_(sheet, name, row) {
  validateRow_(name, row);
  const values = PAYMENT_HEADERS[name].map(function (header) { return row[header]; });
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function findRow_(sheet, header, value) {
  const headers = PAYMENT_HEADERS[sheet.getName()];
  const column = headers.indexOf(header);
  if (column < 0 || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (let index = 0; index < rows.length; index += 1) {
    if (String(rows[index][column]) === String(value)) {
      const result = {};
      headers.forEach(function (key, item) { result[key] = rows[index][item]; });
      return result;
    }
  }
  return null;
}

function findPromoRowByCode_(sheet, code) {
  const headers = PAYMENT_HEADERS["Promo Codes"];
  const codeIndex = headers.indexOf("Code");
  if (sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const matches = rows.filter(function (row) {
    return String(row[codeIndex]).trim().toUpperCase() === code;
  });
  if (matches.length > 1) throw new Error("promo_invalid");
  if (!matches.length) return null;
  const result = {};
  headers.forEach(function (key, index) { result[key] = matches[0][index]; });
  return result;
}

function findRowNumber_(sheet, header, value) {
  const headers = PAYMENT_HEADERS[sheet.getName()];
  const column = headers.indexOf(header);
  if (column < 0 || sheet.getLastRow() < 2) return 0;
  const values = sheet.getRange(2, column + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(value)) return index + 2;
  }
  return 0;
}

function promoUseCount_(code, trace) {
  releaseExpiredPromoReservations_(code, Date.now(), trace);
  const bookingSheet = paymentSheet_("Bookings", trace);
  const bookingHeaders = PAYMENT_HEADERS.Bookings;
  const bookingCodeIndex = bookingHeaders.indexOf("Promo_Code");
  const bookingIdIndex = bookingHeaders.indexOf("Booking_ID");
  const bookings = {};
  if (bookingSheet.getLastRow() >= 2) {
    bookingSheet.getRange(2, 1, bookingSheet.getLastRow() - 1, bookingHeaders.length).getValues().forEach(function (row) {
      if (String(row[bookingCodeIndex] || "").trim().toUpperCase() === code) bookings[String(row[bookingIdIndex])] = true;
    });
  }
  const usageSheet = paymentSheet_("Promo Usage", trace);
  const usageHeaders = PAYMENT_HEADERS["Promo Usage"];
  const usageBookingIndex = usageHeaders.indexOf("Booking_ID");
  const usageCodeIndex = usageHeaders.indexOf("Promo_Code");
  const usageStatusIndex = usageHeaders.indexOf("Status");
  const recorded = {};
  const occupied = {};
  if (usageSheet.getLastRow() >= 2) {
    usageSheet.getRange(2, 1, usageSheet.getLastRow() - 1, usageHeaders.length).getValues().forEach(function (row) {
      const bookingId = String(row[usageBookingIndex]);
      if (!bookings[bookingId] || String(row[usageCodeIndex] || "").trim().toUpperCase() !== code) return;
      recorded[bookingId] = true;
      if (promoUsageStatus_(row[usageStatusIndex]) !== "released") occupied[bookingId] = true;
    });
  }
  Object.keys(bookings).forEach(function (bookingId) {
    // A Booking committed before its audit row remains a conservative use until retry repair.
    if (!recorded[bookingId]) occupied[bookingId] = true;
  });
  return Object.keys(occupied).length;
}

function parseOrder_(value) {
  return normalizeOrder_(JSON.parse(String(value)));
}

function normalizeOrder_(order) {
  if (!order || typeof order.id !== "string" || typeof order.requestFingerprint !== "string") throw new Error("invalid_order");
  if (!order.programType) order.programType = "group";
  if (order.programType !== "group" && order.programType !== "private") throw new Error("invalid_order");
  if (!order.packageSnapshot || typeof order.packageSnapshot.packageId !== "string") throw new Error("invalid_order");
  const privatePackage = order.packageSnapshot.packageId.indexOf("private-") === 0;
  if ((order.programType === "private") !== privatePackage) throw new Error("invalid_order");
  if (order.packageSnapshot.sessionDurationHours === undefined) {
    order.packageSnapshot.sessionDurationHours = order.programType === "private" ? 1.5 : 3;
  }
  if (order.packageSnapshot.sessionDurationHours !== (order.programType === "private" ? 1.5 : 3)) throw new Error("invalid_order");
  return order;
}

function withPaymentLock_(operation, trace) {
  paymentTrace_(trace, "script_lock_requested", null);
  const lock = LockService.getScriptLock();
  paymentStage_(trace, "script_lock_wait", "payment_lock_timeout", function () {
    if (!lock.tryLock(20000)) throw new Error("storage_busy");
  });
  paymentTrace_(trace, "script_lock_acquired", true);
  try { return operation(); } finally {
    paymentStage_(trace, "script_lock_release", "payment_lock_release_failed", function () { lock.releaseLock(); });
  }
}

function requireContract_(payload) {
  if (!payload || payload.contractVersion !== PAYMENT_CONTRACT_VERSION) throw new Error("unsupported_contract");
}

function requireObject_(value, code) {
  if (!value || Object.prototype.toString.call(value) !== "[object Object]") throw new Error(code);
  return value;
}

function normalizeCode_(value) {
  const code = string_(value).trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(code)) throw new Error("promo_invalid");
  return code;
}

function nullableInteger_(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("promo_invalid");
  return number;
}

function finiteNumber_(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error("promo_invalid");
  return number;
}

function promoValue_(value, type) {
  const number = finiteNumber_(value);
  const minor = Math.round(number * 100);
  if (!Number.isSafeInteger(minor) || Math.abs(number * 100 - minor) > 0.000001
    || (type === "percentage" && minor > 10000)) throw new Error("promo_invalid");
  return minor / 100;
}

function boolean_(value) {
  if (value === true || String(value).trim().toUpperCase() === "TRUE") return true;
  if (value === false || String(value).trim().toUpperCase() === "FALSE") return false;
  throw new Error("promo_invalid");
}

function nullableIso_(value) {
  if (value === "" || value === null || value === undefined) return null;
  const isDate = value instanceof Date || Object.prototype.toString.call(value) === "[object Date]";
  if (!isDate && (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))) {
    throw new Error("promo_invalid");
  }
  const date = isDate ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("promo_invalid");
  return date.toISOString();
}

function string_(value) { return typeof value === "string" ? value : ""; }

function safeErrorCode_(error) {
  const allowed = ["invalid_request", "invalid_booking", "invalid_order", "invalid_notification", "idempotency_conflict",
    "order_conflict",
    "promo_invalid", "promo_inactive", "promo_not_started", "promo_expired", "promo_limit_reached", "promo_changed", "promo_package_ineligible",
    "promo_reservation_expired", "order_not_found",
    "invalid_payment_proof", "proof_storage_unavailable", "missing_sheet", "invalid_sheet_schema", "invalid_row",
    "unsupported_contract", "storage_busy", "missing_spreadsheet_id", "invalid_booking_status", "invalid_meta_outbox"];
  return error && allowed.indexOf(error.message) >= 0 ? error.message : "internal_error";
}

function paymentActionName_(value) {
  const allowed = ["create_order", "find_order_by_idempotency", "get_order", "ensure_promo_reservation", "commit_booking_transition", "get_customer_for_order",
    "claim_meta_purchase_job", "complete_meta_purchase_job", "requeue_meta_purchase_job", "reconcile_meta_purchase_jobs", "get_promo", "upload_payment_proof"];
  return allowed.indexOf(value) >= 0 ? value : "unknown";
}

function paymentDiagnosticCode_(value) {
  const allowed = [
    "payment_sheet_open_failed", "payment_sheet_resolve_failed", "payment_sheet_schema_failed",
    "payment_lock_timeout", "payment_lock_release_failed", "payment_idempotency_lookup_failed",
    "payment_booking_lookup_failed", "payment_promo_validation_failed", "payment_booking_write_failed",
    "payment_flush_failed", "payment_promo_usage_failed", "payment_response_serialization_failed",
    "payment_request_rejected", "payment_unknown_storage_error",
  ];
  return allowed.indexOf(value) >= 0 ? value : "payment_unknown_storage_error";
}

function paymentDiagnosticCodeForError_(error) {
  const raw = error && typeof error.message === "string" ? error.message : "";
  if (["invalid_request", "unauthorized", "unsupported_action"].indexOf(raw) >= 0) return "payment_request_rejected";
  const safe = safeErrorCode_(error);
  if (safe === "missing_spreadsheet_id") return "payment_sheet_open_failed";
  if (safe === "missing_sheet") return "payment_sheet_resolve_failed";
  if (safe === "invalid_sheet_schema") return "payment_sheet_schema_failed";
  if (safe === "storage_busy") return "payment_lock_timeout";
  return safe === "internal_error" ? "payment_unknown_storage_error" : "payment_request_rejected";
}

function paymentTrace_(trace, stage, success, diagnosticCode) {
  if (!trace) return;
  const entry = {
    action: paymentActionName_(trace.action),
    stage: String(stage),
    elapsedMs: Math.max(0, Date.now() - trace.startedAt),
    success: success === null ? null : Boolean(success),
    diagnosticCode: diagnosticCode ? paymentDiagnosticCode_(diagnosticCode) : null,
  };
  try {
    console.log(JSON.stringify(entry));
  } catch (_loggingError) {
    // Diagnostics must never change payment behavior.
  }
}

function paymentStage_(trace, stage, diagnosticCode, operation) {
  paymentTrace_(trace, stage + "_start", null, null);
  try {
    const result = operation();
    paymentTrace_(trace, stage + "_end", true, null);
    return result;
  } catch (error) {
    const safeDiagnosticCode = paymentDiagnosticCode_(diagnosticCode);
    if (trace && !trace.failureCode) trace.failureCode = safeDiagnosticCode;
    paymentTrace_(trace, stage + "_failed", false, safeDiagnosticCode);
    throw error;
  }
}

function paymentDiagnosticReply_(body, trace) {
  let response = body;
  if (body && body.success === false) {
    const diagnosticCode = trace && trace.failureCode
      ? paymentDiagnosticCode_(trace.failureCode)
      : paymentDiagnosticCodeForError_({ message: body.error });
    response = Object.assign({}, body, { diagnosticCode: diagnosticCode });
  }
  paymentTrace_(trace, "response_serialization_start", null, null);
  try {
    const output = reply_(response);
    paymentTrace_(trace, "response_serialization_end", true, null);
    paymentTrace_(trace, "doPost_completed", Boolean(body && body.success), response.diagnosticCode || null);
    return output;
  } catch (error) {
    const diagnosticCode = "payment_response_serialization_failed";
    if (trace && !trace.failureCode) trace.failureCode = diagnosticCode;
    paymentTrace_(trace, "response_serialization_failed", false, diagnosticCode);
    paymentTrace_(trace, "doPost_completed", false, diagnosticCode);
    throw error;
  }
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
