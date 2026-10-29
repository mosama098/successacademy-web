const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("Arabic homepage metadata targets Live Online English without Dokki", () => {
  const source = read("app/[locale]/page.tsx");
  assert.match(source, /كورس إنجليزي أونلاين Live/);
  assert.doesNotMatch(source, /الدقي|Dokki/);
});

test("English homepage metadata targets a Live Online English Course", () => {
  assert.match(read("app/[locale]/page.tsx"), /Live Online English Course & Free Placement Test/);
});

test("Corporate metadata and copy preserve Online, client-premises on-site and hybrid", () => {
  const page = read("app/[locale]/business/page.tsx");
  const copy = read("src/content/site-pages.ts");
  assert.match(page, /Online, On-site & Hybrid/);
  assert.match(copy, /on-site at your premises, or hybrid/);
  assert.match(copy, /داخل مقر الشركة أو Hybrid/);
  assert.doesNotMatch(`${page}\n${copy}`, /Dokki|الدقي/);
});

test("Corporate API still accepts all three customer-selected delivery modes", () => {
  const route = read("app/api/leads/route.ts");
  assert.match(route, /new Set\(\["online", "on_site", "hybrid"\]\)/);
  assert.match(read("src/components/business/corporate-lead-form.tsx"), /preferredTrainingMode/);
});

test("B2C public copy has no Dokki attendance proposition", () => {
  const publicCopy = ["src/content/ar.ts", "src/content/en.ts", "src/components/landing/online-learning-section.tsx", "src/features/plans/components/recommended-plan-page.tsx"].map(read).join("\n");
  assert.doesNotMatch(publicCopy, /Dokki|الدقي|Online & Dokki|أونلاين أو حضوري/);
});

test("AR and EN FAQs distinguish real-time Live teaching from the recording", () => {
  assert.match(read("src/content/ar.ts"), /مش كورس مسجل مسبقًا/);
  assert.match(read("src/content/en.ts"), /not a prerecorded course/);
});

test("Group 7–10, Private 1:1 and schedule-after-payment remain explicit", () => {
  const copy = `${read("src/content/ar.ts")}\n${read("src/content/en.ts")}`;
  assert.match(copy, /7–10/);
  assert.match(copy, /Private 1:1/);
  assert.match(copy, /After payment is confirmed/);
});

test("localized root layout renders server-owned html lang and direction", () => {
  const source = read("app/[locale]/layout.tsx");
  assert.match(source, /<html lang=\{currentLocale\} dir=\{localeDirection\[currentLocale\]\}/);
  assert.doesNotMatch(source, /document\.documentElement|useEffect/);
});

test("canonical and language alternates use the configured site URL", () => {
  const helper = read("src/lib/page-metadata.ts");
  assert.match(helper, /NEXT_PUBLIC_SITE_URL/);
  assert.match(helper, /languages/);
  assert.match(helper, /"x-default"/);
  assert.match(helper, /alternateLocale/);
});

test("Open Graph and Twitter metadata include localized social fields", () => {
  const helper = read("src/lib/page-metadata.ts");
  assert.match(helper, /siteName: "Success Academy"/);
  assert.match(helper, /alternateLocale:/);
  assert.match(helper, /twitter:/);
});

test("payment, success, assessment and legacy checkout remain non-indexable", () => {
  assert.match(read("app/[locale]/plans/payment/page.tsx"), /index: false/);
  assert.match(read("app/[locale]/plans/payment/success/page.tsx"), /index: false/);
  assert.match(read("app/[locale]/placement-test/assessment/page.tsx"), /index: false/);
  assert.match(read("app/[locale]/plans/checkout/page.tsx"), /index: false/);
});

test("structured data is truthful and contains no rating, review or address", () => {
  const source = read("src/components/seo/homepage-structured-data.tsx");
  assert.match(source, /EducationalOrganization/);
  assert.match(source, /"@type": "Course"/);
  assert.doesNotMatch(source, /aggregateRating|reviewCount|postalAddress|streetAddress|LocalBusiness/);
});

test("sitemap includes public localized routes and excludes private/payment/API routes", () => {
  const source = read("app/sitemap.ts");
  assert.match(source, /placement-test/);
  assert.match(source, /business/);
  assert.doesNotMatch(source, /plans\/payment|plans\/checkout|thank-you|\/api\//);
});

test("robots explicitly protects private and transactional routes", () => {
  const source = read("app/robots.ts");
  for (const route of ["/api/", "/ar/plans/checkout", "/en/plans/payment", "/ar/placement-test/assessment", "/en/thank-you"]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("Release 2 direct Plans to Payment behavior remains intact", () => {
  const plans = read("src/features/plans/components/recommended-plan-page.tsx");
  const checkout = read("app/[locale]/plans/checkout/page.tsx");
  assert.match(plans, /plans\/payment\?/);
  assert.match(checkout, /redirect\(`\/\$\{currentLocale\}\/plans\/payment\?/);
});

let passed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`PASS ${name}`); passed += 1; }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
console.log(`\n${passed}/${tests.length} Release 3 tests passed.`);
