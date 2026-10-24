const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalLoad = require("node:module")._load;
let existingAttempt = null;
require("node:module")._load = function metaLeadLoad(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "@/features/placement-test/server/attempt-service") {
    return { getExistingAttempt: async () => existingAttempt };
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
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}

const {
  deliverMetaLeadFailOpen,
  metaLeadEventId,
  readMetaLeadCookies,
} = require(path.join(root, "src/features/leads/server/meta-lead-capi.ts"));
const { submitLead } = require(path.join(root, "src/features/leads/client/lead-submission.ts"));
const { trackFormSubmit } = require(path.join(root, "src/lib/tracking.ts"));
const { POST } = require(path.join(root, "app/api/leads/route.ts"));

const tests = [];
const test = (name, run) => tests.push({ name, run });
const uuid = (digit) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
const baseEnv = {
  META_CAPI_ACCESS_TOKEN: "test-access-token",
  META_CAPI_DATASET_ID: "1234567890",
  NEXT_PUBLIC_SITE_URL: "https://eg.successacademy.training",
};
const baseInput = {
  submissionId: uuid("1"),
  source: "website",
  locale: "en",
  pagePath: "/en?utm_source=test",
  email: " Test@Example.COM ",
  phone: "0100 000 0000",
  clientIp: "203.0.113.10",
  clientUserAgent: "Meta Lead Test Agent",
  fbp: "fb.1.1700000000000.123456789",
  fbc: "fb.1.1700000000000.test_click_id",
  occurredAt: "2026-10-24T12:00:00.000Z",
};

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("Lead CAPI uses the v26 dataset endpoint and complete server-controlled event contract", async () => {
  let captured;
  const result = await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options, body: JSON.parse(options.body) };
      return Response.json({ events_received: 1 });
    },
  });
  assert.deepEqual(result, { outcome: "delivered", diagnosticCode: "accepted", httpStatus: 200 });
  assert.equal(captured.url, "https://graph.facebook.com/v26.0/1234567890/events");
  assert.equal(captured.options.headers.Authorization, "Bearer test-access-token");
  const event = captured.body.data[0];
  assert.equal(event.event_name, "Lead");
  assert.equal(event.event_id, `lead:${baseInput.submissionId}`);
  assert.equal(event.action_source, "website");
  assert.equal(event.event_source_url, "https://eg.successacademy.training/en");
  assert.equal(event.event_time, 1792843200);
});

test("email and Egyptian phone are normalized then SHA-256 hashed", async () => {
  let event;
  await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async (_url, options) => {
      event = JSON.parse(options.body).data[0];
      return Response.json({ events_received: 1 });
    },
  });
  assert.deepEqual(event.user_data.em, [hash("test@example.com")]);
  assert.deepEqual(event.user_data.ph, [hash("201000000000")]);
});

test("valid IP, user agent, fbp and fbc are sent without hashing", async () => {
  let userData;
  await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async (_url, options) => {
      userData = JSON.parse(options.body).data[0].user_data;
      return Response.json({ events_received: 1 });
    },
  });
  assert.equal(userData.client_ip_address, baseInput.clientIp);
  assert.equal(userData.client_user_agent, baseInput.clientUserAgent);
  assert.equal(userData.fbp, baseInput.fbp);
  assert.equal(userData.fbc, baseInput.fbc);
});

test("invalid optional IP, UA and Meta cookies are omitted without failing", async () => {
  let userData;
  const result = await deliverMetaLeadFailOpen({
    ...baseInput,
    clientIp: "unknown",
    clientUserAgent: "bad\nagent",
    fbp: "not-valid",
    fbc: "https://evil.test",
  }, {
    env: baseEnv,
    fetchImpl: async (_url, options) => {
      userData = JSON.parse(options.body).data[0].user_data;
      return Response.json({ events_received: 1 });
    },
  });
  assert.equal(result.outcome, "delivered");
  assert.equal("client_ip_address" in userData, false);
  assert.equal("client_user_agent" in userData, false);
  assert.equal("fbp" in userData, false);
  assert.equal("fbc" in userData, false);
});

test("cookie parsing accepts only bounded Meta cookie values", () => {
  assert.deepEqual(
    readMetaLeadCookies(`session=x; _fbp=${baseInput.fbp}; _fbc=${baseInput.fbc}`),
    { fbp: baseInput.fbp, fbc: baseInput.fbc },
  );
  assert.deepEqual(readMetaLeadCookies("_fbp=bad; _fbc=https://evil.test"), {});
  assert.deepEqual(readMetaLeadCookies(null), {});
});

test("unsafe external page paths fall back to a known same-origin source URL", async () => {
  let sourceUrl;
  await deliverMetaLeadFailOpen({ ...baseInput, source: "plans_pricing", locale: "ar", pagePath: "//evil.test/path" }, {
    env: baseEnv,
    fetchImpl: async (_url, options) => {
      sourceUrl = JSON.parse(options.body).data[0].event_source_url;
      return Response.json({ events_received: 1 });
    },
  });
  assert.equal(sourceUrl, "https://eg.successacademy.training/ar/plans");
});

test("optional Meta test event code is honored but not required", async () => {
  const bodies = [];
  for (const env of [baseEnv, { ...baseEnv, META_CAPI_TEST_EVENT_CODE: "TEST123" }]) {
    await deliverMetaLeadFailOpen(baseInput, {
      env,
      fetchImpl: async (_url, options) => {
        bodies.push(JSON.parse(options.body));
        return Response.json({ events_received: 1 });
      },
    });
  }
  assert.equal("test_event_code" in bodies[0], false);
  assert.equal(bodies[1].test_event_code, "TEST123");
});

test("timeout, 429, 500 and malformed success responses remain fail-open delivery results", async () => {
  const timeout = await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async () => { throw new DOMException("timed out", "TimeoutError"); },
  });
  const limited = await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async () => Response.json({ error: {} }, { status: 429 }),
  });
  const failed = await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async () => Response.json({ error: {} }, { status: 500 }),
  });
  const malformed = await deliverMetaLeadFailOpen(baseInput, {
    env: baseEnv,
    fetchImpl: async () => new Response("not-json", { status: 200 }),
  });
  assert.equal(timeout.diagnosticCode, "timeout");
  assert.equal(limited.diagnosticCode, "http_429");
  assert.equal(failed.diagnosticCode, "http_500");
  assert.equal(malformed.diagnosticCode, "response_invalid");
});

test("missing Meta configuration fails open without making a request", async () => {
  let calls = 0;
  const result = await deliverMetaLeadFailOpen(baseInput, {
    env: {},
    fetchImpl: async () => { calls += 1; return Response.json({ events_received: 1 }); },
  });
  assert.deepEqual(result, { outcome: "failed", diagnosticCode: "configuration_invalid", httpStatus: null });
  assert.equal(calls, 0);
});

test("same submission ID is stable while different submissions produce different event IDs", () => {
  assert.equal(metaLeadEventId(baseInput.submissionId), metaLeadEventId(baseInput.submissionId));
  assert.notEqual(metaLeadEventId(baseInput.submissionId), metaLeadEventId(uuid("2")));
  assert.throws(() => metaLeadEventId("not-a-uuid"));
});

function sourceBody(source, submissionId) {
  const shared = {
    source,
    submissionId,
    phone: "01000000000",
    email: "test@example.com",
    consent: true,
    company: "",
    metadata: { locale: "en", pagePath: source === "website" ? "/en" : `/en/${source}` },
  };
  if (source === "website") return {
    ...shared,
    fullName: "Test Website",
    learningGoal: "work",
    currentLevel: "",
    preferredLearningMode: "online",
    preferredAssessmentTime: "earliest",
    notes: "",
  };
  if (source === "corporate_training") return {
    ...shared,
    companyName: "Test Company",
    contactName: "Test Contact",
    employeeCount: "1-10",
    preferredTrainingMode: "online",
    trainingGoal: "English",
    notes: "",
  };
  return { ...shared, fullName: `Test ${source}` };
}

async function runRoute(body, options = {}) {
  const calls = { webhook: [], meta: [] };
  const previous = {
    fetch: global.fetch,
    url: process.env.LEADS_WEBHOOK_URL,
    secret: process.env.LEADS_WEBHOOK_SECRET,
    accessToken: process.env.META_CAPI_ACCESS_TOKEN,
    datasetId: process.env.META_CAPI_DATASET_ID,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  };
  process.env.LEADS_WEBHOOK_URL = "https://leads.example.test/webhook";
  process.env.LEADS_WEBHOOK_SECRET = "test-webhook-secret";
  if (options.metaConfigured !== false) Object.assign(process.env, baseEnv);
  else {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_CAPI_DATASET_ID;
    process.env.NEXT_PUBLIC_SITE_URL = baseEnv.NEXT_PUBLIC_SITE_URL;
  }
  global.fetch = async (url, requestOptions) => {
    const target = String(url);
    if (target === process.env.LEADS_WEBHOOK_URL) {
      calls.webhook.push(JSON.parse(requestOptions.body));
      return options.webhookResponse ?? Response.json({ success: true });
    }
    if (target.startsWith("https://graph.facebook.com/")) {
      calls.meta.push(JSON.parse(requestOptions.body));
      return options.metaResponse ?? Response.json({ events_received: 1 });
    }
    throw new Error(`Unexpected request: ${target}`);
  };
  const ip = options.ip ?? `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  try {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Route Meta Lead Test",
        "X-Real-IP": ip,
        Cookie: `_fbp=${baseInput.fbp}; _fbc=${baseInput.fbc}; sa_placement_attempt=test-token`,
      },
      body: JSON.stringify(body),
    }));
    return { response, json: await response.json(), calls };
  } finally {
    global.fetch = previous.fetch;
    for (const [key, value] of [
      ["LEADS_WEBHOOK_URL", previous.url],
      ["LEADS_WEBHOOK_SECRET", previous.secret],
      ["META_CAPI_ACCESS_TOKEN", previous.accessToken],
      ["META_CAPI_DATASET_ID", previous.datasetId],
      ["NEXT_PUBLIC_SITE_URL", previous.siteUrl],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

for (const [source, digit] of [
  ["website", "3"],
  ["placement_test", "4"],
  ["plans_pricing", "5"],
  ["corporate_training", "6"],
]) {
  test(`${source} accepted lead returns and sends the same authoritative event ID`, async () => {
    existingAttempt = null;
    const submissionId = uuid(digit);
    const { response, json, calls } = await runRoute(sourceBody(source, submissionId));
    assert.equal(response.status, 200);
    assert.equal(json.metaLeadEventId, `lead:${submissionId}`);
    assert.equal(calls.webhook.length, 1);
    assert.equal(calls.meta.length, 1);
    assert.equal(calls.meta[0].data[0].event_id, json.metaLeadEventId);
    assert.equal(calls.meta[0].data[0].event_name, "Lead");
    if (source === "corporate_training") {
      assert.equal("submissionId" in calls.webhook[0], false);
      assert.equal("leadReference" in calls.webhook[0], false);
      assert.equal("metaLeadEventId" in calls.webhook[0], false);
    }
  });
}

test("webhook rejection sends no Meta event and returns no event identity", async () => {
  const result = await runRoute(sourceBody("plans_pricing", uuid("7")), {
    webhookResponse: Response.json({ success: false }, { status: 502 }),
  });
  assert.equal(result.response.status, 502);
  assert.equal(result.calls.meta.length, 0);
  assert.equal("metaLeadEventId" in result.json, false);
});

test("honeypot skip sends neither webhook nor Meta identity", async () => {
  const body = { ...sourceBody("website", uuid("8")), company: "bot-filled" };
  const result = await runRoute(body);
  assert.deepEqual(result.json, { ok: true, skipped: true });
  assert.equal(result.calls.webhook.length, 0);
  assert.equal(result.calls.meta.length, 0);
});

test("placement existing-attempt early success creates no unmatched Meta Lead", async () => {
  existingAttempt = { token: "existing" };
  try {
    const result = await runRoute(sourceBody("placement_test", uuid("9")));
    assert.equal(result.response.status, 200);
    assert.equal(result.json.existing, true);
    assert.equal("metaLeadEventId" in result.json, false);
    assert.equal(result.calls.webhook.length, 0);
    assert.equal(result.calls.meta.length, 0);
  } finally {
    existingAttempt = null;
  }
});

test("Meta HTTP failure cannot reject an accepted lead", async () => {
  const result = await runRoute(sourceBody("plans_pricing", uuid("a")), {
    metaResponse: Response.json({ error: {} }, { status: 500 }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.metaLeadEventId, `lead:${uuid("a")}`);
});

test("missing Meta configuration cannot reject an accepted lead", async () => {
  const result = await runRoute(sourceBody("plans_pricing", uuid("b")), { metaConfigured: false });
  assert.equal(result.response.status, 200);
  assert.equal(result.calls.webhook.length, 1);
  assert.equal(result.calls.meta.length, 0);
  assert.equal(result.json.metaLeadEventId, `lead:${uuid("b")}`);
});

test("client keeps the accepted event ID even after stable identity cleanup", async () => {
  const eventId = `lead:${uuid("c")}`;
  const result = await submitLead({}, async () => Response.json({ ok: true, metaLeadEventId: eventId }));
  assert.deepEqual(result, { kind: "success", metaLeadEventId: eventId });
});

test("browser Pixel uses Meta eventID while Google and TikTok remain intact", () => {
  const calls = { fbq: [], gtag: [], ttq: [], dataLayer: [] };
  const previousWindow = global.window;
  global.window = {
    dataLayer: calls.dataLayer,
    gtag: (...args) => calls.gtag.push(args),
    fbq: (...args) => calls.fbq.push(args),
    ttq: { track: (...args) => calls.ttq.push(args) },
  };
  try {
    const eventId = `lead:${uuid("d")}`;
    const payload = { source: "website" };
    trackFormSubmit(payload, { metaEventId: eventId });
    trackFormSubmit(payload);
    assert.deepEqual(calls.fbq, [["track", "Lead", payload, { eventID: eventId }]]);
    assert.equal(calls.gtag.length, 2);
    assert.equal(calls.ttq.length, 2);
    assert.equal(calls.dataLayer.length, 2);
    assert.equal("eventID" in payload, false);
  } finally {
    global.window = previousWindow;
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
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) console.log(`\n${passed}/${tests.length} Meta Lead tests passed.`);
})();
