const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");

const originalLoad = Module._load;
Module._load = function placementTestLoad(request, parent, isMain) {
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

const root = path.resolve(__dirname, "..");
const testDataDirectory = path.join(os.tmpdir(), `successacademy-placement-tests-${process.pid}`);
fs.rmSync(testDataDirectory, { recursive: true, force: true });
process.env.PLACEMENT_TEST_DATA_DIR = testDataDirectory;
const { assessmentQuestions, getPassage, getQuestions } = require(path.join(
  root,
  "src/features/placement-test/server/question-bank.ts",
));
const { selectForms, buildCoreSequence } = require(path.join(
  root,
  "src/features/placement-test/server/randomization.ts",
));
const { PLACEMENT_COUNT_GATES, scorePlacement } = require(path.join(
  root,
  "src/features/placement-test/server/scoring.ts",
));
const { audioAssets, isPlayableAudioAsset } = require(path.join(
  root,
  "src/features/placement-test/server/audio-manifest.ts",
));
const { createStoredAttempt, readStoredAttempt, updateStoredAttempt } = require(path.join(
  root,
  "src/features/placement-test/server/storage.ts",
));
const {
  applyAttemptAction,
  deliverPendingProgressWebhooks,
  getPublicAttemptState,
} = require(path.join(
  root,
  "src/features/placement-test/server/attempt-service.ts",
));

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

const forms = selectForms("placement-test-fixture");
const sequence = buildCoreSequence(assessmentQuestions, forms);
const coreQuestions = getQuestions(sequence);

function answersWhere(isCorrect) {
  return coreQuestions.map((question) => ({
    questionId: question.id,
    selectedOption: isCorrect(question) ? question.correctOption : wrongOption(question.correctOption),
    submittedAt: "2026-01-01T00:00:00.000Z",
    responseTimeMs: 1_000,
    timedOut: false,
  }));
}

function answersForCounts(
  {
    A1 = 0,
    A2 = 0,
    B1 = 0,
    upperListening = 0,
    upperReading = 0,
    upperLanguageUse = 0,
  },
  questions = coreQuestions,
) {
  const correctIds = new Set();
  const select = (candidates, count, label) => {
    assert.ok(count >= 0 && count <= candidates.length, `${label}: ${count}/${candidates.length}`);
    candidates.slice(0, count).forEach((question) => correctIds.add(question.id));
  };
  const isUpperReading = (question) =>
    question.section === "reading" && (question.slotId === "R09" || question.slotId === "R10");
  const B1Questions = questions.filter((question) => question.evidenceBand === "B1");
  const upperReadingQuestions = B1Questions.filter(isUpperReading);

  select(questions.filter((question) => question.evidenceBand === "A1"), A1, "A1");
  select(questions.filter((question) => question.evidenceBand === "A2"), A2, "A2");
  select(upperReadingQuestions, upperReading, "upper reading");
  select(
    B1Questions.filter((question) => !isUpperReading(question)),
    B1 - upperReading,
    "remaining B1",
  );
  select(
    questions.filter(
      (question) => question.evidenceBand === "B2Entry" && question.section === "listening",
    ),
    upperListening,
    "upper listening",
  );
  select(
    questions.filter(
      (question) => question.evidenceBand === "B2Entry" && question.section === "languageUse",
    ),
    upperLanguageUse,
    "upper language use",
  );

  return questions.map((question) => ({
    questionId: question.id,
    selectedOption: correctIds.has(question.id)
      ? question.correctOption
      : wrongOption(question.correctOption),
    submittedAt: "2026-01-01T00:00:00.000Z",
    responseTimeMs: 1_000,
    timedOut: false,
  }));
}

function profileForCounts(counts, questions = coreQuestions) {
  return scorePlacement(questions, answersForCounts(counts, questions), false);
}

const strongB2Counts = {
  upperListening: 3,
  upperReading: 2,
  upperLanguageUse: 4,
};

function wrongOption(correct) {
  return correct === "A" ? "B" : "A";
}

function firstQuestionIndex(sequence, section) {
  return sequence.findIndex((id) =>
    assessmentQuestions.find((question) => question.id === id)?.section === section,
  );
}

async function createListeningFixture(name, questionIds) {
  const { token } = await createStoredAttempt("en", `lead-test-${name}`);
  const fixtureSlots = new Set(
    questionIds.map((id) => assessmentQuestions.find((question) => question.id === id)?.slotId),
  );
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening"];
    attempt.currentSection = "listening";
    attempt.coreSequence = [
      ...questionIds,
      ...attempt.coreSequence.filter((id) => {
        const question = assessmentQuestions.find((candidate) => candidate.id === id);
        return !fixtureSlots.has(question?.slotId);
      }),
    ];
    attempt.currentIndex = 0;
    attempt.budgetRunningSince = new Date().toISOString();
  });
  return token;
}

async function createReadingFixture(name, questionIds) {
  const { token } = await createStoredAttempt("en", `lead-test-${name}`);
  const fixtureSlots = new Set(
    questionIds.map((id) => assessmentQuestions.find((question) => question.id === id)?.slotId),
  );
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.introducedSections = ["languageUse", "reading"];
    attempt.currentSection = "reading";
    attempt.coreSequence = [
      ...questionIds,
      ...attempt.coreSequence.filter((id) => {
        const question = assessmentQuestions.find((candidate) => candidate.id === id);
        return !fixtureSlots.has(question?.slotId);
      }),
    ];
    attempt.currentIndex = 0;
    attempt.budgetRunningSince = new Date().toISOString();
  });
  return token;
}

test("assessment layout has stable module-level component identity", () => {
  const filename = path.join(
    root,
    "src/features/placement-test/components/placement-assessment.tsx",
  );
  const sourceFile = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const topLevelFunctions = new Set(
    sourceFile.statements
      .filter(ts.isFunctionDeclaration)
      .map((statement) => statement.name?.text)
      .filter(Boolean),
  );
  assert.equal(topLevelFunctions.has("AssessmentLayout"), true);
});

test("content has 36 core slots with two equivalent forms", () => {
  assert.equal(coreQuestions.length, 36);
  assert.equal(new Set(coreQuestions.map((question) => question.slotId)).size, 36);
});

test("core section order is Language Use, Reading, then Listening", () => {
  assert.deepEqual(
    [...new Set(coreQuestions.map((question) => question.section))],
    ["languageUse", "reading", "listening"],
  );
  assert.deepEqual(
    coreQuestions.reduce((counts, question) => {
      counts[question.section] = (counts[question.section] ?? 0) + 1;
      return counts;
    }, {}),
    { languageUse: 16, reading: 10, listening: 10 },
  );
});

test("a started attempt enters Language Use before the Listening audio check", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-section-order");
  const started = await applyAttemptAction(token, { action: "start" });
  assert.equal(started.section, "languageUse");
  assert.equal(started.phase, "section_intro");

  const languageQuestion = await applyAttemptAction(token, {
    action: "section_continue",
    section: "languageUse",
  });
  assert.equal(languageQuestion.phase, "question");

  await updateStoredAttempt(token, (attempt) => {
    attempt.currentIndex = firstQuestionIndex(attempt.coreSequence, "listening");
    attempt.currentSection = "listening";
    attempt.introducedSections = ["languageUse", "reading", "listening"];
    attempt.questionStartedAt = null;
    attempt.questionDeadlineAt = null;
  });
  const listeningStart = await getPublicAttemptState(token);
  assert.equal(listeningStart?.section, "listening");
  assert.equal(listeningStart?.phase, "audio_check");
});

test("progress webhook sends only deduplicated non-PII progress state", async () => {
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;
  const payloads = [];
  process.env.LEADS_WEBHOOK_URL = "https://example.test/placement-progress";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";
  global.fetch = async (_url, init) => {
    payloads.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const { token, attempt: created } = await createStoredAttempt(
      "en",
      "lead-test-progress-webhook",
    );
    await applyAttemptAction(token, { action: "start" });
    await deliverPendingProgressWebhooks(token);

    assert.equal(payloads.length, 1);
    assert.deepEqual(Object.keys(payloads[0]).sort(), [
      "assessmentProgress",
      "attemptReference",
      "currentQuestion",
      "currentSection",
      "lastActivity",
      "leadReference",
      "secret",
      "startedAt",
      "status",
    ]);
    assert.equal(payloads[0].leadReference, "lead-test-progress-webhook");
    assert.equal(payloads[0].attemptReference, created.id);
    assert.equal(payloads[0].status, "in_progress");
    assert.equal(payloads[0].assessmentProgress, 0);
    assert.equal("phone" in payloads[0], false);
    assert.equal("email" in payloads[0], false);
    assert.equal("answers" in payloads[0], false);
    assert.equal("responses" in payloads[0], false);

    await updateStoredAttempt(token, (attempt) => {
      const completedLanguageUse = getQuestions(attempt.coreSequence)
        .filter((question) => question.section === "languageUse");
      attempt.answers = completedLanguageUse.map((question) => ({
        questionId: question.id,
        selectedOption: question.correctOption,
        submittedAt: new Date().toISOString(),
        responseTimeMs: 1_000,
        timedOut: false,
      }));
      attempt.currentIndex = completedLanguageUse.length;
      attempt.currentSection = "reading";
      attempt.budgetRunningSince = null;
    });

    await getPublicAttemptState(token);
    await getPublicAttemptState(token);
    const queued = await readStoredAttempt(token);
    assert.deepEqual(
      queued.progressWebhookQueue.map((event) => event.key),
      ["progress:10", "progress:20", "progress:30", "progress:40", "section:languageUse"],
    );

    await deliverPendingProgressWebhooks(token);
    assert.equal(payloads.length, 6);
    assert.deepEqual(
      payloads.slice(1, 5).map((payload) => payload.assessmentProgress),
      [10, 20, 30, 40],
    );
    assert.equal(payloads[5].assessmentProgress, 44);
    assert.equal(payloads[5].currentSection, "languageUse");

    await getPublicAttemptState(token);
    await deliverPendingProgressWebhooks(token);
    assert.equal(payloads.length, 6);
    const delivered = await readStoredAttempt(token);
    assert.equal(delivered.progressWebhookQueue.length, 0);
    assert.deepEqual(delivered.progressWebhookSentKeys, [
      "start",
      "progress:10",
      "progress:20",
      "progress:30",
      "progress:40",
      "section:languageUse",
    ]);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
});

test("failed progress webhook delivery remains recoverable", async () => {
  const previousFetch = global.fetch;
  const previousUrl = process.env.LEADS_WEBHOOK_URL;
  const previousSecret = process.env.LEADS_WEBHOOK_SECRET;
  process.env.LEADS_WEBHOOK_URL = "https://example.test/placement-progress";
  process.env.LEADS_WEBHOOK_SECRET = "test-secret";

  try {
    const { token } = await createStoredAttempt("en", "lead-test-progress-retry");
    await applyAttemptAction(token, { action: "start" });
    global.fetch = async () => new Response("unavailable", { status: 502 });
    await deliverPendingProgressWebhooks(token);
    let stored = await readStoredAttempt(token);
    assert.deepEqual(stored.progressWebhookQueue.map((event) => event.key), ["start"]);
    assert.equal(stored.progressWebhookClaimedKey, null);
    assert.ok(Date.parse(stored.progressWebhookRetryAt) > Date.now());

    global.fetch = async () => new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await updateStoredAttempt(token, (attempt) => {
      attempt.progressWebhookRetryAt = new Date(Date.now() - 1_000).toISOString();
    });
    await deliverPendingProgressWebhooks(token);
    stored = await readStoredAttempt(token);
    assert.equal(stored.progressWebhookQueue.length, 0);
    assert.deepEqual(stored.progressWebhookSentKeys, ["start"]);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.LEADS_WEBHOOK_URL;
    else process.env.LEADS_WEBHOOK_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.LEADS_WEBHOOK_SECRET;
    else process.env.LEADS_WEBHOOK_SECRET = previousSecret;
  }
});

test("exit prompt copies the complete current page URL", () => {
  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  assert.match(source, /navigator\.clipboard\.writeText\(window\.location\.href\)/);
  assert.match(source, /addEventListener\("beforeunload"/);
  assert.match(source, /addEventListener\("popstate"/);
});

test("Listening renders the question and options before playback on one screen", async () => {
  const token = await createListeningFixture("question-first", ["L01-A"]);
  const state = await getPublicAttemptState(token);
  assert.equal(state?.phase, "audio");
  assert.equal(Boolean(state?.question?.prompt), true);
  assert.equal(state?.question?.options.length, 4);

  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const listeningComponent = source.slice(
    source.indexOf("function ListeningQuestion"),
    source.indexOf("function QuestionSurface"),
  );
  assert.match(listeningComponent, /<QuestionHeading/);
  assert.match(listeningComponent, /<AnswerOptions/);
  assert.match(listeningComponent, /requestAnimationFrame/);
  assert.match(listeningComponent, /const player = \(/);
  assert.match(listeningComponent, /<QuestionHeading state=\{state\} copy=\{copy\}/);
  assert.match(listeningComponent, /<div className="mt-5">\{player\}<\/div>/);
  assert.match(listeningComponent, /disabled=\{!canSelect\}/);
});

test("shared Listening blocks preview every prompt without choices, then render only the current question", async () => {
  const token = await createListeningFixture("shared-preview", ["L03-A", "L04-A"]);
  const state = await getPublicAttemptState(token);
  assert.equal(state?.phase, "audio");
  assert.equal(state?.listeningBlockQuestions.length, 2);
  assert.deepEqual(state?.listeningBlockQuestions.map((question) => question.id), ["L03-A", "L04-A"]);
  for (const question of state?.listeningBlockQuestions ?? []) {
    assert.ok(question.prompt);
    assert.equal(question.options.length, 4);
    assert.equal("correctOption" in question, false);
    assert.equal("evidenceBand" in question, false);
  }

  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const listeningComponent = source.slice(
    source.indexOf("function ListeningQuestion"),
    source.indexOf("function QuestionSurface"),
  );
  const previewComponent = source.slice(
    source.indexOf("function ListeningBlockPreview"),
    source.indexOf("function QuestionSurface"),
  );
  assert.match(listeningComponent, /previewingSharedBlock = isSharedBlock && audio\?\.status !== "completed"/);
  assert.match(listeningComponent, /<ListeningBlockPreview questions=\{blockQuestions\}/);
  assert.match(previewComponent, /questions\.map/);
  assert.match(previewComponent, /previewQuestion\.prompt/);
  assert.doesNotMatch(previewComponent, /previewQuestion\.options|AnswerOptions/);
  assert.match(listeningComponent, /copy\.startListening/);
  assert.match(listeningComponent, /data-listening-block-current-question/);
  assert.match(listeningComponent, /copy\.listeningBlockCount\.replace/);
  assert.match(listeningComponent, /copy\.listeningBlockMeta\.replace/);
  assert.match(listeningComponent, /copy\.listeningQuestionCounter\.replace/);
  assert.match(listeningComponent, /question=\{question\}/);
  assert.match(listeningComponent, /isSharedBlock \? audio\.status === "completed"/);
  assert.match(listeningComponent, /state\.phase === "question"/);
});

test("shared Listening drafts cannot be finalized before server audio completion", async () => {
  const token = await createListeningFixture("shared-gate", ["L03-A", "L04-A"]);
  await applyAttemptAction(token, { action: "audio_start", questionId: "L03-A" });
  await assert.rejects(
    () => applyAttemptAction(token, { action: "answer", questionId: "L03-A", optionId: "A" }),
    (error) => error?.code === "question_not_started",
  );
  const state = await getPublicAttemptState(token);
  assert.equal(state?.phase, "audio");
  assert.equal(state?.audio?.status, "playing");
});

test("Reading renders passage, question, and options in one continuous experience", async () => {
  const token = await createReadingFixture("reading-short", ["R01-A"]);
  const state = await getPublicAttemptState(token);
  assert.equal(state?.phase, "question");
  assert.equal(state?.question?.id, "R01-A");
  assert.equal(Boolean(state?.question?.passage?.text), true);

  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const readingComponent = source.slice(
    source.indexOf("function ReadingQuestion"),
    source.indexOf("function QuestionCard"),
  );
  assert.match(readingComponent, /<PassageText/);
  assert.match(readingComponent, /<QuestionHeading/);
  assert.match(readingComponent, /<AnswerOptions/);
  assert.doesNotMatch(source, /function ReadingPeriod/);
});

test("shared Reading preparation is optional and the passage persists between questions", async () => {
  const token = await createReadingFixture("reading-shared", ["R03-A", "R04-A"]);
  const preparing = await getPublicAttemptState(token);
  assert.equal(preparing?.phase, "reading_period");
  assert.ok(preparing?.readingReadyAt);
  assert.equal(Boolean(preparing?.question?.passage?.text), true);

  const timed = await applyAttemptAction(token, { action: "begin_question", questionId: "R03-A" });
  assert.equal(timed.phase, "question");
  assert.ok(timed.questionDeadlineAt);
  assert.equal(timed.readingReadyAt, null);
  const firstPassage = timed.question?.passage?.text;

  await applyAttemptAction(token, { action: "answer", questionId: "R03-A", optionId: "A" });
  const attachedQuestion = await getPublicAttemptState(token);
  assert.equal(attachedQuestion?.question?.id, "R04-A");
  assert.equal(attachedQuestion?.phase, "question");
  assert.equal(attachedQuestion?.question?.passage?.text, firstPassage);
});

test("expired Reading preparation reconciles at zero and cannot deadlock", async () => {
  const token = await createReadingFixture("reading-zero", ["R03-A", "R04-A"]);
  await getPublicAttemptState(token);
  await updateStoredAttempt(token, (attempt) => {
    attempt.readingReadyAt = new Date(Date.now() - 1_000).toISOString();
  });
  const ready = await getPublicAttemptState(token);
  assert.equal(ready?.phase, "question");
  assert.equal(ready?.readingReadyAt, null);
  assert.equal(ready?.questionDeadlineAt, null);

  const started = await applyAttemptAction(token, { action: "begin_question", questionId: "R03-A" });
  assert.ok(started.questionDeadlineAt);

  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  assert.match(source, /else if \(state\.readingReadyAt\) void refreshState\(\)/);
  assert.match(source, /remainingSeconds <= 0\) return null/);
});

test("Reading resume preserves the attached passage and active question", async () => {
  const token = await createReadingFixture("reading-resume", ["R03-A", "R04-A"]);
  await updateStoredAttempt(token, (attempt) => {
    attempt.currentIndex = 1;
    attempt.completedReadingBlocks = ["R03-04"];
    attempt.readingReadyAt = null;
    attempt.questionStartedAt = new Date().toISOString();
    attempt.questionDeadlineAt = new Date(Date.now() + 45_000).toISOString();
  });
  const resumed = await getPublicAttemptState(token);
  assert.equal(resumed?.question?.id, "R04-A");
  assert.equal(resumed?.phase, "question");
  assert.equal(Boolean(resumed?.question?.passage?.text), true);
  assert.ok(resumed?.questionDeadlineAt);
});

test("assessment UX includes timeout dialog and level-free progress journey", () => {
  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const experience = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-experience.tsx"),
    "utf8",
  );
  const journey = experience.slice(
    experience.indexOf("export function AssessmentJourney"),
    experience.indexOf("export function JourneyEnergy"),
  );
  assert.match(source, /function TimeoutOverlay/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /placementTimeout_1\.15s/);
  assert.deepEqual(
    ["languageUse", "reading", "listening", "result"].map((label) => journey.indexOf(`id: "${label}"`)),
    ["languageUse", "reading", "listening", "result"].map((label) => journey.indexOf(`id: "${label}"`)).sort((a, b) => a - b),
  );
  assert.doesNotMatch(journey, /id: "start"/);
  assert.doesNotMatch(journey, /\b(?:A1|A2|B1|B2)\b/);
});

test("question motion and milestones are completion-driven without score feedback", () => {
  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const answerFlow = source.slice(source.indexOf("async function sendAction"), source.indexOf("async function refreshState"));
  assert.match(answerFlow, /setQuestionTransition\("exiting"\)/);
  assert.match(answerFlow, /setQuestionTransition\("reward"\)/);
  assert.match(answerFlow, /setQuestionTransition\("entering"\)/);
  assert.match(answerFlow, /setReward\(/);
  assert.match(answerFlow, /completedAnswers % 5 === 0/);
  assert.match(answerFlow, /\[20, 40, 50, 70, 90\]/);
  assert.match(answerFlow, /previousProgress < point && next\.progressPercent >= point/);
  assert.doesNotMatch(answerFlow, /correctOption|selectedOption|score/);
});

test("Journey Energy advances from completion only and ignores answer correctness", async () => {
  async function progressAfterOneAnswer(name, optionId) {
    const { token } = await createStoredAttempt("en", `lead-energy-${name}`);
    await applyAttemptAction(token, { action: "start" });
    let state = await applyAttemptAction(token, { action: "section_continue", section: "languageUse" });
    state = await applyAttemptAction(token, { action: "begin_question", questionId: state.question.id });
    const before = state.progressPercent;
    const next = await applyAttemptAction(token, { action: "answer", questionId: state.question.id, optionId });
    return { before, after: next.progressPercent };
  }

  const first = await progressAfterOneAnswer("a", "A");
  const second = await progressAfterOneAnswer("b", "D");
  assert.ok(first.after > first.before);
  assert.equal(first.after, second.after);

  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  assert.match(source, /<JourneyEnergy value=\{state\.progressPercent\}/);
});

test("reward, result reveal, and reduced-motion paths are present without correctness feedback", () => {
  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const resultComponent = source.slice(source.indexOf("function ResultScreen"), source.indexOf("function AssessmentWelcome"));
  assert.match(source, /function MotivationBurst/);
  assert.match(source, /copy\.rewardMessages/);
  assert.match(source, /copy\.bonusMessages/);
  assert.match(resultComponent, /setRevealStep\(4\)/);
  assert.match(resultComponent, /prefers-reduced-motion: reduce/);
  assert.match(resultComponent, /<CelebrationParticles dense/);
  assert.doesNotMatch(resultComponent, /correct answers|إجابات صحيحة/);
});

test("welcome and registration share the animated assessment information cards", () => {
  const experience = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-experience.tsx"),
    "utf8",
  );
  const assessment = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const registration = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-registration.tsx"),
    "utf8",
  );
  assert.match(experience, /export function AssessmentInfoCards/);
  assert.match(experience, /AssessmentChecklistIcon/);
  assert.match(experience, /SkillSpectrumIcon/);
  assert.match(experience, /StopwatchIcon/);
  assert.match(experience, /<SkillGlyph skill=\{skill\}/);
  assert.match(experience, /motion-safe:animate-\[placementRevealUp_/);
  assert.match(experience, /motion-reduce:transition-none/);
  assert.match(assessment, /<AssessmentInfoCards locale=\{locale\}/);
  assert.match(registration, /<AssessmentInfoCards locale=\{locale\}/);
});

test("assessment journey has four labeled icon stages in the approved sequence", () => {
  const experience = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-experience.tsx"),
    "utf8",
  );
  const journey = experience.slice(
    experience.indexOf("export function AssessmentJourney"),
    experience.indexOf("export function JourneyEnergy"),
  );
  const sequence = ["languageUse", "reading", "listening", "result"];
  const positions = sequence.map((stage) => journey.indexOf(`id: "${stage}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(journey, /index \+ 1/);
  assert.match(journey, /data-state=/);
  assert.match(journey, /placementJourneyPulse/);
  assert.match(journey, /placementStageComplete/);
  assert.match(journey, /duration-700 ease-out motion-reduce:transition-none/);
});

test("reward timing categories are fixed, distinct, and content-selected", () => {
  const experience = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-experience.tsx"),
    "utf8",
  );
  const assessment = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  assert.match(experience, /short: 720/);
  assert.match(experience, /normal: 950/);
  assert.match(experience, /bonus: 1_220/);
  assert.match(experience, /milestone: 1_450/);
  assert.match(experience, /section: 1_750/);
  assert.match(assessment, /rewardMessage\.duration/);
  assert.match(assessment, /placementMotionDurations\.milestone/);
  assert.match(assessment, /placementMotionDurations\.section/);
});

test("result keeps final CEFR, uses qualitative skills, and renders both safe CTAs", () => {
  const source = fs.readFileSync(
    path.join(root, "src/features/placement-test/components/placement-assessment.tsx"),
    "utf8",
  );
  const result = source.slice(source.indexOf("function ResultScreen"), source.indexOf("function AssessmentWelcome"));
  assert.match(result, /\{result\.placement\}/);
  assert.match(result, /copy\.qualitativeLabels\[evidence\.estimatedBand\]/);
  assert.match(result, /<AnimatedSkillIcon skill=\{skill\}/);
  assert.doesNotMatch(result, />\{evidence\.estimatedBand\}</);
  assert.match(result, /href=\{`\/\$\{locale\}`\}/);
  assert.match(result, /copy\.homepageCta/);
  assert.match(result, /copy\.whatsappCta/);
  assert.match(result, /getPlacementWhatsAppHref\(locale, whatsAppMessage\)/);
  assert.match(result, /ctaType/);
  assert.doesNotMatch(result, /attemptToken|attemptId|fullName|phone|email|correctOption/);
});

test("placement WhatsApp uses the approved number and encodes the dynamic result message", () => {
  const {
    getPlacementWhatsAppHref,
    PLACEMENT_TEST_WHATSAPP_NUMBER,
  } = require(path.join(root, "src/lib/utm.ts"));
  const previousNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const message = "المستوى المناسب: B1\nأقوى مهارة: الاستماع";

  try {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "201204110111";
    assert.equal(PLACEMENT_TEST_WHATSAPP_NUMBER, "201204006361");
    assert.equal(
      getPlacementWhatsAppHref("ar", message),
      `https://wa.me/201204006361?text=${encodeURIComponent(message)}`,
    );
  } finally {
    if (previousNumber === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    else process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = previousNumber;
  }
});

test("every question is structurally valid", () => {
  const ids = new Set();
  for (const question of assessmentQuestions) {
    assert.equal(ids.has(question.id), false, `duplicate id ${question.id}`);
    ids.add(question.id);
    assert.equal(question.options.length, 4, `${question.id} option count`);
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4);
    assert.equal(question.options.some((option) => option.id === question.correctOption), true);
    assert.equal(question.timeLimitSeconds > 0, true);
    assert.equal(Boolean(question.construct), true);
    if (question.section === "reading") {
      assert.equal(Boolean(question.passageId), true);
      assert.ok(getPassage(question.passageId), `${question.id} passage reference`);
    }
    if (question.section === "listening") {
      assert.equal(Boolean(question.audioId), true);
      assert.ok(audioAssets.some((asset) => asset.id === question.audioId), `${question.id} audio reference`);
    }
  }
});

test("every listening asset is playable and exists locally", () => {
  assert.equal(audioAssets.length, 10);
  for (const asset of audioAssets) {
    assert.equal(isPlayableAudioAsset(asset), true, `${asset.id} range`);
    assert.equal(fs.existsSync(path.join(root, "public", asset.source.replace(/^\//, ""))), true, `${asset.id} file`);
  }
});

test("seeded selection is stable and preserves block forms", () => {
  assert.deepEqual(selectForms("same-seed"), selectForms("same-seed"));
  const selected = selectForms("block-integrity");
  const selectedQuestions = getQuestions(buildCoreSequence(assessmentQuestions, selected));
  for (const question of selectedQuestions) {
    assert.equal(question.form, selected[question.blockId]);
  }
});

test("placement count gates match the fixed assessment evidence totals", () => {
  assert.deepEqual(PLACEMENT_COUNT_GATES.A1, {
    total: 6,
    normalPass: 5,
    borderline: 4,
    extreme: 3,
  });
  assert.deepEqual(PLACEMENT_COUNT_GATES.A2, {
    total: 7,
    normalPass: 5,
    borderline: 4,
    extreme: 3,
  });
  assert.deepEqual(PLACEMENT_COUNT_GATES.B1, { total: 15, normalPass: 11, borderline: 10 });
  assert.equal(PLACEMENT_COUNT_GATES.coreB2.B2Entry.normalPass, 5);
  assert.equal(PLACEMENT_COUNT_GATES.coreB2.upperListening.normalPass, 2);
  assert.equal(PLACEMENT_COUNT_GATES.coreB2.upperReading.normalPass, 1);
  assert.equal(PLACEMENT_COUNT_GATES.coreB2.upperLanguageUse.normalPass, 3);
  assert.equal(PLACEMENT_COUNT_GATES.confirmedB2.B2Entry.normalPass, 7);
  assert.equal(PLACEMENT_COUNT_GATES.confirmedB2.upperListening.normalPass, 2);
  assert.equal(PLACEMENT_COUNT_GATES.confirmedB2.upperReading.normalPass, 2);
  assert.equal(PLACEMENT_COUNT_GATES.confirmedB2.upperLanguageUse.normalPass, 4);
});

test("A1 clear and extreme failures cannot jump more than one level", () => {
  const perfectHigher = { A2: 7, B1: 15, ...strongB2Counts, upperLanguageUse: 5 };
  const absoluteFailure = profileForCounts({ A1: 2, ...perfectHigher });
  const weakExtreme = profileForCounts({ A1: 3, A2: 2, B1: 5 });
  const insufficientExtreme = profileForCounts({ A1: 3, A2: 7, B1: 12 });
  const qualifyingExtreme = profileForCounts({ A1: 3, A2: 7, B1: 13 });
  const perfectExtreme = profileForCounts({ A1: 3, ...perfectHigher });

  assert.equal(absoluteFailure.placement, "A1");
  assert.equal(absoluteFailure.confidence, "low");
  assert.equal(weakExtreme.placement, "A1");
  assert.equal(insufficientExtreme.placement, "A1");
  assert.equal(insufficientExtreme.confidence, "low");
  assert.equal(qualifyingExtreme.placement, "A2");
  assert.equal(qualifyingExtreme.confidence, "low");
  assert.equal(perfectExtreme.placement, "A2");
  assert.equal(perfectExtreme.confidence, "low");
});

test("A1 borderline recovery requires approved higher evidence and stops at A2", () => {
  const weak = profileForCounts({ A1: 4, A2: 4, B1: 10 });
  const strongA2 = profileForCounts({ A1: 4, A2: 6, B1: 5 });
  const supportedA2 = profileForCounts({ A1: 4, A2: 5, B1: 12 });
  const normalPass = profileForCounts({ A1: 5, A2: 2, B1: 15, ...strongB2Counts });

  assert.equal(weak.placement, "A1");
  assert.equal(weak.confidence, "medium");
  assert.equal(strongA2.placement, "A2");
  assert.equal(strongA2.confidence, "low");
  assert.equal(supportedA2.placement, "A2");
  assert.equal(supportedA2.confidence, "low");
  assert.equal(normalPass.placement, "A2");
});

test("A2 clear and extreme failures use exceptional independent support only", () => {
  const perfectHigher = { B1: 15, ...strongB2Counts, upperLanguageUse: 5 };
  const absoluteFailure = profileForCounts({ A1: 6, A2: 2, ...perfectHigher });
  const weakExtreme = profileForCounts({ A1: 6, A2: 3, B1: 8 });
  const insufficientExtreme = profileForCounts({ A1: 6, A2: 3, B1: 13, ...strongB2Counts });
  const corroboratedExtreme = profileForCounts({ A1: 6, A2: 3, B1: 14, ...strongB2Counts });
  const perfectB1Extreme = profileForCounts({ A1: 6, A2: 3, B1: 15, upperReading: 2 });

  assert.equal(absoluteFailure.placement, "A2");
  assert.equal(absoluteFailure.confidence, "low");
  assert.equal(weakExtreme.placement, "A2");
  assert.equal(insufficientExtreme.placement, "A2");
  assert.equal(insufficientExtreme.confidence, "low");
  assert.equal(corroboratedExtreme.placement, "B1");
  assert.equal(corroboratedExtreme.confidence, "low");
  assert.equal(perfectB1Extreme.placement, "B1");
  assert.equal(perfectB1Extreme.confidence, "low");
});

test("A2 borderline recovery requires approved B1 support and stops at B1", () => {
  const weak = profileForCounts({ A1: 6, A2: 4, B1: 10 });
  const supported = profileForCounts({ A1: 6, A2: 4, B1: 12, ...strongB2Counts });
  const normalPass = profileForCounts({ A1: 6, A2: 5, B1: 9, ...strongB2Counts });

  assert.equal(weak.placement, "A2");
  assert.equal(weak.confidence, "medium");
  assert.equal(supported.placement, "B1");
  assert.equal(supported.confidence, "low");
  assert.equal(normalPass.placement, "B1");
});

test("B1 clear failure and borderline protection cannot skip normal B2 evaluation", () => {
  const clearFailure = profileForCounts({ A1: 6, A2: 7, B1: 9, ...strongB2Counts });
  const weakBorderline = profileForCounts({ A1: 6, A2: 7, B1: 10 });
  const narrowUpperEvidence = profileForCounts({
    A1: 6,
    A2: 7,
    B1: 10,
    upperListening: 2,
    upperReading: 1,
    upperLanguageUse: 4,
  });
  const confirmedPath = profileForCounts({
    A1: 6,
    A2: 7,
    B1: 10,
    upperListening: 3,
    upperReading: 2,
    upperLanguageUse: 3,
  });

  assert.equal(clearFailure.placement, "B1");
  assert.equal(clearFailure.confidence, "low");
  assert.equal(weakBorderline.placement, "B1");
  assert.equal(narrowUpperEvidence.placement, "B1");
  assert.equal(confirmedPath.placement, "B2");
  assert.equal(confirmedPath.confirmationRequired, true);
  assert.equal(confirmedPath.confidence, "low");
});

test("core B2 entry and upper-skill gates use exact integer boundaries", () => {
  const base = { A1: 6, A2: 7, B1: 12 };
  const entryBelow = profileForCounts({
    ...base,
    upperListening: 2,
    upperReading: 2,
    upperLanguageUse: 2,
  });
  const entryAt = profileForCounts({
    ...base,
    upperListening: 2,
    upperReading: 2,
    upperLanguageUse: 3,
  });
  const listeningBelow = profileForCounts({
    ...base,
    upperListening: 1,
    upperReading: 2,
    upperLanguageUse: 5,
  });
  const listeningAt = profileForCounts({
    ...base,
    upperListening: 2,
    upperReading: 2,
    upperLanguageUse: 4,
  });
  const readingBelow = profileForCounts({
    ...base,
    upperListening: 3,
    upperReading: 0,
    upperLanguageUse: 4,
  });
  const readingAt = profileForCounts({
    ...base,
    upperListening: 3,
    upperReading: 1,
    upperLanguageUse: 4,
  });
  const languageBelow = profileForCounts({
    ...base,
    upperListening: 3,
    upperReading: 2,
    upperLanguageUse: 2,
  });
  const languageAt = profileForCounts({
    ...base,
    upperListening: 3,
    upperReading: 2,
    upperLanguageUse: 3,
  });

  assert.equal(entryBelow.placement, "B1");
  assert.equal(entryAt.placement, "B2");
  assert.equal(entryAt.confirmationRequired, true);
  assert.equal(listeningBelow.placement, "B1");
  assert.equal(listeningAt.placement, "B2");
  assert.equal(listeningAt.confirmationRequired, false);
  assert.equal(readingBelow.placement, "B1");
  assert.equal(readingAt.placement, "B2");
  assert.equal(readingAt.confirmationRequired, true);
  assert.equal(languageBelow.placement, "B1");
  assert.equal(languageAt.placement, "B2");
  assert.equal(languageAt.confirmationRequired, true);
});

test("post-confirmation B2 decisions use 7/12, 2/4, 2/3, and 4/7 counts", () => {
  const coreAnswers = answersForCounts({
    A1: 6,
    A2: 7,
    B1: 12,
    upperListening: 2,
    upperReading: 1,
    upperLanguageUse: 3,
  });
  const confirmationQuestions = assessmentQuestions.filter(
    (question) =>
      question.isConfirmation &&
      (question.form === "confirmation" || question.form === forms["L08-10"]),
  );
  const confirmationAnswers = (correctSlots) =>
    confirmationQuestions.map((question) => ({
      questionId: question.id,
      selectedOption: correctSlots.has(question.slotId)
        ? question.correctOption
        : wrongOption(question.correctOption),
      submittedAt: "2026-01-01T00:00:00.000Z",
      responseTimeMs: 1_000,
      timedOut: false,
    }));
  const questions = [...coreQuestions, ...confirmationQuestions];
  const passed = scorePlacement(
    questions,
    [...coreAnswers, ...confirmationAnswers(new Set(["C02", "C03"]))],
    true,
  );
  const failed = scorePlacement(
    questions,
    [...coreAnswers, ...confirmationAnswers(new Set(["C02"]))],
    true,
  );

  assert.equal(passed.placement, "B2");
  assert.equal(passed.confidence, "low");
  assert.equal(failed.placement, "B1");
  assert.equal(failed.confidence, "low");
});

test("count-based confidence distinguishes clear, boundary, bypass, and contradictory profiles", () => {
  assert.equal(profileForCounts({ A1: 2, A2: 1, B1: 2 }).confidence, "high");
  assert.equal(profileForCounts({ A1: 4, A2: 2, B1: 3 }).confidence, "medium");
  assert.equal(profileForCounts({ A1: 3, A2: 6, B1: 5 }).confidence, "low");
  assert.equal(profileForCounts({ A1: 4, A2: 6, B1: 5 }).confidence, "low");
  assert.equal(profileForCounts({ A1: 6, A2: 4, B1: 12 }).confidence, "low");
  assert.equal(profileForCounts({ A1: 6, A2: 7, B1: 8 }).confidence, "high");
  assert.equal(
    profileForCounts({ A1: 6, A2: 7, B1: 15, ...strongB2Counts }).confidence,
    "high",
  );
});

test("public evidence percentages remain reporting values derived from exact counts", () => {
  const profile = profileForCounts({
    A1: 4,
    A2: 5,
    B1: 10,
    upperListening: 2,
    upperReading: 1,
    upperLanguageUse: 3,
  });
  assert.deepEqual(profile.evidence, { A1: 67, A2: 71, B1: 67, B2Entry: 63 });
});

test("count scoring is equivalent across all-A and all-B form selections", () => {
  const allA = Object.fromEntries(Object.keys(forms).map((blockId) => [blockId, "A"]));
  const allB = Object.fromEntries(Object.keys(forms).map((blockId) => [blockId, "B"]));
  const formAQuestions = getQuestions(buildCoreSequence(assessmentQuestions, allA));
  const formBQuestions = getQuestions(buildCoreSequence(assessmentQuestions, allB));
  const counts = { A1: 4, A2: 6, B1: 12, ...strongB2Counts };
  const formAProfile = profileForCounts(counts, formAQuestions);
  const formBProfile = profileForCounts(counts, formBQuestions);

  assert.equal(formAQuestions.length, 36);
  assert.equal(formBQuestions.length, 36);
  assert.equal(formAProfile.placement, "A2");
  assert.equal(formBProfile.placement, "A2");
  assert.deepEqual(formAProfile.evidence, formBProfile.evidence);
});

test("clear A1 case", () => {
  assert.equal(scorePlacement(coreQuestions, answersWhere(() => false), false).placement, "A1");
});

test("clear A2 case", () => {
  const profile = scorePlacement(
    coreQuestions,
    answersWhere((question) => question.evidenceBand === "A1"),
    false,
  );
  assert.equal(profile.placement, "A2");
});

test("clear B1 case", () => {
  const profile = scorePlacement(
    coreQuestions,
    answersWhere((question) => question.evidenceBand === "A1" || question.evidenceBand === "A2"),
    false,
  );
  assert.equal(profile.placement, "B1");
});

test("clear B2 case", () => {
  assert.equal(scorePlacement(coreQuestions, answersWhere(() => true), false).placement, "B2");
});

test("B1/B2 borderline triggers confirmation", () => {
  let listeningCorrect = 0;
  let languageCorrect = 0;
  const answers = answersWhere((question) => {
    if (question.evidenceBand !== "B2Entry") return true;
    if (question.section === "listening" && listeningCorrect < 2) {
      listeningCorrect += 1;
      return true;
    }
    if (question.section === "languageUse" && languageCorrect < 3) {
      languageCorrect += 1;
      return true;
    }
    return false;
  });
  const profile = scorePlacement(coreQuestions, answers, false);
  assert.equal(profile.confirmationRequired, true);
});

test("confirmation can settle the B2 boundary", () => {
  let listeningCorrect = 0;
  let languageCorrect = 0;
  const coreAnswers = answersWhere((question) => {
    if (question.evidenceBand !== "B2Entry") return true;
    if (question.section === "listening" && listeningCorrect < 2) {
      listeningCorrect += 1;
      return true;
    }
    if (question.section === "languageUse" && languageCorrect < 3) {
      languageCorrect += 1;
      return true;
    }
    return false;
  });
  const confirmationQuestions = assessmentQuestions.filter((question) => question.isConfirmation && (question.form === "confirmation" || question.form === forms["L08-10"]));
  const confirmationAnswers = confirmationQuestions.map((question) => ({
    questionId: question.id,
    selectedOption: question.correctOption,
    submittedAt: "2026-01-01T00:00:00.000Z",
    responseTimeMs: 1_000,
    timedOut: false,
  }));
  const profile = scorePlacement(
    [...coreQuestions, ...confirmationQuestions],
    [...coreAnswers, ...confirmationAnswers],
    true,
  );
  assert.equal(profile.placement, "B2");
  assert.equal(profile.confirmationUsed, true);
});

test("a weak upper listening skill prevents inappropriate B2 placement", () => {
  const profile = scorePlacement(
    coreQuestions,
    answersWhere((question) => !(question.section === "listening" && question.evidenceBand === "B2Entry")),
    false,
  );
  assert.equal(profile.placement, "B1");
  assert.equal(profile.b2Readiness, false);
});

test("attempt storage resumes the exact seeded sequence", async () => {
  const { token, attempt } = await createStoredAttempt("ar", "lead-test-resume");
  const resumed = await readStoredAttempt(token);
  assert.ok(resumed);
  assert.deepEqual(resumed.coreSequence, attempt.coreSequence);
  assert.deepEqual(resumed.selectedForms, attempt.selectedForms);
  assert.equal(
    assessmentQuestions.find((question) => question.id === resumed.coreSequence[0])?.section,
    "languageUse",
  );
});

test("public state never exposes an answer key", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-public-payload");
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening", "reading", "languageUse"];
    attempt.currentIndex = firstQuestionIndex(attempt.coreSequence, "languageUse");
    attempt.currentSection = "languageUse";
    attempt.budgetRunningSince = new Date().toISOString();
  });
  const state = await getPublicAttemptState(token);
  assert.ok(state?.question);
  assert.equal("correctOption" in state.question, false);
  assert.equal("evidenceBand" in state.question, false);
  assert.equal("construct" in state.question, false);
});

test("an attempt cannot submit another attempt's question", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-cross-attempt");
  let currentQuestionId;
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening", "reading", "languageUse"];
    attempt.currentIndex = firstQuestionIndex(attempt.coreSequence, "languageUse");
    attempt.currentSection = "languageUse";
    attempt.budgetRunningSince = new Date().toISOString();
    currentQuestionId = attempt.coreSequence[attempt.currentIndex];
  });
  await applyAttemptAction(token, { action: "begin_question", questionId: currentQuestionId });
  await assert.rejects(
    () => applyAttemptAction(token, { action: "answer", questionId: "LU16-A", optionId: "A" }),
    (error) => error?.code === "invalid_question",
  );
});

test("audio playback is paced, excluded from the active budget, and precedes the answer timer", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-audio-timing");
  let questionId;
  let blockId;
  let expectedDuration;
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date(Date.now() - 5_000).toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening"];
    attempt.currentSection = "listening";
    attempt.budgetRunningSince = new Date(Date.now() - 5_000).toISOString();
    attempt.currentIndex = firstQuestionIndex(attempt.coreSequence, "listening");
    questionId = attempt.coreSequence[attempt.currentIndex];
    const question = assessmentQuestions.find((item) => item.id === questionId);
    const asset = audioAssets.find((item) => item.id === question?.audioId);
    blockId = question?.blockId;
    expectedDuration = asset?.expectedDurationSeconds;
  });
  assert.ok(questionId && blockId && expectedDuration);

  await applyAttemptAction(token, { action: "audio_start", questionId });
  const paused = await readStoredAttempt(token);
  assert.ok(paused);
  assert.equal(paused.budgetRunningSince, null);
  const pausedBudget = paused.budgetRemainingMs;

  await assert.rejects(
    () => applyAttemptAction(token, {
      action: "audio_progress",
      questionId,
      progressSeconds: expectedDuration,
    }),
    (error) => error?.code === "invalid_audio_progress",
  );

  await updateStoredAttempt(token, (attempt) => {
    attempt.audioPlayback[blockId].startedAt = new Date(
      Date.now() - (expectedDuration + 3) * 1_000,
    ).toISOString();
  });
  await applyAttemptAction(token, {
    action: "audio_progress",
    questionId,
    progressSeconds: expectedDuration,
  });
  const afterProgress = await readStoredAttempt(token);
  assert.ok(afterProgress);
  assert.equal(afterProgress.budgetRemainingMs, pausedBudget);
  assert.equal(afterProgress.questionDeadlineAt, null);

  await applyAttemptAction(token, { action: "audio_complete", questionId });
  const ready = await readStoredAttempt(token);
  assert.ok(ready);
  assert.notEqual(ready.budgetRunningSince, null);
  assert.equal(ready.questionDeadlineAt, null);

  await applyAttemptAction(token, { action: "begin_question", questionId });
  const timed = await readStoredAttempt(token);
  assert.ok(timed?.questionDeadlineAt);
});

test("failed audio startup remains retryable and does not consume playback", async () => {
  const token = await createListeningFixture("audio-failure", ["L01-A"]);

  await applyAttemptAction(token, { action: "audio_failed", questionId: "L01-A" });
  await applyAttemptAction(token, { action: "audio_start", questionId: "L01-A" });
  await applyAttemptAction(token, { action: "audio_failed", questionId: "L01-A" });
  const failed = await readStoredAttempt(token);
  assert.ok(failed);
  assert.equal(failed.audioPlayback.L01.status, "not_started");
  assert.equal(failed.audioPlayback.L01.progressSeconds, 0);
  assert.equal(failed.audioPlayback.L01.startedAt, null);
  assert.notEqual(failed.budgetRunningSince, null);

  await applyAttemptAction(token, { action: "audio_start", questionId: "L01-A" });
  const retried = await readStoredAttempt(token);
  assert.equal(retried?.audioPlayback.L01.status, "playing");
});

test("Form A and Form B audio resume by elapsed progress and cannot replay after completion", async () => {
  for (const form of ["A", "B"]) {
    const questionId = `L01-${form}`;
    const token = await createListeningFixture(`audio-form-${form}`, [questionId]);
    const before = await getPublicAttemptState(token);
    assert.equal(before?.audio?.source, `/placement-test/audio/test-${form.toLowerCase()}-q01.mp3`);

    await applyAttemptAction(token, { action: "audio_start", questionId });
    const expectedDuration = before?.audio?.expectedDurationSeconds;
    assert.ok(expectedDuration);
    await updateStoredAttempt(token, (attempt) => {
      attempt.audioPlayback.L01.startedAt = new Date(
        Date.now() - (expectedDuration + 1) * 1_000,
      ).toISOString();
    });

    const refreshed = await getPublicAttemptState(token);
    assert.equal(refreshed?.phase, "question");
    assert.equal(refreshed?.audio?.status, "completed");
    assert.equal(refreshed?.audio?.progressSeconds, expectedDuration);

    const replay = await applyAttemptAction(token, { action: "audio_start", questionId });
    assert.equal(replay.phase, "question");
    assert.equal(replay.audio?.status, "completed");
  }
});

test("one completed audio block unlocks every attached listening question", async () => {
  const token = await createListeningFixture("audio-block", ["L03-A", "L04-A"]);
  const initial = await getPublicAttemptState(token);
  const expectedDuration = initial?.audio?.expectedDurationSeconds;
  assert.ok(expectedDuration);

  await applyAttemptAction(token, { action: "audio_start", questionId: "L03-A" });
  await updateStoredAttempt(token, (attempt) => {
    attempt.audioPlayback["L03-04"].startedAt = new Date(
      Date.now() - (expectedDuration + 1) * 1_000,
    ).toISOString();
  });
  const firstQuestion = await getPublicAttemptState(token);
  assert.equal(firstQuestion?.phase, "question");
  await applyAttemptAction(token, { action: "begin_question", questionId: "L03-A" });
  await applyAttemptAction(token, { action: "answer", questionId: "L03-A", optionId: "B" });

  const secondQuestion = await getPublicAttemptState(token);
  assert.equal(secondQuestion?.question?.id, "L04-A");
  assert.equal(secondQuestion?.phase, "question");
  assert.equal(secondQuestion?.audio?.status, "completed");
  assert.equal(secondQuestion?.questionDeadlineAt, null);
  await assert.rejects(
    () => applyAttemptAction(token, { action: "answer", questionId: "L03-A", optionId: "A" }),
    (error) => error?.code === "invalid_question",
  );
});

test("expired answers are recorded as timeouts and refresh cannot reset them", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-timeout");
  let questionId;
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date(Date.now() - 60_000).toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening", "reading", "languageUse"];
    attempt.currentIndex = firstQuestionIndex(attempt.coreSequence, "languageUse");
    attempt.currentSection = "languageUse";
    attempt.budgetRunningSince = new Date().toISOString();
    questionId = attempt.coreSequence[attempt.currentIndex];
    attempt.questionStartedAt = new Date(Date.now() - 40_000).toISOString();
    attempt.questionDeadlineAt = new Date(Date.now() - 10_000).toISOString();
  });
  const firstRefresh = await getPublicAttemptState(token);
  const secondRefresh = await getPublicAttemptState(token);
  const stored = await readStoredAttempt(token);
  assert.ok(firstRefresh && secondRefresh && stored);
  assert.equal(stored.answers.filter((answer) => answer.questionId === questionId).length, 1);
  assert.equal(stored.answers.find((answer) => answer.questionId === questionId)?.timedOut, true);
  assert.equal(stored.currentIndex, firstQuestionIndex(stored.coreSequence, "languageUse") + 1);
});

test("invalid opaque attempt tokens are rejected", async () => {
  assert.equal(await readStoredAttempt("predictable-token"), null);
  assert.equal(await getPublicAttemptState("predictable-token"), null);
});

(async () => {
  let failures = 0;
  for (const { name, run } of tests) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  fs.rmSync(testDataDirectory, { recursive: true, force: true });
  if (failures > 0) process.exitCode = 1;
  else console.log(`\n${tests.length} placement tests passed.`);
})().catch((error) => {
  fs.rmSync(testDataDirectory, { recursive: true, force: true });
  console.error(error);
  process.exitCode = 1;
});
