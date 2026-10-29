const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

function loadPrefillModule(storage) {
  const source = read("src/features/customers/client/checkout-contact-prefill.ts");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const normalizeEgyptianMobile = (value) => {
    const digits = String(value).replace(/\D/g, "");
    const local = digits.startsWith("20") ? digits.slice(2) : digits;
    return /^01[0125]\d{8}$/.test(local) ? `+2${local}` : null;
  };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id === "@/lib/phone") return { normalizeEgyptianMobile };
      throw new Error(`Unexpected import: ${id}`);
    },
    window: { sessionStorage: storage },
    Date,
    JSON,
    Object,
    Number,
    RegExp,
  });
  return module.exports;
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

test("contact prefill stores only validated name, phone and email for this session", () => {
  const storage = memoryStorage();
  const helper = loadPrefillModule(storage);
  helper.writeCheckoutContactPrefill({ name: "  Test Learner  ", phone: "01000000000", email: "TEST@example.com" });
  const raw = JSON.parse(storage.values.get("sa_checkout_contact_v1"));
  assert.deepEqual(JSON.parse(JSON.stringify(raw.contact)), { name: "Test Learner", phone: "+201000000000", email: "test@example.com" });
  assert.deepEqual(Object.keys(raw.contact).sort(), ["email", "name", "phone"]);
  assert.equal(raw.version, 1);
});

test("contact prefill ignores malformed and stale session data", () => {
  const storage = memoryStorage();
  const helper = loadPrefillModule(storage);
  storage.setItem("sa_checkout_contact_v1", JSON.stringify({ version: 1, savedAt: Date.now(), contact: { name: "X", phone: "bad", email: "bad" } }));
  assert.equal(helper.readCheckoutContactPrefill(), null);
  storage.setItem("sa_checkout_contact_v1", JSON.stringify({ version: 1, savedAt: Date.now() - 9 * 60 * 60 * 1000, contact: { name: "Test Learner", phone: "01000000000", email: "" } }));
  assert.equal(helper.readCheckoutContactPrefill(), null);
  assert.equal(storage.getItem("sa_checkout_contact_v1"), null);
});

test("storage failures cannot block lead or payment journeys", () => {
  const helper = loadPrefillModule({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } });
  assert.doesNotThrow(() => helper.writeCheckoutContactPrefill({ name: "Test Learner", phone: "01000000000", email: "" }));
  assert.equal(helper.readCheckoutContactPrefill(), null);
  assert.doesNotThrow(() => helper.clearCheckoutContactPrefill());
});

test("Homepage, Placement and Plans Gate write prefill only after confirmed success", () => {
  for (const file of [
    "src/components/form/lead-form.tsx",
    "src/features/placement-test/components/placement-registration.tsx",
    "src/features/plans/components/plans-lead-gate.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /writeCheckoutContactPrefill/);
    assert.ok(source.lastIndexOf("writeCheckoutContactPrefill") > source.indexOf('result.kind !== "success"'));
  }
});

test("Payment reads session prefill into editable fields and defaults WhatsApp to mobile", () => {
  const source = read("src/features/payments/components/payment-checkout.tsx");
  assert.match(source, /readCheckoutContactPrefill\(\)/);
  assert.match(source, /whatsapp: prefill\.phone/);
  assert.match(source, /onChange=\{\(field, value\).*setContact/s);
});

test("prefill never stores age, notes, payment, proof, consent or access data", () => {
  const source = read("src/features/customers/client/checkout-contact-prefill.ts");
  assert.doesNotMatch(source, /\bage\b|\bnotes\b|paymentMethod|proof|consent|accessToken|orderAccess/);
});

test("Plans Group and Private package links go directly to Payment without PII", () => {
  const source = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(source, /plans\/payment\?\$\{query\.toString\(\)\}/);
  assert.doesNotMatch(source, /plans\/checkout\?\$\{query\.toString\(\)\}/);
  assert.doesNotMatch(source, /fullName|phone|email/);
});

test("legacy valid Checkout links redirect to Payment while invalid links fail safely", () => {
  const source = read("app/[locale]/plans/checkout/page.tsx");
  assert.match(source, /if \(validRecommendation\)[\s\S]*redirect\(`\/\$\{currentLocale\}\/plans\/payment\?/);
  assert.match(source, /recommendation=\{null\}/);
  assert.match(source, /startMatchesContext/);
});

test("Payment is the complete final checkout and back navigation returns to Plans", () => {
  const source = read("src/features/payments/components/payment-checkout.tsx");
  for (const value of ["programType", "requiredLevels", "startLevel", "targetLevel", "requiredHours", "package.sessions", "finalPrice"]) assert.match(source, new RegExp(value.replace(".", "\\.")));
  assert.match(source, /const reviewHref = `\/\$\{locale\}\/plans`/);
  assert.doesNotMatch(source, /const reviewHref = `\/\$\{locale\}\/plans\/checkout/);
});

test("electronic payment and manual transfer CTAs remain truthful", () => {
  const copy = read("src/features/payments/copy.ts");
  const checkout = read("src/features/payments/components/payment-checkout.tsx");
  assert.match(copy, /انتقل إلى الدفع الآمن/);
  assert.match(copy, /Continue to Secure Payment/);
  assert.match(copy, /تأكيد التحويل وإرسال الإثبات/);
  assert.match(copy, /Confirm Transfer & Submit Proof/);
  assert.match(checkout, /copy\.actions\.electronic/);
  assert.match(checkout, /copy\.actions\.manual/);
});

test("payment trust and post-confirmation scheduling copy is bilingual and provider-accurate", () => {
  const source = read("src/features/payments/copy.ts");
  assert.match(source, /دفع إلكتروني آمن/);
  assert.match(source, /Success Academy لا تخزن بيانات بطاقتك/);
  assert.match(source, /Secure electronic payment/);
  assert.match(source, /Success Academy does not store your card details/);
  assert.match(source, /suitable available schedule/);
  assert.match(source, /Success Manager/);
});

test("success presentation is truthful for paid, pending, proof review, failed and cancelled states", () => {
  const source = read("src/features/payments/success-presentation.ts");
  assert.match(source, /order\.status === "paid" && order\.payment\.status === "paid"/);
  assert.match(source, /order\.status === "cancelled" \|\| order\.payment\.status === "cancelled"/);
  assert.match(source, /cardPendingNext/);
  assert.match(source, /proofNext/);
  assert.match(source, /rejectedNext/);
  assert.match(source, /paidSteps/);
});

test("the paid journey appears only for authoritative paid presentation", () => {
  const source = read("src/features/payments/components/payment-success.tsx");
  assert.match(source, /presentation\.state === "paid" \? <ol data-paid-journey/);
});

test("Placement Result to Plans uses explicit result semantics without duplicate events", () => {
  const source = read("src/features/placement-test/components/placement-assessment.tsx");
  assert.match(source, /source=placement_result/);
  assert.match(source, /trackSalesCta\("result_to_plans"\)/);
  assert.doesNotMatch(source, /trackSalesCta\("homepage"\)/);
});

test("analytics payloads and URLs contain no remembered customer PII", () => {
  const tracking = read("src/features/payments/tracking.ts");
  assert.doesNotMatch(tracking, /name: string|phone|email|customer/);
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(plans, /new URLSearchParams\(\{ program: recommendation\.programType, start: recommendation\.startLevel, target: recommendation\.targetLevel, package: recommendation\.package\.id \}\)/);
});

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`PASS ${name}`); passed += 1; }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`\n${passed}/${tests.length} commercial funnel tests passed.`);
