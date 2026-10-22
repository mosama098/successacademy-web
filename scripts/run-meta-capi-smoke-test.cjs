const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { loadEnvConfig } = require("@next/env");

const root = path.resolve(__dirname, "..");
loadEnvConfig(root, true);

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run the local Meta CAPI smoke test in production mode.");
  process.exit(1);
}

if (!process.env.META_CAPI_TEST_EVENT_CODE?.trim()) {
  console.error("META_CAPI_TEST_EVENT_CODE is required. No Meta request was sent.");
  process.exit(1);
}

const originalLoad = Module._load;
Module._load = function metaSmokeTestLoad(request, parent, isMain) {
  if (request === "server-only") return {};
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

async function main() {
  const { MetaCapiClient, readMetaCapiConfig } = require(path.join(
    root,
    "src/features/payments/server/meta-capi.ts",
  ));
  const config = readMetaCapiConfig();
  if (!config.testEventCode) {
    throw new Error("test_event_code_missing");
  }

  const testRunId = randomUUID();
  const event = {
    eventName: "Purchase",
    eventId: `meta:test:purchase:smoke:${testRunId}`,
    orderId: `test-only-meta-capi-smoke-${testRunId}`,
    locale: "en",
    occurredAt: new Date().toISOString(),
    currency: "EGP",
    valueEgp: 1000,
    transactionId: null,
    packageId: "meta-capi-smoke-test",
    programType: "group",
    startLevel: "A1",
    targetLevel: "A1",
    customer: {
      email: "test@example.com",
      phone: "+1 202-555-0100",
    },
  };

  if (!event.eventId.startsWith("meta:test:purchase:smoke:")) {
    throw new Error("test_event_id_invalid");
  }

  const result = await new MetaCapiClient(config).sendPurchase(event);
  console.log(JSON.stringify({
    eventId: event.eventId,
    outcome: result.outcome,
    diagnosticCode: result.diagnosticCode,
    httpStatus: result.httpStatus,
  }, null, 2));

  if (result.outcome !== "delivered") process.exitCode = 1;
}

main().catch((failure) => {
  const safeCode = failure instanceof Error && [
    "meta_capi_configuration_invalid",
    "test_event_code_missing",
    "test_event_id_invalid",
  ].includes(failure.message)
    ? failure.message
    : "smoke_test_failed";
  console.error(`Meta CAPI smoke test failed: ${safeCode}. No secret or customer data was logged.`);
  process.exitCode = 1;
});
