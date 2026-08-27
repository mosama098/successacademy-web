import type {
  AssessmentQuestion,
  AssessmentSection,
  EvidenceBand,
  PlacementConfidence,
  PlacementLevel,
  PlacementProfile,
  StoredAnswer,
} from "../types";

export const PLACEMENT_COUNT_GATES = {
  A1: { total: 6, normalPass: 5, borderline: 4, extreme: 3 },
  A2: { total: 7, normalPass: 5, borderline: 4, extreme: 3 },
  B1: { total: 15, normalPass: 11, borderline: 10 },
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

type B2CountGates = {
  B2Entry: { normalPass: number };
  upperListening: { normalPass: number };
  upperReading: { normalPass: number };
  upperLanguageUse: { normalPass: number };
};

type BoundaryBypass =
  | "A1-borderline"
  | "A1-extreme"
  | "A2-borderline"
  | "A2-extreme"
  | "B1-borderline";

type PlacementDecision = {
  placement: PlacementLevel;
  bypass: BoundaryBypass | null;
};

export function scorePlacement(
  questions: readonly AssessmentQuestion[],
  answers: readonly StoredAnswer[],
  confirmationUsed: boolean,
): PlacementProfile {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scoredQuestions = questions.filter((question) => answerByQuestion.has(question.id));
  const coreQuestions = scoredQuestions.filter((question) => !question.isConfirmation);

  const counts = scoreEvidence(scoredQuestions, answerByQuestion);
  const coreCounts = scoreEvidence(coreQuestions, answerByQuestion);
  const strongB2 = hasStrongB2Evidence(coreCounts);
  const supportAboveA2 = hasSupportAboveA2(coreCounts, strongB2);
  const supportAboveA1 = hasSupportAboveA1(coreCounts, supportAboveA2);
  const canEvaluateB2 =
    coreCounts.A1.correct >= PLACEMENT_COUNT_GATES.A1.normalPass &&
    coreCounts.A2.correct >= PLACEMENT_COUNT_GATES.A2.normalPass &&
    (coreCounts.B1.correct >= PLACEMENT_COUNT_GATES.B1.normalPass ||
      (coreCounts.B1.correct === PLACEMENT_COUNT_GATES.B1.borderline && strongB2));
  const b2Gates = confirmationUsed
    ? PLACEMENT_COUNT_GATES.confirmedB2
    : PLACEMENT_COUNT_GATES.coreB2;
  const coreB2EvidencePasses = passesB2Gates(coreCounts, PLACEMENT_COUNT_GATES.coreB2);
  const b2Readiness = canEvaluateB2 && passesB2Gates(counts, b2Gates);
  const decision = determinePlacement({
    counts: coreCounts,
    strongB2,
    supportAboveA1,
    supportAboveA2,
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
      counts: coreCounts,
      b2Gates,
      coreB2EvidencePasses,
      strongB2,
      supportAboveA1,
      supportAboveA2,
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
  counts: EvidenceCounts;
  strongB2: boolean;
  supportAboveA1: boolean;
  supportAboveA2: boolean;
  b2Readiness: boolean;
}): PlacementDecision {
  const { counts, strongB2, supportAboveA1, supportAboveA2, b2Readiness } = values;
  const A1 = counts.A1.correct;
  const A2 = counts.A2.correct;
  const B1 = counts.B1.correct;

  if (A1 <= PLACEMENT_COUNT_GATES.A1.extreme - 1) {
    return { placement: "A1", bypass: null };
  }
  if (A1 === PLACEMENT_COUNT_GATES.A1.extreme) {
    const extremeSupport = A2 === PLACEMENT_COUNT_GATES.A2.total && B1 >= 13;
    return extremeSupport
      ? { placement: "A2", bypass: "A1-extreme" }
      : { placement: "A1", bypass: null };
  }
  if (A1 === PLACEMENT_COUNT_GATES.A1.borderline) {
    return supportAboveA1
      ? { placement: "A2", bypass: "A1-borderline" }
      : { placement: "A1", bypass: null };
  }

  if (A2 <= PLACEMENT_COUNT_GATES.A2.extreme - 1) {
    return { placement: "A2", bypass: null };
  }
  if (A2 === PLACEMENT_COUNT_GATES.A2.extreme) {
    const extremeSupport =
      B1 === PLACEMENT_COUNT_GATES.B1.total || (B1 >= 14 && strongB2);
    return extremeSupport
      ? { placement: "B1", bypass: "A2-extreme" }
      : { placement: "A2", bypass: null };
  }
  if (A2 === PLACEMENT_COUNT_GATES.A2.borderline) {
    return supportAboveA2
      ? { placement: "B1", bypass: "A2-borderline" }
      : { placement: "A2", bypass: null };
  }

  if (B1 <= PLACEMENT_COUNT_GATES.B1.borderline - 1) {
    return { placement: "B1", bypass: null };
  }
  if (B1 === PLACEMENT_COUNT_GATES.B1.borderline && !strongB2) {
    return { placement: "B1", bypass: null };
  }

  return {
    placement: b2Readiness ? "B2" : "B1",
    bypass: B1 === PLACEMENT_COUNT_GATES.B1.borderline ? "B1-borderline" : null,
  };
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

function hasStrongB2Evidence(counts: EvidenceCounts) {
  const gates = PLACEMENT_COUNT_GATES.coreB2;
  const strongSkills = [
    counts.upperListening.correct >= gates.upperListening.strong,
    counts.upperReading.correct >= gates.upperReading.strong,
    counts.upperLanguageUse.correct >= gates.upperLanguageUse.strong,
  ].filter(Boolean).length;

  return (
    counts.B2Entry.correct >= gates.B2Entry.strong &&
    passesB2Gates(counts, gates) &&
    strongSkills >= gates.requiredStrongSkills
  );
}

function hasSupportAboveA2(counts: EvidenceCounts, strongB2: boolean) {
  return counts.B1.correct >= 12 || (counts.B1.correct >= 11 && strongB2);
}

function hasSupportAboveA1(counts: EvidenceCounts, supportAboveA2: boolean) {
  return counts.A2.correct >= 6 || (counts.A2.correct >= 5 && supportAboveA2);
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
  counts: EvidenceCounts;
  b2Gates: B2CountGates;
  coreB2EvidencePasses: boolean;
  strongB2: boolean;
  supportAboveA1: boolean;
  supportAboveA2: boolean;
  confirmationRequired: boolean;
  confirmationUsed: boolean;
}): PlacementConfidence {
  const {
    decision,
    counts,
    b2Gates,
    coreB2EvidencePasses,
    strongB2,
    supportAboveA1,
    supportAboveA2,
    confirmationRequired,
    confirmationUsed,
  } = values;

  if (decision.bypass || confirmationRequired || confirmationUsed) return "low";
  if (
    hasStrongContradiction(
      decision.placement,
      counts,
      strongB2,
      supportAboveA1,
      supportAboveA2,
    )
  ) {
    return "low";
  }
  if (
    hasModerateContradiction(decision.placement, counts, coreB2EvidencePasses) ||
    isOnDecisionBoundary(decision.placement, counts, b2Gates)
  ) {
    return "medium";
  }
  return "high";
}

function hasStrongContradiction(
  placement: PlacementLevel,
  counts: EvidenceCounts,
  strongB2: boolean,
  supportAboveA1: boolean,
  supportAboveA2: boolean,
) {
  if (placement === "A1") return supportAboveA1;
  if (placement === "A2") return supportAboveA2;
  if (placement === "B1") {
    return counts.B1.correct <= PLACEMENT_COUNT_GATES.B1.borderline - 1 && strongB2;
  }
  return false;
}

function hasModerateContradiction(
  placement: PlacementLevel,
  counts: EvidenceCounts,
  coreB2EvidencePasses: boolean,
) {
  if (placement === "A1") {
    return (
      counts.A2.correct >= PLACEMENT_COUNT_GATES.A2.normalPass ||
      counts.B1.correct >= PLACEMENT_COUNT_GATES.B1.normalPass
    );
  }
  if (placement === "A2") {
    return counts.B1.correct >= PLACEMENT_COUNT_GATES.B1.normalPass;
  }
  if (placement === "B1") return coreB2EvidencePasses;
  return false;
}

function isOnDecisionBoundary(
  placement: PlacementLevel,
  counts: EvidenceCounts,
  b2Gates: B2CountGates,
) {
  if (placement === "A1") return counts.A1.correct === PLACEMENT_COUNT_GATES.A1.borderline;
  if (placement === "A2") {
    return (
      counts.A1.correct === PLACEMENT_COUNT_GATES.A1.normalPass ||
      counts.A2.correct === PLACEMENT_COUNT_GATES.A2.borderline
    );
  }

  const lowerBoundary =
    counts.A1.correct === PLACEMENT_COUNT_GATES.A1.normalPass ||
    counts.A2.correct === PLACEMENT_COUNT_GATES.A2.normalPass ||
    counts.B1.correct === PLACEMENT_COUNT_GATES.B1.normalPass ||
    counts.B1.correct === PLACEMENT_COUNT_GATES.B1.borderline;
  if (lowerBoundary) return true;
  if (placement === "B1" && counts.B1.correct < PLACEMENT_COUNT_GATES.B1.normalPass) {
    return false;
  }

  const b2Values = [
    [counts.B2Entry.correct, b2Gates.B2Entry.normalPass],
    [counts.upperListening.correct, b2Gates.upperListening.normalPass],
    [counts.upperReading.correct, b2Gates.upperReading.normalPass],
    [counts.upperLanguageUse.correct, b2Gates.upperLanguageUse.normalPass],
  ] as const;

  return b2Values.some(([correct, minimum]) =>
    placement === "B2" ? correct === minimum : correct === minimum - 1,
  );
}
