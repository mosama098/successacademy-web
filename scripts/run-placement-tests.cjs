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
const { scorePlacement } = require(path.join(
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
const { applyAttemptAction, getPublicAttemptState } = require(path.join(
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

function wrongOption(correct) {
  return correct === "A" ? "B" : "A";
}

async function createListeningFixture(name, questionIds) {
  const { token } = await createStoredAttempt("en", `lead-test-${name}`);
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening"];
    attempt.currentSection = "listening";
    attempt.coreSequence = [
      ...questionIds,
      ...attempt.coreSequence.filter((id) => !questionIds.includes(id)),
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
});

test("public state never exposes an answer key", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-public-payload");
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date().toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening", "reading", "languageUse"];
    attempt.currentIndex = 20;
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
    attempt.currentIndex = 20;
    attempt.currentSection = "languageUse";
    attempt.budgetRunningSince = new Date().toISOString();
    currentQuestionId = attempt.coreSequence[20];
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
    questionId = attempt.coreSequence[0];
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
});

test("expired answers are recorded as timeouts and refresh cannot reset them", async () => {
  const { token } = await createStoredAttempt("en", "lead-test-timeout");
  let questionId;
  await updateStoredAttempt(token, (attempt) => {
    attempt.status = "in_progress";
    attempt.startedAt = new Date(Date.now() - 60_000).toISOString();
    attempt.audioCheckCompleted = true;
    attempt.introducedSections = ["listening", "reading", "languageUse"];
    attempt.currentIndex = 20;
    attempt.currentSection = "languageUse";
    attempt.budgetRunningSince = new Date().toISOString();
    questionId = attempt.coreSequence[20];
    attempt.questionStartedAt = new Date(Date.now() - 40_000).toISOString();
    attempt.questionDeadlineAt = new Date(Date.now() - 10_000).toISOString();
  });
  const firstRefresh = await getPublicAttemptState(token);
  const secondRefresh = await getPublicAttemptState(token);
  const stored = await readStoredAttempt(token);
  assert.ok(firstRefresh && secondRefresh && stored);
  assert.equal(stored.answers.filter((answer) => answer.questionId === questionId).length, 1);
  assert.equal(stored.answers.find((answer) => answer.questionId === questionId)?.timedOut, true);
  assert.equal(stored.currentIndex, 21);
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
