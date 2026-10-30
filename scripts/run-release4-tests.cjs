const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

function loadTracking() {
  const source = read("src/lib/tracking.ts");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = { dataLayer: [], fbq: [], tiktok: [] };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    window: {
      dataLayer: calls.dataLayer,
      fbq: (...args) => calls.fbq.push(args),
      ttq: { track: (...args) => calls.tiktok.push(args), page: () => undefined },
    },
    Object,
    Set,
  });
  return { tracking: module.exports, calls };
}

function versionAtLeast(actual, minimum) {
  const a = actual.split(".").map(Number);
  const b = minimum.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) > (b[index] ?? 0);
  }
  return true;
}

test("funnel payload allowlist strips every customer and secret field", () => {
  const { tracking } = loadTracking();
  const safe = tracking.safeFunnelPayload({
    locale: "ar", source: "plans", programType: "group", packageId: "excellence-120",
    name: "Test", email: "test@example.com", phone: "01000000000", whatsapp: "01000000000",
    notes: "private", age: 30, accessToken: "secret", orderSecret: "secret", paymentProof: "proof",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(safe)), {
    locale: "ar", source: "plans", programType: "group", packageId: "excellence-120",
  });
});

test("canonical funnel event reaches existing analytics sinks without standard Lead or Purchase", () => {
  const { tracking, calls } = loadTracking();
  tracking.trackFunnelEvent("plans_view", { locale: "en", source: "plans" });
  assert.equal(calls.dataLayer[0].event, "plans_view");
  assert.deepEqual(calls.fbq[0].slice(0, 2), ["trackCustom", "plans_view"]);
  assert.equal(calls.tiktok[0][0], "plans_view");
  assert.doesNotMatch(JSON.stringify(calls), /Purchase|Lead/);
});

test("Plans View is guarded to fire once and preserves placement-result attribution", () => {
  const source = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(source, /plansViewTrackedRef\.current/);
  assert.match(source, /trackFunnelEvent\("plans_view"/);
  assert.match(source, /fromAssessment \? "placement_result" : "plans"/);
});

test("program selection distinguishes Group and Private without tracking no-op clicks", () => {
  const source = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(source, /if \(value === programType\) return/);
  assert.match(source, /trackFunnelEvent\("program_select"/);
  assert.match(source, /programType: value/);
});

test("each intentional package CTA emits one package_select event", () => {
  const source = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(source, /trackFunnelEvent\("package_select"/);
  assert.match(source, /plans_recommendation/);
  assert.match(source, /plans_package_grid/);
  assert.match(source, /plans_sticky/);
});

test("payment view, method selection and initiation map to distinct canonical events", () => {
  const source = read("src/features/payments/tracking.ts");
  for (const event of ["payment_view", "payment_method_select", "payment_initiated"]) {
    assert.match(source, new RegExp(`trackFunnelEvent\\(\"${event}\"`));
  }
  assert.doesNotMatch(source, /Purchase|Paid/);
});

test("payment analytics contain only operational dimensions and never enrollment data", () => {
  const source = `${read("src/features/payments/tracking.ts")}\n${read("src/features/payments/components/payment-checkout.tsx")}`;
  assert.match(source, /locale/);
  assert.match(source, /programType/);
  assert.match(source, /packageId/);
  assert.match(source, /paymentMethod/);
  const trackingModule = read("src/features/payments/tracking.ts");
  assert.doesNotMatch(trackingModule, /fullName|email|phone|whatsapp|notes|accessToken|proof/);
});

test("Placement Result to Plans keeps its corrected result_to_plans source", () => {
  const source = read("src/features/placement-test/components/placement-assessment.tsx");
  assert.match(source, /ctaType: "result_to_plans"/);
  assert.match(source, /source=placement_result/);
});

test("Meta Lead deduplication remains the existing event-ID implementation", () => {
  const tracking = read("src/lib/tracking.ts");
  const leadApi = read("app/api/leads/route.ts");
  const metaLeadCapi = read("src/features/leads/server/meta-lead-capi.ts");
  assert.match(tracking, /fbq\?\.\("track", "Lead", payload, \{ eventID: options\.metaEventId \}\)/);
  assert.match(leadApi, /metaLeadEventId\(String\(body\.submissionId\)\)/);
  assert.match(metaLeadCapi, /return `lead:\$\{submissionId\.toLowerCase\(\)\}`/);
  assert.match(metaLeadCapi, /event_id: metaLeadEventId\(input\.submissionId\)/);
});

test("browser payment and return surfaces still cannot emit Purchase", () => {
  const sources = [
    "src/features/payments/components/payment-checkout.tsx",
    "src/features/payments/components/payment-success.tsx",
    "app/api/payments/paytabs/return/route.ts",
    "app/api/payments/easykash/return/route.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(sources, /fbq\([^\n]*Purchase|trackFunnelEvent\("Purchase"/);
});

test("Hero LCP image uses Next Image with intrinsic dimensions, priority and sizes", () => {
  const source = read("src/components/landing/hero-section.tsx");
  assert.match(source, /import Image from "next\/image"/);
  assert.match(source, /width=\{930\}/);
  assert.match(source, /height=\{1024\}/);
  assert.match(source, /priority/);
  assert.match(source, /sizes=/);
  assert.doesNotMatch(source, /<img\s/);
});

test("Wistia player and media scripts load only near the testimonial section", () => {
  const source = read("src/components/landing/testimonials-section.tsx");
  assert.match(source, /rootMargin: "700px 0px"/);
  assert.match(source, /shouldLoadWistia \? <>/);
  assert.match(source, /shouldLoadWistia \? createElement\("wistia-player"/);
  assert.match(source, /\[shouldLoadWistia\]/);
});

test("framework runtime versions remain pinned to the approved baseline", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.dependencies.next, "16.4.3");
  assert.equal(packageJson.dependencies.react, "19.2.7");
  assert.equal(packageJson.dependencies["react-dom"], "19.2.7");
  assert.equal(packageJson.devDependencies["eslint-config-next"], "16.4.3");
});

test("transitive advisory fixes remain at or above the patched versions", () => {
  const lock = JSON.parse(read("package-lock.json"));
  const expected = [
    ["node_modules/baseline-browser-mapping", "2.11.0"],
    ["node_modules/brace-expansion", "1.1.21"],
    ["node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion", "5.0.12"],
    ["node_modules/browserslist", "4.28.7"],
    ["node_modules/js-yaml", "4.3.2"],
    ["node_modules/source-map-js", "1.2.2"],
    ["node_modules/zod", "4.6.6"],
  ];
  for (const [key, minimum] of expected) {
    assert.ok(lock.packages[key], `${key} missing`);
    assert.ok(versionAtLeast(lock.packages[key].version, minimum), `${key} remains below ${minimum}`);
  }
});

test("Group and Private package prices remain unchanged", () => {
  const source = read("src/features/plans/config.ts");
  for (const price of [2250, 4500, 6750, 9000, 5000, 10000, 15000, 20000]) {
    assert.match(source, new RegExp(`priceEgp: ${price}(?:,| )`));
  }
});

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`PASS ${name}`); passed += 1; }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`\n${passed}/${tests.length} Release 4 tests passed.`);
