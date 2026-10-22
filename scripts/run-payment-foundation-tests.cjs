const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
let storedAttempt = null;
let attemptReads = 0;

const originalLoad = Module._load;
Module._load = function paymentFoundationLoad(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "../../placement-test/server/attempt-service" && parent.filename.includes("payments")) {
    return { getExistingAttempt: async () => { attemptReads += 1; return storedAttempt; } };
  }
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const root = path.resolve(__dirname, "..");
const {
  OrderIdempotencyConflictError,
  OrderService,
  OrderValidationError,
} = require(path.join(root, "src/features/payments/server/order-service.ts"));
const {
  createOrderAccessToken,
  verifyOrderAccessToken,
} = require(path.join(root, "src/features/payments/server/order-access.ts"));
const { getPlanRecommendation } = require(path.join(root, "src/features/plans/config.ts"));
const { validateCustomerContact, paymentMethodPreferences, requiresPaymentProof, validatePaymentProof } = require(path.join(root, "src/features/payments/validation.ts"));
const { createOrderHandler } = require(path.join(root, "src/features/payments/server/create-order-handler.ts"));
const { GoogleSheetsOrderRepository } = require(path.join(root, "src/features/payments/server/google-sheets-order-repository.ts"));
const { OrderRepositoryUnavailableError } = require(path.join(root, "src/features/payments/server/order-repository.ts"));
const { trackPaymentPreparation } = require(path.join(root, "src/features/payments/tracking.ts"));
const { resolveOrderCustomer } = require(path.join(root, "src/features/payments/server/customer-context.ts"));
const { PLACEMENT_ATTEMPT_COOKIE } = require(path.join(root, "src/features/placement-test/server/cookie.ts"));
const { PromoService, evaluatePromo } = require(path.join(root, "src/features/promos/promo-service.ts"));
const { PromoValidationError, PromoRepositoryUnavailableError } = require(path.join(root, "src/features/promos/promo-repository.ts"));
const { GoogleSheetsPromoRepository } = require(path.join(root, "src/features/promos/google-sheets-promo-repository.ts"));
const { createValidatePromoHandler } = require(path.join(root, "src/features/promos/validate-promo-handler.ts"));
const { LegalConsentRequiredError, LegalPoliciesUnavailableError, getLegalPolicyLinks } = require(path.join(root, "src/features/payments/server/legal-consent.ts"));
const { trainingRules, TRAINING_TERMS_VERSION } = require(path.join(root, "src/content/training-rules.ts"));
const { validateEnrollment } = require(path.join(root, "src/features/customers/validation.ts"));
const { CustomerService } = require(path.join(root, "src/features/customers/customer-service.ts"));
const { GoogleSheetsCustomerRepository } = require(path.join(root, "src/features/customers/google-sheets-customer-repository.ts"));
const { prepareAdminBookingEmail } = require(path.join(root, "src/features/payments/server/booking-records.ts"));
const { bookingPaymentStatus, bookingPaymentVerification, toBookingSheetRow, toPromoUsageSheetRow } = require(path.join(root, "src/features/payments/server/booking-sheet.ts"));
const { createUploadPaymentProofHandler } = require(path.join(root, "src/features/payments/server/upload-payment-proof-handler.ts"));
const { GoogleDrivePaymentProofStorage } = require(path.join(root, "src/features/payments/server/google-drive-payment-proof-storage.ts"));
const { createProofReceipt, verifyProofReceipt } = require(path.join(root, "src/features/payments/server/proof-receipt.ts"));
const { bookingDisplayReference, bookingPresentation } = require(path.join(root, "src/features/payments/success-presentation.ts"));
const { manualPaymentConfig } = require(path.join(root, "src/features/payments/manual-payment-config.ts"));
const { buildBookingCreatedEvent, buildProviderPaymentEvent, notificationEventId } = require(path.join(root, "src/features/payments/server/notification-events.ts"));
const { PayTabsProvider } = require(path.join(root, "src/features/payments/server/paytabs-provider.ts"));
const { createPayTabsInitiateHandler } = require(path.join(root, "src/features/payments/server/paytabs-initiate-handler.ts"));
const { createPayTabsCallbackHandler } = require(path.join(root, "src/features/payments/server/paytabs-callback-handler.ts"));
const { EasyKashProvider } = require(path.join(root, "src/features/payments/server/easykash-provider.ts"));
const { createEasyKashInitiateHandler } = require(path.join(root, "src/features/payments/server/easykash-initiate-handler.ts"));
const { createEasyKashCallbackHandler } = require(path.join(root, "src/features/payments/server/easykash-callback-handler.ts"));
const { createConfiguredEasyKashProvider } = require(path.join(root, "src/features/payments/server/easykash-factory.ts"));
const { buildMetaPurchaseEvent, metaPurchaseEventId } = require(path.join(root, "src/features/payments/server/meta-purchase.ts"));
const { MetaCapiClient, readMetaCapiConfig } = require(path.join(root, "src/features/payments/server/meta-capi.ts"));
const { drainOne } = require(path.join(root, "src/features/payments/server/meta-purchase-delivery.ts"));

const testPolicies = { terms: "/test-policies/terms", privacy: "/test-policies/privacy", trainingTerms: "/test-policies/training" };

class InMemoryOrderRepository {
  constructor() {
    this.orders = new Map();
    this.idempotency = new Map();
    this.events = [];
    this.promos = new Map();
    this.bookings = new Map();
    this.usages = new Map();
    this.reservationChecks = [];
    this.audits = [];
    this.now = () => new Date("2026-09-02T12:00:00Z");
  }

  async createIfAbsent(order, event, records, guard) {
    const existingId = this.idempotency.get(order.idempotencyKeyHash);
    if (existingId) return { order: structuredClone(this.orders.get(existingId)), created: false };
    if (guard) {
      const promo = this.promos.get(guard.code);
      if (!promo) throw new PromoValidationError("promo_invalid");
      const journalUses = [...this.usages.values()].filter((usage) => usage.promoCode === promo.code).length;
      const fresh = evaluatePromo({ ...promo, usedCount: Math.max(promo.usedCount, journalUses) }, order.packageSnapshot.packageId, order.packageSnapshot.priceEgp, this.now());
      if (JSON.stringify(fresh.redemption) !== JSON.stringify(guard)) throw new PromoValidationError("promo_changed");
      assert.deepEqual(fresh.pricing, order.pricing);
      promo.usedCount += 1;
      assert.equal(records.promoUsage.orderId, order.id);
      this.usages.set(records.promoUsage.usageId, structuredClone(records.promoUsage));
    }
    this.orders.set(order.id, structuredClone(order));
    this.idempotency.set(order.idempotencyKeyHash, order.id);
    this.events.push(structuredClone(event));
    this.bookings.set(order.id, structuredClone(records));
    this.audits.push(structuredClone(records.audit));
    return { order: structuredClone(order), created: true };
  }

  async findByIdempotencyKeyHash(idempotencyKeyHash) {
    const id = this.idempotency.get(idempotencyKeyHash);
    return id ? structuredClone(this.orders.get(id)) : null;
  }

  async getById(orderId) {
    const order = this.orders.get(orderId);
    return order ? structuredClone(order) : null;
  }

  async ensurePromoReservation(orderId) {
    assert.ok(this.orders.has(orderId));
    this.reservationChecks.push(orderId);
  }

  async commitTransition(order, event, audit) {
    assert.ok(this.orders.has(order.id));
    assert.equal(this.orders.get(order.id).status, event.previousStatus);
    this.orders.set(order.id, structuredClone(order));
    this.events.push(structuredClone(event));
    this.audits.push(structuredClone(audit));
    this.bookings.get(order.id).customer.paymentStatus = order.payment.status;
    return structuredClone(order);
  }
}

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

function createFixture(overrides = {}) {
  const repository = new InMemoryOrderRepository();
  let id = 0;
  let tick = 0;
  const service = new OrderService({
    repository,
    createId: () => `fixture-${++id}`,
    now: () => new Date(Date.UTC(2026, 8, 1, 12, 0, tick++)),
    legalPolicies: () => testPolicies,
    ...overrides,
  });
  return { repository, service };
}

const customer = {
  id: "lead_customer_1",
  leadReference: "lead-reference-server-only",
  identitySource: "existing_lead",
  name: "Test Customer",
  phone: "+201000000001",
  email: "checkout@example.test",
};
const enrollment = {
  name: customer.name, phone: customer.phone, email: customer.email,
  whatsapp: customer.phone, age: 25, notes: null,
};

function validInput(overrides = {}) {
  const recommendation = getPlanRecommendation("A1", "B2");
  assert.ok(recommendation);
  return {
    locale: "ar",
    startLevel: "A1",
    targetLevel: "B2",
    packageId: recommendation.package.id,
    attendance: "online",
    quotedPriceEgp: recommendation.package.priceEgp,
    paymentMethod: "card",
    legalConsent: { accepted: true },
    marketing: { utm_source: "test" },
    enrollment,
    ...overrides,
  };
}

function privateInput(overrides = {}) {
  const recommendation = getPlanRecommendation("private", "A1", "B2");
  assert.ok(recommendation);
  return validInput({
    programType: "private",
    packageId: recommendation.package.id,
    quotedPriceEgp: recommendation.package.priceEgp,
    ...overrides,
  });
}

const context = {
  customer,
  idempotencyKey: "payment-foundation-test-0001",
};

test("creates an order from the authoritative plan catalog", async () => {
  const { repository, service } = createFixture();
  const result = await service.createOrder(validInput(), context);
  const recommendation = getPlanRecommendation("A1", "B2");

  assert.equal(result.created, true);
  assert.equal(repository.orders.size, 1);
  assert.equal(result.order.packageSnapshot.priceEgp, recommendation.package.priceEgp);
  assert.equal(result.order.payment.amountMinor, recommendation.package.priceEgp * 100);
  assert.equal(result.order.packageSnapshot.packageId, recommendation.package.id);
  assert.equal(result.order.status, "pending");
  assert.equal(result.order.payment.status, "not_started");
});

test("creates a Private 1:1 order with explicit immutable program and session facts", async () => {
  const { repository, service } = createFixture();
  const result = await service.createOrder(privateInput(), context);
  assert.equal(result.order.programType, "private");
  assert.equal(result.order.packageSnapshot.packageId, "private-excellence-60");
  assert.equal(result.order.packageSnapshot.hours, 60);
  assert.equal(result.order.packageSnapshot.sessions, 40);
  assert.equal(result.order.packageSnapshot.sessionDurationHours, 1.5);
  assert.equal(result.order.packageSnapshot.priceEgp, 20000);
  assert.equal(result.order.packageSnapshot.regularPriceEgp, null);
  assert.equal(result.order.packageSnapshot.discountEgp, 0);
  assert.equal(result.order.packageSnapshot.startLevel, "A1");
  assert.equal(result.order.packageSnapshot.targetLevel, "B2");
  assert.equal(result.order.payment.amountMinor, 2000000);
  const booking = toBookingSheetRow(result.order, repository.bookings.get(result.order.id));
  assert.equal(Object.hasOwn(booking, "Program_Type"), false);
  assert.equal(Object.keys(booking).length, 30);
  assert.equal(JSON.parse(booking.Order_Snapshot).programType, "private");
  assert.equal(repository.orders.size, 1);
});

test("rejects cross-family package and program combinations", async () => {
  const { repository, service } = createFixture();
  await assert.rejects(
    () => service.createOrder(validInput({ programType: "private" }), context),
    (error) => error instanceof OrderValidationError && error.code === "invalid_plan",
  );
  await assert.rejects(
    () => service.createOrder(privateInput({ programType: "group" }), { ...context, idempotencyKey: "private-family-mismatch-0002" }),
    (error) => error instanceof OrderValidationError && error.code === "invalid_plan",
  );
  assert.equal(repository.orders.size, 0);
});

test("rejects a package that does not match the selected learning path", async () => {
  const { service } = createFixture();
  const starter = getPlanRecommendation("A1", "A1");
  assert.ok(starter);
  await assert.rejects(
    () => service.createOrder(validInput({ packageId: starter.package.id }), context),
    (error) => error instanceof OrderValidationError && error.code === "invalid_plan",
  );
});

test("rejects a quoted price mismatch and never stores the client amount", async () => {
  const { repository, service } = createFixture();
  await assert.rejects(
    () => service.createOrder(validInput({ quotedPriceEgp: 1 }), context),
    (error) => error instanceof OrderValidationError && error.code === "price_mismatch",
  );
  assert.equal(repository.orders.size, 0);
});

test("reuses an order for the same idempotency key", async () => {
  const { repository, service } = createFixture();
  const first = await service.createOrder(validInput(), context);
  const second = await service.createOrder(validInput(), context);

  assert.equal(first.order.id, second.order.id);
  assert.equal(second.created, false);
  assert.equal(repository.orders.size, 1);
  assert.equal(repository.events.length, 1);
});

test("legacy missing program type and explicit Group share the same idempotent request", async () => {
  const { service } = createFixture();
  const first = await service.createOrder(validInput(), context);
  const retry = await service.createOrder(validInput({ programType: "group" }), context);
  assert.equal(first.created, true);
  assert.equal(retry.created, false);
  assert.equal(retry.order.id, first.order.id);
  assert.equal(retry.order.programType, "group");
});

test("rejects reuse of an idempotency key for a different order", async () => {
  const { service } = createFixture();
  await service.createOrder(validInput(), context);
  await assert.rejects(
    () => service.createOrder(validInput({ attendance: "branch" }), context),
    (error) => error instanceof OrderIdempotencyConflictError,
  );
});

test("enforces valid status transitions and a paid transaction reference", async () => {
  const { service } = createFixture();
  const created = await service.createOrder(validInput(), context);
  const waiting = await service.transitionOrder(created.order.id, {
    status: "waiting_payment",
    method: "card",
    provider: "paytabs",
  });
  assert.equal(waiting.status, "waiting_payment");
  await assert.rejects(
    () => service.transitionOrder(created.order.id, { status: "paid" }),
    (error) => error instanceof OrderValidationError && error.code === "missing_transaction_reference",
  );
  const paid = await service.transitionOrder(created.order.id, {
    status: "paid",
    transactionId: "provider-transaction-1",
  });
  assert.equal(paid.status, "paid");
  assert.equal(paid.payment.status, "paid");
  await assert.rejects(
    () => service.transitionOrder(created.order.id, { status: "failed" }),
    (error) => error instanceof OrderValidationError && error.code === "invalid_transition",
  );
});

test("derives and verifies order access tokens without storing a browser secret", () => {
  const secret = "foundation-test-secret-that-is-at-least-32-characters";
  const token = createOrderAccessToken("order-1", secret);
  assert.equal(verifyOrderAccessToken("order-1", token, secret), true);
  assert.equal(verifyOrderAccessToken("order-2", token, secret), false);
});

test("requires all contact fields and validates Egyptian mobile numbers and email", async () => {
  for (const field of ["name", "phone", "email"]) {
    const invalid = { ...customer, [field]: "" };
    assert.equal(validateCustomerContact(invalid).valid, false);
    const { service, repository } = createFixture();
    await assert.rejects(() => service.createOrder(validInput(), { ...context, customer: invalid }), /invalid_customer/);
    assert.equal(repository.orders.size, 0);
  }
  for (const phone of ["123", "+15551234567", "012345678", "01400000000"]) {
    assert.equal(validateCustomerContact({ ...customer, phone }).valid, false);
  }
  for (const email of ["bad", "a@b", "a @b.test"]) assert.equal(validateCustomerContact({ ...customer, email }).valid, false);
  for (const phone of ["01000000001", "+201000000001", "00201000000001", "٠١٠٠٠٠٠٠٠٠١"]) {
    assert.equal(validateCustomerContact({ ...customer, phone }).contact.phone, "+201000000001");
  }
});

test("all five methods save a preference without activating a provider or payment", async () => {
  assert.deepEqual([...paymentMethodPreferences].sort(), ["branch", "card", "installments", "instapay", "wallet"]);
  for (const paymentMethod of paymentMethodPreferences) {
    const { service } = createFixture();
    const proofLink = requiresPaymentProof(paymentMethod) ? "https://drive.google.com/file/d/test-proof/view" : undefined;
    const { order } = await service.createOrder(validInput({ paymentMethod, proofLink }), context);
    assert.equal(order.payment.method, paymentMethod);
    assert.equal(order.payment.provider, null);
    assert.equal(order.payment.transactionId, null);
    assert.equal(order.payment.status, "not_started");
    assert.equal(order.status, "pending");
  }
  const { service } = createFixture();
  await assert.rejects(() => service.createOrder(validInput({ paymentMethod: "paid" }), context), /invalid_payment_method/);
});

test("all five payment methods accept the same authoritative Private 1:1 catalog", async () => {
  for (const paymentMethod of paymentMethodPreferences) {
    const { service } = createFixture();
    const proofLink = requiresPaymentProof(paymentMethod) ? "https://drive.google.com/file/d/private-proof/view" : undefined;
    const { order } = await service.createOrder(privateInput({ paymentMethod, proofLink }), {
      ...context,
      idempotencyKey: `private-payment-${paymentMethod}-0001`,
    });
    assert.equal(order.programType, "private");
    assert.equal(order.payment.method, paymentMethod);
    assert.equal(order.payment.amountMinor, 2000000);
    assert.equal(order.status, "pending");
  }
});

test("concurrent retries produce one order and one event", async () => {
  const { service, repository } = createFixture();
  const responses = await Promise.all(Array.from({ length: 6 }, () => service.createOrder(validInput(), context)));
  assert.equal(responses.filter((item) => item.created).length, 1);
  assert.equal(new Set(responses.map((item) => item.order.id)).size, 1);
  assert.equal(repository.events.length, 1);
});

test("changing contact or payment preference cannot silently reuse an earlier request", async () => {
  const { service } = createFixture();
  await service.createOrder(validInput(), context);
  await assert.rejects(() => service.createOrder(validInput({ paymentMethod: "wallet", proofLink: "https://drive.google.com/file/d/test-proof/view" }), context), OrderIdempotencyConflictError);
  await assert.rejects(() => service.createOrder(validInput({ enrollment: { ...enrollment, email: "changed@example.test" } }), { ...context, customer: { ...customer, email: "changed@example.test" } }), OrderIdempotencyConflictError);
});

const secret = "payment-handler-test-secret-at-least-32-characters";
function createApi(overrides = {}) {
  const fixture = createFixture();
  return { ...fixture, handler: createOrderHandler({
    createService: () => fixture.service,
    getSecret: () => secret,
    resolveCustomer: async (_request, contact) => ({ customer: { ...customer, ...contact }, startLevel: null }),
    ...overrides,
  }) };
}
function request(overrides = {}, headers = {}) {
  const { enrollment: _enrollment, ...input } = validInput();
  return new Request("http://localhost/api/payments/orders", {
    method: "POST", headers: { "content-type": "application/json", "idempotency-key": context.idempotencyKey, ...headers },
    body: JSON.stringify({ ...input, customer: enrollment, ...overrides }),
  });
}

test("API creates a durable order, exposes a public reference, and reuses duplicates", async () => {
  const { handler, repository } = createApi();
  const first = await handler(request());
  assert.equal(first.status, 201);
  const body = await first.json();
  assert.equal(body.order.id, [...repository.orders.keys()][0]);
  assert.equal(body.order.customer, undefined);
  assert.equal(body.order.idempotencyKeyHash, undefined);
  assert.equal(JSON.stringify(body).includes(customer.leadReference), false);
  assert.equal(JSON.stringify(body).includes(customer.email), false);
  assert.equal(verifyOrderAccessToken(body.order.id, body.orderAccessToken, secret), true);
  const repeat = await handler(request());
  assert.equal(repeat.status, 200);
  assert.equal((await repeat.json()).created, false);
  assert.equal(repository.orders.size, 1);
});

test("booking.created is emitted only after persistence and retries retain its event ID", async () => {
  const notifications = [];
  let api;
  api = createApi({ emitNotification: async (event) => {
    assert.equal(api.repository.orders.has(event.booking.bookingId), true);
    notifications.push(structuredClone(event));
  } });
  assert.equal((await api.handler(request())).status, 201);
  assert.equal((await api.handler(request())).status, 200);
  assert.equal(api.repository.orders.size, 1);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].eventId, notifications[1].eventId);
  assert.equal(notifications[0].eventId, notificationEventId("booking.created", notifications[0].booking.bookingId));
});

test("failed persistence sends no event and notification failure remains fail-open", async () => {
  let sends = 0;
  const failed = createApi({ emitNotification: async () => { sends += 1; } });
  failed.repository.createIfAbsent = async () => { throw new OrderRepositoryUnavailableError(); };
  assert.equal((await failed.handler(request())).status, 503);
  assert.equal(sends, 0);

  const originalWarn = console.warn;
  const logs = [];
  console.warn = (value) => logs.push(String(value));
  try {
    const delivered = createApi({ emitNotification: async () => { throw new Error("private failure detail"); } });
    const response = await delivered.handler(request());
    assert.equal(response.status, 201);
    assert.equal(delivered.repository.orders.size, 1);
    assert.equal((await response.json()).ok, true);
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(logs.every((entry) => !entry.includes(customer.email) && !entry.includes(customer.phone)));
});

test("notification v1 payload is minimal, locale-aware and excludes private/internal fields", async () => {
  for (const [locale, method] of [["ar", "instapay"], ["en", "wallet"], ["ar", "branch"]]) {
    const { service } = createFixture();
    const input = validInput({ locale, paymentMethod: method,
      proofLink: method === "branch" ? undefined : "https://drive.google.com/file/d/private-proof/view" });
    const { order } = await service.createOrder(input, context);
    const event = buildBookingCreatedEvent(order, input.enrollment);
    assert.equal(event.version, 1);
    assert.equal(event.eventType, "booking.created");
    assert.equal(event.source, "checkout");
    assert.equal(event.booking.locale, locale);
    assert.equal(event.booking.paymentVerification, "Waiting Review");
    assert.deepEqual(Object.keys(event.booking).sort(), [
      "attendanceType", "bookingId", "createdAt", "discountAmountEgp", "finalPriceEgp", "hours", "locale",
      "originalPriceEgp", "package", "paymentContext", "paymentMethod", "paymentStatus", "paymentVerification",
      "promoCode", "reference", "sessions", "startLevel", "targetLevel",
    ]);
    assert.equal(event.booking.reference, bookingDisplayReference(order.id));
    assert.equal(event.booking.package, order.packageSnapshot.packageName);
    assert.equal(event.booking.startLevel, order.packageSnapshot.startLevel);
    assert.equal(event.booking.targetLevel, order.packageSnapshot.targetLevel);
    assert.equal(event.booking.hours, order.packageSnapshot.hours);
    assert.equal(event.booking.sessions, order.packageSnapshot.sessions);
    assert.equal(event.booking.attendanceType, order.attendance);
    assert.equal(event.booking.originalPriceEgp, order.pricing.originalPrice);
    assert.equal(event.booking.discountAmountEgp, order.pricing.discountAmount);
    assert.equal(event.booking.finalPriceEgp, order.pricing.finalPrice);
    assert.equal(event.booking.paymentMethod, method);
    assert.equal(event.booking.paymentStatus, "Pending");
    assert.equal(Object.hasOwn(event.booking, "originalPrice"), false);
    assert.equal(Object.hasOwn(event.booking, "discountAmount"), false);
    assert.equal(Object.hasOwn(event.booking, "finalPrice"), false);
    assert.deepEqual(Object.keys(event.customer).sort(), ["email", "fullName", "phone", "whatsapp"]);
    const serialized = JSON.stringify(event);
    for (const forbidden of ["Order_Snapshot", "Idempotency_Key_Hash", "Request_Fingerprint", "accessToken",
      "Payment_Proof_URL", "paymentProofUrl", "private-proof", "NOTIFICATIONS_WEBHOOK_SECRET"]) {
      assert.equal(serialized.includes(forbidden), false, `notification leaked ${forbidden}`);
    }
    if (method === "branch") {
      assert.equal(event.booking.paymentContext.kind, "branch");
      assert.equal(event.booking.paymentContext.reservationHours, 72);
      assert.equal(event.booking.paymentContext.proofReceived, false);
      assert.match(event.booking.paymentContext.branchAddress, /54 شارع مصدق/);
    } else {
      assert.equal(event.booking.paymentContext.kind, "manual_transfer");
      assert.equal(event.booking.paymentContext.proofReceived, true);
      assert.equal(event.booking.paymentContext.branchAddress, null);
    }
  }
  const { service } = createFixture();
  const input = validInput({ paymentMethod: "card" });
  const { order } = await service.createOrder(input, context);
  const preference = buildBookingCreatedEvent(order, input.enrollment);
  assert.equal(preference.booking.paymentVerification, "Not Required");
  assert.equal(preference.booking.paymentContext.kind, "payment_preference");
  assert.equal(preference.booking.paymentContext.proofReceived, false);
});

test("notification configuration is server-only and application code contains no provider credentials", () => {
  const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(env, /^NOTIFICATIONS_WEBHOOK_URL=$/m);
  assert.match(env, /^NOTIFICATIONS_WEBHOOK_SECRET=$/m);
  assert.doesNotMatch(env, /NEXT_PUBLIC_NOTIFICATIONS_/);
  const route = fs.readFileSync(path.join(root, "app/api/payments/orders/route.ts"), "utf8");
  const webhook = fs.readFileSync(path.join(root, "src/features/payments/server/notification-webhook.ts"), "utf8");
  assert.match(webhook, /"X-Success-Academy-Webhook-Secret": webhookSecret/);
  assert.doesNotMatch(webhook, /Authorization|Bearer/);
  assert.match(webhook, /AbortSignal\.timeout\(NOTIFICATION_TIMEOUT_MS\)/);
  assert.doesNotMatch(route + webhook, /BREVO_API_KEY|TELEGRAM_BOT_TOKEN|NEXT_PUBLIC_NOTIFICATIONS/);
});

test("API rejects contact, package, price, attendance, method and idempotency errors", async () => {
  const cases = [
    [{ customer: {} }, "invalid_customer"],
    [{ customer: { name: "Test", phone: "123", email: "a@example.test" } }, "invalid_customer"],
    [{ packageId: "fake" }, "invalid_plan"],
    [{ quotedPriceEgp: 1 }, "price_mismatch"],
    [{ attendance: "anywhere" }, "invalid_attendance"],
    [{ paymentMethod: "bitcoin" }, "invalid_payment_method"],
  ];
  for (const [body, code] of cases) {
    const { handler, repository } = createApi();
    const response = await handler(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, code);
    assert.equal(repository.orders.size, 0);
  }
  const { handler } = createApi();
  assert.equal((await handler(request({}, { "idempotency-key": "" }))).status, 400);
});

test("API rejects identity/status injection and locks the placement-derived start on the server", async () => {
  for (const extra of [{ amount: 1 }, { status: "paid" }, { leadReference: "forged" }, { customer: { name: "Test", phone: "01000000001", email: "a@example.test", id: "forged" } }]) {
    const { handler, repository } = createApi();
    assert.equal((await handler(request(extra))).status, 400);
    assert.equal(repository.orders.size, 0);
  }
  const { handler, repository } = createApi({ resolveCustomer: async () => ({ customer, startLevel: "A2" }) });
  assert.equal((await handler(request())).status, 400);
  assert.equal(repository.orders.size, 0);
});

test("API returns conflict when a repeated key carries changed details", async () => {
  const { handler, repository } = createApi();
  await handler(request());
  const conflict = await handler(request({ paymentMethod: "branch" }));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, "idempotency_conflict");
  assert.equal(repository.orders.size, 1);
});

test("missing configuration fails before persistence and repository errors never show success", async () => {
  const missing = createApi({ getSecret: () => { throw new OrderRepositoryUnavailableError(); } });
  assert.equal((await missing.handler(request())).status, 503);
  assert.equal(missing.repository.orders.size, 0);
  const unavailable = createApi();
  unavailable.repository.createIfAbsent = async () => { throw new OrderRepositoryUnavailableError(); };
  const response = await unavailable.handler(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  const failure = createApi({ resolveCustomer: async () => { throw new Error("secret or personal detail"); } });
  const failed = await failure.handler(request());
  assert.equal(failed.status, 500);
  assert.equal((await failed.text()).includes("personal detail"), false);
});

test("API blocks cross-origin requests, oversized bodies and excessive retries", async () => {
  const { handler } = createApi();
  assert.equal((await handler(request({}, { "sec-fetch-site": "cross-site" }))).status, 403);
  assert.equal((await handler(request({ marketing: { utm_source: "x".repeat(17000) } }))).status, 400);
  for (let i = 0; i < 19; i++) await handler(request());
  assert.equal((await handler(request())).status, 429);
});

test("same-origin validation supports Next localhost canonicalization without accepting foreign origins", async () => {
  const { handler } = createApi();
  assert.equal((await handler(request({}, { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }))).status, 201);
  assert.equal((await handler(request({}, { host: "127.0.0.1:3000", origin: "https://unrelated.example.test" }))).status, 403);
});

test("Google Sheets adapter requires acknowledgement and checks returned plan/amount", async () => {
  const { service, repository: memory } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const event = { id: "event", orderId: order.id };
  let sent;
  const repository = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test-only", fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ success: true, data: { order, created: true, bookingCommit: bookingAck(order) } });
  } });
  assert.equal((await repository.createIfAbsent(order, event, memory.bookings.get(order.id))).order.id, order.id);
  assert.equal(sent.domain, "payments");
  assert.equal(sent.action, "create_order");
  assert.equal(sent.payload.order.payment.method, "card");
  for (const reply of [{ success: true }, { success: false }, { success: true, data: { order: { ...order, packageSnapshot: { ...order.packageSnapshot, priceEgp: 1 } }, created: true } }]) {
    const invalid = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test-only", fetchImpl: async () => Response.json(reply) });
    await assert.rejects(() => invalid.createIfAbsent(order, event, memory.bookings.get(order.id)), OrderRepositoryUnavailableError);
  }
});

test("tracking hooks are inert by default and never interrupt checkout", () => {
  const event = { name: "InitiateCheckout", packageId: "excellence-120" };
  assert.doesNotThrow(() => trackPaymentPreparation(event));
  assert.doesNotThrow(() => trackPaymentPreparation(event, () => { throw new Error("tracking unavailable"); }));
  const source = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const tracking = fs.readFileSync(path.join(root, "src/features/payments/tracking.ts"), "utf8");
  assert.doesNotMatch(source, /name:\s*["']Purchase["']|fbq\(|\/api\/leads/);
  assert.doesNotMatch(tracking, /name:\s*["']Purchase["']/);
  assert.match(source, /window\.sessionStorage\.setItem\(storageKey, key\)/);
  assert.match(source, /submittingRef\.current/);
});

test("order and promo deadlines cover Apps Script latency without changing retry idempotency", () => {
  const checkout = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const promoRepository = fs.readFileSync(path.join(root, "src/features/promos/google-sheets-promo-repository.ts"), "utf8");
  const orderRepository = fs.readFileSync(path.join(root, "src/features/payments/server/google-sheets-order-repository.ts"), "utf8");
  const customerRepository = fs.readFileSync(path.join(root, "src/features/customers/google-sheets-customer-repository.ts"), "utf8");
  const orderRequestStart = checkout.indexOf('const response = await fetch("/api/payments/orders"');
  const orderRequestEnd = checkout.indexOf("const data = await response.json()", orderRequestStart);
  const orderRequest = checkout.slice(orderRequestStart, orderRequestEnd);

  assert.ok(orderRequestStart >= 0 && orderRequestEnd > orderRequestStart);
  assert.match(orderRequest, /AbortSignal\.timeout\(60_000\)/);
  assert.doesNotMatch(orderRequest, /AbortSignal\.timeout\(15_000\)/);
  assert.equal((checkout.match(/fetch\("\/api\/payments\/orders"/g) ?? []).length, 1);
  assert.match(checkout, /window\.sessionStorage\.getItem\(storageKey\)/);
  assert.match(checkout, /window\.sessionStorage\.setItem\(storageKey, key\)/);
  assert.match(checkout, /"Idempotency-Key": idempotencyKey/);
  assert.match(promoRepository, /AbortSignal\.timeout\(30_000\)/);
  assert.doesNotMatch(promoRepository, /AbortSignal\.timeout\(8_?000\)/);
  assert.match(orderRepository, /const REQUEST_TIMEOUT_MS = 30_000;/);
  assert.match(customerRepository, /AbortSignal\.timeout\(30_000\)/);
});

test("direct contact gets a stable server identity without creating a lead or reading an attempt", async () => {
  const contact = { name: customer.name, phone: customer.phone, email: customer.email };
  attemptReads = 0;
  const first = await resolveOrderCustomer(request(), contact, context.idempotencyKey, secret);
  const repeat = await resolveOrderCustomer(request(), contact, context.idempotencyKey, secret);
  assert.equal(first.customer.id, repeat.customer.id);
  assert.equal(first.customer.identitySource, "checkout_contact");
  assert.equal(first.customer.leadReference, null);
  assert.equal(first.startLevel, null);
  assert.equal(attemptReads, 0);
});

test("existing placement context remains server-only and carries the locked study start", async () => {
  storedAttempt = { leadReference: "server-lead-reference", finalProfile: { placement: "A2" } };
  const contact = { name: customer.name, phone: customer.phone, email: customer.email };
  const result = await resolveOrderCustomer(request({}, { cookie: `${PLACEMENT_ATTEMPT_COOKIE}=${"a".repeat(64)}` }), contact, context.idempotencyKey, secret);
  assert.equal(result.startLevel, "A2");
  assert.equal(result.customer.identitySource, "existing_lead");
  assert.equal(result.customer.leadReference, "server-lead-reference");
  storedAttempt = null;
});

test("consent is required in OrderService and API, including strict boolean validation", async () => {
  for (const legalConsent of [undefined, null, {}, { accepted: false }, { accepted: "true" }]) {
    const { service, repository } = createFixture();
    await assert.rejects(() => service.createOrder(validInput({ legalConsent }), context), LegalConsentRequiredError);
    assert.equal(repository.orders.size, 0);
    const { handler } = createApi();
    const response = await handler(request({ legalConsent }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "legal_consent_required");
  }
});

test("consent timestamps and versions are server snapshots; client timestamps are rejected", async () => {
  const { service } = createFixture();
  const first = await service.createOrder(validInput(), context);
  assert.deepEqual(first.order.legalConsent, {
    accepted: true, acceptedAt: first.order.createdAt,
    termsVersion: "current", privacyVersion: "current", trainingTermsVersion: "2026-09-v1",
  });
  const retry = await service.createOrder(validInput(), context);
  assert.deepEqual(retry.order.legalConsent, first.order.legalConsent);
  const { handler, repository } = createApi();
  assert.equal((await handler(request({ legalConsent: { accepted: true, acceptedAt: "forged", termsVersion: "forged" } }))).status, 400);
  assert.equal(repository.orders.size, 0);
});

test("missing training policy blocks new orders rather than recording incomplete consent", async () => {
  const { service, repository } = createFixture({ legalPolicies: () => ({ ...testPolicies, trainingTerms: null }) });
  await assert.rejects(() => service.createOrder(validInput(), context), LegalPoliciesUnavailableError);
  assert.equal(repository.orders.size, 0);
});

test("published training rules have 15 continuous clauses and the approved policy version", () => {
  assert.equal(TRAINING_TERMS_VERSION, "2026-09-v1");
  assert.equal(trainingRules.title, "لائحة القواعد والشروط العامة للتدريب");
  assert.equal(trainingRules.groups.length, 4);
  assert.deepEqual(trainingRules.groups.map((group) => group.clauses[0].number), [1, 6, 9, 15]);
  assert.deepEqual(trainingRules.groups.flatMap((group) => group.clauses.map((clause) => clause.number)), Array.from({ length: 15 }, (_, i) => i + 1));
  const component = fs.readFileSync(path.join(root, "src/components/legal/legal-page.tsx"), "utf8");
  assert.match(component, /id="training-rules"\s+lang="ar"\s+dir="rtl"/);
  assert.match(component, /section\.id === "terms" \? <TrainingRulesSection/);
  assert.match(component, /<ol start=\{group\.clauses\[0\]\.number\}/);
});

test("published policy links enable consented orders in both locales without changing old snapshots", async () => {
  for (const locale of ["ar", "en"]) {
    assert.deepEqual(getLegalPolicyLinks(locale), {
      terms: `/${locale}/legal#terms`, privacy: `/${locale}/legal#privacy`, trainingTerms: `/${locale}/legal#training-rules`,
    });
    const { service, repository } = createFixture({ legalPolicies: getLegalPolicyLinks });
    await assert.rejects(() => service.createOrder(validInput({ locale, legalConsent: { accepted: false } }), context), LegalConsentRequiredError);
    const created = await service.createOrder(validInput({ locale }), context);
    assert.equal(created.order.legalConsent.trainingTermsVersion, "2026-09-v1");
    assert.equal(created.order.legalConsent.acceptedAt, created.order.createdAt);
    const historical = structuredClone(created.order);
    historical.legalConsent.trainingTermsVersion = "current";
    repository.orders.set(historical.id, historical);
    assert.equal((await service.getOrder(historical.id)).legalConsent.trainingTermsVersion, "current");
    assert.equal((await service.createOrder(validInput({ locale }), context)).order.legalConsent.trainingTermsVersion, "current");
  }
});

function promoFixture(changes = {}) {
  const repository = new InMemoryOrderRepository();
  const promo = { promoId: "promo-test500", createdAt: "2026-09-01T00:00:00Z", createdBy: "test-admin", code: "TEST500", type: "fixed", value: 500, active: true, startDate: null, endDate: null, maxUses: 10, usedCount: 0, allowedPackages: [], ...changes };
  repository.promos.set(promo.code, promo);
  const promos = new PromoService({ findByCode: async (code) => structuredClone(repository.promos.get(code) ?? null) }, repository.now);
  const { service } = createFixture({ repository, promoService: promos, now: repository.now });
  return { repository, service, promos, promo };
}

test("fixed and percentage promo quotes use canonical prices and never consume a use", async () => {
  const fixed = promoFixture();
  const quote = await fixed.promos.quote(" test500 ", "excellence-120");
  assert.deepEqual(quote.pricing, { originalPrice: 9000, promoCode: "TEST500", discountAmount: 500, finalPrice: 8500 });
  assert.equal(fixed.promo.usedCount, 0);
  const percent = promoFixture({ type: "percentage", value: 12.5 });
  assert.deepEqual((await percent.promos.quote("TEST500", "excellence-120")).pricing, { originalPrice: 9000, promoCode: "TEST500", discountAmount: 1125, finalPrice: 7875 });
  const rounding = promoFixture({ type: "percentage", value: 33.33 });
  assert.equal((await rounding.promos.quote("TEST500", "starter-30")).pricing.finalPrice, 1500.07);
  const clamped = promoFixture({ value: 9999 });
  assert.equal((await clamped.promos.quote("TEST500", "starter-30")).pricing.finalPrice, 0);
});

test("shared and package-scoped promos apply to Private packages without crossing IDs", async () => {
  const fixed = promoFixture();
  assert.deepEqual((await fixed.promos.quote("TEST500", "private-excellence-60")).pricing,
    { originalPrice: 20000, promoCode: "TEST500", discountAmount: 500, finalPrice: 19500 });
  const percentage = promoFixture({ type: "percentage", value: 10 });
  assert.deepEqual((await percentage.promos.quote("TEST500", "private-excellence-60")).pricing,
    { originalPrice: 20000, promoCode: "TEST500", discountAmount: 2000, finalPrice: 18000 });
  const groupOnly = promoFixture({ allowedPackages: ["excellence-120"] });
  await assert.rejects(() => groupOnly.promos.quote("TEST500", "private-excellence-60"), (error) => error.code === "promo_package_ineligible");
  const privateOnly = promoFixture({ allowedPackages: ["private-excellence-60"] });
  assert.equal((await privateOnly.promos.quote("TEST500", "private-excellence-60")).pricing.finalPrice, 19500);
  await assert.rejects(() => privateOnly.promos.quote("TEST500", "excellence-120"), (error) => error.code === "promo_package_ineligible");
});

test("promo existence, activity, dates, limits and package eligibility are enforced", async () => {
  const cases = [
    [{ active: false }, "promo_inactive"],
    [{ startDate: "2026-09-03T00:00:00Z" }, "promo_not_started"],
    [{ endDate: "2026-09-02T12:00:00Z" }, "promo_expired"],
    [{ maxUses: 1, usedCount: 1 }, "promo_limit_reached"],
    [{ allowedPackages: ["starter-30"] }, "promo_package_ineligible"],
    [{ value: -1 }, "promo_invalid"],
    [{ value: NaN }, "promo_invalid"],
    [{ type: "percentage", value: 101 }, "promo_invalid"],
    [{ startDate: "not-a-date" }, "promo_invalid"],
  ];
  for (const [changes, code] of cases) {
    const { promos } = promoFixture(changes);
    await assert.rejects(() => promos.quote("TEST500", "excellence-120"), (error) => error.code === code);
  }
  const { promos } = promoFixture();
  await assert.rejects(() => promos.quote("UNKNOWN", "excellence-120"), /promo_invalid/);
  await assert.rejects(() => promos.quote("=BAD", "excellence-120"), /promo_invalid/);
  await assert.rejects(() => promos.quote("TEST500", "not-a-package"), /promo_package_ineligible/);
});

test("promo preview API returns only server-calculated prices and rejects client amounts", async () => {
  const { promos, promo } = promoFixture();
  const handler = createValidatePromoHandler(() => promos);
  const send = (body) => handler(new Request("http://localhost/api/payments/promos/validate", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }));
  const response = await send({ code: "TEST500", packageId: "excellence-120" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, pricing: { originalPrice: 9000, promoCode: "TEST500", discountAmount: 500, finalPrice: 8500 } });
  assert.equal(promo.usedCount, 0);
  assert.equal((await send({ code: "TEST500", packageId: "excellence-120", originalPrice: 1 })).status, 400);
  const unavailable = createValidatePromoHandler(() => new PromoService({ findByCode: async () => { throw new PromoRepositoryUnavailableError(); } }));
  const failed = await unavailable(new Request("http://localhost/api/payments/promos/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "TEST500", packageId: "excellence-120" }) }));
  assert.equal(failed.status, 503);
});

test("orders store immutable promo pricing and payment amounts without changing catalog snapshots", async () => {
  const { service, promo } = promoFixture();
  const input = validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 });
  const first = await service.createOrder(input, context);
  assert.equal(first.order.packageSnapshot.priceEgp, 9000);
  assert.equal(first.order.payment.amountMinor, 850000);
  assert.deepEqual(first.order.pricing, { originalPrice: 9000, promoCode: "TEST500", discountAmount: 500, finalPrice: 8500 });
  promo.value = 1000;
  promo.active = false;
  promo.usedCount = 10;
  assert.deepEqual((await service.getOrder(first.order.id)).pricing, first.order.pricing);
  const retry = await service.createOrder(input, context);
  assert.equal(retry.created, false);
  assert.equal(retry.order.id, first.order.id);
  assert.deepEqual(retry.order.legalConsent, first.order.legalConsent);
  assert.deepEqual(retry.order.pricing, first.order.pricing);
});

test("final-price tampering and stale promo quotes are rejected before storing an order", async () => {
  const { service, repository, promo } = promoFixture();
  await assert.rejects(() => service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 1 }), context), /price_mismatch/);
  await assert.rejects(() => service.createOrder(validInput({ promoCode: "TEST500" }), context), /price_mismatch/);
  promo.value = 1000;
  await assert.rejects(() => service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 }), context), /price_mismatch/);
  assert.equal(repository.orders.size, 0);
  assert.equal(promo.usedCount, 0);
});

test("atomic promo redemption prevents last-use races and repeated use by the same order", async () => {
  const { service, repository, promo } = promoFixture({ maxUses: 1 });
  const input = validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 });
  const outcomes = await Promise.allSettled([
    service.createOrder(input, context),
    service.createOrder(input, { ...context, idempotencyKey: "another-promo-attempt-0002" }),
  ]);
  assert.equal(outcomes.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(outcomes.find((item) => item.status === "rejected").reason.code, "promo_limit_reached");
  assert.equal(repository.orders.size, 1);
  assert.equal(promo.usedCount, 1);
  const retry = await service.createOrder(input, context);
  assert.equal(retry.created, false);
  assert.equal(promo.usedCount, 1);
  await assert.rejects(() => service.createOrder(validInput(), context), OrderIdempotencyConflictError);
});

test("a no-promo order retains full pricing and old orders remain readable without new fields", async () => {
  const { service, repository } = createFixture();
  const created = await service.createOrder(validInput(), context);
  assert.deepEqual(created.order.pricing, { originalPrice: 9000, promoCode: null, discountAmount: 0, finalPrice: 9000 });
  const historical = repository.orders.get(created.order.id);
  delete historical.pricing;
  delete historical.legalConsent;
  const before = structuredClone(historical);
  assert.deepEqual(await service.getOrder(created.order.id), before);
  assert.deepEqual(repository.orders.get(created.order.id), before);
});

test("Google Sheets promo adapter validates the response without exporting usage data to the client", async () => {
  const { promo } = promoFixture();
  let sent;
  const repository = new GoogleSheetsPromoRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ success: true, data: { promo } });
  } });
  assert.deepEqual(await repository.findByCode("TEST500"), promo);
  assert.equal(sent.action, "get_promo");
  assert.equal(sent.domain, "payments");
  for (const data of [{}, { promo: { ...promo, active: "true" } }, { promo: { ...promo, endDate: "2026-09-01" } }]) {
    const invalid = new GoogleSheetsPromoRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async () => Response.json({ success: true, data }) });
    await assert.rejects(() => invalid.findByCode("TEST500"), PromoRepositoryUnavailableError);
  }
});

test("discounted order persistence requires explicit atomic-redemption acknowledgement", async () => {
  const { service, promos, repository: memory } = promoFixture();
  const quote = await promos.quote("TEST500", "excellence-120");
  const { order } = await service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 }), context);
  let sent;
  const records = memory.bookings.get(order.id);
  const responseData = { order, created: true, bookingCommit: bookingAck(order) };
  const adapter = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ success: true, data: responseData });
  } });
  await adapter.createIfAbsent(order, { id: "event", orderId: order.id }, records, quote.redemption);
  assert.equal(sent.action, "create_order");
  assert.equal(sent.payload.promo.code, "TEST500");
  responseData.order = { ...order,
    pricing: Object.fromEntries(Object.entries(order.pricing).reverse()),
    legalConsent: Object.fromEntries(Object.entries(order.legalConsent).reverse()),
  };
  await adapter.createIfAbsent(order, { id: "event", orderId: order.id }, records, quote.redemption);
  delete responseData.bookingCommit;
  await assert.rejects(() => adapter.createIfAbsent(order, { id: "event" }, records, quote.redemption), OrderRepositoryUnavailableError);
});

test("Google Sheets order storage preserves not-yet-active promo errors", async () => {
  const { service, promos, repository: memory } = promoFixture();
  const quote = await promos.quote("TEST500", "excellence-120");
  const { order } = await service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 }), context);
  const adapter = new GoogleSheetsOrderRepository({
    webhookUrl: "https://orders.example.test",
    webhookSecret: "test",
    fetchImpl: async () => Response.json({ success: false, error: "promo_not_started" }),
  });
  await assert.rejects(
    () => adapter.createIfAbsent(order, { id: "event", orderId: order.id }, memory.bookings.get(order.id), quote.redemption),
    (error) => error instanceof PromoValidationError && error.code === "promo_not_started",
  );
});

test("order API revalidates promo pricing and returns the stored price without exposing consent", async () => {
  const { service, repository, promo } = promoFixture();
  const { handler } = createApi({ createService: () => service });
  const input = { promoCode: "TEST500", quotedFinalPriceEgp: 8500 };
  const rejected = await handler(request({ ...input, quotedFinalPriceEgp: 1 }));
  assert.equal(rejected.status, 400);
  assert.equal((await rejected.json()).error, "price_mismatch");
  assert.equal(repository.orders.size, 0);
  const created = await handler(request(input));
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.order.pricing.finalPrice, 8500);
  assert.equal(body.order.payment.amountMinor, 850000);
  assert.equal(body.order.legalConsent, undefined);
  promo.active = false;
  const retry = await handler(request(input));
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).order.pricing.finalPrice, 8500);
  assert.equal(repository.orders.size, 1);
  assert.equal(promo.usedCount, 1);
});

test("payment UI contains consent links, server promo endpoint, and no client discount arithmetic", () => {
  const ui = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  assert.match(ui, /name="legalConsent"/);
  assert.match(ui, /href=\{legalLinks\.terms\}/);
  assert.match(ui, /href=\{legalLinks\.privacy\}/);
  assert.match(ui, /href=\{legalLinks\.trainingTerms\}/);
  assert.match(ui, /\/api\/payments\/promos\/validate/);
  assert.doesNotMatch(ui, /\.discountAmount\s*[+*/-]|\.finalPrice\s*[+*/-]|\.priceEgp\s*[+*/-]/);
});

// Render the real payment component with local hook state and stubbed HTTP only.
// This exercises its event handlers without a browser, live Sheets, or extra packages.
function paymentUiFixture(locale) {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const states = [], refs = [];
  let stateCursor = 0, refCursor = 0;
  const previousLoad = Module._load;
  const previousTsx = require.extensions[".tsx"];
  const filename = path.join(root, "src/features/payments/components/payment-checkout.tsx");
  Module._load = function uiTestLoad(request, parent, isMain) {
    if (parent?.filename === filename) {
      if (request === "react") return { ...React,
        useState(initial) {
          const slot = stateCursor++;
          if (!(slot in states)) states[slot] = initial;
          return [states[slot], (next) => { states[slot] = typeof next === "function" ? next(states[slot]) : next; }];
        },
        useRef(initial) { return refs[refCursor++] ??= { current: initial }; },
        useEffect() {},
      };
      if (request === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (request === "next/image") return ({ priority, ...props }) => React.createElement("img", props);
      if (request === "@/lib/utm") return { getLeadMetadata: () => ({}) };
    }
    return previousLoad.call(this, request, parent, isMain);
  };
  require.extensions[".tsx"] = (module, file) => {
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }, fileName: file });
    module._compile(output.outputText, file);
  };
  try {
    delete require.cache[filename];
    const { PaymentCheckout } = require(filename);
    return () => {
      stateCursor = 0; refCursor = 0;
      const tree = PaymentCheckout({ locale, recommendation: getPlanRecommendation("A1", "B2"), attendance: "online", legalLinks: testPolicies });
      const elements = [];
      function visit(node) {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!React.isValidElement(node)) return;
        elements.push(node);
        visit(node.props.children);
      }
      visit(tree);
      return { html: renderToStaticMarkup(tree), find: (predicate) => {
        const matches = elements.filter(predicate);
        assert.equal(matches.length, 1, "expected one payment UI element");
        return matches[0];
      } };
    };
  } finally {
    Module._load = previousLoad;
    if (previousTsx) require.extensions[".tsx"] = previousTsx;
    else delete require.extensions[".tsx"];
  }
}

test("visible promo UI applies only server pricing and submits that quote with the customer's age", async () => {
  const render = paymentUiFixture("en");
  const { service, repository, promos } = promoFixture();
  const { handler } = createApi({ createService: () => service });
  const validatePromo = createValidatePromoHandler(() => promos);
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];
  let redirectedTo = null;
  global.window = {
    crypto: { randomUUID: () => context.idempotencyKey },
    sessionStorage: { getItem: () => null, setItem() {} },
    location: { assign(value) { redirectedTo = value; } },
  };
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    const req = new Request(`http://localhost${url}`, options);
    if (url === "/api/payments/promos/validate") return validatePromo(req);
    if (url === "/api/payments/paytabs/initiate") return Response.json({ redirectUrl: "https://secure-egypt.paytabs.com/payment/page/UI-TEST" });
    assert.equal(url, "/api/payments/orders");
    return handler(req);
  };
  try {
    let ui = render();
    assert.doesNotMatch(ui.html, /<details|Governorate/);
    assert.match(ui.html, /name="age"[^>]*required|name="age"/);
    assert.ok(ui.html.indexOf("Final price") >= 0 && ui.html.indexOf("Final price") < ui.html.indexOf('id="promo-code"'));
    assert.ok(ui.html.indexOf('id="promo-code"') < ui.html.indexOf('type="submit"'));
    ui.find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "TEST500" } });
    await render().find((node) => node.type === "button" && node.props.children === "Apply").props.onClick();
    // The click starts an async handler; wait for its local response through the event loop.
    await new Promise((resolve) => setImmediate(resolve));
    ui = render();
    for (const text of ["Promo code applied", "9,000", "500", "8,500", "Final price"]) assert.ok(ui.html.includes(text), text);
    assert.deepEqual(calls[0].body, { code: "TEST500", packageId: "excellence-120" });
    ui.find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "INVALID" } });
    assert.ok(!render().html.includes("8,500"));
    render().find((node) => node.type === "button" && node.props.children === "Apply").props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(render().html.includes("That promo code is not valid."));
    render().find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "TEST500" } });
    render().find((node) => node.type === "button" && node.props.children === "Apply").props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    const fields = render().find((node) => node.type?.name === "CustomerEnrollmentFields");
    for (const [field, value] of Object.entries(enrollment)) fields.props.onChange(field, value == null ? "" : String(value));
    render().find((node) => node.props.name === "paymentMethod" && node.props.value === "card").props.onChange();
    render().find((node) => node.props.name === "legalConsent").props.onChange({ target: { checked: true } });
    await render().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
    const sent = calls.find((call) => call.url === "/api/payments/orders").body;
    assert.equal(sent.quotedFinalPriceEgp, 8500);
    assert.equal(sent.promoCode, "TEST500");
    assert.equal(sent.customer.age, 25);
    assert.equal(sent.customer.governorate, undefined);
    assert.equal(repository.bookings.size, 1);
    assert.equal([...repository.bookings.values()][0].customer.age, 25);
    assert.deepEqual([...repository.orders.values()][0].pricing, { originalPrice: 9000, promoCode: "TEST500", discountAmount: 500, finalPrice: 8500 });
    assert.equal(redirectedTo, "https://secure-egypt.paytabs.com/payment/page/UI-TEST");
    const initiation = calls.find((call) => call.url === "/api/payments/paytabs/initiate");
    assert.equal(initiation.body.orderId, [...repository.orders.keys()][0]);
  } finally {
    global.fetch = originalFetch;
    if (originalWindow === undefined) delete global.window;
    else global.window = originalWindow;
  }
});

test("payment UI keeps the summary-first section order and the submit action last in both locales", () => {
  for (const locale of ["ar", "en"]) {
    const render = paymentUiFixture(locale);
    const ui = render();
    const sections = [...ui.html.matchAll(/data-payment-section="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(sections, ["summary", "customer", "promo", "methods", "security", "consent", "action"]);
    assert.ok(ui.html.indexOf('id="mini-order-summary"') < ui.html.indexOf('name="name"'));
    const submit = ui.find((node) => node.props.type === "submit");
    assert.equal(submit.props.disabled, true);
    assert.match(ui.html, /<\/button><\/div><\/form>/);
    for (const href of Object.values(testPolicies)) assert.ok(ui.html.includes(`href="${href}"`));
    ui.find((node) => node.props.name === "paymentMethod" && node.props.value === "instapay").props.onChange();
    const manualSections = [...render().html.matchAll(/data-payment-section="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(manualSections, ["summary", "customer", "promo", "methods", "instructions", "proof", "security", "consent", "action"]);
  }
});

test("submit availability uses the existing validation, payment preference, consent and promo quote", () => {
  const render = paymentUiFixture("en");
  const buttonDisabled = () => render().find((node) => node.props.type === "submit").props.disabled;
  const change = (field, value) => render().find((node) => node.type?.name === "CustomerEnrollmentFields").props.onChange(field, value);
  for (const [field, value] of Object.entries(enrollment)) change(field, value == null ? "" : String(value));
  assert.equal(buttonDisabled(), true, "payment method and consent are still missing");
  render().find((node) => node.props.name === "paymentMethod" && node.props.value === "card").props.onChange();
  assert.equal(buttonDisabled(), true, "consent is still missing");
  render().find((node) => node.props.name === "legalConsent").props.onChange({ target: { checked: true } });
  assert.equal(buttonDisabled(), false);
  for (const field of ["name", "phone", "whatsapp", "email", "age"]) {
    change(field, "");
    assert.equal(buttonDisabled(), true, field);
    change(field, String(enrollment[field]));
    assert.equal(buttonDisabled(), false, field);
  }
  change("email", "invalid");
  render().find((node) => node.type?.name === "CustomerEnrollmentFields").props.onBlur("email");
  assert.ok(render().html.includes("Enter a valid email address."));
  assert.equal(buttonDisabled(), true);
  change("email", enrollment.email);
  render().find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "PENDING" } });
  assert.equal(buttonDisabled(), true, "unvalidated promo cannot be silently ignored");
  render().find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "" } });
  assert.equal(buttonDisabled(), false);
  render().find((node) => node.props.name === "paymentMethod" && node.props.value === "wallet").props.onChange();
  assert.equal(buttonDisabled(), true, "wallet proof is required");
  render().find((node) => node.props.name === "paymentProof").props.onChange({ target: { files: [{ name: "receipt.png", size: 1024, type: "image/png" }] } });
  assert.equal(buttonDisabled(), false, "a supported proof image enables submission");
});

test("manual payment configuration uses the approved public business details and untouched official QR", () => {
  assert.deepEqual(manualPaymentConfig.instapay, {
    address: "successacademyeg@instapay",
    paymentUrl: "https://ipn.eg/S/successacademyeg/instapay/0v6ZNw",
    qrAssetPath: "/payments/instapay-qr.jpg",
  });
  assert.equal(manualPaymentConfig.wallet.number, "01090323096");
  assert.equal(manualPaymentConfig.branch.name.en, "Success Academy Dokki Branch");
  assert.equal(manualPaymentConfig.branch.address.ar, "54 شارع مصدق – الدور الأول – أمام هارديز – الدقي، الجيزة");
  assert.equal(manualPaymentConfig.branch.mapsUrl, "https://share.google/FG28DyvPaSVj6KpWj");
  assert.equal(manualPaymentConfig.branch.reservationHours, 72);
  assert.match(manualPaymentConfig.branch.workingHours.en, /1:00 PM.*9:00 PM/);
  assert.match(manualPaymentConfig.branch.fridayClosed.en, /Friday.*Closed/);
  assert.deepEqual([...manualPaymentConfig.branch.paymentMethods.en], ["Cash", "Visa", "Credit Card", "InstaPay", "Vodafone Cash", "Installments"]);
  const qr = fs.readFileSync(path.join(root, "public/payments/instapay-qr.jpg"));
  assert.equal(crypto.createHash("sha256").update(qr).digest("hex"), "17dfbe47dbf858dbc68aef0836409fe5c3bfd361144ab43ff2ecbfb774a84b78");
});

test("checkout shows exactly one compact method panel with dynamic final price and correct proof rules", () => {
  for (const locale of ["ar", "en"]) {
    const render = paymentUiFixture(locale);
    const select = (value) => render().find((node) => node.props.name === "paymentMethod" && node.props.value === value).props.onChange();
    const expectedPrice = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(9000);

    select("instapay");
    let html = render().html;
    assert.match(html, /data-manual-payment-panel="instapay"/);
    assert.ok(html.includes(manualPaymentConfig.instapay.address));
    assert.ok(html.includes(manualPaymentConfig.instapay.paymentUrl));
    assert.ok(html.includes(manualPaymentConfig.instapay.qrAssetPath));
    assert.ok(html.includes(expectedPrice));
    assert.match(html, /name="paymentProof"/);
    assert.doesNotMatch(html, /data-manual-payment-panel="wallet"|data-manual-payment-panel="branch"/);

    select("wallet");
    html = render().html;
    assert.match(html, /data-manual-payment-panel="wallet"/);
    assert.ok(html.includes(manualPaymentConfig.wallet.number));
    assert.ok(html.includes(expectedPrice));
    assert.match(html, /name="paymentProof"/);
    assert.ok(!html.includes(manualPaymentConfig.instapay.address));
    assert.ok(!html.includes(manualPaymentConfig.instapay.qrAssetPath));

    select("branch");
    html = render().html;
    assert.match(html, /data-manual-payment-panel="branch"/);
    assert.ok(html.includes(locale === "ar" ? "54 شارع مصدق" : "54 Mossad Street"));
    assert.ok(html.includes(manualPaymentConfig.branch.mapsUrl));
    assert.ok(html.includes(manualPaymentConfig.branch.workingHours[locale]));
    assert.ok(html.includes(manualPaymentConfig.branch.fridayClosed[locale]));
    assert.ok(html.includes("72"));
    assert.ok(html.includes(expectedPrice));
    assert.doesNotMatch(html, /name="paymentProof"/);
    assert.doesNotMatch(html, /إثبات التحويل|transfer proof/);
    assert.ok(!html.includes(manualPaymentConfig.instapay.qrAssetPath));
    assert.ok(!html.includes(manualPaymentConfig.wallet.number));
  }
});

test("promo-adjusted final price is the amount shown in the InstaPay panel", async () => {
  const render = paymentUiFixture("en");
  const originalFetch = global.fetch;
  global.fetch = async () => Response.json({ ok: true, pricing: { originalPrice: 9000, promoCode: "TEST500", discountAmount: 500, finalPrice: 8500 } });
  try {
    render().find((node) => node.props.name === "promoCode").props.onChange({ target: { value: "TEST500" } });
    render().find((node) => node.type === "button" && node.props.children === "Apply").props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    render().find((node) => node.props.name === "paymentMethod" && node.props.value === "instapay").props.onChange();
    const html = render().html;
    assert.match(html, /data-payment-final-price(?:="true")?[^>]*>8,500/);
    assert.ok(html.includes(manualPaymentConfig.instapay.address));
  } finally {
    global.fetch = originalFetch;
  }
});

test("copy actions are accessible and use subtle localized feedback", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(global, "navigator");
  const copied = [];
  Object.defineProperty(global, "navigator", { configurable: true, value: { clipboard: { writeText: async (value) => copied.push(value) } } });
  try {
    for (const [locale, method, value, feedback] of [
      ["ar", "instapay", manualPaymentConfig.instapay.address, "تم النسخ"],
      ["en", "wallet", manualPaymentConfig.wallet.number, "Copied"],
    ]) {
      const render = paymentUiFixture(locale);
      render().find((node) => node.props.name === "paymentMethod" && node.props.value === method).props.onChange();
      const panel = render().find((node) => node.type?.name === "ManualPaymentPanel");
      await panel.props.onCopy(method, value);
      assert.equal(copied.at(-1), value);
      assert.ok(render().html.includes(feedback));
    }
    const source = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
    assert.match(source, /aria-label=\{copy\.instapay\.copy\}/);
    assert.match(source, /aria-label=\{copy\.wallet\.copy\}/);
  } finally {
    if (originalNavigator) Object.defineProperty(global, "navigator", originalNavigator);
    else delete global.navigator;
  }
});

test("switching to branch clears transfer proof state and cannot submit a stale proof", () => {
  const render = paymentUiFixture("en");
  const fields = render().find((node) => node.type?.name === "CustomerEnrollmentFields");
  for (const [field, value] of Object.entries(enrollment)) fields.props.onChange(field, value == null ? "" : String(value));
  render().find((node) => node.props.name === "legalConsent").props.onChange({ target: { checked: true } });
  render().find((node) => node.props.name === "paymentMethod" && node.props.value === "instapay").props.onChange();
  render().find((node) => node.props.name === "paymentProof").props.onChange({ target: { files: [{ name: "receipt.png", size: 1024, type: "image/png" }] } });
  assert.equal(render().find((node) => node.props.type === "submit").props.disabled, false);
  render().find((node) => node.props.name === "paymentMethod" && node.props.value === "branch").props.onChange();
  const branch = render();
  assert.doesNotMatch(branch.html, /name="paymentProof"|receipt\.png/);
  assert.equal(branch.find((node) => node.props.type === "submit").props.disabled, false);
  const source = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  assert.match(source, /if \(requiresPaymentProof\(method\) && proofFile\)/);
});

test("manual payment layout keeps RTL/LTR and responsive overflow guards for 390px and 1440px", () => {
  for (const locale of ["ar", "en"]) {
    const render = paymentUiFixture(locale);
    render().find((node) => node.props.name === "paymentMethod" && node.props.value === "instapay").props.onChange();
    assert.match(render().html, new RegExp(`dir="${locale === "ar" ? "rtl" : "ltr"}"`));
  }
  const source = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  assert.match(source, /max-w-\[880px\]/);
  assert.match(source, /min-w-0/);
  assert.match(source, /max-w-full/);
  assert.doesNotMatch(source, /min-w-\[/);
});

test("installment providers are compact informational cards with approved local assets", () => {
  const providerConfig = fs.readFileSync(path.join(root, "src/features/payments/installment-providers.ts"), "utf8");
  const source = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const copySource = fs.readFileSync(path.join(root, "src/features/payments/copy.ts"), "utf8");
  for (const locale of ["ar", "en"]) {
    const render = paymentUiFixture(locale);
    render().find((node) => node.props.name === "paymentMethod" && node.props.value === "installments").props.onChange();
    const output = render();
    assert.match(output.html, /data-payment-section="installment-providers"/);
    for (const id of ["nbe", "valu", "aman", "souhoola", "contact", "tru", "klivvr"]) {
      assert.match(output.html, new RegExp(`<div[^>]+data-installment-provider="${id}"`));
      assert.doesNotMatch(output.html, new RegExp(`<(?:button|input)[^>]+data-installment-provider="${id}"`));
    }
    assert.match(output.html, locale === "ar" ? /جهات التقسيط المتاحة/ : /Available installment providers/);
    assert.match(output.html, /6 \/ 12 \/ 18/);
  }
  assert.match(source, /object-contain/);
  assert.match(source, /grid-cols-2/);
  assert.match(source, /min-\[430px\]:grid-cols-3/);
  assert.doesNotMatch(source, /data-installment-provider[^\n]+(?:button|onClick|cursor-pointer|aria-pressed)/);
  assert.doesNotMatch(providerConfig, /easykash/i);
  assert.match(providerConfig, /logoPath: null/);
  assert.match(copySource, /يتم استكمال عملية التقسيط بأمان عبر بوابة EasyKash/);
  assert.match(copySource, /Installment checkout is securely processed through EasyKash/);
  assert.doesNotMatch(source, /paymentOptions/);
});

function bookingAck(order) {
  return { version: 3, orderId: order.id,
    requestFingerprint: order.requestFingerprint, bookingSaved: true,
    promoUsageBookingId: order.pricing.promoCode ? order.id : null };
}

test("booking requires name, phone, WhatsApp, email and age on client and server", async () => {
  for (const field of ["name", "phone", "whatsapp", "email", "age"]) {
    const invalid = { ...enrollment, [field]: "" };
    assert.equal(validateEnrollment(invalid, "online").valid, false, field);
    const { handler, repository } = createApi();
    const response = await handler(request({ customer: invalid }));
    assert.equal(response.status, 400, field);
    assert.equal(repository.orders.size, 0);
    assert.equal(repository.bookings.size, 0);
  }
  for (const changes of [{ whatsapp: "123" }, { phone: "01400000000" }, { email: "bad@" }, { age: [] }, { notes: 5 }, { notes: "x".repeat(1001) }]) {
    assert.equal(validateEnrollment({ ...enrollment, ...changes }, "online").valid, false, JSON.stringify(changes));
  }
  assert.equal(validateEnrollment({ ...enrollment, whatsapp: "01000000001" }, "online").details.whatsapp, customer.phone);
  assert.equal(validateEnrollment({ ...enrollment, notes: undefined }, "online").details.notes, null);
  const { service, repository } = createFixture();
  await assert.rejects(() => service.createOrder(validInput({ enrollment: undefined }), context), /invalid_customer/);
  assert.equal(repository.bookings.size, 0);
});

test("branch bookings need no extra personal information and reject removed governorate and unnecessary fields", async () => {
  for (const field of ["governorate", "gender", "address", "nationalId", "branch", "englishLevel", "previousExperience", "learningGoal"]) {
    const { handler } = createApi();
    assert.equal((await handler(request({ attendance: "branch", customer: { ...enrollment, [field]: "unnecessary" } }))).status, 400, field);
  }
  const { handler, repository } = createApi();
  assert.equal((await handler(request({ attendance: "branch" }))).status, 201);
  const registration = [...repository.bookings.values()][0].customer;
  assert.equal(registration.address, undefined);
  assert.equal(registration.gender, undefined);
  assert.equal(registration.governorate, undefined);
  assert.equal(registration.age, 25);
  assert.equal(registration.attendance, "branch");
});

test("age accepts whole years and Arabic digits but rejects malformed or missing values", async () => {
  for (const age of [undefined, null, "", " ", 0, -1, 121, 25.5, true, {}, "2e1", "25.0", "NaN", "25years"]) {
    assert.equal(validateEnrollment({ ...enrollment, age }, "online").valid, false, String(age));
    const { handler, repository } = createApi();
    assert.equal((await handler(request({ customer: { ...enrollment, age } }))).status, 400, String(age));
    assert.equal(repository.bookings.size, 0);
  }
  for (const [age, expected] of [[1, 1], [120, 120], [25, 25], ["25", 25], ["٢٥", 25], ["۲۵", 25], [" 25 ", 25]]) {
    const { handler, repository } = createApi();
    assert.equal((await handler(request({ customer: { ...enrollment, age } }))).status, 201);
    assert.equal([...repository.bookings.values()][0].customer.age, expected);
  }
});

test("historical customer snapshots remain readable without inventing an age", async () => {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const { age: _age, ...record } = repository.bookings.get(order.id).customer;
  const legacy = { ...record, governorate: "Cairo" };
  const adapter = new GoogleSheetsCustomerRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async () => Response.json({ success: true, data: { customer: legacy } }) });
  const saved = await adapter.getByOrderId(order.id);
  assert.equal(saved.age, null);
  assert.equal(saved.governorate, undefined);
  assert.equal(legacy.governorate, "Cairo");
  legacy.age = "invalid";
  await assert.rejects(() => adapter.getByOrderId(order.id), /Customer storage is unavailable/);
});

test("minimal booking contact is saved without changing the plan or leaking PII into financial events", async () => {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput({ enrollment: { ...enrollment, notes: "Evening classes preferred" } }), context);
  const records = repository.bookings.get(order.id);
  assert.equal(records.customer.name, customer.name);
  assert.equal(records.customer.orderId, order.id);
  assert.equal(records.customer.customerId, order.customer.id);
  assert.equal(records.customer.notes, "Evening classes preferred");
  assert.equal(records.customer.englishLevel, undefined);
  assert.equal(order.packageSnapshot.startLevel, "A1");
  for (const value of [customer.name, customer.phone, customer.email, customer.leadReference]) {
    assert.equal(JSON.stringify([order, repository.events, records.audit, records.notification]).includes(value), false);
  }
  assert.equal(records.notification.status, "prepared");
  assert.equal(records.notification.customerId, order.customer.id);
  const email = prepareAdminBookingEmail(order, records.customer);
  for (const value of [customer.name, customer.phone, customer.email, order.id, order.packageSnapshot.packageName, order.createdAt, "9000.00 EGP", "card"]) assert.ok(email.text.includes(value));
  assert.throws(() => prepareAdminBookingEmail(order, { ...records.customer, orderId: "wrong" }), /booking_customer_mismatch/);
  const customers = new CustomerService({ getByOrderId: async (id) => repository.bookings.get(id)?.customer ?? null });
  assert.deepEqual(await customers.getForOrder(order.id), records.customer);
});

test("a retry preserves all booking records and changed enrollment cannot reuse its key", async () => {
  const { service, repository } = createFixture();
  const first = await service.createOrder(validInput(), context);
  const before = structuredClone(repository.bookings.get(first.order.id));
  await service.createOrder(validInput(), context);
  assert.deepEqual(repository.bookings.get(first.order.id), before);
  assert.equal(repository.bookings.size, 1);
  assert.equal(repository.audits.length, 1);
  await assert.rejects(() => service.createOrder(validInput({ enrollment: { ...enrollment, age: 26 } }), context), OrderIdempotencyConflictError);
});

test("every promo use is journalled exactly once and the journal protects against a reset counter", async () => {
  const { service, repository, promo } = promoFixture({ maxUses: 1 });
  const input = validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 });
  const responses = await Promise.all(Array.from({ length: 5 }, () => service.createOrder(input, context)));
  assert.equal(responses.filter((response) => response.created).length, 1);
  assert.equal(repository.usages.size, 1);
  assert.equal(repository.bookings.size, 1);
  const usage = [...repository.usages.values()][0];
  assert.equal(usage.discountAmount, 500);
  assert.equal(usage.customerId, customer.id);
  assert.equal(usage.customerPhone, customer.phone);
  assert.equal(usage.orderId, responses[0].order.id);
  promo.usedCount = 0;
  await assert.rejects(() => service.createOrder(input, { ...context, idempotencyKey: "fresh-promo-order-attempt" }), /promo_limit_reached/);
  assert.equal(repository.orders.size, 1);
  assert.equal(repository.usages.size, 1);
});

test("10 percent promo has a fixed order snapshot even after future promo edits", async () => {
  const { service, promo } = promoFixture({ type: "percentage", value: 10 });
  const { order } = await service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8100 }), context);
  assert.deepEqual(order.pricing, { originalPrice: 9000, promoCode: "TEST500", discountAmount: 900, finalPrice: 8100 });
  promo.value = 20;
  assert.deepEqual((await service.getOrder(order.id)).pricing, order.pricing);
});

test("storage refuses incomplete booking acknowledgements and does not fall back to order-only writes", async () => {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const records = repository.bookings.get(order.id);
  for (const changes of [{ version: 1 }, { bookingSaved: false }, { orderId: "wrong" }, { requestFingerprint: "wrong" }, { promoUsageBookingId: "unexpected" }]) {
    const calls = [];
    const adapter = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async (_url, options) => {
      calls.push(JSON.parse(options.body).action);
      return Response.json({ success: true, data: { order, created: true, bookingCommit: { ...bookingAck(order), ...changes } } });
    } });
    await assert.rejects(() => adapter.createIfAbsent(order, repository.events[0], records), OrderRepositoryUnavailableError);
    assert.deepEqual(calls, ["create_order"]);
  }
});

test("spreadsheet customer reads are server-only, keyed by order and reject mismatched records", async () => {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const record = repository.bookings.get(order.id).customer;
  let sent;
  const adapter = new GoogleSheetsCustomerRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ success: true, data: { customer: record } });
  } });
  assert.deepEqual(await adapter.getByOrderId(order.id), record);
  assert.equal(sent.action, "get_customer_for_order");
  assert.deepEqual(sent.payload, { orderId: order.id });
  await assert.rejects(() => adapter.getByOrderId("another-order"), /Customer storage is unavailable/);
});

test("audit records are append-only and status transitions preserve original snapshots", async () => {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const firstAudit = structuredClone(repository.audits[0]);
  const changed = await service.transitionOrder(order.id, { status: "waiting_payment" });
  assert.deepEqual(repository.audits[0], firstAudit);
  assert.equal(repository.audits[1].oldValue, "pending");
  assert.equal(repository.audits[1].newValue, "waiting_payment");
  assert.equal(repository.bookings.get(order.id).customer.paymentStatus, "waiting_payment");
  assert.deepEqual(changed.pricing, order.pricing);
  assert.deepEqual(changed.legalConsent, order.legalConsent);
});

test("the active spreadsheet contract keeps Bookings at 30 columns and adds a no-PII Meta outbox", async () => {
  const { paymentSheetColumns } = require(path.join(root, "src/features/payments/server/sheets-schema.ts"));
  assert.deepEqual(Object.keys(paymentSheetColumns), ["Bookings", "Promo Codes", "Promo Usage"]);
  assert.deepEqual(paymentSheetColumns["Promo Usage"], [
    "Usage_ID", "Created_At", "Promo_Code", "Booking_ID", "Customer_Name", "Customer_Phone", "Discount_Amount",
    "Status", "Reserved_Until", "Finalized_At", "Released_At", "Release_Reason",
  ]);
  assert.deepEqual(paymentSheetColumns["Promo Codes"], ["Code", "Discount_Type", "Discount_Value", "Active", "Start_Date", "End_Date", "Usage_Limit", "Description"]);
  const { service, repository } = promoFixture();
  const { order } = await service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500, enrollment: { ...enrollment, notes: "Customer note" } }), context);
  const records = repository.bookings.get(order.id);
  const row = toBookingSheetRow(order, records);
  assert.deepEqual(Object.keys(row), paymentSheetColumns.Bookings);
  assert.equal(row.Full_Name, customer.name);
  assert.equal(row.Phone, customer.phone);
  assert.equal(row.WhatsApp, customer.phone);
  assert.equal(row.Email, customer.email);
  assert.equal(row.Age, 25);
  assert.equal(row.Governorate, undefined);
  assert.equal(row.Hours, 120);
  assert.equal(row.Sessions, 40);
  assert.equal(row.Original_Price, 9000);
  assert.equal(row.Promo_Code, "TEST500");
  assert.equal(row.Discount_Amount, 500);
  assert.equal(row.Final_Price, 8500);
  assert.equal(row.Payment_Status, "Pending");
  assert.equal(row.Payment_Verification, "Not Required");
  assert.equal(Object.hasOwn(row, "Program_Type"), false);
  assert.equal(paymentSheetColumns.Bookings.length, 30);
  assert.equal(paymentSheetColumns.Bookings.at(-1), "Payment_Updated_At");
  assert.equal(JSON.parse(row.Order_Snapshot).programType, "group");
  assert.equal(row.Admin_Notes, "");
  assert.equal(row.Customer_Notes, "Customer note");
  assert.deepEqual(JSON.parse(row.Order_Snapshot), order);
  assert.deepEqual(toPromoUsageSheetRow(records.promoUsage), {
    Usage_ID: records.promoUsage.usageId, Created_At: records.promoUsage.usedAt,
    Promo_Code: "TEST500", Booking_ID: order.id, Customer_Name: customer.name,
    Customer_Phone: customer.phone, Discount_Amount: 500,
    Status: "reserved", Reserved_Until: new Date(Date.parse(records.promoUsage.usedAt) + 60 * 60 * 1000).toISOString(),
    Finalized_At: "", Released_At: "", Release_Reason: "",
  });
});

function createPaymentScriptHarness(options = {}) {
  let nowMs = Date.parse(options.now ?? "2026-09-01T12:05:00.000Z");
  class HarnessDate extends Date {
    constructor(...args) { super(...(args.length ? args : [nowMs])); }
    static now() { return nowMs; }
  }
  const properties = new Map([
    ["PAYMENTS_SPREADSHEET_ID", "test-payments-spreadsheet"],
    ["PAYMENTS_SHEETS_WEBHOOK_SECRET", "test-payments-secret"],
    ["PAYMENT_PROOFS_DRIVE_FOLDER_ID", "test-private-folder"],
  ]);
  const sheets = new Map();
  let opened = 0;
  let activeCalls = 0;
  let lockAcquisitions = 0;
  let lockDepth = 0;
  let maxLockDepth = 0;
  let lockReleases = 0;
  let lockBusy = false;
  let failUsageWrite = false;
  let failBookingWrite = false;
  let failOutboxWrite = false;
  let failFlush = false;
  let failNotification = false;
  const lockWaits = [];
  const diagnosticLogs = [];
  const notificationRequests = [];
  const proofFiles = new Map();
  const proofFolder = {
    getFilesByName: (name) => ({
      hasNext: () => proofFiles.has(name),
      next: () => proofFiles.get(name),
    }),
    createFile: (blob) => {
      const file = { getUrl: () => `https://drive.google.com/file/d/${blob.name}/view` };
      proofFiles.set(blob.name, file);
      return file;
    },
  };
  const toasts = [];
  const protections = [];
  const spreadsheet = { getId: () => "test-payments-spreadsheet", getSheetByName: (name) => sheets.get(name) ?? null,
    toast: (message) => toasts.push(message) };
  const sandbox = {
    Date: HarnessDate,
    console: { log: (value) => {
      if (options.loggerThrows) throw new Error("simulated_logger_failure");
      diagnosticLogs.push(String(value));
    } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null }) },
    SpreadsheetApp: {
      ProtectionType: { SHEET: "SHEET" },
      newDataValidation: () => ({ requireValueInList(values) { this.values = values; return this; },
        setAllowInvalid(value) { this.allowInvalid = value; return this; }, build() { return this; } }),
      openById: (id) => { assert.equal(id, "test-payments-spreadsheet"); opened += 1; return spreadsheet; },
      getActiveSpreadsheet: () => { activeCalls += 1; throw new Error("active spreadsheet must not be used"); },
      flush: () => { if (failFlush) { failFlush = false; throw new Error("simulated_flush_failure"); } },
    },
    Session: { getEffectiveUser: () => "test-owner" },
    DriveApp: { getFolderById: (id) => { assert.equal(id, "test-private-folder"); return proofFolder; } },
    UrlFetchApp: { fetch: (url, requestOptions) => {
      notificationRequests.push({
        url,
        headers: structuredClone(requestOptions.headers),
        payload: JSON.parse(requestOptions.payload),
        lockDepth,
      });
      if (failNotification) throw new Error("simulated_notification_failure");
      return { getResponseCode: () => options.notificationStatus ?? 202 };
    } },
    Utilities: {
      base64Decode: (base64) => [...Buffer.from(base64, "base64")],
      newBlob: (bytes, mimeType, name) => ({ bytes, mimeType, name }),
      getUuid: () => crypto.randomUUID(),
    },
    LockService: { getScriptLock: () => ({
      tryLock: (milliseconds) => {
        lockAcquisitions += 1;
        lockWaits.push(milliseconds);
        if (lockBusy) return false;
        lockDepth += 1;
        maxLockDepth = Math.max(maxLockDepth, lockDepth);
        return true;
      },
      releaseLock: () => { lockReleases += 1; lockDepth -= 1; },
    }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
  };
  vm.createContext(sandbox);
  let source = fs.readFileSync(path.join(root, "scripts/google-apps-script/payment-bookings-webhook.gs"), "utf8");
  if (options.diagnosticsEnabled === true) {
    source = source.replace("const PAYMENT_DIAGNOSTICS_ENABLED = false;", "const PAYMENT_DIAGNOSTICS_ENABLED = true;");
  }
  vm.runInContext(source, sandbox);
  const headers = vm.runInContext("PAYMENT_HEADERS", sandbox);
  for (const [name, columns] of Object.entries(headers)) {
    const rows = [[...columns]];
    sheets.set(name, {
      rows,
      getName: () => name,
      getSheetId: () => Object.keys(headers).indexOf(name),
      getMaxRows: () => 1000,
      getProtections: () => protections,
      protect: () => {
        const protection = { getDescription() { return this.description; }, setDescription(value) { this.description = value; return this; },
          setWarningOnly(value) { this.warning = value; }, addEditor() {}, removeEditors() { this.restricted = true; }, getEditors: () => [],
          canDomainEdit: () => true, setDomainEdit(value) { this.domain = value; }, setUnprotectedRanges(ranges) { this.ranges = ranges; } };
        protections.push(protection);
        return protection;
      },
      getLastRow: () => rows.length,
      getRange: (row, column, rowCount = 1, columnCount = 1) => ({
        getSheet: () => sheets.get(name), getRow: () => row, getColumn: () => column,
        getLastRow: () => row + rowCount - 1, getLastColumn: () => column + columnCount - 1,
        getNumRows: () => rowCount, getNumColumns: () => columnCount,
        setDataValidation: (rule) => { sheets.get(name).validation = rule; },
        setValue: (value) => { rows[row - 1][column - 1] = value; },
        getDisplayValues: () => rows.slice(row - 1, row - 1 + rowCount).map((values) => values.slice(column - 1, column - 1 + columnCount)),
        getValues: () => rows.slice(row - 1, row - 1 + rowCount).map((values) => values.slice(column - 1, column - 1 + columnCount)),
        setValues: (values) => {
          assert.equal(rowCount, values.length);
          assert.equal(columnCount, values[0].length);
          if (name === "Promo Usage" && failUsageWrite) {
            failUsageWrite = false;
            throw new Error("simulated_usage_write_failure");
          }
          if (name === "Bookings" && failBookingWrite) {
            failBookingWrite = false;
            throw new Error("simulated_booking_write_failure");
          }
          if (name === "Meta Purchase Outbox" && failOutboxWrite) {
            failOutboxWrite = false;
            throw new Error("simulated_meta_outbox_write_failure");
          }
          for (let index = 0; index < values.length; index += 1) {
            rows[row - 1 + index] ||= [];
            for (let cell = 0; cell < columnCount; cell += 1) rows[row - 1 + index][column - 1 + cell] = values[index][cell];
          }
        },
      }),
    });
  }
  return {
    properties,
    sheets,
    headers,
    proofFiles,
    toasts,
    protections,
    setup: () => sandbox.setupPaymentAdminReview(),
    edit: (row, value, options = {}) => {
      const sheet = sheets.get(options.sheet ?? "Bookings");
      const column = options.column ?? headers.Bookings.indexOf("Payment_Verification") + 1;
      const oldValue = sheet.rows[row - 1][column - 1];
      sheet.rows[row - 1][column - 1] = value;
      sandbox.paymentAdminOnEdit({ source: spreadsheet, triggerUid: "installed-test-trigger",
        range: sheet.getRange(row, column, options.rowCount ?? 1, 1), oldValue, value, ...options.event });
    },
    request: (action, payload) => {
      const output = sandbox.doPost({ postData: { contents: JSON.stringify({
        domain: "payments", secret: "test-payments-secret", action, payload,
      }) } });
      return JSON.parse(output.text);
    },
    failNextUsageWrite: () => { failUsageWrite = true; },
    failNextBookingWrite: () => { failBookingWrite = true; },
    failNextOutboxWrite: () => { failOutboxWrite = true; },
    failNextFlush: () => { failFlush = true; },
    setLockBusy: (busy) => { lockBusy = busy; },
    failNotifications: (fail = true) => { failNotification = fail; },
    notificationRequests: () => structuredClone(notificationRequests),
    stats: () => ({ opened, activeCalls, lockAcquisitions }),
    lockStats: () => ({ lockWaits: [...lockWaits], maxLockDepth, lockDepth, lockReleases }),
    diagnosticLogs: () => diagnosticLogs.map((entry) => JSON.parse(entry)),
    rawDiagnosticLogs: () => [...diagnosticLogs],
    setNow: (value) => { nowMs = Date.parse(value); assert.ok(Number.isFinite(nowMs)); },
    advanceTime: (milliseconds) => { nowMs += milliseconds; },
    sheetDate: (value) => new HarnessDate(value),
  };
}

async function scriptedPromoOrders() {
  const { service, repository, promos } = promoFixture();
  const quote = await promos.quote("TEST500", "excellence-120");
  const orderInput = validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500 });
  const results = [];
  for (const key of ["script-test-idempotency-0001", "script-test-idempotency-0002"]) {
    const { order } = await service.createOrder(orderInput, { ...context, idempotencyKey: key });
    const records = repository.bookings.get(order.id);
    results.push({
      contractVersion: 3,
      order,
      event: repository.events.find((event) => event.orderId === order.id),
      booking: toBookingSheetRow(order, records),
      promoUsage: toPromoUsageSheetRow(records.promoUsage),
      promo: quote.redemption,
      notification: records.notification,
    });
  }
  return results;
}

async function promoScriptFixture(method = "card", maxUses = 10) {
  const { service, repository, promos } = promoFixture({ maxUses });
  const quote = await promos.quote("TEST500", "excellence-120");
  const proofLink = method === "instapay" || method === "wallet"
    ? "https://drive.google.com/file/d/test-proof/view"
    : undefined;
  const { order } = await service.createOrder(validInput({
    paymentMethod: method,
    proofLink,
    promoCode: "TEST500",
    quotedFinalPriceEgp: 8500,
  }), context);
  const records = repository.bookings.get(order.id);
  const payload = {
    contractVersion: 3,
    order,
    event: repository.events.find((event) => event.orderId === order.id),
    booking: toBookingSheetRow(order, records),
    promoUsage: toPromoUsageSheetRow(records.promoUsage),
    promo: quote.redemption,
    notification: records.notification,
  };
  const script = createPaymentScriptHarness({ now: new Date(Date.parse(order.createdAt) + 5 * 60 * 1000).toISOString() });
  script.sheets.get("Promo Codes").rows.push([
    "TEST500", "Fixed", 500, true, "", "", maxUses, "Test promo",
  ]);
  assert.equal(script.request("create_order", payload).success, true);
  const usageRow = () => script.sheets.get("Promo Usage").rows.find((row) => row[3] === order.id);
  const usage = (name) => usageRow()[script.headers["Promo Usage"].indexOf(name)];
  return { script, order, payload, usage, usageRow };
}

function providerTransitionPayload(order, status, previousStatus, provider) {
  const waiting = status === "waiting_payment";
  const transactionId = provider === "paytabs" || !waiting ? `TEST-${provider.toUpperCase()}-TRANSACTION` : `TEST-${provider.toUpperCase()}-TRANSACTION`;
  const redirectUrl = provider === "paytabs"
    ? "https://secure-egypt.paytabs.com/payment/page/test"
    : "https://easykash.net/DirectPayV1/test";
  const updated = {
    ...order,
    updatedAt: new Date(Date.parse(order.createdAt) + (status === "waiting_payment" ? 10 : 20) * 60 * 1000).toISOString(),
    status,
    payment: {
      ...order.payment,
      provider,
      status: status === "paid" ? "paid" : status === "failed" ? "failed" : "waiting_payment",
      transactionId,
      redirectUrl,
    },
  };
  return {
    contractVersion: 3,
    order: updated,
    event: { orderId: order.id, previousStatus, status },
    audit: {},
    expectedStatus: previousStatus,
    bookingPaymentStatus: status === "paid" ? "Paid" : status === "failed" ? "Rejected" : "Pending",
  };
}

test("promo reservations use 72 hours for branch, 60 minutes for providers, and no deadline during manual review", async () => {
  for (const method of ["branch", "card", "installments", "instapay", "wallet"]) {
    const f = await promoScriptFixture(method);
    const manualReview = method === "instapay" || method === "wallet";
    assert.equal(f.usage("Status"), manualReview ? "pending_review" : "reserved");
    if (manualReview) assert.equal(f.usage("Reserved_Until"), "");
    else {
      const expectedHours = method === "branch" ? 72 : 1;
      assert.equal(Date.parse(f.usage("Reserved_Until")) - Date.parse(f.usage("Created_At")), expectedHours * 60 * 60 * 1000);
    }
  }
});

test("idempotent booking retry preserves exactly one promo reservation", async () => {
  const f = await promoScriptFixture("card");
  const before = structuredClone(f.usageRow());
  assert.equal(f.script.request("create_order", f.payload).data.created, false);
  assert.equal(f.script.sheets.get("Promo Usage").rows.length, 2);
  assert.deepEqual(f.usageRow(), before);
});

test("lazy capacity checks release only stale reserved usage", async () => {
  const f = await promoScriptFixture("card", 1);
  f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 1).toISOString());
  const promo = f.script.request("get_promo", { code: "TEST500" }).data.promo;
  assert.equal(promo.usedCount, 0);
  assert.equal(f.usage("Status"), "released");
  assert.equal(f.usage("Release_Reason"), "reservation_expired");
  assert.ok(f.usage("Released_At"));
});

test("manual transfer proof starts pending review and does not expire while review is pending", async () => {
  for (const method of ["instapay", "wallet"]) {
    const f = await promoScriptFixture(method, 1);
    assert.equal(f.usage("Reserved_Until"), "");
    for (const elapsed of [61 * 60 * 1000, 4 * 60 * 60 * 1000, 24 * 60 * 60 * 1000]) {
      f.script.setNow(new Date(Date.parse(f.usage("Created_At")) + elapsed).toISOString());
      assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 1);
      assert.equal(f.usage("Status"), "pending_review");
      assert.equal(f.usage("Released_At"), "");
    }
  }
});

test("manual approval consumes promo usage and rejection releases it", async () => {
  const approved = await promoScriptFixture("instapay", 1);
  approved.script.edit(2, "Approved");
  assert.equal(approved.usage("Status"), "consumed");
  assert.ok(approved.usage("Finalized_At"));
  const rejected = await promoScriptFixture("wallet", 1);
  rejected.script.edit(2, "Rejected");
  assert.equal(rejected.usage("Status"), "released");
  assert.equal(rejected.usage("Release_Reason"), "payment_rejected");
});

test("expired branch approval atomically reacquires and consumes the unchanged promo", async () => {
  const f = await promoScriptFixture("branch", 1);
  f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 1).toISOString());
  assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 0);
  f.script.edit(2, "Approved");
  assert.equal(f.usage("Status"), "consumed");
  assert.equal(f.script.request("get_order", { orderId: f.order.id }).data.order.status, "paid");
});

test("provider reservation state advances only after a successful persisted session", async () => {
  for (const [method, provider] of [["card", "paytabs"], ["installments", "easykash"]]) {
    const f = await promoScriptFixture(method, 1);
    assert.equal(f.script.request("ensure_promo_reservation", { contractVersion: 3, orderId: f.order.id }).success, true);
    assert.equal(f.usage("Status"), "reserved");
    const waiting = providerTransitionPayload(f.order, "waiting_payment", "pending", provider);
    assert.equal(f.script.request("commit_booking_transition", waiting).success, true);
    assert.equal(f.usage("Status"), "payment_in_progress");
    f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 7 * 24 * 60 * 60 * 1000).toISOString());
    assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 1);
    assert.equal(f.usage("Status"), "payment_in_progress");
  }
});

test("provider paid consumes promo and terminal failure releases it", async () => {
  const paid = await promoScriptFixture("card", 1);
  const paidWaiting = providerTransitionPayload(paid.order, "waiting_payment", "pending", "paytabs");
  assert.equal(paid.script.request("commit_booking_transition", paidWaiting).success, true);
  const paidTransition = providerTransitionPayload(paidWaiting.order, "paid", "waiting_payment", "paytabs");
  assert.equal(paid.script.request("commit_booking_transition", paidTransition).success, true);
  assert.equal(paid.usage("Status"), "consumed");
  const failed = await promoScriptFixture("installments", 1);
  const failedWaiting = providerTransitionPayload(failed.order, "waiting_payment", "pending", "easykash");
  assert.equal(failed.script.request("commit_booking_transition", failedWaiting).success, true);
  const failedTransition = providerTransitionPayload(failedWaiting.order, "failed", "waiting_payment", "easykash");
  assert.equal(failed.script.request("commit_booking_transition", failedTransition).success, true);
  assert.equal(failed.usage("Status"), "released");
  assert.equal(failed.usage("Release_Reason"), "provider_payment_failed");
});

test("expired promo re-reservation preserves immutable price and fails safely on changed definition", async () => {
  const f = await promoScriptFixture("card", 1);
  const snapshot = f.payload.booking.Order_Snapshot;
  f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 1).toISOString());
  assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 0);
  assert.equal(f.script.request("ensure_promo_reservation", { contractVersion: 3, orderId: f.order.id }).success, true);
  assert.equal(f.usage("Status"), "reserved");
  assert.equal(f.payload.booking.Order_Snapshot, snapshot);

  f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 1).toISOString());
  assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 0);
  f.script.sheets.get("Promo Codes").rows[1][2] = 1000;
  const changed = f.script.request("ensure_promo_reservation", { contractVersion: 3, orderId: f.order.id });
  assert.equal(changed.error, "promo_reservation_expired");
  assert.equal(f.usage("Status"), "released");
  assert.equal(f.payload.booking.Order_Snapshot, snapshot);
});

test("expired promo re-reservation fails when another booking occupies the last use", async () => {
  const f = await promoScriptFixture("card", 1);
  f.script.setNow(new Date(Date.parse(f.usage("Reserved_Until")) + 1).toISOString());
  assert.equal(f.script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 0);
  const bookingHeaders = f.script.headers.Bookings;
  const usageHeaders = f.script.headers["Promo Usage"];
  const otherBooking = [...f.script.sheets.get("Bookings").rows[1]];
  otherBooking[bookingHeaders.indexOf("Booking_ID")] = "other-capacity-booking";
  otherBooking[bookingHeaders.indexOf("Idempotency_Key_Hash")] = "f".repeat(64);
  f.script.sheets.get("Bookings").rows.push(otherBooking);
  const otherUsage = [...f.usageRow()];
  otherUsage[usageHeaders.indexOf("Usage_ID")] = "promo-use:other-capacity-booking";
  otherUsage[usageHeaders.indexOf("Booking_ID")] = "other-capacity-booking";
  otherUsage[usageHeaders.indexOf("Status")] = "consumed";
  otherUsage[usageHeaders.indexOf("Finalized_At")] = new Date().toISOString();
  otherUsage[usageHeaders.indexOf("Released_At")] = "";
  otherUsage[usageHeaders.indexOf("Release_Reason")] = "";
  f.script.sheets.get("Promo Usage").rows.push(otherUsage);
  const result = f.script.request("ensure_promo_reservation", { contractVersion: 3, orderId: f.order.id });
  assert.equal(result.error, "promo_reservation_expired");
  assert.equal(f.usage("Status"), "released");
});

test("repository maps promo reservation expiry without exposing storage details", async () => {
  const adapter = new GoogleSheetsOrderRepository({
    webhookUrl: "https://orders.example.test",
    webhookSecret: "test",
    fetchImpl: async (_url, options) => {
      const request = JSON.parse(options.body);
      assert.equal(request.action, "ensure_promo_reservation");
      return Response.json({ success: false, error: "promo_reservation_expired" });
    },
  });
  await assert.rejects(
    () => adapter.ensurePromoReservation("fixture-order"),
    (error) => error instanceof PromoValidationError && error.code === "promo_reservation_expired",
  );
  const checkout = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const copy = fs.readFileSync(path.join(root, "src/features/payments/copy.ts"), "utf8");
  assert.match(checkout, /paymentData\.error === "promo_reservation_expired"/);
  assert.match(copy, /reservationExpired:/);
  assert.match(copy, /انتهت مدة حجز الخصم/);
  assert.match(copy, /promo reservation expired/i);
});

test("payment Apps Script requires an explicit spreadsheet ID and includes the protected conversion outbox", async () => {
  const script = createPaymentScriptHarness();
  const { paymentSheetColumns } = require(path.join(root, "src/features/payments/server/sheets-schema.ts"));
  const scriptHeaders = JSON.parse(JSON.stringify(script.headers));
  assert.deepEqual(Object.fromEntries(Object.entries(scriptHeaders).filter(([name]) => name !== "Meta Purchase Outbox")), paymentSheetColumns);
  assert.deepEqual(scriptHeaders["Meta Purchase Outbox"], [
    "Event_ID", "Booking_ID", "Occurred_At", "Status", "Attempt_Count", "Next_Attempt_At",
    "Lease_ID", "Lease_Until", "Delivered_At", "Last_Result", "Updated_At",
  ]);
  script.properties.delete("PAYMENTS_SPREADSHEET_ID");
  assert.equal(script.request("get_promo", { code: "TEST500" }).error, "missing_spreadsheet_id");
  assert.deepEqual(script.stats(), { opened: 0, activeCalls: 0, lockAcquisitions: 1 });
  script.properties.set("PAYMENTS_SPREADSHEET_ID", "test-payments-spreadsheet");
  assert.equal(script.request("get_promo", { code: "TEST500" }).success, true);
  assert.ok(script.stats().opened > 0);
  assert.equal(script.stats().activeCalls, 0);
  assert.equal(script.request("record_promo_usage", {}).error, "unsupported_action");
});

test("create_order diagnostics cover every storage stage without logging payment data", async () => {
  const script = createPaymentScriptHarness({ diagnosticsEnabled: true });
  script.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 10, "Test promo"]);
  const [payload] = await scriptedPromoOrders();
  const response = script.request("create_order", payload);
  assert.equal(response.success, true);
  const logs = script.diagnosticLogs();
  const stages = new Set(logs.map((entry) => entry.stage));
  for (const stage of [
    "doPost_entered", "payload_parsed", "authentication_passed", "script_lock_requested", "script_lock_acquired",
    "spreadsheet_open_start", "spreadsheet_open_end", "bookings_sheet_resolve_start", "bookings_sheet_resolve_end",
    "idempotency_lookup_start", "idempotency_lookup_end", "promo_validation_start", "promo_validation_end",
    "booking_row_write_start", "booking_row_write_end", "flush_start", "flush_end",
    "promo_usage_ensure_start", "promo_usage_ensure_end", "response_serialization_start",
    "response_serialization_end", "doPost_completed",
  ]) assert.ok(stages.has(stage), `missing diagnostic stage ${stage}`);
  for (const entry of logs) {
    assert.deepEqual(Object.keys(entry).sort(), ["action", "diagnosticCode", "elapsedMs", "stage", "success"]);
    assert.equal(entry.action, entry.stage === "doPost_entered" ? "unknown" : "create_order");
    assert.ok(Number.isInteger(entry.elapsedMs) && entry.elapsedMs >= 0);
  }
  const serializedLogs = script.rawDiagnosticLogs().join("\n");
  for (const sensitive of [
    "test-payments-secret", payload.booking.Full_Name, payload.booking.Phone, payload.booking.Email,
    payload.booking.Order_Snapshot, payload.booking.Idempotency_Key_Hash, payload.booking.Payment_Proof_URL,
  ].filter(Boolean)) assert.ok(!serializedLogs.includes(String(sensitive)), `diagnostics leaked ${sensitive}`);
  assert.deepEqual(script.lockStats(), { lockWaits: [20000], maxLockDepth: 1, lockDepth: 0, lockReleases: 1 });
});

test("diagnostic mode is behavior-neutral and logging failure cannot block a booking", async () => {
  const [payload] = await scriptedPromoOrders();
  const enabled = createPaymentScriptHarness({ diagnosticsEnabled: true });
  const disabled = createPaymentScriptHarness();
  const brokenLogger = createPaymentScriptHarness({ diagnosticsEnabled: true, loggerThrows: true });
  for (const script of [enabled, disabled, brokenLogger]) {
    script.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 10, "Test promo"]);
  }
  const enabledResponse = enabled.request("create_order", payload);
  const disabledResponse = disabled.request("create_order", payload);
  const brokenLoggerResponse = brokenLogger.request("create_order", payload);
  assert.deepEqual(enabledResponse, disabledResponse);
  assert.deepEqual(enabledResponse, brokenLoggerResponse);
  assert.deepEqual(enabled.sheets.get("Bookings").rows, disabled.sheets.get("Bookings").rows);
  assert.deepEqual(enabled.sheets.get("Promo Usage").rows, disabled.sheets.get("Promo Usage").rows);
  assert.ok(enabled.diagnosticLogs().length > 0);
  assert.equal(disabled.diagnosticLogs().length, 0);
  assert.equal(brokenLogger.sheets.get("Bookings").rows.length, 2);
});

test("storage failures return stable diagnostics while preserving existing application errors", async () => {
  const [payload] = await scriptedPromoOrders();
  const cases = [
    ["lock", "storage_busy", "payment_lock_timeout", (script) => script.setLockBusy(true)],
    ["booking", "internal_error", "payment_booking_write_failed", (script) => script.failNextBookingWrite()],
    ["flush", "internal_error", "payment_flush_failed", (script) => script.failNextFlush()],
    ["promo", "internal_error", "payment_promo_usage_failed", (script) => script.failNextUsageWrite()],
  ];
  for (const [name, applicationError, diagnosticCode, arrange] of cases) {
    const script = createPaymentScriptHarness({ diagnosticsEnabled: true });
    script.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 10, "Test promo"]);
    arrange(script);
    const response = script.request("create_order", payload);
    assert.equal(response.error, applicationError, `${name} changed the existing application error`);
    assert.equal(response.diagnosticCode, diagnosticCode);
    assert.ok(script.diagnosticLogs().some((entry) => entry.success === false && entry.diagnosticCode === diagnosticCode));
  }
  const missingSheet = createPaymentScriptHarness({ diagnosticsEnabled: true });
  missingSheet.properties.delete("PAYMENTS_SPREADSHEET_ID");
  const missingResponse = missingSheet.request("get_promo", { code: "TEST500" });
  assert.equal(missingResponse.error, "missing_spreadsheet_id");
  assert.equal(missingResponse.diagnosticCode, "payment_sheet_open_failed");
});

test("diagnostic action names are allowlisted and cannot echo untrusted input", () => {
  const script = createPaymentScriptHarness({ diagnosticsEnabled: true });
  const attackerAction = "customer-secret-action-value";
  const response = script.request(attackerAction, { secretCustomerField: "must-not-appear" });
  assert.equal(response.error, "unsupported_action");
  assert.ok(script.diagnosticLogs().every((entry) => entry.action === "unknown"));
  assert.ok(!script.rawDiagnosticLogs().join("\n").includes(attackerAction));
  assert.ok(!script.rawDiagnosticLogs().join("\n").includes("must-not-appear"));
});

test("payment Apps Script counts only committed bookings and enforces the last promo use", async () => {
  const script = createPaymentScriptHarness();
  const promo = script.sheets.get("Promo Codes").rows;
  promo.push(["TEST500", "Fixed", 500, true, "", "", 1, "Test promo"]);
  const orders = await scriptedPromoOrders();
  orders.forEach((payload) => { payload.promo.maxUses = 1; });
  script.setLockBusy(true);
  assert.equal(script.request("create_order", orders[0]).error, "storage_busy");
  assert.equal(script.sheets.get("Bookings").rows.length, 1);
  script.setLockBusy(false);
  const orphan = script.sheets.get("Promo Usage").rows;
  orphan.push(["orphan", "2026-09-01", "TEST500", "missing-booking", "Customer", "Phone", 500]);
  assert.equal(script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 0);
  assert.equal(script.request("create_order", orders[0]).success, true);
  assert.equal(script.request("get_promo", { code: "TEST500" }).data.promo.usedCount, 1);
  assert.equal(script.request("create_order", orders[1]).error, "promo_limit_reached");
  assert.equal(script.sheets.get("Bookings").rows.length, 2);
  assert.equal(script.request("create_order", orders[0]).data.created, false);
  assert.equal(script.sheets.get("Bookings").rows.length, 2);
  assert.equal(script.sheets.get("Promo Usage").rows.filter((row) => row[3] === orders[0].order.id).length, 1);
  assert.ok(script.stats().lockAcquisitions >= 3);
});

test("payment Apps Script normalizes stored promo codes and rejects normalized duplicates", async () => {
  const [payload] = await scriptedPromoOrders();
  const script = createPaymentScriptHarness();
  script.sheets.get("Promo Codes").rows.push([" test500 ", "Fixed", 500, true, "", "", 10, "Test promo"]);
  const promo = script.request("get_promo", { code: "tEsT500" });
  assert.equal(promo.success, true);
  assert.equal(promo.data.promo.code, "TEST500");
  assert.equal(script.request("create_order", payload).success, true);

  const duplicate = createPaymentScriptHarness();
  duplicate.sheets.get("Promo Codes").rows.push(
    ["TEST500", "Fixed", 500, true, "", "", 10, "First"],
    ["test500", "Fixed", 500, true, "", "", 10, "Duplicate"],
  );
  assert.equal(duplicate.request("get_promo", { code: "TEST500" }).error, "promo_invalid");
});

test("payment Apps Script accepts Sheet booleans and Date objects with inclusive-start exclusive-end semantics", async () => {
  const now = "2026-09-01T12:05:00.000Z";
  const end = "2026-09-02T12:05:00.000Z";
  const [payload] = await scriptedPromoOrders();
  const active = createPaymentScriptHarness({ now });
  active.sheets.get("Promo Codes").rows.push([
    "TEST500", "Fixed", 500, true, active.sheetDate(now), active.sheetDate(end), 10, "Informational only",
  ]);
  payload.promo.startDate = now;
  payload.promo.endDate = end;
  assert.equal(active.request("create_order", payload).success, true);
  const parsed = active.request("get_promo", { code: "TEST500" }).data.promo;
  assert.equal(parsed.active, true);
  assert.equal(parsed.startDate, now);
  assert.equal(parsed.endDate, end);

  const inactive = createPaymentScriptHarness({ now });
  inactive.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, false, "", "", 10, ""]);
  assert.equal(inactive.request("get_promo", { code: "TEST500" }).data.promo.active, false);

  const exclusiveEnd = createPaymentScriptHarness({ now });
  exclusiveEnd.sheets.get("Promo Codes").rows.push([
    "TEST500", "Fixed", 500, true, "", exclusiveEnd.sheetDate(now), 10, "",
  ]);
  const expiredPayload = structuredClone(payload);
  expiredPayload.promo.startDate = null;
  expiredPayload.promo.endDate = now;
  assert.equal(exclusiveEnd.request("create_order", expiredPayload).error, "promo_expired");

  const blank = createPaymentScriptHarness({ now });
  blank.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 10, ""]);
  assert.deepEqual(blank.request("get_promo", { code: "TEST500" }).data.promo.startDate, null);
  assert.deepEqual(blank.request("get_promo", { code: "TEST500" }).data.promo.endDate, null);
});

test("payment Apps Script fails closed for invalid promo cell values", () => {
  const cases = [
    ["Percentage", 100.01, true, "", "", 10],
    ["Fixed", 1.001, true, "", "", 10],
    ["Fixed", 500, "Enabled", "", "", 10],
    ["Fixed", 500, true, "01/09/2026", "", 10],
    ["Fixed", 500, true, "2026-09-02T00:00:00.000Z", "2026-09-01T00:00:00.000Z", 10],
    ["Fixed", 500, true, "", "", 0],
  ];
  for (const [type, value, active, start, end, limit] of cases) {
    const script = createPaymentScriptHarness();
    script.sheets.get("Promo Codes").rows.push(["TEST500", type, value, active, start, end, limit, ""]);
    assert.equal(script.request("get_promo", { code: "TEST500" }).error, "promo_invalid");
  }

  const percentage = createPaymentScriptHarness();
  percentage.sheets.get("Promo Codes").rows.push(["TEST500", "Percentage", 10, true, "", "", 10, ""]);
  assert.deepEqual(
    { type: percentage.request("get_promo", { code: "TEST500" }).data.promo.type,
      value: percentage.request("get_promo", { code: "TEST500" }).data.promo.value },
    { type: "percentage", value: 10 },
  );
});

test("payment Apps Script preserves promo state errors and rejects stale definitions", async () => {
  const [payload] = await scriptedPromoOrders();
  const inactive = createPaymentScriptHarness();
  inactive.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, false, "", "", 10, "Inactive"]);
  assert.equal(inactive.request("create_order", payload).error, "promo_inactive");

  const future = createPaymentScriptHarness();
  future.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "2099-01-01T00:00:00Z", "", 10, "Future"]);
  assert.equal(future.request("create_order", payload).error, "promo_changed");

  const changedLimit = createPaymentScriptHarness();
  changedLimit.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 11, "Changed limit"]);
  assert.equal(changedLimit.request("create_order", payload).error, "promo_changed");
});

test("payment Apps Script repairs missing promo audit rows after a partial write", async () => {
  const script = createPaymentScriptHarness();
  script.sheets.get("Promo Codes").rows.push(["TEST500", "Fixed", 500, true, "", "", 1, "Test promo"]);
  const [first, second] = await scriptedPromoOrders();
  first.promo.maxUses = 1;
  second.promo.maxUses = 1;
  script.failNextUsageWrite();
  assert.equal(script.request("create_order", first).error, "internal_error");
  assert.equal(script.sheets.get("Bookings").rows.length, 2);
  assert.equal(script.sheets.get("Promo Usage").rows.length, 1);
  assert.equal(script.request("create_order", second).error, "promo_limit_reached");
  const retry = script.request("find_order_by_idempotency", { idempotencyKeyHash: first.order.idempotencyKeyHash });
  assert.equal(retry.data.order.id, first.order.id);
  assert.equal(script.sheets.get("Bookings").rows.length, 2);
  assert.equal(script.sheets.get("Promo Usage").rows.length, 2);
  assert.equal(script.request("find_order_by_idempotency", { idempotencyKeyHash: first.order.idempotencyKeyHash }).success, true);
  assert.equal(script.request("create_order", first).data.created, false);
  assert.equal(script.sheets.get("Promo Usage").rows.length, 2);
  assert.equal(script.request("create_order", second).error, "promo_limit_reached");
});

test("payment Apps Script writes only validated image bytes to its private configured folder", () => {
  const script = createPaymentScriptHarness();
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const hash = "a".repeat(64);
  const payload = {
    contractVersion: 3, uploadKeyHash: hash, fileName: `payment-proof-${hash}.png`,
    mimeType: "image/png", contentBase64: bytes.toString("base64"),
  };
  assert.match(script.request("upload_payment_proof", payload).data.proofUrl, /^https:\/\/drive\.google\.com\/file\/d\//);
  assert.equal(script.proofFiles.size, 1);
  assert.equal(script.request("upload_payment_proof", { ...payload, contentBase64: Buffer.from("not an image").toString("base64") }).error, "invalid_payment_proof");
  assert.equal(script.request("upload_payment_proof", { ...payload, folderId: "attacker-folder" }).success, true);
  assert.equal(script.proofFiles.size, 1);
  script.properties.delete("PAYMENT_PROOFS_DRIVE_FOLDER_ID");
  assert.equal(script.request("upload_payment_proof", payload).error, "proof_storage_unavailable");
});

test("InstaPay and wallet require a signed upload receipt while branch requires no screenshot", async () => {
  const proofLink = "https://drive.google.com/file/d/test-proof/view";
  for (const method of ["instapay", "wallet"]) {
    const { handler, repository } = createApi();
    const proofReceipt = createProofReceipt(proofLink, method, context.idempotencyKey, secret);
    const response = await handler(request({ paymentMethod: method, proofReceipt }));
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.order.payment.proofLink, undefined);
    const order = [...repository.orders.values()][0];
    assert.equal(order.payment.proofLink, proofLink);
    assert.equal(order.payment.provider, null);
    assert.equal(order.payment.transactionId, null);
    assert.equal(order.payment.status, "not_started");
    assert.equal(order.status, "pending");
    const row = toBookingSheetRow(order, repository.bookings.get(order.id));
    assert.equal(row.Payment_Proof_URL, proofLink);
    assert.equal(row.Payment_Status, "Pending");
    assert.equal(row.Payment_Verification, "Waiting Review");
    const missing = createApi();
    assert.equal((await missing.handler(request({ paymentMethod: method }))).status, 400);
  }
  for (const method of ["card", "installments", "branch"]) {
    const { handler, repository } = createApi();
    const response = await handler(request({ paymentMethod: method, proofReceipt: createProofReceipt(proofLink, "instapay", context.idempotencyKey, secret) }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "invalid_payment_proof");
    assert.equal(repository.orders.size, 0);
  }
  const branch = createApi();
  assert.equal((await branch.handler(request({ paymentMethod: "branch" }))).status, 201);
  const branchOrder = [...branch.repository.orders.values()][0];
  assert.equal(bookingPaymentVerification(branchOrder), "Waiting Review");
});

test("proof validation rejects arbitrary URLs and forged, tampered or expired receipts", async () => {
  const trusted = "https://drive.google.com/file/d/test-proof/view";
  for (const proofLink of ["javascript:alert(1)", "http://files.example.test/x", "https://user:pass@files.example.test/x", "https://localhost/x", "https://host.local/x", "https://127.0.0.1/x", "https://[::1]/x", "https://files.example.test/receipt.png", "https://files.example.test/" + "x".repeat(2048), 42, {}]) {
    assert.equal(validatePaymentProof(proofLink, "instapay").valid, false, String(proofLink));
    const { handler, repository } = createApi();
    assert.equal((await handler(request({ paymentMethod: "instapay", proofLink }))).status, 400);
    assert.equal(repository.orders.size, 0);
  }
  const receipt = createProofReceipt(trusted, "instapay", context.idempotencyKey, secret);
  assert.equal(verifyProofReceipt(receipt, "instapay", context.idempotencyKey, secret), trusted);
  assert.equal(verifyProofReceipt(receipt, "wallet", context.idempotencyKey, secret), null);
  assert.equal(verifyProofReceipt(receipt, "instapay", "different-idempotency-key", secret), null);
  assert.equal(verifyProofReceipt(receipt + "x", "instapay", context.idempotencyKey, secret), null);
  const oldReceipt = createProofReceipt(trusted, "instapay", context.idempotencyKey, secret, Date.now() - 21 * 60_000);
  assert.equal(verifyProofReceipt(oldReceipt, "instapay", context.idempotencyKey, secret), null);
  for (const badReceipt of [trusted, receipt + "x", oldReceipt]) {
    const { handler, repository } = createApi();
    assert.equal((await handler(request({ paymentMethod: "instapay", proofReceipt: badReceipt }))).status, 400);
    assert.equal(repository.orders.size, 0);
  }
  for (const value of [undefined, null, "", "  "]) assert.deepEqual(validatePaymentProof(value, "card"), { valid: true, proofLink: null });
  assert.equal(requiresPaymentProof("instapay"), true);
  assert.equal(requiresPaymentProof("wallet"), true);
  assert.equal(requiresPaymentProof("branch"), false);
});

test("payment proof upload validates the image and stores it through the private Drive adapter", async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  let stored;
  const handler = createUploadPaymentProofHandler(() => ({ store: async (upload) => {
    stored = upload;
    return { url: "https://drive.google.com/file/d/test-proof/view" };
  } }), () => secret);
  const makeRequest = (file, method = "instapay", key = context.idempotencyKey) => {
    const form = new FormData();
    form.set("method", method);
    form.set("file", file);
    return new Request("http://localhost/api/payments/proofs", {
      method: "POST", headers: { "idempotency-key": key, origin: "http://localhost" }, body: form,
    });
  };
  const response = await handler(makeRequest(new File([png], "customer-name.png", { type: "image/png" })));
  assert.equal(response.status, 201);
  const uploadResult = await response.json();
  assert.equal(uploadResult.proofUrl, undefined);
  assert.equal(verifyProofReceipt(uploadResult.proofReceipt, "instapay", context.idempotencyKey, secret), "https://drive.google.com/file/d/test-proof/view");
  assert.equal(stored.mimeType, "image/png");
  assert.match(stored.fileName, /^payment-proof-[a-f0-9]{64}\.png$/);
  assert.deepEqual([...stored.bytes], [...png]);
  assert.equal((await handler(makeRequest(new File([png], "receipt.txt", { type: "text/plain" })))).status, 400);
  assert.equal((await handler(makeRequest(new File([png], "receipt.png", { type: "image/png" }), "branch"))).status, 400);
  assert.equal((await handler(makeRequest(new File([png], "receipt.png", { type: "image/png" }), "wallet", "short"))).status, 400);

  let requestBody;
  const adapter = new GoogleDrivePaymentProofStorage({
    webhookUrl: "https://script.google.com/macros/s/test/exec",
    webhookSecret: "test-secret",
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return Response.json({ success: true, data: { proofUrl: "https://drive.google.com/file/d/test-proof/view" } });
    },
  });
  assert.equal((await adapter.store(stored)).url, "https://drive.google.com/file/d/test-proof/view");
  assert.equal(requestBody.action, "upload_payment_proof");
  assert.equal(requestBody.payload.contractVersion, 3);
  assert.equal(requestBody.payload.folderId, undefined);
  assert.equal(Buffer.from(requestBody.payload.contentBase64, "base64").length, png.length);
});

test("proof and notes belong to the immutable idempotent booking request", async () => {
  const { service, repository } = createFixture();
  const input = validInput({ paymentMethod: "wallet", proofLink: "https://drive.google.com/file/d/one/view", enrollment: { ...enrollment, notes: "One note\nSecond line" } });
  const first = await service.createOrder(input, context);
  assert.equal((await service.createOrder(input, context)).created, false);
  for (const changes of [{ proofLink: "https://drive.google.com/file/d/two/view" }, { enrollment: { ...enrollment, notes: "Changed note" } }]) {
    await assert.rejects(() => service.createOrder({ ...input, ...changes }, context), OrderIdempotencyConflictError);
  }
  assert.equal(repository.bookings.size, 1);
  assert.equal(repository.bookings.get(first.order.id).customer.notes, "One note\nSecond line");
});

test("the Sheets adapter sends one booking row and optional usage, with no extra sheet records", async () => {
  const { service, repository, promos } = promoFixture();
  const { order } = await service.createOrder(validInput({ promoCode: "TEST500", quotedFinalPriceEgp: 8500, paymentMethod: "instapay", proofLink: "https://drive.google.com/file/d/test-proof/view" }), context);
  const records = repository.bookings.get(order.id);
  let payload;
  let stored = order;
  const adapter = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async (_url, options) => {
    payload = JSON.parse(options.body).payload;
    return Response.json({ success: true, data: { order: stored, created: true, bookingCommit: bookingAck(stored) } });
  } });
  const quote = await promos.quote("TEST500", "excellence-120");
  await adapter.createIfAbsent(order, repository.events[0], records, quote.redemption);
  assert.equal(payload.contractVersion, 3);
  assert.equal(payload.records, undefined);
  assert.equal(payload.booking.Final_Price, 8500);
  assert.equal(payload.booking.Phone, "'" + customer.phone);
  assert.equal(payload.promoUsage.Customer_Phone, "'" + customer.phone);
  assert.equal(payload.promoUsage.Booking_ID, order.id);
  assert.equal(payload.booking.Payment_Status, "Pending");
  assert.equal(payload.booking.Payment_Verification, "Waiting Review");
  assert.equal(payload.notification.eventType, "booking.created");
  for (const payment of [{ ...order.payment, amountMinor: 1 }, { ...order.payment, proofLink: "https://drive.google.com/file/d/wrong/view" }]) {
    stored = { ...order, payment };
    await assert.rejects(() => adapter.createIfAbsent(order, repository.events[0], records, quote.redemption), OrderRepositoryUnavailableError);
  }
});

test("minimal Promo Codes data works with usage derived from the usage journal", async () => {
  const minimal = { code: "WELCOME500", type: "fixed", value: 500, active: true, startDate: null, endDate: null, maxUses: 1, usedCount: 0 };
  const adapter = new GoogleSheetsPromoRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test", fetchImpl: async () => Response.json({ success: true, data: { promo: minimal } }) });
  const promos = new PromoService(adapter, () => new Date("2026-09-02T12:00:00Z"));
  assert.deepEqual((await promos.quote("WELCOME500", "excellence-120")).pricing, { originalPrice: 9000, promoCode: "WELCOME500", discountAmount: 500, finalPrice: 8500 });
  minimal.usedCount = 1;
  await assert.rejects(() => promos.quote("WELCOME500", "excellence-120"), /promo_limit_reached/);
});

test("booking status labels prepare manual review without changing internal transitions", () => {
  for (const status of ["not_started", "waiting_payment", "waiting_verification"]) assert.equal(bookingPaymentStatus(status), "Pending");
  assert.equal(bookingPaymentStatus("paid"), "Paid");
  assert.equal(bookingPaymentStatus("failed"), "Rejected");
  assert.equal(bookingPaymentStatus("cancelled"), "Rejected");
});

test("manual review uses existing guarded transitions and preserves the booking price", async () => {
  for (const outcome of ["paid", "failed"]) {
    const { service } = createFixture();
    const { order } = await service.createOrder(validInput({ paymentMethod: "instapay", proofLink: "https://drive.google.com/file/d/test-proof/view" }), context);
    await assert.rejects(() => service.transitionOrder(order.id, { status: "paid", transactionId: "test-only-review" }), /invalid_transition/);
    await service.transitionOrder(order.id, { status: "waiting_verification" });
    await assert.rejects(() => service.transitionOrder(order.id, { status: "paid" }), /missing_transaction_reference/);
    const reviewed = await service.transitionOrder(order.id, { status: outcome, transactionId: outcome === "paid" ? "test-only-review" : null });
    assert.equal(bookingPaymentStatus(reviewed.payment.status), outcome === "paid" ? "Paid" : "Rejected");
    assert.deepEqual(reviewed.pricing, order.pricing);
    assert.deepEqual(reviewed.legalConsent, order.legalConsent);
  }
});

test("audit event IDs remain unique when status transitions share a timestamp", async () => {
  const { service, repository } = createFixture({ now: () => new Date("2026-09-02T12:00:00Z") });
  const { order } = await service.createOrder(validInput(), context);
  await service.transitionOrder(order.id, { status: "waiting_payment" });
  await service.transitionOrder(order.id, { status: "failed" });
  await service.transitionOrder(order.id, { status: "waiting_payment" });
  assert.equal(repository.audits.length, 4);
  assert.equal(new Set(repository.audits.map((entry) => entry.eventId)).size, 4);
});

async function adminReviewFixture(method = "instapay") {
  const { service, repository } = createFixture();
  const { order } = await service.createOrder(validInput({ paymentMethod: method,
    proofLink: ["instapay", "wallet"].includes(method) ? "https://drive.google.com/file/d/test-proof/view" : undefined }), context);
  const records = repository.bookings.get(order.id);
  const payload = { contractVersion: 3, order, booking: toBookingSheetRow(order, records),
    notification: records.notification, promoUsage: null, promo: null };
  const script = createPaymentScriptHarness();
  assert.equal(script.request("create_order", payload).success, true);
  const row = script.sheets.get("Bookings").rows[1];
  const column = (name) => script.headers.Bookings.indexOf(name);
  return { script, order, payload, row, column, get: (name) => row[column(name)] };
}

test("admin setup adds exact dropdown and protects system fields without changing bookings", async () => {
  const f = await adminReviewFixture();
  const before = JSON.stringify(f.row);
  f.script.setup();
  f.script.setup();
  assert.equal(JSON.stringify(f.row), before);
  assert.equal(f.script.protections.length, 2);
  const protection = f.script.protections.find((item) => item.description === "Payment bookings: system-owned data");
  assert.ok(protection);
  assert.equal(protection.warning, false);
  assert.equal(protection.restricted, true);
  assert.equal(protection.domain, false);
  assert.deepEqual(Array.from(protection.ranges, (range) => range.getColumn()), [20, 22]);
  const rule = f.script.sheets.get("Bookings").validation;
  assert.deepEqual([...rule.values], ["Waiting Review", "Approved", "Rejected", "Not Required"]);
  assert.equal(rule.allowInvalid, false);
});

test("manual creation remains Pending/Waiting Review; actual proof upload does not approve", async () => {
  for (const method of ["instapay", "wallet", "branch"]) {
    const f = await adminReviewFixture(method);
    assert.equal(f.get("Payment_Status"), "Pending");
    assert.equal(f.get("Payment_Verification"), "Waiting Review");
    const hash = "b".repeat(64);
    const before = JSON.stringify(f.row);
    assert.equal(f.script.request("upload_payment_proof", { contractVersion: 3, uploadKeyHash: hash,
      fileName: `payment-proof-${hash}.png`, mimeType: "image/png",
      contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64") }).success, true);
    assert.equal(JSON.stringify(f.row), before);
  }
});

for (const method of ["instapay", "wallet"]) {
  test(`${method} approval without proof is reverted with a toast`, async () => {
    const f = await adminReviewFixture(method);
    f.row[f.column("Payment_Proof_URL")] = "  ";
    f.script.edit(2, "Approved");
    assert.equal(f.get("Payment_Status"), "Pending");
    assert.equal(f.get("Payment_Verification"), "Waiting Review");
    assert.match(f.script.toasts.at(-1), /proof is missing/);
  });
}

for (const method of ["instapay", "wallet", "branch"]) {
  test(`${method} explicit approval maps to Paid while snapshots, notes and idempotency stay intact`, async () => {
    const f = await adminReviewFixture(method);
    f.row[f.column("Admin_Notes")] = "Keep the reviewer note";
    const snapshot = f.get("Order_Snapshot");
    f.script.edit(2, "Approved");
    assert.equal(f.get("Payment_Status"), "Paid");
    assert.equal(f.get("Payment_Verification"), "Approved");
    assert.equal(f.get("Order_Snapshot"), snapshot);
    assert.equal(JSON.parse(snapshot).status, "pending");
    assert.equal(f.get("Admin_Notes"), "Keep the reviewer note");
    for (const [action, payload] of [["get_order", { orderId: f.order.id }],
      ["find_order_by_idempotency", { idempotencyKeyHash: f.order.idempotencyKeyHash }], ["create_order", f.payload]]) {
      const result = f.script.request(action, payload);
      assert.equal(result.success, true);
      assert.equal(result.data.order.status, "paid");
      assert.equal(result.data.order.payment.status, "paid");
      assert.deepEqual(result.data.order.pricing, f.order.pricing);
    }
    assert.equal(f.script.sheets.get("Bookings").rows.length, 2);
    assert.equal(f.script.request("get_customer_for_order", { orderId: f.order.id }).data.customer.paymentStatus, "paid");
    if (method === "branch") assert.ok(!f.get("Payment_Proof_URL"));
  });
}

test("rejection overrides stale pending snapshot without mutating it", async () => {
  const f = await adminReviewFixture();
  const snapshot = f.get("Order_Snapshot");
  f.script.edit(2, "Rejected");
  assert.equal(f.get("Payment_Status"), "Rejected");
  assert.equal(f.get("Payment_Verification"), "Rejected");
  assert.equal(f.get("Order_Snapshot"), snapshot);
  const current = f.script.request("get_order", { orderId: f.order.id }).data.order;
  assert.equal(current.status, "failed");
  assert.equal(current.payment.status, "failed");
});

for (const [decision, eventType, status] of [
  ["Approved", "payment.approved", "Paid"],
  ["Rejected", "payment.rejected", "Rejected"],
]) {
  test(`${eventType} is sent after committed state and outside ScriptLock`, async () => {
    const f = await adminReviewFixture("instapay");
    f.script.properties.set("NOTIFICATIONS_WEBHOOK_URL", "https://n8n.example.test/webhook/payment-events");
    f.script.properties.set("NOTIFICATIONS_WEBHOOK_SECRET", "test-notification-secret-at-least-32-characters");
    f.script.edit(2, decision);
    assert.equal(f.get("Payment_Status"), status);
    assert.equal(f.get("Payment_Verification"), decision);
    const requests = f.script.notificationRequests();
    assert.equal(requests.length, 1);
    const sent = requests[0];
    assert.equal(sent.lockDepth, 0);
    assert.equal(sent.headers["X-Success-Academy-Webhook-Secret"], "test-notification-secret-at-least-32-characters");
    assert.equal(Object.hasOwn(sent.headers, "Authorization"), false);
    assert.equal(sent.payload.version, 1);
    assert.equal(sent.payload.eventType, eventType);
    assert.equal(sent.payload.eventId, `notification:${eventType}:${f.order.id}`);
    assert.equal(sent.payload.source, "payment_admin");
    assert.equal(sent.payload.booking.paymentStatus, status);
    assert.equal(sent.payload.booking.paymentVerification, decision);
    assert.equal(sent.payload.booking.originalPriceEgp, f.payload.booking.Original_Price);
    assert.equal(sent.payload.booking.discountAmountEgp, f.payload.booking.Discount_Amount);
    assert.equal(sent.payload.booking.finalPriceEgp, f.payload.booking.Final_Price);
    assert.equal(Object.hasOwn(sent.payload.booking, "originalPrice"), false);
    assert.equal(Object.hasOwn(sent.payload.booking, "discountAmount"), false);
    assert.equal(Object.hasOwn(sent.payload.booking, "finalPrice"), false);
    assert.deepEqual(Object.keys(sent.payload.customer).sort(), ["email", "fullName", "phone", "whatsapp"]);
    const serialized = JSON.stringify(sent.payload);
    for (const forbidden of ["Order_Snapshot", "Idempotency_Key_Hash", "Request_Fingerprint", "accessToken",
      "Payment_Proof_URL", "paymentProofUrl", "test-proof", "test-notification-secret"]) {
      assert.equal(serialized.includes(forbidden), false, `admin notification leaked ${forbidden}`);
    }
    const logs = f.script.rawDiagnosticLogs().join("\n");
    for (const privateValue of [customer.name, customer.phone, customer.email, "test-proof"]) {
      assert.equal(logs.includes(privateValue), false);
    }
  });
}

test("notification failure cannot undo an approved payment", async () => {
  const f = await adminReviewFixture("wallet");
  f.script.properties.set("NOTIFICATIONS_WEBHOOK_URL", "https://n8n.example.test/webhook/payment-events");
  f.script.properties.set("NOTIFICATIONS_WEBHOOK_SECRET", "test-notification-secret-at-least-32-characters");
  f.script.failNotifications();
  f.script.edit(2, "Approved");
  assert.equal(f.get("Payment_Status"), "Paid");
  assert.equal(f.get("Payment_Verification"), "Approved");
  assert.equal(f.script.notificationRequests().length, 1);
  assert.equal(f.script.lockStats().lockDepth, 0);
  assert.match(f.script.rawDiagnosticLogs().join("\n"), /"diagnosticCode":"network_error"/);
});

test("invalid admin edits and proof upload emit no notification", async () => {
  const f = await adminReviewFixture("instapay");
  f.script.properties.set("NOTIFICATIONS_WEBHOOK_URL", "https://n8n.example.test/webhook/payment-events");
  f.script.properties.set("NOTIFICATIONS_WEBHOOK_SECRET", "test-notification-secret-at-least-32-characters");
  const hash = "c".repeat(64);
  assert.equal(f.script.request("upload_payment_proof", { contractVersion: 3, uploadKeyHash: hash,
    fileName: `payment-proof-${hash}.png`, mimeType: "image/png",
    contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64") }).success, true);
  f.script.edit(2, "Not Required");
  f.script.edit(2, "Waiting Review");
  f.script.edit(2, "A reviewer note", { column: f.column("Admin_Notes") + 1 });
  assert.equal(f.script.notificationRequests().length, 0);
  assert.equal(f.get("Payment_Status"), "Pending");
  assert.equal(f.get("Payment_Verification"), "Waiting Review");
});

test("paid and rejected decisions are terminal; invalid edits preserve safe state", async () => {
  for (const terminal of ["Approved", "Rejected"]) {
    const f = await adminReviewFixture();
    f.script.edit(2, terminal);
    for (const invalid of ["Waiting Review", "Not Required", "", terminal === "Approved" ? "Rejected" : "Approved"]) {
      f.script.edit(2, invalid);
      assert.equal(f.get("Payment_Verification"), terminal);
      assert.equal(f.get("Payment_Status"), terminal === "Approved" ? "Paid" : "Rejected");
      assert.match(f.script.toasts.at(-1), /cannot be changed/);
    }
  }
  const f = await adminReviewFixture();
  f.script.edit(2, "Not Required");
  assert.equal(f.get("Payment_Status"), "Pending");
  assert.equal(f.get("Payment_Verification"), "Waiting Review");
});

test("approval ignores unrelated cells, wrong spreadsheet, absent trigger and delayed events", async () => {
  const f = await adminReviewFixture();
  f.script.edit(2, "A reviewer note", { column: f.column("Admin_Notes") + 1 });
  assert.equal(f.get("Admin_Notes"), "A reviewer note");
  assert.equal(f.script.toasts.length, 0);
  for (const event of [{ triggerUid: undefined }, { source: { getId: () => "unrelated-spreadsheet" } }, { value: "Rejected" }]) {
    f.row[f.column("Payment_Verification")] = "Waiting Review";
    f.script.edit(2, "Approved", { event });
    assert.equal(f.get("Payment_Status"), "Pending");
  }
  f.script.sheets.get("Promo Codes").rows.push(["TEST", "fixed", 500, true, "", "", 10, ""]);
  f.script.edit(2, "Approved", { sheet: "Promo Codes", column: 4 });
  assert.equal(f.get("Payment_Status"), "Pending");
});

test("bulk reviews are reverted, gateway preferences cannot approve, and lock failure fails closed", async () => {
  const f = await adminReviewFixture();
  f.script.edit(2, "Approved", { rowCount: 2 });
  assert.equal(f.get("Payment_Verification"), "Waiting Review");
  assert.equal(f.get("Payment_Status"), "Pending");
  const card = await adminReviewFixture("card");
  card.script.edit(2, "Approved");
  assert.equal(card.get("Payment_Verification"), "Not Required");
  assert.equal(card.get("Payment_Status"), "Pending");
  f.script.setLockBusy(true);
  assert.throws(() => f.script.edit(2, "Approved"), /storage_busy/);
  assert.equal(f.get("Payment_Status"), "Pending");
  assert.equal(f.script.request("get_order", { orderId: f.order.id }).error, "invalid_booking_status");
  f.script.setLockBusy(false);
  f.script.edit(2, "Waiting Review");
  f.script.edit(2, "Approved");
  assert.equal(f.get("Payment_Status"), "Paid");
});

test("repository and OrderService expose current row decisions, not immutable snapshot state", async () => {
  for (const decision of ["Approved", "Rejected"]) {
    const f = await adminReviewFixture();
    f.script.edit(2, decision);
    const adapter = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test",
      fetchImpl: async (_url, options) => { const body = JSON.parse(options.body); return Response.json(f.script.request(body.action, body.payload)); } });
    const { service } = createFixture({ repository: adapter });
    const order = await service.getOrder(f.order.id);
    assert.equal(order.status, decision === "Approved" ? "paid" : "failed");
    assert.equal((await adapter.findByIdempotencyKeyHash(f.order.idempotencyKeyHash)).status, order.status);
    assert.equal(JSON.parse(f.get("Order_Snapshot")).status, "pending");
  }
});

test("success copy is status-aware and method-specific in Arabic and English", async () => {
  for (const locale of ["ar", "en"]) {
    for (const method of ["instapay", "wallet", "branch", "card", "installments"]) {
      const f = await adminReviewFixture(method);
      const pending = bookingPresentation(f.order, locale);
      assert.equal(pending.state, "pending");
      assert.equal(pending.heading, locale === "ar" ? "تم استلام طلبك" : "Your booking request is received");
      if (["instapay", "wallet"].includes(method)) assert.match(pending.body, /إثبات التحويل|transfer receipt/);
      else assert.doesNotMatch(pending.body + pending.next, /إثبات التحويل|transfer receipt/);
      if (method === "branch") {
        assert.match(pending.body + pending.next, /72/);
        assert.match(pending.next, /فرع الدقي|Dokki branch/);
        assert.doesNotMatch(pending.body + pending.next, /استلمنا.*إثبات|received.*receipt/i);
      }
      if (["instapay", "wallet", "branch"].includes(method)) {
        const paid = { ...f.order, status: "paid", payment: { ...f.order.payment, status: "paid" } };
        assert.equal(bookingPresentation(paid, locale).state, "paid");
        assert.equal(bookingPresentation(paid, locale).heading, locale === "ar" ? "تم تأكيد الدفع" : "Payment confirmed");
        assert.equal(bookingPresentation(paid, locale, false).state, "unavailable");
        const rejected = bookingPresentation({ ...paid, status: "failed", payment: { ...paid.payment, status: "failed" } }, locale);
        assert.equal(rejected.state, "rejected");
        assert.equal(rejected.heading, locale === "ar" ? "تعذر تأكيد عملية الدفع" : "Payment could not be confirmed");
        assert.match(rejected.body, /التحقق من التحويل|verify the transfer/);
      }
    }
  }
});

test("friendly reference is deterministic and presentation-only; secure status access stays required", async () => {
  const f = await adminReviewFixture();
  const before = JSON.stringify(f.order);
  assert.equal(bookingDisplayReference("9b617a9a-c6da-4a12-8a12-123456789012"), "SA-9B617A9A");
  assert.equal(bookingDisplayReference(f.order.id), bookingDisplayReference(f.order.id));
  assert.equal(JSON.stringify(f.order), before);
  const api = fs.readFileSync(path.join(root, "app/api/payments/orders/[orderId]/route.ts"), "utf8");
  assert.match(api, /verifyOrderAccessToken\(orderId, token/);
  assert.match(api, /order_access_denied/);
  const ui = fs.readFileSync(path.join(root, "src/features/payments/components/payment-success.tsx"), "utf8");
  assert.match(ui, /Authorization: `Bearer/);
  assert.doesNotMatch(ui, /setOrder\(stored|Purchase|fbq\(/);
  assert.match(ui, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
});

test("real confirmation component renders status-aware RTL/LTR summaries without a raw UUID", async () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const filename = path.join(root, "src/features/payments/components/payment-success.tsx");
  const previousLoad = Module._load;
  const previousTsx = require.extensions[".tsx"];
  const f = await adminReviewFixture();
  let currentOrder = { ...f.order, id: "9b617a9a-c6da-4a12-8a12-123456789012" };
  let stateCursor = 0;
  Module._load = function successUiLoad(request, parent, isMain) {
    if (parent?.filename === filename) {
      if (request === "react") return { ...React, useState: (initial) => [stateCursor++ === 0 ? currentOrder : initial, () => {}],
        useEffect() {}, useRef: (current) => ({ current }) };
      if (request === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (request === "next/image") return ({ priority, ...props }) => React.createElement("img", props);
    }
    return previousLoad.call(this, request, parent, isMain);
  };
  require.extensions[".tsx"] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: file,
  }).outputText, file);
  try {
    delete require.cache[filename];
    const { PaymentSuccess } = require(filename);
    for (const locale of ["ar", "en"]) {
      for (const status of ["pending", "paid", "failed"]) {
        currentOrder = { ...currentOrder, status, payment: { ...currentOrder.payment, status: status === "pending" ? "not_started" : status } };
        stateCursor = 0;
        const html = renderToStaticMarkup(PaymentSuccess({ locale, orderId: currentOrder.id }));
        assert.match(html, new RegExp(`dir="${locale === "ar" ? "rtl" : "ltr"}"`));
        assert.ok(html.includes(bookingPresentation(currentOrder, locale).heading));
        assert.ok(html.includes("SA-9B617A9A"));
        assert.ok(!html.includes(currentOrder.id));
        assert.match(html, /data-payment-section="summary"/);
      }
    }
  } finally {
    Module._load = previousLoad;
    if (previousTsx) require.extensions[".tsx"] = previousTsx;
    else delete require.extensions[".tsx"];
    delete require.cache[filename];
  }
});

test("financial reads reject a different order returned by storage", async () => {
  const { service } = createFixture();
  const { order } = await service.createOrder(validInput(), context);
  const adapter = new GoogleSheetsOrderRepository({ webhookUrl: "https://orders.example.test", webhookSecret: "test",
    fetchImpl: async () => Response.json({ success: true, data: { order } }) });
  await assert.rejects(() => adapter.getById("a-different-order"), OrderRepositoryUnavailableError);
  assert.equal((await adapter.getById(order.id)).id, order.id);
});

async function payTabsOrderFixture() {
  const repository = new InMemoryOrderRepository();
  const promo = { code: "TEST500", type: "fixed", value: 500, active: true, startDate: null, endDate: null,
    maxUses: 10, usedCount: 0, allowedPackages: [] };
  repository.promos.set(promo.code, promo);
  const promoService = new PromoService({ findByCode: async (code) => structuredClone(repository.promos.get(code) ?? null) }, repository.now);
  const ids = ["9b617a9a-c6da-4a12-8a12-123456789012"];
  const service = new OrderService({
    repository,
    promoService,
    createId: () => ids.shift() ?? crypto.randomUUID(),
    now: () => new Date("2026-09-30T12:00:00.000Z"),
    legalPolicies: () => testPolicies,
  });
  const { order } = await service.createOrder(validInput({ paymentMethod: "card", promoCode: "TEST500", quotedFinalPriceEgp: 8500 }), context);
  return { repository, service, order, customerRecord: repository.bookings.get(order.id).customer };
}

function payTabsCallbackPayload(order, changes = {}) {
  return {
    tran_ref: order.payment.transactionId,
    profile_id: "123456",
    cart_id: order.id,
    cart_currency: "EGP",
    cart_amount: (order.payment.amountMinor / 100).toFixed(2),
    payment_result: { response_status: "A", response_code: "G10000", response_message: "Authorised" },
    ...changes,
  };
}

function signedCallbackRequest(payload, secret, signature) {
  const rawBody = JSON.stringify(payload);
  const value = signature === undefined ? crypto.createHmac("sha256", secret).update(rawBody).digest("hex") : signature;
  return new Request("https://academy.example/api/payments/paytabs/callback", {
    method: "POST",
    headers: value === null ? { "Content-Type": "application/json" } : { "Content-Type": "application/json", Signature: value },
    body: rawBody,
  });
}

test("PayTabs initiation uses the Egypt HPP contract, authoritative amount and raw server-key authorization", async () => {
  const f = await payTabsOrderFixture();
  const requests = [];
  const serverKey = "test-paytabs-server-key-with-sufficient-length";
  const provider = new PayTabsProvider({
    profileId: "123456",
    serverKey,
    baseUrl: "https://secure-egypt.paytabs.com",
    callbackUrl: "https://academy.example/api/payments/paytabs/callback",
    returnUrlForOrder: (order) => `https://academy.example/api/payments/paytabs/return?order=${order.id}&locale=${order.locale}`,
    fetchImpl: async (url, options) => {
      requests.push({ url, options, payload: JSON.parse(options.body) });
      if (url.endsWith("/payment/query")) return Response.json({ tran_ref: "TST-TRAN-001", profile_id: "123456",
        cart_id: f.order.id, cart_currency: "EGP", cart_amount: f.order.payment.amountMinor / 100,
        payment_result: { response_status: "A" } });
      return Response.json({ tran_ref: "TST-TRAN-001", redirect_url: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-001" });
    },
  });
  const accessSecret = "test-order-access-secret-at-least-32-characters";
  const handler = createPayTabsInitiateHandler({
    createService: () => f.service,
    createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    getAccessSecret: () => accessSecret,
  });
  const request = () => new Request("https://academy.example/api/payments/paytabs/initiate", {
    method: "POST",
    headers: {
      Origin: "https://academy.example",
      "Content-Type": "application/json",
      Authorization: `Bearer ${createOrderAccessToken(f.order.id, accessSecret)}`,
    },
    body: JSON.stringify({ orderId: f.order.id }),
  });
  const [first, concurrent] = await Promise.all([handler(request()), handler(request())]);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-001" });
  assert.deepEqual(await concurrent.json(), { redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-001" });
  assert.equal(requests.length, 1);
  assert.deepEqual(f.repository.reservationChecks, [f.order.id]);
  assert.equal(requests[0].url, "https://secure-egypt.paytabs.com/payment/request");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers.authorization, serverKey);
  assert.equal(requests[0].options.headers["content-type"], "application/json");
  assert.equal(requests[0].payload.profile_id, 123456);
  assert.equal(requests[0].payload.tran_type, "sale");
  assert.equal(requests[0].payload.tran_class, "ecom");
  assert.equal(requests[0].payload.cart_id, f.order.id);
  assert.equal(requests[0].payload.cart_currency, "EGP");
  assert.equal(requests[0].payload.cart_amount, f.order.payment.amountMinor / 100);
  assert.deepEqual(requests[0].payload.payment_methods, ["creditcard"]);
  assert.deepEqual(Object.keys(requests[0].payload.customer_details).sort(), ["email", "name", "phone"]);
  const stored = await f.service.getOrder(f.order.id);
  assert.equal(stored.status, "waiting_payment");
  assert.equal(stored.payment.provider, "paytabs");
  assert.equal(stored.payment.transactionId, "TST-TRAN-001");
  const replay = await handler(request());
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).redirectUrl, stored.payment.redirectUrl);
  assert.equal(requests.length, 1);
  const verification = await provider.verifyPayment("TST-TRAN-001");
  assert.equal(verification.status, "paid");
  assert.equal(requests[1].url, "https://secure-egypt.paytabs.com/payment/query");
  assert.equal(requests[1].payload.tran_ref, "TST-TRAN-001");
});

test("PayTabs callback verifies exact raw-body HMAC and rejects missing or invalid signatures", async () => {
  const f = await payTabsOrderFixture();
  const serverKey = "test-paytabs-server-key-with-sufficient-length";
  const provider = new PayTabsProvider({ profileId: "123456", serverKey,
    callbackUrl: "https://academy.example/api/payments/paytabs/callback",
    returnUrlForOrder: () => "https://academy.example/api/payments/paytabs/return" });
  const rawBody = JSON.stringify(payTabsCallbackPayload({ ...f.order, payment: { ...f.order.payment, transactionId: "TST-TRAN-001" } }));
  const valid = crypto.createHmac("sha256", serverKey).update(rawBody).digest("hex");
  assert.equal((await provider.handleCallback({ rawBody, headers: { signature: valid } })).status, "paid");
  await assert.rejects(() => provider.handleCallback({ rawBody, headers: { signature: "0".repeat(64) } }), /paytabs_signature_invalid/);
  await assert.rejects(() => provider.handleCallback({ rawBody, headers: {} }), /paytabs_signature_invalid/);
});

test("PayTabs callback correlates amount, currency, order and transaction before idempotent payment transitions", async () => {
  const f = await payTabsOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "TST-TRAN-001", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-001" });
  const serverKey = "test-paytabs-server-key-with-sufficient-length";
  const provider = new PayTabsProvider({ profileId: "123456", serverKey,
    callbackUrl: "https://academy.example/api/payments/paytabs/callback",
    returnUrlForOrder: () => "https://academy.example/api/payments/paytabs/return" });
  const notifications = [];
  const purchases = [];
  const handler = createPayTabsCallbackHandler({
    createService: () => f.service,
    createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    emitNotification: async (event) => notifications.push(event),
    emitMetaPurchase: async (event) => purchases.push(event),
  });
  assert.equal((await handler(signedCallbackRequest(payTabsCallbackPayload(waiting, { cart_amount: "1.00" }), serverKey))).status, 409);
  assert.equal((await handler(signedCallbackRequest(payTabsCallbackPayload(waiting, { cart_currency: "USD" }), serverKey))).status, 409);
  assert.equal((await handler(signedCallbackRequest(payTabsCallbackPayload(waiting, { cart_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" }), serverKey))).status, 404);
  assert.equal((await handler(signedCallbackRequest(payTabsCallbackPayload(waiting), serverKey, null))).status, 401);
  assert.equal((await handler(signedCallbackRequest(payTabsCallbackPayload(waiting), serverKey, "0".repeat(64)))).status, 401);
  assert.equal(purchases.length, 0);
  const success = await handler(signedCallbackRequest(payTabsCallbackPayload(waiting), serverKey));
  assert.equal(success.status, 200);
  assert.equal((await f.service.getOrder(waiting.id)).status, "paid");
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].eventType, "payment.approved");
  assert.equal(notifications[0].source, "payment_admin");
  assert.equal(notifications[0].booking.paymentVerification, "Not Required");
  assert.deepEqual(notifications[0].customer, { fullName: enrollment.name, phone: enrollment.phone, whatsapp: enrollment.whatsapp, email: enrollment.email });
  assert.deepEqual({
    originalPriceEgp: notifications[0].booking.originalPriceEgp,
    promoCode: notifications[0].booking.promoCode,
    discountAmountEgp: notifications[0].booking.discountAmountEgp,
    finalPriceEgp: notifications[0].booking.finalPriceEgp,
  }, { originalPriceEgp: 9000, promoCode: "TEST500", discountAmountEgp: 500, finalPriceEgp: 8500 });
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].eventName, "Purchase");
  assert.equal(purchases[0].eventId, metaPurchaseEventId(waiting.id));
  assert.equal(purchases[0].valueEgp, 1000);
  assert.equal(purchases[0].currency, "EGP");
  assert.equal(purchases[0].transactionId, "TST-TRAN-001");
  const duplicate = await handler(signedCallbackRequest(payTabsCallbackPayload(waiting), serverKey));
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).duplicate, true);
  assert.equal(notifications.length, 1);
  assert.equal(purchases.length, 1);
  const declinedAfterPaid = payTabsCallbackPayload(waiting, { payment_result: { response_status: "D" } });
  assert.equal((await handler(signedCallbackRequest(declinedAfterPaid, serverKey))).status, 200);
  assert.equal((await f.service.getOrder(waiting.id)).status, "paid");
  assert.equal(purchases.length, 1);
});

test("PayTabs declined payment becomes failed once and emits one deterministic rejected event", async () => {
  const f = await payTabsOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "TST-TRAN-DECLINED", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-DECLINED" });
  const serverKey = "test-paytabs-server-key-with-sufficient-length";
  const provider = new PayTabsProvider({ profileId: "123456", serverKey,
    callbackUrl: "https://academy.example/api/payments/paytabs/callback",
    returnUrlForOrder: () => "https://academy.example/api/payments/paytabs/return" });
  const notifications = [];
  const purchases = [];
  const handler = createPayTabsCallbackHandler({ createService: () => f.service, createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }), emitNotification: async (event) => notifications.push(event),
    emitMetaPurchase: async (event) => purchases.push(event) });
  const declined = payTabsCallbackPayload(waiting, { payment_result: { response_status: "D", response_code: "D10000" } });
  assert.equal((await handler(signedCallbackRequest(declined, serverKey))).status, 200);
  assert.equal((await f.service.getOrder(waiting.id)).status, "failed");
  assert.equal(notifications.length, 1);
  assert.equal(purchases.length, 0);
  assert.equal(notifications[0].eventId, notificationEventId("payment.rejected", waiting.id));
  assert.equal((await handler(signedCallbackRequest(declined, serverKey))).status, 200);
  assert.equal(notifications.length, 1);
  assert.equal(purchases.length, 0);
});

test("Meta Purchase contract rejects every non-authoritative payment state", async () => {
  const f = await payTabsOrderFixture();
  assert.throws(() => buildMetaPurchaseEvent(f.order, f.customerRecord, 1000), /meta_purchase_not_authoritative/);
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "TST-TRAN-META", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-META" });
  assert.throws(() => buildMetaPurchaseEvent(waiting, f.customerRecord, 1000), /meta_purchase_not_authoritative/);
});

test("Apps Script persists PayTabs provider state without mutating the immutable order snapshot", async () => {
  const f = await adminReviewFixture("card");
  const snapshot = f.get("Order_Snapshot");
  const waiting = { ...f.order, updatedAt: "2026-09-30T12:05:00.000Z", status: "waiting_payment",
    payment: { ...f.order.payment, provider: "paytabs", status: "waiting_payment", transactionId: "TST-TRAN-001",
      redirectUrl: "https://secure-egypt.paytabs.com/payment/page/TST-TRAN-001" } };
  const payload = { contractVersion: 3, order: waiting,
    event: { orderId: waiting.id, previousStatus: "pending", status: "waiting_payment" }, audit: {},
    expectedStatus: "pending", bookingPaymentStatus: "Pending" };
  const result = f.script.request("commit_booking_transition", payload);
  assert.equal(result.success, true);
  assert.equal(f.get("Order_Snapshot"), snapshot);
  assert.equal(f.get("Payment_Provider"), "paytabs");
  assert.equal(f.get("Provider_Transaction_ID"), "TST-TRAN-001");
  assert.equal(f.get("Payment_Verification"), "Not Required");
  assert.equal(f.script.request("get_order", { orderId: waiting.id }).data.order.status, "waiting_payment");
  const paid = { ...waiting, updatedAt: "2026-09-30T12:06:00.000Z", status: "paid", payment: { ...waiting.payment, status: "paid" } };
  const paidResult = f.script.request("commit_booking_transition", { ...payload, order: paid,
    event: { orderId: paid.id, previousStatus: "waiting_payment", status: "paid" }, expectedStatus: "waiting_payment", bookingPaymentStatus: "Paid" });
  assert.equal(paidResult.success, true);
  assert.equal(f.get("Payment_Status"), "Paid");
  assert.equal(f.get("Payment_Verification"), "Not Required");
  assert.equal(f.get("Order_Snapshot"), snapshot);
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows.length, 2);
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows[1][0], metaPurchaseEventId(paid.id));
  assert.equal(f.script.request("commit_booking_transition", payload).error, "order_conflict");
});

test("PayTabs browser return and existing success access remain non-authoritative", () => {
  const returnRoute = fs.readFileSync(path.join(root, "app/api/payments/paytabs/return/route.ts"), "utf8");
  assert.match(returnRoute, /status: 303/);
  assert.doesNotMatch(returnRoute, /transitionOrder|status:\s*["']paid/);
  const callbackRoute = fs.readFileSync(path.join(root, "app/api/payments/paytabs/callback/route.ts"), "utf8");
  assert.match(callbackRoute, /createPayTabsCallbackHandler/);
  const success = fs.readFileSync(path.join(root, "src/features/payments/components/payment-success.tsx"), "utf8");
  assert.match(success, /Authorization: `Bearer/);
  assert.match(success, /window\.sessionStorage/);
  assert.doesNotMatch(success, /Purchase|fbq\(/);
  assert.doesNotMatch(returnRoute, /Purchase|fbq\(/);
});

async function easyKashOrderFixture() {
  const repository = new InMemoryOrderRepository();
  const promo = { code: "TEST500", type: "fixed", value: 500, active: true, startDate: null, endDate: null,
    maxUses: 10, usedCount: 0, allowedPackages: [] };
  repository.promos.set(promo.code, promo);
  const promoService = new PromoService({ findByCode: async (code) => structuredClone(repository.promos.get(code) ?? null) }, repository.now);
  const ids = ["9b617a9a-c6da-4a12-8a12-123456789012"];
  const service = new OrderService({
    repository,
    promoService,
    createId: () => ids.shift() ?? crypto.randomUUID(),
    now: () => new Date("2026-10-04T12:00:00.000Z"),
    legalPolicies: () => testPolicies,
  });
  const { order } = await service.createOrder(validInput({ paymentMethod: "installments", promoCode: "TEST500", quotedFinalPriceEgp: 8500 }), context);
  return { repository, service, order, customerRecord: repository.bookings.get(order.id).customer };
}

function easyKashCallbackPayload(order, status = "PAID", changes = {}) {
  return {
    ProductCode: "TEST-PRODUCT",
    Amount: (order.payment.amountMinor / 100).toFixed(2),
    ProductType: "DirectPay",
    PaymentMethod: "Qassatly",
    status,
    easykashRef: "EK-TEST-001",
    customerReference: easyKashAttemptReference(order),
    ...changes,
  };
}

function easyKashAttemptReference(order, suffix = "a".repeat(16)) {
  return `${order.id}-${suffix}`;
}

function signEasyKashPayload(payload, secret) {
  const signedValue = ["ProductCode", "Amount", "ProductType", "PaymentMethod", "status", "easykashRef", "customerReference"]
    .map((field) => String(payload[field])).join("");
  return { ...payload, signatureHash: crypto.createHmac("sha512", secret).update(signedValue).digest("hex") };
}

function easyKashCallbackRequest(payload, secret, signature) {
  const signed = signEasyKashPayload(payload, secret);
  if (signature === null) delete signed.signatureHash;
  else if (signature !== undefined) signed.signatureHash = signature;
  return new Request("https://academy.example/api/payments/easykash/callback", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signed),
  });
}

function unsignedEasyKashCallbackRequest(payload) {
  return new Request("https://academy.example/api/payments/easykash/callback", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
}

test("EasyKash initiation uses the authoritative EGP amount and lets hosted checkout choose enabled methods", async () => {
  const f = await easyKashOrderFixture();
  const requests = [];
  const provider = new EasyKashProvider({
    apiKey: "test-easykash-api-key-long-enough",
    hmacSecret: "test-easykash-hmac-secret-long-enough",
    baseUrl: "https://back.easykash.net",
    allowedPaymentMethods: ["Qassatly"],
    createAttemptSuffix: () => "1".repeat(16),
    returnUrlForOrder: (order) => `https://academy.example/api/payments/easykash/return?order=${order.id}&locale=${order.locale}`,
    fetchImpl: async (url, options) => {
      requests.push({ url, options, payload: JSON.parse(options.body) });
      return Response.json({ redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION", easykashRef: "EK-INIT-001" });
    },
  });
  const accessSecret = "test-order-access-secret-at-least-32-characters";
  const handler = createEasyKashInitiateHandler({
    createService: () => f.service,
    createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    getAccessSecret: () => accessSecret,
  });
  const request = () => new Request("https://academy.example/api/payments/easykash/initiate", {
    method: "POST",
    headers: { Origin: "https://academy.example", "Content-Type": "application/json",
      Authorization: `Bearer ${createOrderAccessToken(f.order.id, accessSecret)}` },
    body: JSON.stringify({ orderId: f.order.id }),
  });
  const [first, concurrent] = await Promise.all([handler(request()), handler(request())]);
  assert.equal(first.status, 200);
  assert.equal(concurrent.status, 200);
  assert.equal(requests.length, 1);
  assert.deepEqual(f.repository.reservationChecks, [f.order.id]);
  assert.equal(requests[0].url, "https://back.easykash.net/api/directpayv1/pay");
  assert.equal(requests[0].options.headers.authorization, "test-easykash-api-key-long-enough");
  assert.equal(requests[0].payload.amount, f.order.payment.amountMinor / 100);
  assert.equal(requests[0].payload.currency, "EGP");
  assert.equal(Object.hasOwn(requests[0].payload, "paymentOptions"), false);
  assert.equal(requests[0].payload.customerReference, easyKashAttemptReference(f.order, "1".repeat(16)));
  assert.notEqual(requests[0].payload.customerReference, f.order.id);
  assert.deepEqual(Object.keys(requests[0].payload).sort(), ["amount", "currency", "customerReference", "email", "mobile", "name", "redirectUrl"].sort());
  const stored = await f.service.getOrder(f.order.id);
  assert.equal(stored.status, "waiting_payment");
  assert.equal(stored.payment.provider, "easykash");
  assert.equal(stored.payment.transactionId, "EK-INIT-001");
  assert.equal((await handler(request())).status, 200);
  assert.equal(requests.length, 1);
  const source = fs.readFileSync(path.join(root, "src/features/payments/server/easykash-provider.ts"), "utf8");
  assert.doesNotMatch(source, /paymentOptions\s*:/);
});

test("EasyKash hosted redirects require the exact HTTPS checkout hostname without path coupling", async () => {
  const f = await easyKashOrderFixture();
  const validUrls = [
    "https://easykash.net/DirectPayV1/TEST-SESSION",
    "https://easykash.net/checkout/hosted-session?mode=installments",
    "https://easykash.net/#/checkout/hosted-session",
  ];
  const invalidUrls = [
    "http://easykash.net/checkout/hosted-session",
    "https://evil.com/checkout/hosted-session",
    "https://easykash.net.evil.com/checkout/hosted-session",
    "https://evil-easykash.net/checkout/hosted-session",
    "not-a-url",
  ];
  const originalInfo = console.info;
  const originalWarn = console.warn;
  console.info = () => {};
  console.warn = () => {};
  try {
    for (const redirectUrl of validUrls) {
      const provider = new EasyKashProvider({
        apiKey: "test-easykash-api-key-long-enough",
        hmacSecret: "test-easykash-hmac-secret-long-enough",
        createAttemptSuffix: () => "3".repeat(16),
        returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
        fetchImpl: async () => Response.json({ redirectUrl }),
      });
      assert.equal((await provider.createPayment(f.order, f.customerRecord)).redirectUrl, redirectUrl);
    }
    for (const redirectUrl of invalidUrls) {
      const provider = new EasyKashProvider({
        apiKey: "test-easykash-api-key-long-enough",
        hmacSecret: "test-easykash-hmac-secret-long-enough",
        createAttemptSuffix: () => "4".repeat(16),
        returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
        fetchImpl: async () => Response.json({ redirectUrl }),
      });
      await assert.rejects(
        provider.createPayment(f.order, f.customerRecord),
        (error) => error instanceof Error && error.message === "easykash_response_invalid",
        redirectUrl,
      );
    }
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
  }
  const checkout = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const appsScript = fs.readFileSync(path.join(root, "scripts/google-apps-script/payment-bookings-webhook.gs"), "utf8");
  assert.match(checkout, /url\.hostname\.toLowerCase\(\) === "easykash\.net"/);
  assert.doesNotMatch(checkout.slice(checkout.indexOf("function isEasyKashRedirect")), /DirectPayV1/);
  assert.match(appsScript, /\^https:\\\/\\\/easykash\\\.net/);
  assert.doesNotMatch(appsScript.match(/if \(provider === "easykash"\)[^\n]+/)?.[0] ?? "", /DirectPayV1|www\\\./);
});

test("EasyKash initiation logs only safe diagnostics without changing the request", async () => {
  const f = await easyKashOrderFixture();
  const logs = [];
  const requests = [];
  const originalInfo = console.info;
  const originalWarn = console.warn;
  console.info = (value) => logs.push(String(value));
  console.warn = (value) => logs.push(String(value));
  try {
    const provider = new EasyKashProvider({
      apiKey: "test-easykash-api-key-long-enough",
      hmacSecret: "test-easykash-hmac-secret-long-enough",
      createAttemptSuffix: () => "2".repeat(16),
      returnUrlForOrder: (order) => `https://academy.example/api/payments/easykash/return?order=${order.id}`,
      fetchImpl: async (url, options) => {
        requests.push({ url, options, payload: JSON.parse(options.body) });
        return Response.json({ code: "OPTION_REJECTED", message: `Unsupported option for ${f.customerRecord.name}; test-easykash-api-key-long-enough` }, { status: 422 });
      },
    });
    await assert.rejects(
      provider.createPayment(f.order, f.customerRecord),
      (error) => error instanceof Error && error.message === "easykash_request_failed",
    );
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
  }
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://back.easykash.net/api/directpayv1/pay");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.headers.authorization, "test-easykash-api-key-long-enough");
  assert.equal(Object.hasOwn(requests[0].payload, "paymentOptions"), false);
  assert.deepEqual(Object.keys(requests[0].payload).sort(), ["amount", "currency", "customerReference", "email", "mobile", "name", "redirectUrl"].sort());
  const entries = logs.map((line) => JSON.parse(line));
  const requestLog = entries.find((entry) => entry.stage === "request");
  const responseLog = entries.find((entry) => entry.stage === "upstream_error");
  assert.equal(requestLog.endpointHost, "back.easykash.net");
  assert.equal(requestLog.endpointPath, "/api/directpayv1/pay");
  assert.equal(requestLog.authorizationHeaderPresent, true);
  assert.equal(requestLog.paymentOptionsPresent, false);
  assert.equal(requestLog.namePresent, true);
  assert.equal(requestLog.emailPresent, true);
  assert.equal(requestLog.mobilePresent, true);
  assert.equal(responseLog.upstreamResponseReceived, true);
  assert.equal(responseLog.upstreamStatus, 422);
  assert.equal(responseLog.upstreamContentType, "application/json");
  assert.equal(responseLog.easyKashErrorCode, "OPTION_REJECTED");
  assert.equal(responseLog.easyKashErrorMessage, "Unsupported option for [redacted]; [redacted]");
  assert.equal(responseLog.redirectUrlExists, false);
  assert.ok(Number.isInteger(responseLog.elapsedMs));
  assert.doesNotMatch(logs.join("\n"), /test-easykash-api-key-long-enough/);
  assert.doesNotMatch(logs.join("\n"), new RegExp(f.customerRecord.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(logs.join("\n"), new RegExp(f.customerRecord.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(logs.join("\n"), new RegExp(f.customerRecord.phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("EasyKash failed initiation retries the same booking with a new attempt reference and reuses success", async () => {
  const f = await easyKashOrderFixture();
  const requests = [];
  const suffixes = ["1".repeat(16), "2".repeat(16)];
  const provider = new EasyKashProvider({
    apiKey: "test-easykash-api-key-long-enough",
    hmacSecret: "test-easykash-hmac-secret-long-enough",
    createAttemptSuffix: () => suffixes.shift(),
    returnUrlForOrder: (order) => `https://academy.example/api/payments/easykash/return?order=${order.id}`,
    fetchImpl: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return requests.length === 1
        ? Response.json({ message: "customerReference already used" })
        : Response.json({ redirectUrl: "https://easykash.net/DirectPayV1/RETRY-SESSION" });
    },
  });
  const accessSecret = "test-order-access-secret-at-least-32-characters";
  const handler = createEasyKashInitiateHandler({
    createService: () => f.service,
    createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    getAccessSecret: () => accessSecret,
  });
  const request = () => new Request("https://academy.example/api/payments/easykash/initiate", {
    method: "POST",
    headers: { Origin: "https://academy.example", "Content-Type": "application/json",
      Authorization: `Bearer ${createOrderAccessToken(f.order.id, accessSecret)}` },
    body: JSON.stringify({ orderId: f.order.id }),
  });

  assert.equal((await handler(request())).status, 502);
  assert.equal((await f.service.getOrder(f.order.id)).status, "pending");
  assert.equal((await handler(request())).status, 200);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].customerReference, easyKashAttemptReference(f.order, "1".repeat(16)));
  assert.equal(requests[1].customerReference, easyKashAttemptReference(f.order, "2".repeat(16)));
  assert.notEqual(requests[0].customerReference, requests[1].customerReference);
  assert.equal(f.repository.orders.size, 1);
  assert.equal((await f.service.getOrder(f.order.id)).id, f.order.id);
  assert.equal((await handler(request())).status, 200);
  assert.equal(requests.length, 2);
});

test("EasyKash callback uses exact HMAC-SHA512 fields and configured installment methods", async () => {
  const f = await easyKashOrderFixture();
  const secret = "test-easykash-hmac-secret-long-enough";
  let inquiryRequests = 0;
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: secret,
    allowedPaymentMethods: ["Qassatly"], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
    fetchImpl: async () => { inquiryRequests += 1; throw new Error("signed callbacks must not inquire"); } });
  const payload = easyKashCallbackPayload(f.order);
  const signed = signEasyKashPayload(payload, secret);
  assert.equal((await provider.handleCallback({ rawBody: JSON.stringify(signed), headers: {} })).status, "paid");
  await assert.rejects(() => provider.handleCallback({ rawBody: JSON.stringify({ ...signed, signatureHash: "0".repeat(128) }), headers: {} }), /easykash_signature_invalid/);
  await assert.rejects(() => provider.handleCallback({ rawBody: JSON.stringify({ ...signed, signatureHash: undefined }), headers: {} }), /easykash_signature_invalid/);
  const otherMethod = signEasyKashPayload({ ...payload, PaymentMethod: "Cash" }, secret);
  await assert.rejects(() => provider.handleCallback({ rawBody: JSON.stringify(otherMethod), headers: {} }), /easykash_payment_method_invalid/);
  const numericMethod = signEasyKashPayload({ ...payload, PaymentMethod: "3" }, secret);
  await assert.rejects(() => provider.handleCallback({ rawBody: JSON.stringify(numericMethod), headers: {} }), /easykash_payment_method_invalid/);
  assert.equal(inquiryRequests, 0);
});

test("EasyKash without HMAC treats callback status as untrusted and uses authenticated inquiry", async () => {
  const f = await easyKashOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
    transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
  const requests = [];
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: "",
    allowedPaymentMethods: [], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
    fetchImpl: async (url, options) => {
      requests.push({ url, options, payload: JSON.parse(options.body) });
      return Response.json({ customerReference: easyKashAttemptReference(waiting), easykashRef: "EK-INQUIRE-001", Amount: (waiting.payment.amountMinor / 100).toFixed(2),
        PaymentMethod: "MerchantInstallment", status: "NEW" });
    } });
  const purchases = [];
  const notifications = [];
  const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    emitMetaPurchase: async (event) => purchases.push(event), emitNotification: async (event) => notifications.push(event) });
  const callbackClaimsPaid = { customerReference: easyKashAttemptReference(waiting), easykashRef: "EK-INQUIRE-001", status: "PAID", Amount: "1.00" };
  const result = await handler(unsignedEasyKashCallbackRequest(callbackClaimsPaid));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).pending, true);
  assert.equal((await f.service.getOrder(waiting.id)).status, "waiting_payment");
  assert.equal(purchases.length, 0);
  assert.equal(notifications.length, 0);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://back.easykash.net/api/cash-api/inquire");
  assert.equal(requests[0].options.headers.authorization, "test-easykash-api-key-long-enough");
  assert.deepEqual(requests[0].payload, { customerReference: easyKashAttemptReference(waiting) });
});

test("EasyKash factory accepts an intentionally empty HMAC secret without reusing the API key", () => {
  const names = ["EASYKASH_API_KEY", "EASYKASH_HMAC_SECRET", "EASYKASH_BASE_URL",
    "EASYKASH_INSTALLMENT_PAYMENT_METHODS", "NEXT_PUBLIC_SITE_URL"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    EASYKASH_API_KEY: "test-easykash-api-key-long-enough",
    EASYKASH_HMAC_SECRET: "",
    EASYKASH_BASE_URL: "https://back.easykash.net",
    EASYKASH_INSTALLMENT_PAYMENT_METHODS: "",
    NEXT_PUBLIC_SITE_URL: "https://academy.example",
  });
  try {
    const provider = createConfiguredEasyKashProvider();
    assert.equal(provider.id, "easykash");
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test("EasyKash inquiry-confirmed PAID commits once and cannot be downgraded", async () => {
  const f = await easyKashOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
    transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
  let inquiryStatus = "PAID";
  let inquiryCount = 0;
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough",
    allowedPaymentMethods: [], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
    fetchImpl: async () => {
      inquiryCount += 1;
      return Response.json({ customerReference: easyKashAttemptReference(waiting), easykashRef: "EK-INQUIRE-PAID", Amount: (waiting.payment.amountMinor / 100).toFixed(2),
        PaymentMethod: "MerchantInstallment", status: inquiryStatus });
    } });
  const purchases = [];
  const notifications = [];
  const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    emitMetaPurchase: async (event) => purchases.push(event), emitNotification: async (event) => notifications.push(event) });
  const callback = { customerReference: easyKashAttemptReference(waiting), easykashRef: "EK-INQUIRE-PAID" };
  assert.equal((await handler(unsignedEasyKashCallbackRequest(callback))).status, 200);
  const paid = await f.service.getOrder(waiting.id);
  assert.equal(paid.status, "paid");
  assert.equal(paid.payment.transactionId, "EK-INQUIRE-PAID");
  assert.equal(purchases.length, 1);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].eventType, "payment.approved");
  assert.equal((await handler(unsignedEasyKashCallbackRequest(callback))).status, 200);
  assert.equal(purchases.length, 1);
  assert.equal(notifications.length, 1);
  inquiryStatus = "REFUNDED";
  assert.equal((await handler(unsignedEasyKashCallbackRequest(callback))).status, 200);
  assert.equal((await f.service.getOrder(waiting.id)).status, "paid");
  assert.equal(purchases.length, 1);
  assert.equal(notifications.length, 1);
  assert.equal(inquiryCount, 3);
});

test("EasyKash inquiry mismatches and failures never mark an order paid", async () => {
  for (const scenario of ["amount", "reference", "callback_reference", "network", "malformed"]) {
    const f = await easyKashOrderFixture();
    const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
      transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
    const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough",
      allowedPaymentMethods: [], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return",
      fetchImpl: async () => {
        if (scenario === "network") throw new Error("network unavailable");
        if (scenario === "malformed") return Response.json({ status: "PAID" });
        return Response.json({
          customerReference: scenario === "reference"
            ? "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee-bbbbbbbbbbbbbbbb"
            : easyKashAttemptReference(waiting),
          easykashRef: "EK-INQUIRE-CHECK",
          Amount: scenario === "amount" ? "1.00" : (waiting.payment.amountMinor / 100).toFixed(2),
          PaymentMethod: "MerchantInstallment",
          status: "PAID",
        });
      } });
    const purchases = [];
    const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
      createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }), emitMetaPurchase: async (event) => purchases.push(event) });
    const callbackReference = scenario === "callback_reference" ? "EK-CALLBACK-OTHER" : "EK-INQUIRE-CHECK";
    const result = await handler(unsignedEasyKashCallbackRequest({ customerReference: easyKashAttemptReference(waiting), easykashRef: callbackReference, status: "PAID" }));
    assert.equal(result.status, scenario === "amount" ? 409 : scenario === "network" ? 503 : 400, scenario);
    assert.equal((await f.service.getOrder(waiting.id)).status, "waiting_payment", scenario);
    assert.equal(purchases.length, 0, scenario);
  }
});

test("EasyKash callback maps provider statuses without treating refunds as paid", async () => {
  const f = await easyKashOrderFixture();
  const secret = "test-easykash-hmac-secret-long-enough";
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: secret,
    allowedPaymentMethods: ["Qassatly"], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return" });
  for (const [status, expected] of [["NEW", "waiting_payment"], ["PENDING", "waiting_payment"], ["PAID", "paid"],
    ["FAILED", "failed"], ["EXPIRED", "failed"], ["CANCELED", "failed"], ["REFUNDED", "failed"]]) {
    const signed = signEasyKashPayload(easyKashCallbackPayload(f.order, status), secret);
    assert.equal((await provider.handleCallback({ rawBody: JSON.stringify(signed), headers: {} })).status, expected);
  }
});

test("EasyKash callback correlates order and amount before one paid transition and side effects", async () => {
  const f = await easyKashOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
    transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
  const secret = "test-easykash-hmac-secret-long-enough";
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: secret,
    allowedPaymentMethods: ["Qassatly"], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return" });
  const notifications = [];
  const purchases = [];
  const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
    emitNotification: async (event) => notifications.push(event), emitMetaPurchase: async (event) => purchases.push(event) });
  assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, "PAID", { Amount: "1.00" }), secret))).status, 409);
  assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, "PAID", { customerReference: "forged-reference" }), secret))).status, 400);
  assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting), secret, null))).status, 401);
  assert.equal(purchases.length, 0);
  const pending = await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, "NEW"), secret));
  assert.equal((await pending.json()).pending, true);
  assert.equal((await f.service.getOrder(waiting.id)).status, "waiting_payment");
  const success = await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting), secret));
  assert.equal(success.status, 200);
  const paid = await f.service.getOrder(waiting.id);
  assert.equal(paid.status, "paid");
  assert.equal(paid.payment.transactionId, "EK-TEST-001");
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].booking.paymentMethod, "installments");
  assert.equal(notifications[0].eventType, "payment.approved");
  assert.deepEqual({
    originalPriceEgp: notifications[0].booking.originalPriceEgp,
    promoCode: notifications[0].booking.promoCode,
    discountAmountEgp: notifications[0].booking.discountAmountEgp,
    finalPriceEgp: notifications[0].booking.finalPriceEgp,
  }, { originalPriceEgp: 9000, promoCode: "TEST500", discountAmountEgp: 500, finalPriceEgp: 8500 });
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].eventId, metaPurchaseEventId(waiting.id));
  assert.equal(purchases[0].valueEgp, 1000);
  assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting), secret))).status, 200);
  assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, "REFUNDED"), secret))).status, 200);
  assert.equal((await f.service.getOrder(waiting.id)).status, "paid");
  assert.equal(notifications.length, 1);
  assert.equal(purchases.length, 1);
});

test("EasyKash callback rejects a reference that conflicts with a persisted provider transaction", async () => {
  const f = await easyKashOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
    transactionId: "EK-EXPECTED", redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
  const secret = "test-easykash-hmac-secret-long-enough";
  const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: secret,
    allowedPaymentMethods: ["Qassatly"], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return" });
  const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
    createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }) });
  const result = await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, "PAID", { easykashRef: "EK-OTHER" }), secret));
  assert.equal(result.status, 409);
  assert.equal((await result.json()).error, "payment_transaction_mismatch");
  assert.equal((await f.service.getOrder(waiting.id)).status, "waiting_payment");
});

for (const failedStatus of ["FAILED", "EXPIRED", "CANCELED"]) {
  test(`EasyKash ${failedStatus} becomes failed once and never emits Meta Purchase`, async () => {
    const f = await easyKashOrderFixture();
    const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
      transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
    const secret = "test-easykash-hmac-secret-long-enough";
    const provider = new EasyKashProvider({ apiKey: "test-easykash-api-key-long-enough", hmacSecret: secret,
      allowedPaymentMethods: ["Qassatly"], returnUrlForOrder: () => "https://academy.example/api/payments/easykash/return" });
    const notifications = [];
    const purchases = [];
    const handler = createEasyKashCallbackHandler({ createService: () => f.service, createProvider: () => provider,
      createCustomerRepository: () => ({ getByOrderId: async () => f.customerRecord }),
      emitNotification: async (event) => notifications.push(event), emitMetaPurchase: async (event) => purchases.push(event) });
    assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, failedStatus), secret))).status, 200);
    assert.equal((await f.service.getOrder(waiting.id)).status, "failed");
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].eventType, "payment.rejected");
    assert.equal(purchases.length, 0);
    assert.equal((await handler(easyKashCallbackRequest(easyKashCallbackPayload(waiting, failedStatus), secret))).status, 200);
    assert.equal(notifications.length, 1);
  });
}

test("Apps Script persists EasyKash waiting and paid state without changing the immutable snapshot", async () => {
  const f = await adminReviewFixture("installments");
  const snapshot = f.get("Order_Snapshot");
  const waiting = { ...f.order, updatedAt: "2026-10-04T12:05:00.000Z", status: "waiting_payment",
    payment: { ...f.order.payment, provider: "easykash", status: "waiting_payment", transactionId: null,
      redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" } };
  const payload = { contractVersion: 3, order: waiting,
    event: { orderId: waiting.id, previousStatus: "pending", status: "waiting_payment" }, audit: {},
    expectedStatus: "pending", bookingPaymentStatus: "Pending" };
  assert.equal(f.script.request("commit_booking_transition", payload).success, true);
  assert.equal(f.get("Payment_Provider"), "easykash");
  assert.equal(f.get("Provider_Transaction_ID"), "");
  assert.equal(f.get("Payment_Verification"), "Not Required");
  assert.equal(f.script.request("get_order", { orderId: waiting.id }).data.order.status, "waiting_payment");
  const paid = { ...waiting, updatedAt: "2026-10-04T12:06:00.000Z", status: "paid",
    payment: { ...waiting.payment, status: "paid", transactionId: "EK-TEST-001" } };
  const result = f.script.request("commit_booking_transition", { ...payload, order: paid,
    event: { orderId: paid.id, previousStatus: "waiting_payment", status: "paid" }, expectedStatus: "waiting_payment", bookingPaymentStatus: "Paid" });
  assert.equal(result.success, true);
  assert.equal(f.get("Payment_Status"), "Paid");
  assert.equal(f.get("Provider_Transaction_ID"), "EK-TEST-001");
  assert.equal(f.get("Order_Snapshot"), snapshot);
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows.length, 2);
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows[1][0], metaPurchaseEventId(paid.id));
});

test("EasyKash browser return is non-authoritative and existing provider flows remain isolated", () => {
  const returnRoute = fs.readFileSync(path.join(root, "app/api/payments/easykash/return/route.ts"), "utf8");
  assert.match(returnRoute, /status: 303/);
  assert.doesNotMatch(returnRoute, /transitionOrder|status:\s*["']paid|Purchase|fbq\(/);
  const callbackRoute = fs.readFileSync(path.join(root, "app/api/payments/easykash/callback/route.ts"), "utf8");
  assert.match(callbackRoute, /createEasyKashCallbackHandler/);
  const payTabsProvider = fs.readFileSync(path.join(root, "src/features/payments/server/paytabs-provider.ts"), "utf8");
  assert.match(payTabsProvider, /secure-egypt\.paytabs\.com/);
  assert.doesNotMatch(payTabsProvider, /easykash/i);
});

test("EasyKash status presentation is provider-specific in both locales", async () => {
  const f = await easyKashOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "easykash",
    transactionId: null, redirectUrl: "https://easykash.net/DirectPayV1/TEST-SESSION" });
  for (const locale of ["ar", "en"]) {
    const pending = bookingPresentation(waiting, locale);
    assert.match(pending.body + pending.next, /EasyKash/);
    const paid = { ...waiting, status: "paid", payment: { ...waiting.payment, status: "paid", transactionId: "EK-TEST-001" } };
    assert.match(bookingPresentation(paid, locale).body, /التقسيط|installment/i);
    const failed = { ...paid, status: "failed", payment: { ...paid.payment, status: "failed" } };
    assert.match(bookingPresentation(failed, locale).body, /التقسيط|installment/i);
  }
});

test("authoritative Group, Private and promo purchases use the fixed 1000 EGP tracking value", async () => {
  for (const input of [
    validInput({ paymentMethod: "card", promoCode: "TEST500", quotedFinalPriceEgp: 8500 }),
    privateInput({ paymentMethod: "card" }),
  ]) {
    const fixture = input.programType === "private" ? createFixture() : promoFixture();
    const created = await fixture.service.createOrder(input, {
      ...context,
      idempotencyKey: `meta-${input.programType ?? "group"}-purchase-0001`,
    });
    const waiting = await fixture.service.transitionOrder(created.order.id, {
      status: "waiting_payment", provider: "paytabs", transactionId: "META-TX-001",
      redirectUrl: "https://secure-egypt.paytabs.com/payment/page/META-TX-001",
    });
    const paid = await fixture.service.transitionOrder(waiting.id, {
      status: "paid", provider: "paytabs", transactionId: "META-TX-001",
    });
    const customerRecord = fixture.repository.bookings.get(paid.id).customer;
    const event = buildMetaPurchaseEvent(paid, customerRecord, 1000);
    assert.equal(event.valueEgp, 1000);
    assert.equal(event.currency, "EGP");
    assert.equal(event.programType, paid.programType);
    assert.equal(event.packageId, paid.packageSnapshot.packageId);
    assert.equal(paid.pricing.finalPrice, input.quotedFinalPriceEgp ?? input.quotedPriceEgp);
    assert.equal(paid.payment.amountMinor, paid.pricing.finalPrice * 100);
  }
});

test("Meta CAPI sends one server-only hashed Purchase with a stable event ID", async () => {
  const f = await payTabsOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "META-CAPI-TX", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/META-CAPI-TX" });
  const paid = await f.service.transitionOrder(waiting.id, { status: "paid", provider: "paytabs", transactionId: "META-CAPI-TX" });
  const event = buildMetaPurchaseEvent(paid, f.customerRecord, 1000);
  const requests = [];
  const client = new MetaCapiClient({ accessToken: "test-meta-token-not-a-real-secret", datasetId: "1234567890",
    siteUrl: "https://academy.example", trackingValueEgp: 1000, testEventCode: "TEST-CODE" }, async (url, options) => {
    requests.push({ url, options, payload: JSON.parse(options.body) });
    return Response.json({ events_received: 1 });
  });
  const result = await client.sendPurchase(event);
  assert.deepEqual(result, { outcome: "delivered", diagnosticCode: "accepted", httpStatus: 200 });
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /graph\.facebook\.com\/v26\.0\/1234567890\/events$/);
  assert.equal(requests[0].options.headers.Authorization, "Bearer test-meta-token-not-a-real-secret");
  const sent = requests[0].payload.data[0];
  assert.equal(sent.event_name, "Purchase");
  assert.equal(sent.event_id, metaPurchaseEventId(paid.id));
  assert.equal(sent.action_source, "website");
  assert.equal(sent.custom_data.value, 1000);
  assert.equal(sent.custom_data.currency, "EGP");
  assert.equal(sent.custom_data.package_id, paid.packageSnapshot.packageId);
  assert.equal(sent.custom_data.program_type, "group");
  assert.match(sent.user_data.em[0], /^[a-f0-9]{64}$/);
  assert.match(sent.user_data.ph[0], /^[a-f0-9]{64}$/);
  const serialized = JSON.stringify(requests[0].payload);
  assert.equal(serialized.includes(f.customerRecord.email), false);
  assert.equal(serialized.includes(f.customerRecord.phone), false);
  assert.equal(serialized.includes(String(paid.pricing.finalPrice)), false);
});

test("Meta delivery retries transient failures with the same event ID and never changes Paid", async () => {
  const f = await payTabsOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "META-RETRY-TX", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/META-RETRY-TX" });
  const paid = await f.service.transitionOrder(waiting.id, { status: "paid", provider: "paytabs", transactionId: "META-RETRY-TX" });
  const job = { eventId: metaPurchaseEventId(paid.id), orderId: paid.id, occurredAt: paid.updatedAt, attemptCount: 1, leaseId: "lease-1" };
  const completions = [];
  let sends = 0;
  const dependencies = {
    outbox: {
      reconcile: async () => 0,
      claim: async () => ({ ...job, attemptCount: sends + 1, leaseId: `lease-${sends + 1}` }),
      complete: async (completion) => completions.push(completion),
      requeue: async () => {},
    },
    service: f.service,
    customers: { getByOrderId: async () => f.customerRecord },
    trackingValueEgp: 1000,
    createClient: () => ({ sendPurchase: async (event) => {
      assert.equal(event.eventId, job.eventId);
      sends += 1;
      return sends === 1
        ? { outcome: "retryable", diagnosticCode: "http_503", httpStatus: 503 }
        : { outcome: "delivered", diagnosticCode: "accepted", httpStatus: 200 };
    } }),
  };
  assert.equal((await drainOne(dependencies, paid.id)).outcome, "retryable");
  assert.equal((await f.service.getOrder(paid.id)).status, "paid");
  assert.equal((await drainOne(dependencies, paid.id)).outcome, "delivered");
  assert.equal((await f.service.getOrder(paid.id)).status, "paid");
  assert.equal(sends, 2);
  assert.deepEqual(completions.map((item) => item.eventId), [job.eventId, job.eventId]);
});

test("manual approval records one deterministic outbox job and wakes delivery outside ScriptLock", async () => {
  const f = await adminReviewFixture("branch");
  f.script.properties.set("META_PURCHASE_DRAIN_URL", "https://academy.example/api/payments/meta/drain");
  f.script.properties.set("META_PURCHASE_DRAIN_SECRET", "test-meta-drain-secret-at-least-32-characters");
  f.script.edit(2, "Approved");
  assert.equal(f.get("Payment_Status"), "Paid");
  const outbox = f.script.sheets.get("Meta Purchase Outbox").rows;
  assert.equal(outbox.length, 2);
  assert.equal(outbox[1][f.script.headers["Meta Purchase Outbox"].indexOf("Event_ID")], metaPurchaseEventId(f.order.id));
  assert.equal(outbox[1][f.script.headers["Meta Purchase Outbox"].indexOf("Status")], "pending");
  const wake = f.script.notificationRequests().find((request) => request.url.includes("/api/payments/meta/drain"));
  assert.ok(wake);
  assert.equal(wake.lockDepth, 0);
  assert.equal(wake.headers["X-Success-Academy-Meta-Drain-Secret"], "test-meta-drain-secret-at-least-32-characters");
  assert.deepEqual(wake.payload, { orderId: f.order.id });
  f.script.edit(2, "Approved");
  assert.equal(outbox.length, 2);
});

test("provider Paid persists when the Meta outbox write fails and an order claim repairs it", async () => {
  const f = await adminReviewFixture("installments");
  const waiting = { ...f.order, updatedAt: "2026-10-04T12:05:00.000Z", status: "waiting_payment",
    payment: { ...f.order.payment, provider: "easykash", status: "waiting_payment", transactionId: null,
      redirectUrl: "https://easykash.net/DirectPayV1/TEST-FAIL-OPEN" } };
  const basePayload = { contractVersion: 3, order: waiting,
    event: { orderId: waiting.id, previousStatus: "pending", status: "waiting_payment" }, audit: {},
    expectedStatus: "pending", bookingPaymentStatus: "Pending" };
  assert.equal(f.script.request("commit_booking_transition", basePayload).success, true);
  f.script.failNextOutboxWrite();
  const paid = { ...waiting, updatedAt: "2026-10-04T12:06:00.000Z", status: "paid",
    payment: { ...waiting.payment, status: "paid", transactionId: "EK-FAIL-OPEN-001" } };
  const result = f.script.request("commit_booking_transition", { ...basePayload, order: paid,
    event: { orderId: paid.id, previousStatus: "waiting_payment", status: "paid" },
    expectedStatus: "waiting_payment", bookingPaymentStatus: "Paid" });
  assert.equal(result.success, true);
  assert.equal(f.get("Payment_Status"), "Paid");
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows.length, 1);
  assert.ok(f.script.diagnosticLogs().some((entry) => entry.scope === "meta_purchase_outbox"
    && entry.eventId === metaPurchaseEventId(paid.id) && entry.diagnosticCode === "outbox_write_failed"));
  f.script.setNow("2026-10-04T12:07:00.000Z");
  const repaired = f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: paid.id });
  assert.equal(repaired.success, true);
  assert.equal(repaired.data.job.eventId, metaPurchaseEventId(paid.id));
  assert.equal(f.get("Payment_Status"), "Paid");
});

test("manual Paid persists when the Meta outbox write fails and reconciliation repairs it", async () => {
  const f = await adminReviewFixture("branch");
  f.script.failNextOutboxWrite();
  f.script.edit(2, "Approved");
  assert.equal(f.get("Payment_Status"), "Paid");
  assert.equal(f.get("Payment_Verification"), "Approved");
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows.length, 1);
  const reconciled = f.script.request("reconcile_meta_purchase_jobs", { contractVersion: 3 });
  assert.equal(reconciled.success, true);
  assert.deepEqual(reconciled.data, { reconciled: true, created: 1 });
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows.length, 2);
  assert.equal(f.script.sheets.get("Meta Purchase Outbox").rows[1][0], metaPurchaseEventId(f.order.id));
  assert.equal(f.get("Payment_Status"), "Paid");
});

test("Apps Script outbox leases retries and marks one deterministic Purchase delivered", async () => {
  const f = await adminReviewFixture("branch");
  f.script.edit(2, "Approved");
  const first = f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id });
  assert.equal(first.success, true);
  assert.equal(first.data.job.eventId, metaPurchaseEventId(f.order.id));
  assert.equal(first.data.job.attemptCount, 1);
  const outboxHeaders = f.script.headers["Meta Purchase Outbox"];
  const outboxRow = f.script.sheets.get("Meta Purchase Outbox").rows[1];
  assert.equal(
    Date.parse(outboxRow[outboxHeaders.indexOf("Lease_Until")])
      - Date.parse(outboxRow[outboxHeaders.indexOf("Updated_At")]),
    5 * 60 * 1000,
  );
  assert.equal(f.script.request("requeue_meta_purchase_job", {
    contractVersion: 3, orderId: f.order.id,
  }).error, "invalid_meta_outbox");
  assert.equal(f.script.request("complete_meta_purchase_job", { contractVersion: 3,
    eventId: first.data.job.eventId, leaseId: first.data.job.leaseId,
    outcome: "retryable", diagnosticCode: "http_503" }).success, true);
  assert.equal(f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id }).data.job, null);
  f.script.advanceTime(60 * 1000);
  const second = f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id }).data.job;
  assert.equal(second.eventId, first.data.job.eventId);
  assert.equal(second.attemptCount, 2);
  assert.equal(f.script.request("complete_meta_purchase_job", { contractVersion: 3,
    eventId: second.eventId, leaseId: second.leaseId,
    outcome: "delivered", diagnosticCode: "accepted" }).success, true);
  assert.equal(f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id }).data.job, null);
  assert.equal(f.get("Payment_Status"), "Paid");
});

test("Meta manual requeue cannot steal an active lease and only revives permanent failures", async () => {
  const f = await adminReviewFixture("branch");
  f.script.edit(2, "Approved");
  const claimed = f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id }).data.job;
  assert.equal(f.script.request("requeue_meta_purchase_job", {
    contractVersion: 3, orderId: f.order.id,
  }).error, "invalid_meta_outbox");
  assert.equal(f.script.request("complete_meta_purchase_job", {
    contractVersion: 3, eventId: claimed.eventId, leaseId: claimed.leaseId,
    outcome: "permanent", diagnosticCode: "http_400",
  }).success, true);
  assert.equal(f.script.request("requeue_meta_purchase_job", {
    contractVersion: 3, orderId: f.order.id,
  }).success, true);
  const retried = f.script.request("claim_meta_purchase_job", { contractVersion: 3, orderId: f.order.id }).data.job;
  assert.equal(retried.eventId, claimed.eventId);
  assert.equal(retried.attemptCount, 2);
});

test("Meta configuration is server-only, fixed at 1000 and fails safely when invalid", () => {
  assert.throws(() => readMetaCapiConfig({
    META_CAPI_ACCESS_TOKEN: "", META_CAPI_DATASET_ID: "1234567890",
    NEXT_PUBLIC_SITE_URL: "https://academy.example", META_PURCHASE_VALUE_EGP: "1000",
  }), /meta_capi_configuration_invalid/);
  assert.throws(() => readMetaCapiConfig({
    META_CAPI_ACCESS_TOKEN: "token", META_CAPI_DATASET_ID: "1234567890",
    NEXT_PUBLIC_SITE_URL: "https://academy.example", META_PURCHASE_VALUE_EGP: "8500",
  }), /meta_capi_configuration_invalid/);
  const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  for (const name of ["META_CAPI_ACCESS_TOKEN", "META_CAPI_DATASET_ID", "META_PURCHASE_VALUE_EGP", "META_CAPI_DRAIN_SECRET"]) {
    assert.match(env, new RegExp(`^${name}=`, "m"));
  }
  const clientSources = [
    "src/features/payments/server/meta-capi.ts",
    "src/features/payments/server/meta-purchase-delivery.ts",
    "app/api/payments/meta/drain/route.ts",
  ].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  assert.doesNotMatch(clientSources, /NEXT_PUBLIC_META_CAPI|NEXT_PUBLIC_META_PURCHASE/);
});

test("invalid Meta configuration leaves payment Paid and the conversion retryable", async () => {
  const f = await payTabsOrderFixture();
  const waiting = await f.service.transitionOrder(f.order.id, { status: "waiting_payment", provider: "paytabs",
    transactionId: "META-CONFIG-TX", redirectUrl: "https://secure-egypt.paytabs.com/payment/page/META-CONFIG-TX" });
  const paid = await f.service.transitionOrder(waiting.id, { status: "paid", provider: "paytabs", transactionId: "META-CONFIG-TX" });
  const completions = [];
  const result = await drainOne({
    outbox: {
      reconcile: async () => 0,
      claim: async () => ({ eventId: metaPurchaseEventId(paid.id), orderId: paid.id,
        occurredAt: paid.updatedAt, attemptCount: 1, leaseId: "config-lease" }),
      complete: async (completion) => completions.push(completion),
      requeue: async () => {},
    },
    service: f.service,
    customers: { getByOrderId: async () => f.customerRecord },
    trackingValueEgp: 1000,
    createClient: () => { throw new (require(path.join(root, "src/features/payments/server/meta-capi.ts")).MetaCapiConfigurationError)(); },
  }, paid.id);
  assert.equal(result.outcome, "retryable");
  assert.equal(result.diagnosticCode, "configuration_invalid");
  assert.equal(completions[0].outcome, "retryable");
  assert.equal((await f.service.getOrder(paid.id)).status, "paid");
});

test("installment checkout uses EasyKash hosted methods without local option IDs", () => {
  const checkout = fs.readFileSync(path.join(root, "src/features/payments/components/payment-checkout.tsx"), "utf8");
  const factory = fs.readFileSync(path.join(root, "src/features/payments/server/easykash-factory.ts"), "utf8");
  const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(checkout, /method === "card" \|\| method === "installments"/);
  assert.match(checkout, /method === "card" \? "paytabs" : "easykash"/);
  assert.match(checkout, /isEasyKashRedirect/);
  assert.doesNotMatch(factory, /EASYKASH_INSTALLMENT_PAYMENT_OPTIONS|paymentOptions/);
  assert.match(factory, /process\.env\.EASYKASH_INSTALLMENT_PAYMENT_METHODS/);
  for (const name of ["EASYKASH_API_KEY", "EASYKASH_HMAC_SECRET", "EASYKASH_BASE_URL"]) {
    assert.match(env, new RegExp(`^${name}=`, "m"));
    assert.doesNotMatch(checkout, new RegExp(name));
  }
  assert.doesNotMatch(env, /^EASYKASH_INSTALLMENT_PAYMENT_OPTIONS=/m);
  assert.doesNotMatch(env, /^EASYKASH_(?:API_KEY|HMAC_SECRET)=.+$/m);
});

(async () => {
  let passed = 0;
  for (const { name, run } of tests) {
    try {
      await run();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      console.error(`FAIL ${name}`);
      throw error;
    }
  }
  console.log(`\n${passed}/${tests.length} payment foundation tests passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
