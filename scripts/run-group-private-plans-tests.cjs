const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalLoad = Module._load;
Module._load = function groupPrivateLoad(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  allLearningPackages,
  getLearningPackage,
  getLearningPackages,
  getPlanRecommendation,
  learningPackages,
  privateLearningPackages,
  resolveProgramType,
} = require(path.join(root, "src/features/plans/config.ts"));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tests = [];
const test = (name, run) => tests.push({ name, run });

test("missing program type preserves Group as the backward-compatible default", () => {
  assert.equal(resolveProgramType(undefined), "group");
  assert.equal(resolveProgramType(""), "group");
  assert.equal(getPlanRecommendation("A1", "B2").package.id, "excellence-120");
});

test("the four Group packages use full catalog prices without built-in discounts", () => {
  assert.deepEqual(learningPackages.map(({ id, hours, sessions, sessionDurationHours, priceEgp, regularPriceEgp, savingEgp }) =>
    ({ id, hours, sessions, sessionDurationHours, priceEgp, regularPriceEgp, savingEgp })), [
    { id: "starter-30", hours: 30, sessions: 10, sessionDurationHours: 3, priceEgp: 2250, regularPriceEgp: null, savingEgp: 0 },
    { id: "progress-60", hours: 60, sessions: 20, sessionDurationHours: 3, priceEgp: 4500, regularPriceEgp: null, savingEgp: 0 },
    { id: "proficiency-90", hours: 90, sessions: 30, sessionDurationHours: 3, priceEgp: 6750, regularPriceEgp: null, savingEgp: 0 },
    { id: "excellence-120", hours: 120, sessions: 40, sessionDurationHours: 3, priceEgp: 9000, regularPriceEgp: null, savingEgp: 0 },
  ]);
});

test("the four Private 1:1 packages use full catalog prices without built-in discounts", () => {
  assert.deepEqual(privateLearningPackages.map(({ id, hours, sessions, sessionDurationHours, priceEgp, regularPriceEgp, savingEgp }) =>
    ({ id, hours, sessions, sessionDurationHours, priceEgp, regularPriceEgp, savingEgp })), [
    { id: "private-starter-15", hours: 15, sessions: 10, sessionDurationHours: 1.5, priceEgp: 5000, regularPriceEgp: null, savingEgp: 0 },
    { id: "private-progress-30", hours: 30, sessions: 20, sessionDurationHours: 1.5, priceEgp: 10000, regularPriceEgp: null, savingEgp: 0 },
    { id: "private-proficiency-45", hours: 45, sessions: 30, sessionDurationHours: 1.5, priceEgp: 15000, regularPriceEgp: null, savingEgp: 0 },
    { id: "private-excellence-60", hours: 60, sessions: 40, sessionDurationHours: 1.5, priceEgp: 20000, regularPriceEgp: null, savingEgp: 0 },
  ]);
});

test("Plans and checkout do not render package-level crossed prices or savings", () => {
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  const checkout = read("src/features/plans/components/checkout-foundation.tsx");
  assert.doesNotMatch(plans, /regularPriceEgp|savingEgp/);
  assert.doesNotMatch(checkout, /regularPriceEgp|savingEgp/);
});

test("program families have unique IDs and matching localized names", () => {
  assert.equal(new Set(allLearningPackages.map((item) => item.id)).size, 8);
  assert.deepEqual(privateLearningPackages.map((item) => item.name), learningPackages.map((item) => item.name));
  assert.equal(getLearningPackages("group").length, 4);
  assert.equal(getLearningPackages("private").length, 4);
});

test("recommendations preserve level logic while selecting the chosen program family", () => {
  const group = getPlanRecommendation("group", "A2", "B2");
  const privatePlan = getPlanRecommendation("private", "A2", "B2");
  assert.deepEqual(group.levelsToStudy, ["A2", "B1", "B2"]);
  assert.deepEqual(privatePlan.levelsToStudy, group.levelsToStudy);
  assert.equal(group.package.id, "proficiency-90");
  assert.equal(group.package.priceEgp, 6750);
  assert.equal(privatePlan.package.id, "private-proficiency-45");
  assert.equal(privatePlan.package.priceEgp, 15000);
  assert.equal(privatePlan.requiredHours, 45);
});

test("Group and Private recommendation matrices select exact family packages", () => {
  const group = [
    ["A1", "A1", "starter-30"], ["A1", "A2", "progress-60"],
    ["A1", "B1", "proficiency-90"], ["A1", "B2", "excellence-120"],
  ];
  const privatePlans = [
    ["A1", "A1", "private-starter-15"], ["A1", "A2", "private-progress-30"],
    ["A1", "B1", "private-proficiency-45"], ["A1", "B2", "private-excellence-60"],
    ["A2", "B2", "private-proficiency-45"], ["B1", "B2", "private-progress-30"],
    ["B2", "B2", "private-starter-15"],
  ];
  for (const [start, target, packageId] of group) assert.equal(getPlanRecommendation("group", start, target).package.id, packageId);
  for (const [start, target, packageId] of privatePlans) assert.equal(getPlanRecommendation("private", start, target).package.id, packageId);
});

test("a package cannot cross program families", () => {
  assert.equal(getLearningPackage("private-excellence-60").programType, "private");
  assert.equal(getPlanRecommendation("group", "A1", "B2").package.id, "excellence-120");
  assert.equal(getPlanRecommendation("private", "A1", "B2").package.id, "private-excellence-60");
});

test("Plans links carry explicit program context while legacy links still default to Group", () => {
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  const checkout = read("app/[locale]/plans/checkout/page.tsx");
  const payment = read("src/features/payments/components/payment-checkout.tsx");
  assert.match(plans, /program: recommendation\.programType/);
  assert.match(checkout, /resolveProgramType\(query\.program\)/);
  assert.match(payment, /programType: recommendation\.programType/);
  assert.match(payment, /planCopy\.program\.sessionDuration/);
  assert.match(read("src/features/plans/components/checkout-foundation.tsx"), /copy\.program\.options\[recommendation\.programType\]/);
});

test("the placement start remains locked independently of program switching", () => {
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  assert.match(plans, /if \(fromAssessment\) return/);
  assert.match(plans, /setProgramType\(value\)/);
  assert.doesNotMatch(plans, /chooseProgramType[\s\S]{0,240}setStartLevel/);
});

test("order snapshots store explicit program type while booking rows retain the 30-column contract", () => {
  const types = read("src/features/payments/types.ts");
  const sheet = read("src/features/payments/server/sheets-schema.ts");
  const booking = read("src/features/payments/server/booking-sheet.ts");
  assert.match(types, /programType: ProgramType/);
  assert.match(types, /sessionDurationHours: 1\.5 \| 3/);
  assert.doesNotMatch(sheet, /Program_Type/);
  assert.doesNotMatch(booking, /Program_Type/);
  assert.match(booking, /Order_Snapshot: JSON\.stringify\(order\)/);
  const { paymentSheetColumns } = require(path.join(root, "src/features/payments/server/sheets-schema.ts"));
  assert.equal(paymentSheetColumns.Bookings.length, 30);
  assert.equal(paymentSheetColumns.Bookings.at(-1), "Payment_Updated_At");
});

test("local Apps Script uses 30 booking fields and normalizes historical Group snapshots", () => {
  const script = read("scripts/google-apps-script/payment-bookings-webhook.gs");
  assert.match(script, /"Payment_Redirect_URL", "Payment_Updated_At"/);
  assert.doesNotMatch(script, /Program_Type/);
  assert.match(script, /if \(!order\.programType\) order\.programType = "group"/);
  assert.match(script, /order\.programType !== orderSnapshot\.programType/);
  assert.match(script, /sessionDurationHours/);
});

test("the bilingual selector and package grid retain mobile-through-desktop guards", () => {
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  const copy = read("src/features/plans/copy.ts");
  assert.match(copy, /اختار نوع البرنامج/);
  assert.match(copy, /Choose Your Program/);
  assert.match(copy, /برايفت 1:1/);
  assert.match(copy, /Private 1:1/);
  assert.match(plans, /relative overflow-hidden/);
  assert.match(plans, /grid grid-cols-2 gap-2/);
  assert.match(plans, /md:hidden/);
  assert.match(plans, /hidden grid-cols-2 items-stretch gap-4 md:grid xl:grid-cols-4/);
  assert.match(plans, /sm:grid-cols-4/);
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
  console.log(`\n${passed}/${tests.length} Group/Private Plans tests passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
