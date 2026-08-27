import type {
  AssessmentQuestion,
  AssessmentSection,
  EvidenceBand,
  PlacementConfidence,
  PlacementLevel,
  PlacementProfile,
  StoredAnswer,
} from "../types";

const A2_MIN_CORE_CORRECT = 18;
const B1_MIN_CORE_CORRECT = 23;
const B2_MIN_CORE_CORRECT = 29;

const B1_MIN_LISTENING_CORRECT = 4;
const B1_MIN_READING_CORRECT = 4;
const B1_MIN_LANGUAGE_USE_CORRECT = 7;

const B2_MIN_LISTENING_CORRECT = 6;
const B2_MIN_READING_CORRECT = 6;
const B2_MIN_LANGUAGE_USE_CORRECT = 10;

export const PLACEMENT_COUNT_GATES = {
  core: {
    total: 36,
    A2: A2_MIN_CORE_CORRECT,
    B1: B1_MIN_CORE_CORRECT,
    B2: B2_MIN_CORE_CORRECT,
  },
  B1Skills: {
    listening: B1_MIN_LISTENING_CORRECT,
    reading: B1_MIN_READING_CORRECT,
    languageUse: B1_MIN_LANGUAGE_USE_CORRECT,
  },
  B2Skills: {
    listening: B2_MIN_LISTENING_CORRECT,
    reading: B2_MIN_READING_CORRECT,
    languageUse: B2_MIN_LANGUAGE_USE_CORRECT,
  },
  coreB2: {
    B2Entry: { total: 8, normalPass: 5, strong: 6 },
    upperListening: { total: 3, normalPass: 2, strong: 3 },
    upperReading: { total: 2, normalPass: 1, strong: 2 },
    upperLanguageUse: { total: 5, normalPass: 3, strong: 4 },
    requiredStrongSkills: 2,
  },
  confirmedB2: {
    B2Entry: { total: 12, normalPass: 7 },
    upperListening: { total: 4, normalPass: 2 },
    upperReading: { total: 3, normalPass: 2 },
    upperLanguageUse: { total: 7, normalPass: 4 },
  },
} as const;

const CORE_DECISION_BOUNDARIES = new Set([17, 18, 22, 23, 28, 29]);

type CountScore = {
  correct: number;
  total: number;
  percent: number;
};

type EvidenceCounts = {
  A1: CountScore;
  A2: CountScore;
  B1: CountScore;
  B2Entry: CountScore;
  upperListening: CountScore;
  upperReading: CountScore;
  upperLanguageUse: CountScore;
};

type CoreSkillCounts = Record<AssessmentSection, CountScore>;

type B2CountGates = {
  B2Entry: { normalPass: number };
  upperListening: { normalPass: number };
  upperReading: { normalPass: number };
  upperLanguageUse: { normalPass: number };
};

type PlacementGuardrail = "B1-skill-floor" | "B2-skill-floor" | "B2-protection";

type PlacementDecision = {
  placement: PlacementLevel;
  guardrail: PlacementGuardrail | null;
};

export function scorePlacement(
  questions: readonly AssessmentQuestion[],
  answers: readonly StoredAnswer[],
  confirmationUsed: boolean,
): PlacementProfile {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scoredQuestions = questions.filter((question) => answerByQuestion.has(question.id));
  const coreQuestions = questions.filter((question) => !question.isConfirmation);

  const counts = scoreEvidence(scoredQuestions, answerByQuestion);
  const coreCounts = scoreEvidence(coreQuestions, answerByQuestion);
  const coreSkills: CoreSkillCounts = {
    listening: scoreSkill(coreQuestions, answerByQuestion, "listening"),
    reading: scoreSkill(coreQuestions, answerByQuestion, "reading"),
    languageUse: scoreSkill(coreQuestions, answerByQuestion, "languageUse"),
  };
  const coreCorrect = Object.values(coreSkills).reduce(
    (total, skill) => total + skill.correct,
    0,
  );
  const passesB1SkillFloor = passesSkillFloor(coreSkills, PLACEMENT_COUNT_GATES.B1Skills);
  const passesB2SkillFloor = passesSkillFloor(coreSkills, PLACEMENT_COUNT_GATES.B2Skills);
  const canEvaluateB2 =
    coreCorrect >= B2_MIN_CORE_CORRECT && passesB1SkillFloor && passesB2SkillFloor;
  const b2Gates = confirmationUsed
    ? PLACEMENT_COUNT_GATES.confirmedB2
    : PLACEMENT_COUNT_GATES.coreB2;
  const coreB2EvidencePasses = passesB2Gates(coreCounts, PLACEMENT_COUNT_GATES.coreB2);
  const b2Readiness = canEvaluateB2 && passesB2Gates(counts, b2Gates);
  const decision = determinePlacement({
    coreCorrect,
    passesB1SkillFloor,
    passesB2SkillFloor,
    b2Readiness,
  });
  const confirmationRequired =
    !confirmationUsed &&
    canEvaluateB2 &&
    coreB2EvidencePasses &&
    isCoreB2ConfirmationBoundary(coreCounts);

  const listening = scoreSkill(scoredQuestions, answerByQuestion, "listening");
  const reading = scoreSkill(scoredQuestions, answerByQuestion, "reading");
  const languageUse = scoreSkill(scoredQuestions, answerByQuestion, "languageUse");
  const skills = { listening, reading, languageUse };
  const sortedSkills = (Object.keys(skills) as AssessmentSection[]).sort(
    (left, right) => skills[right].percent - skills[left].percent,
  );

  return {
    placement: decision.placement,
    confidence: classifyConfidence({
      decision,
      coreCorrect,
      confirmationRequired,
      confirmationUsed,
    }),
    listening,
    reading,
    languageUse,
    evidence: {
      A1: counts.A1.percent,
      A2: counts.A2.percent,
      B1: counts.B1.percent,
      B2Entry: counts.B2Entry.percent,
    },
    strongestSkill: sortedSkills[0],
    weakestSkill: sortedSkills.at(-1) ?? sortedSkills[0],
    b2Readiness,
    confirmationRequired,
    confirmationUsed,
  };
}

function determinePlacement(values: {
  coreCorrect: number;
  passesB1SkillFloor: boolean;
  passesB2SkillFloor: boolean;
  b2Readiness: boolean;
}): PlacementDecision {
  const { coreCorrect, passesB1SkillFloor, passesB2SkillFloor, b2Readiness } = values;

  if (coreCorrect < A2_MIN_CORE_CORRECT) {
    return { placement: "A1", guardrail: null };
  }
  if (coreCorrect < B1_MIN_CORE_CORRECT) {
    return { placement: "A2", guardrail: null };
  }
  if (!passesB1SkillFloor) {
    return { placement: "A2", guardrail: "B1-skill-floor" };
  }
  if (coreCorrect < B2_MIN_CORE_CORRECT) {
    return { placement: "B1", guardrail: null };
  }
  if (!passesB2SkillFloor) {
    return { placement: "B1", guardrail: "B2-skill-floor" };
  }
  if (!b2Readiness) {
    return { placement: "B1", guardrail: "B2-protection" };
  }
  return { placement: "B2", guardrail: null };
}

function passesSkillFloor(
  skills: CoreSkillCounts,
  minimums: Readonly<Record<AssessmentSection, number>>,
) {
  return (Object.keys(minimums) as AssessmentSection[]).every(
    (skill) => skills[skill].correct >= minimums[skill],
  );
}

function scoreEvidence(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
): EvidenceCounts {
  return {
    A1: scoreBand(questions, answerByQuestion, "A1"),
    A2: scoreBand(questions, answerByQuestion, "A2"),
    B1: scoreBand(questions, answerByQuestion, "B1"),
    B2Entry: scoreBand(questions, answerByQuestion, "B2Entry"),
    upperListening: scoreUpperSkill(questions, answerByQuestion, "listening"),
    upperReading: scoreUpperSkill(questions, answerByQuestion, "reading"),
    upperLanguageUse: scoreUpperSkill(questions, answerByQuestion, "languageUse"),
  };
}

function passesB2Gates(counts: EvidenceCounts, gates: B2CountGates) {
  return (
    counts.B2Entry.correct >= gates.B2Entry.normalPass &&
    counts.upperListening.correct >= gates.upperListening.normalPass &&
    counts.upperReading.correct >= gates.upperReading.normalPass &&
    counts.upperLanguageUse.correct >= gates.upperLanguageUse.normalPass
  );
}

function isCoreB2ConfirmationBoundary(counts: EvidenceCounts) {
  const gates = PLACEMENT_COUNT_GATES.coreB2;
  return (
    counts.B2Entry.correct === gates.B2Entry.normalPass ||
    counts.upperReading.correct === gates.upperReading.normalPass ||
    counts.upperLanguageUse.correct === gates.upperLanguageUse.normalPass
  );
}

function scoreBand(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  band: EvidenceBand,
) {
  return countFor(
    questions.filter((question) => question.evidenceBand === band),
    answerByQuestion,
  );
}

function scoreSkill(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  skill: AssessmentSection,
) {
  const score = countFor(
    questions.filter((question) => question.skill === skill),
    answerByQuestion,
  );

  return {
    ...score,
    estimatedBand: bandFromPercent(score.percent),
  };
}

function scoreUpperSkill(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  skill: AssessmentSection,
) {
  return countFor(
    questions.filter(
      (question) =>
        question.skill === skill &&
        (question.evidenceBand === "B2Entry" ||
          (skill === "reading" && (question.slotId === "R09" || question.slotId === "R10"))),
    ),
    answerByQuestion,
  );
}

function countFor(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
): CountScore {
  const correct = questions.filter(
    (question) => answerByQuestion.get(question.id)?.selectedOption === question.correctOption,
  ).length;
  return {
    correct,
    total: questions.length,
    percent: questions.length === 0 ? 0 : roundPercent(correct, questions.length),
  };
}

function roundPercent(correct: number, total: number) {
  return Math.round((correct / total) * 100);
}

function bandFromPercent(percent: number): PlacementLevel {
  if (percent >= 80) return "B2";
  if (percent >= 65) return "B1";
  if (percent >= 45) return "A2";
  return "A1";
}

function classifyConfidence(values: {
  decision: PlacementDecision;
  coreCorrect: number;
  confirmationRequired: boolean;
  confirmationUsed: boolean;
}): PlacementConfidence {
  const { decision, coreCorrect, confirmationRequired, confirmationUsed } = values;

  if (decision.guardrail || confirmationRequired || confirmationUsed) return "low";
  if (CORE_DECISION_BOUNDARIES.has(coreCorrect)) return "medium";
  return "high";
}
