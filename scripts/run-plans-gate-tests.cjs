const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalLoad = require("node:module")._load;
require("node:module")._load = function plansGateLoad(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request.startsWith("@/")) {
    const base = path.join(root, "src", request.slice(2));
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")]
      .find((candidate) => fs.existsSync(candidate));
    if (resolved) return originalLoad.call(this, resolved, parent, isMain);
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

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const { resolvePlansAccess } = require(path.join(
  root,
  "src/features/plans/server/plans-access-policy.ts",
));
const { isAllowedBrowserRequest } = require(path.join(
  root,
  "src/features/leads/server/request-origin.ts",
));

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("a fresh visitor remains unregistered", () => {
  assert.deepEqual(resolvePlansAccess(false, null), {
    registered: false,
    placementContext: null,
  });
});

test("the generic acknowledgement unlocks normal Plans without a level lock", () => {
  assert.deepEqual(resolvePlansAccess(true, null), {
    registered: true,
    placementContext: null,
  });
});

test("a legacy registered placement attempt unlocks Plans without inventing a result", () => {
  const result = resolvePlansAccess(false, { leadReference: "lead-1", finalProfile: null });
  assert.equal(result.registered, true);
  assert.equal(result.placementContext, null);
});

test("a completed placement keeps the authoritative locked starting level", () => {
  const result = resolvePlansAccess(false, {
    leadReference: "lead-1",
    finalProfile: { placement: "B1" },
  });
  assert.equal(result.registered, true);
  assert.deepEqual(result.placementContext, { startLevel: "B1", hasLeadReference: true });
});

test("the acknowledgement cookie is versioned, non-PII, HttpOnly, Lax, and 30 days", () => {
  const cookie = read("src/features/leads/server/registration-cookie.ts");
  assert.match(cookie, /LEAD_REGISTRATION_COOKIE = "sa_lead_registered"/);
  assert.match(cookie, /LEAD_REGISTRATION_COOKIE_VALUE = "v1"/);
  assert.match(cookie, /30 \* 24 \* 60 \* 60/);
  assert.match(cookie, /httpOnly: true/);
  assert.match(cookie, /sameSite: "lax"/);
  assert.match(cookie, /secure: process\.env\.NODE_ENV === "production"/);
  assert.doesNotMatch(cookie, /fullName|phone|email/);
});

test("Plans make the gate decision on the server without redirects or pricing intents", () => {
  const page = read("app/[locale]/plans/page.tsx");
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  assert.match(page, /getPlansAccessContext\(\)/);
  assert.match(page, /registered \? \(/);
  assert.match(page, /<RecommendedPlanPage/);
  assert.match(page, /<PlansLeadGate/);
  assert.doesNotMatch(page, /showFloatingWhatsAppOnMobile=/);
  assert.match(gate, /min-h-\[calc\(100svh-72px\)\]/);
  assert.match(gate, /max-w-\[540px\]/);
  assert.match(gate, /<PlanSilhouette/);
  assert.match(gate, /pb-32/);
  assert.doesNotMatch(page, /redirect\(|entry=pricing|intent=pricing/);
});

test("the gate requests only the approved short-form fields", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  for (const field of ["submissionId", "fullName", "phone", "email", "consent", "company", "metadata"]) {
    assert.match(gate, new RegExp(field));
  }
  assert.doesNotMatch(gate, /learningGoal|preferredLearningMode|preferredAssessmentTime|notes|currentLevel/);
  assert.match(gate, /source: "plans_pricing"/);
});

test("the gate is accessible and preserves values on a failed submission", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  assert.match(gate, /htmlFor="plans-full-name"/);
  assert.match(gate, /aria-invalid=/);
  assert.match(gate, /aria-describedby=/);
  assert.match(gate, /role="alert"/);
  assert.match(gate, /aria-live="polite"/);
  assert.match(gate, /setErrors\(\{ submission: copy\.errors\.submission \}\)/);
  assert.doesNotMatch(gate, /setForm\(initialForm\)/);
});

test("double submission is blocked and there is no automatic resubmit", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  const submission = read("src/features/leads/client/lead-submission.ts");
  assert.match(gate, /if \(submissionInFlight\.current \|\| submitting\) return/);
  assert.match(gate, /disabled=\{submitting\}/);
  assert.match(gate, /getOrCreateLeadSubmissionId\(submissionStorageKey\)/);
  assert.match(gate, /clearLeadSubmissionId\(submissionStorageKey\)/);
  assert.match(submission, /try \{\s*storedId = window\.sessionStorage\.getItem\(storageKey\)/);
  assert.match(submission, /try \{\s*window\.sessionStorage\.removeItem\(storageKey\)/);
  assert.equal((gate.match(/submitLead\(\{/g) ?? []).length, 1);
  assert.equal((submission.match(/fetchImpl\("\/api\/leads"/g) ?? []).length, 1);
});

test("Lead tracking fires only after confirmed persistence and only once per gate instance", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  const successCheck = gate.indexOf('if (result.kind !== "success")');
  const tracking = gate.lastIndexOf("trackFormSubmit");
  assert.ok(successCheck > -1 && tracking > successCheck);
  assert.match(gate, /trackedSuccess\.current/);
  assert.match(gate, /router\.refresh\(\)/);
});

test("the lead API validates Plans independently and does not create a placement attempt", () => {
  const route = read("app/api/leads/route.ts");
  assert.match(route, /const isPlans = source === "plans_pricing"/);
  assert.match(route, /preparePlansLead\(body, request\)/);
  assert.match(route, /status: "new_plans_lead"/);
  assert.match(route, /source: "plans_pricing"/);
  assert.match(route, /if \(isPlans\) setLeadRegistrationCookie\(successResponse\)/);
  assert.match(route, /\(isPlacement \|\| result\.payload\.source === "website"\)/);
  assert.doesNotMatch(route, /isPlacement \|\| isPlans/);
});

test("Homepage and placement success also establish the generic acknowledgement", () => {
  const route = read("app/api/leads/route.ts");
  assert.match(route, /setAttemptCookie\(placementResponse, token\);\s*setLeadRegistrationCookie\(placementResponse\)/);
  assert.match(route, /setLeadRegistrationCookie\(existingResponse\)/);
});

test("failure and honeypot paths do not establish registration", () => {
  const route = read("app/api/leads/route.ts");
  const submission = read("src/features/leads/client/lead-submission.ts");
  assert.match(route, /if \(company\.trim\(\)\) \{\s*return NextResponse\.json\(\{ ok: true, skipped: true \}\);\s*\}/);
  assert.match(route, /if \(!response\.ok\) \{\s*return NextResponse\.json\(\{ ok: false, error: "submission_rejected" \}/);
  assert.match(route, /if \(!isSuccessfulWebhookResponse\(webhookResult\)\) \{\s*return NextResponse\.json\(\{ ok: false, error: "submission_rejected" \}/);
  assert.match(submission, /result\.skipped === true \? \{ kind: "skipped" \} : \{ kind: "success" \}/);
});

test("lead origin validation stays strict in production and permits matching loopback development origins", () => {
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://eg.successacademy.training";

  const request = (origin) => new Request("http://localhost:3100/api/leads", {
    headers: origin === null ? {} : { Origin: origin },
  });

  try {
    assert.equal(isAllowedBrowserRequest(request("https://eg.successacademy.training"), "production"), true);
    assert.equal(isAllowedBrowserRequest(request("http://localhost:3100"), "production"), false);
    assert.equal(isAllowedBrowserRequest(request("http://127.0.0.1:3100"), "production"), false);
    assert.equal(isAllowedBrowserRequest(request("https://unrelated.example"), "production"), false);

    assert.equal(isAllowedBrowserRequest(request("https://eg.successacademy.training"), "development"), true);
    assert.equal(isAllowedBrowserRequest(request("http://localhost:3100"), "development"), true);
    assert.equal(isAllowedBrowserRequest(request("http://127.0.0.1:3100"), "development"), true);
    assert.equal(isAllowedBrowserRequest(request("http://localhost:3101"), "development"), false);
    assert.equal(isAllowedBrowserRequest(request("https://unrelated.example"), "development"), false);
    assert.equal(isAllowedBrowserRequest(request("not a valid origin"), "development"), false);
    assert.equal(isAllowedBrowserRequest(request(null), "production"), true);
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

test("the alternate loopback hostname is allowed only by the development server configuration", () => {
  const config = read("next.config.ts");
  assert.match(config, /allowedDevOrigins: process\.env\.NODE_ENV === "development" \? \["127\.0\.0\.1"\] : undefined/);
});

test("Header and Footer expose separate Plans and Placement destinations", () => {
  const navbar = read("src/components/landing/navbar.tsx");
  const footer = read("src/components/landing/footer-section.tsx");
  assert.match(navbar, /`\/\$\{locale\}\/plans`/);
  assert.match(navbar, /`\/\$\{locale\}#lead-form`/);
  assert.match(footer, /`\/\$\{locale\}\/plans`/);
  assert.match(footer, /`\/\$\{locale\}\/placement-test`/);
});

test("Arabic and English gate copy is present without placement language", () => {
  const copy = read("src/features/plans/copy.ts");
  assert.match(copy, /شوف الباقات والأسعار/);
  assert.match(copy, /سجّل وشاهد الباقات/);
  assert.match(copy, /View Plans & Pricing/);
  assert.match(copy, /Register & View Plans/);
  assert.doesNotMatch(read("src/features/plans/components/plans-lead-gate.tsx"), /placement|تحديد المستوى/i);
});

test("unregistered gate source contains no package data or pricing configuration", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  assert.doesNotMatch(gate, /learningPackages|packagePrice|finalPrice|originalPrice|RecommendedPlanPage/);
});

test("the Plans lead API persists the exact lightweight payload before setting acknowledgement", async () => {
  const { POST } = require(path.join(root, "app/api/leads/route.ts"));
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;
  let webhookPayload;

  process.env.LEADS_WEBHOOK_URL = "https://example.test/leads";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";
  global.fetch = async (_url, options) => {
    webhookPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "plans_pricing",
        submissionId: "d6ee1ca2-e8d7-4f03-a0a2-c0efe9c7812e",
        fullName: "Test Plans Lead",
        phone: "01000000000",
        email: "plans@example.test",
        consent: true,
        company: "",
        metadata: { locale: "en", pagePath: "/en/plans" },
      }),
    }));

    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /sa_lead_registered=v1/);
    assert.doesNotMatch(response.headers.get("set-cookie") ?? "", /sa_placement_attempt/);
    assert.equal(webhookPayload.source, "plans_pricing");
    assert.equal(webhookPayload.status, "new_plans_lead");
    assert.equal(webhookPayload.fullName, "Test Plans Lead");
    assert.equal(webhookPayload.phone, "+201000000000");
    assert.equal(webhookPayload.email, "plans@example.test");
    assert.equal(webhookPayload.leadReference, "d6ee1ca2-e8d7-4f03-a0a2-c0efe9c7812e");
    for (const absent of ["learningGoal", "currentLevel", "preferredLearningMode", "preferredAssessmentTime", "notes"]) {
      assert.equal(Object.hasOwn(webhookPayload, absent), false);
    }
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
});

test("a failed Plans lead persistence response never sets acknowledgement", async () => {
  const { POST } = require(path.join(root, "app/api/leads/route.ts"));
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;

  process.env.LEADS_WEBHOOK_URL = "https://example.test/leads";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";
  global.fetch = async () => new Response(JSON.stringify({ success: false }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "plans_pricing",
        submissionId: "8df93576-3e35-421f-b5b5-1fb2f593b204",
        fullName: "Test Failed Lead",
        phone: "01100000000",
        email: "",
        consent: true,
        company: "",
        metadata: { locale: "ar", pagePath: "/ar/plans" },
      }),
    }));

    assert.equal(response.status, 502);
    assert.equal(response.headers.get("set-cookie"), null);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
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
  console.log(`\n${passed}/${tests.length} Plans gate tests passed.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
