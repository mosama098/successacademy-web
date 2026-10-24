const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalLoad = require("node:module")._load;
require("node:module")._load = function leadReliabilityLoad(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/features/placement-test/server/attempt-service") {
    return { getExistingAttempt: async () => null };
  }
  if (request === "@/features/placement-test/server/storage") {
    return { createStoredAttempt: async () => ({ token: "test-placement-token", attempt: {} }) };
  }
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const {
  LEAD_SUBMISSION_TIMEOUT_MS,
  clearLeadSubmissionId,
  getOrCreateLeadSubmissionId,
  submitLead,
} = require(path.join(
  root,
  "src/features/leads/client/lead-submission.ts",
));
const tests = [];
const test = (name, run) => tests.push({ name, run });

test("lead clients use one bounded 60-second request over a 30-second webhook deadline", () => {
  const client = read("src/features/leads/client/lead-submission.ts");
  const route = read("app/api/leads/route.ts");
  assert.equal(LEAD_SUBMISSION_TIMEOUT_MS, 60_000);
  assert.match(client, /AbortSignal\.timeout\(LEAD_SUBMISSION_TIMEOUT_MS\)/);
  assert.match(route, /const WEBHOOK_TIMEOUT_MS = 30_000/);
  assert.doesNotMatch(route, /WEBHOOK_TIMEOUT_MS = 8_000/);
});

test("a slow successful response remains loading-compatible and succeeds without a retry", async () => {
  let calls = 0;
  let capturedSignal;
  const result = await submitLead({ submissionId: "test" }, async (_url, options) => {
    calls += 1;
    capturedSignal = options.signal;
    await new Promise((resolve) => setTimeout(resolve, 25));
    return Response.json({ ok: true });
  });
  assert.deepEqual(result, { kind: "success" });
  assert.equal(calls, 1);
  assert.equal(capturedSignal.aborted, false);
});

test("validation, rejection, downstream failure and honeypot skip remain distinct", async () => {
  const request = (status, body) => submitLead({}, async () => Response.json(body, { status }));
  assert.deepEqual(await request(400, { ok: false, error: "validation_error" }), { kind: "validation" });
  assert.deepEqual(await request(502, { ok: false, error: "submission_rejected" }), { kind: "rejected" });
  assert.deepEqual(await request(502, { ok: false, error: "submission_invalid_response" }), { kind: "downstream" });
  assert.deepEqual(await request(200, { ok: true, skipped: true }), { kind: "skipped" });
});

test("the client preserves only a valid authoritative Meta Lead event ID", async () => {
  const validId = "lead:11111111-1111-4111-8111-111111111111";
  const valid = await submitLead({}, async () => Response.json({ ok: true, metaLeadEventId: validId }));
  const invalid = await submitLead({}, async () => Response.json({ ok: true, metaLeadEventId: "lead:forged" }));
  assert.deepEqual(valid, { kind: "success", metaLeadEventId: validId });
  assert.deepEqual(invalid, { kind: "success" });
});

test("timeout and network failures are classified without an automatic replay", async () => {
  let timeoutCalls = 0;
  const timeout = await submitLead({}, async () => {
    timeoutCalls += 1;
    throw new DOMException("timed out", "TimeoutError");
  });
  let networkCalls = 0;
  const network = await submitLead({}, async () => {
    networkCalls += 1;
    throw new TypeError("connection reset");
  });
  assert.deepEqual(timeout, { kind: "timeout" });
  assert.deepEqual(network, { kind: "network" });
  assert.equal(timeoutCalls, 1);
  assert.equal(networkCalls, 1);
});

test("Homepage, Placement, Plans and Corporate keep locale-independent per-session submission identities", () => {
  for (const [file, key] of [
    ["src/components/form/lead-form.tsx", "sa_home_lead_submission"],
    ["src/features/placement-test/components/placement-registration.tsx", "sa_placement_lead_submission"],
    ["src/features/plans/components/plans-lead-gate.tsx", "sa_plans_lead_submission"],
    ["src/components/business/corporate-lead-form.tsx", "sa_corporate_lead_submission"],
  ]) {
    const source = read(file);
    assert.match(source, new RegExp(`submissionStorageKey = ["']${key}["']`));
    assert.match(source, /getOrCreateLeadSubmissionId\(submissionStorageKey\)/);
    assert.match(source, /clearLeadSubmissionId\(submissionStorageKey\)/);
    assert.match(source, /submissionId: getSubmissionId\(\)/);
    assert.match(source, /submissionInFlight\.current/);
    assert.equal((source.match(/submitLead\(\{/g) ?? []).length, 1);
  }
});

test("submission identity remains stable when sessionStorage is unavailable and cleanup cannot hide success", () => {
  const originalWindow = global.window;
  let generated = 0;
  global.window = {
    crypto: {
      randomUUID: () => generated++ === 0
        ? "44444444-4444-4444-8444-444444444444"
        : "55555555-5555-4555-8555-555555555555",
    },
    sessionStorage: {
      getItem: () => { throw new DOMException("blocked", "SecurityError"); },
      setItem: () => { throw new DOMException("blocked", "SecurityError"); },
      removeItem: () => { throw new DOMException("blocked", "SecurityError"); },
    },
  };
  try {
    const key = "test_storage_failure_submission";
    const first = getOrCreateLeadSubmissionId(key);
    assert.equal(getOrCreateLeadSubmissionId(key), first);
    assert.doesNotThrow(() => clearLeadSubmissionId(key));
    assert.notEqual(getOrCreateLeadSubmissionId(key), first);
  } finally {
    global.window = originalWindow;
  }
});

test("the API derives every scoped downstream leadReference from the stable submission ID", () => {
  const route = read("app/api/leads/route.ts");
  assert.equal((route.match(/"submissionId"/g) ?? []).length >= 4, true);
  assert.equal((route.match(/leadReference: submissionId\.toLowerCase\(\)/g) ?? []).length, 3);
  assert.doesNotMatch(route, /leadReference: randomUUID\(\)/);
});

test("Homepage and Placement persist their exact stable identities through the API", async () => {
  const { POST } = require(path.join(root, "app/api/leads/route.ts"));
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;
  const payloads = [];
  process.env.LEADS_WEBHOOK_URL = "https://example.test/leads";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";
  global.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return Response.json({ success: true });
  };

  const send = (body) => POST(new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  try {
    const homepageId = "11111111-1111-4111-8111-111111111111";
    const homepage = await send({
      source: "website", submissionId: homepageId, fullName: "Test Homepage", phone: "01000000000",
      email: "", learningGoal: "work", currentLevel: "", preferredLearningMode: "online",
      preferredAssessmentTime: "earliest", notes: "", consent: true, company: "",
      metadata: { locale: "en", pagePath: "/en" },
    });
    const placementId = "22222222-2222-4222-8222-222222222222";
    const placement = await send({
      source: "placement_test", submissionId: placementId, fullName: "Test Placement", phone: "01100000000",
      email: "", consent: true, company: "", metadata: { locale: "ar", pagePath: "/ar/placement-test" },
    });
    assert.equal(homepage.status, 200);
    assert.equal(placement.status, 200);
    assert.equal(payloads[0].leadReference, homepageId);
    assert.equal(payloads[1].leadReference, placementId);
    assert.match(homepage.headers.get("set-cookie") ?? "", /sa_placement_attempt=/);
    assert.match(placement.headers.get("set-cookie") ?? "", /sa_placement_attempt=/);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
});

test("the API reports an unknown-outcome webhook timeout distinctly", async () => {
  const { POST } = require(path.join(root, "app/api/leads/route.ts"));
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;
  process.env.LEADS_WEBHOOK_URL = "https://example.test/leads";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";
  global.fetch = async () => { throw new DOMException("timed out", "TimeoutError"); };
  try {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "plans_pricing", submissionId: "33333333-3333-4333-8333-333333333333",
        fullName: "Test Timeout", phone: "01200000000", email: "", consent: true, company: "",
        metadata: { locale: "en", pagePath: "/en/plans" },
      }),
    }));
    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), { ok: false, error: "submission_timeout" });
    assert.equal(response.headers.get("set-cookie"), null);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
});

test("only genuine success can advance journeys or emit Lead tracking", () => {
  const files = [
    read("src/components/form/lead-form.tsx"),
    read("src/features/placement-test/components/placement-registration.tsx"),
    read("src/features/plans/components/plans-lead-gate.tsx"),
    read("src/components/business/corporate-lead-form.tsx"),
  ];
  for (const source of files) {
    const successGuard = source.indexOf('result.kind !== "success"');
    const tracking = source.lastIndexOf("trackFormSubmit");
    assert.ok(successGuard >= 0 && tracking > successGuard);
  }
  assert.match(read("src/features/leads/client/lead-submission.ts"), /result\.skipped === true\) return \{ kind: "skipped" \}/);
});

test("Homepage and Placement do not advance before confirmed persistence", () => {
  const homepage = read("src/components/form/lead-form.tsx");
  const placement = read("src/features/placement-test/components/placement-registration.tsx");
  assert.ok(homepage.indexOf('result.kind !== "success"') < homepage.indexOf('setStatus("success")'));
  assert.ok(placement.indexOf('result.kind !== "success"') < placement.indexOf("router.replace"));
});

test("Plans stays locked until success and preserves its existing acknowledgement path", () => {
  const gate = read("src/features/plans/components/plans-lead-gate.tsx");
  const route = read("app/api/leads/route.ts");
  assert.ok(gate.indexOf('result.kind !== "success"') < gate.indexOf("router.refresh()"));
  assert.match(route, /if \(isPlans\) setLeadRegistrationCookie\(successResponse\)/);
  assert.match(route, /return NextResponse\.json\(\{ ok: true, skipped: true \}\)/);
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
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) console.log(`\n${passed}/${tests.length} lead reliability tests passed.`);
})();
