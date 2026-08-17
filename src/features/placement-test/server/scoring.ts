import type {
  AssessmentQuestion,
  AssessmentSection,
  EvidenceBand,
  PlacementConfidence,
  PlacementLevel,
  PlacementProfile,
  StoredAnswer,
} from "../types";

export const PLACEMENT_THRESHOLDS = {
  A1: 70,
  A2: 65,
  B1: 70,
  B2Entry: 55,
  upperListening: 50,
  upperReading: 50,
  upperLanguageUse: 55,
  // Eight points accommodates the discrete 12.5-point core B2 item steps while
  // remaining faithful to the requested approximately seven-point boundary band.
  boundaryMargin: 8,
} as const;

export function scorePlacement(
  questions: readonly AssessmentQuestion[],
  answers: readonly StoredAnswer[],
  confirmationUsed: boolean,
): PlacementProfile {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scoredQuestions = questions.filter((question) => answerByQuestion.has(question.id));

  const evidence = {
    A1: scoreBand(scoredQuestions, answerByQuestion, "A1"),
    A2: scoreBand(scoredQuestions, answerByQuestion, "A2"),
    B1: scoreBand(scoredQuestions, answerByQuestion, "B1"),
    B2Entry: scoreBand(scoredQuestions, answerByQuestion, "B2Entry"),
  };

  const listening = scoreSkill(scoredQuestions, answerByQuestion, "listening");
  const reading = scoreSkill(scoredQuestions, answerByQuestion, "reading");
  const languageUse = scoreSkill(scoredQuestions, answerByQuestion, "languageUse");
  const upperListening = scoreUpperSkill(scoredQuestions, answerByQuestion, "listening");
  const upperReading = scoreUpperSkill(scoredQuestions, answerByQuestion, "reading");
  const upperLanguageUse = scoreUpperSkill(scoredQuestions, answerByQuestion, "languageUse");

  const lowerGatesPass =
    evidence.A1 >= PLACEMENT_THRESHOLDS.A1 &&
    evidence.A2 >= PLACEMENT_THRESHOLDS.A2 &&
    evidence.B1 >= PLACEMENT_THRESHOLDS.B1;
  const b2Readiness =
    lowerGatesPass &&
    evidence.B2Entry >= PLACEMENT_THRESHOLDS.B2Entry &&
    upperListening >= PLACEMENT_THRESHOLDS.upperListening &&
    upperReading >= PLACEMENT_THRESHOLDS.upperReading &&
    upperLanguageUse >= PLACEMENT_THRESHOLDS.upperLanguageUse;
  const confirmationRequired =
    !confirmationUsed && lowerGatesPass && isNearB2Boundary({
      B2Entry: evidence.B2Entry,
      upperListening,
      upperReading,
      upperLanguageUse,
    });
  const placement = determinePlacement(evidence, b2Readiness);

  const skills = { listening, reading, languageUse };
  const sortedSkills = (Object.keys(skills) as AssessmentSection[]).sort(
    (left, right) => skills[right].percent - skills[left].percent,
  );

  return {
    placement,
    confidence: classifyConfidence(placement, evidence, confirmationUsed),
    listening,
    reading,
    languageUse,
    evidence,
    strongestSkill: sortedSkills[0],
    weakestSkill: sortedSkills.at(-1) ?? sortedSkills[0],
    b2Readiness,
    confirmationRequired,
    confirmationUsed,
  };
}

function determinePlacement(
  evidence: PlacementProfile["evidence"],
  b2Readiness: boolean,
): PlacementLevel {
  if (evidence.A1 < PLACEMENT_THRESHOLDS.A1) return "A1";
  if (evidence.A2 < PLACEMENT_THRESHOLDS.A2) return "A2";
  if (evidence.B1 < PLACEMENT_THRESHOLDS.B1) return "B1";
  return b2Readiness ? "B2" : "B1";
}

function scoreBand(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  band: EvidenceBand,
) {
  return percentFor(questions.filter((question) => question.evidenceBand === band), answerByQuestion);
}

function scoreSkill(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  skill: AssessmentSection,
) {
  const relevant = questions.filter((question) => question.skill === skill);
  const correct = relevant.filter(
    (question) => answerByQuestion.get(question.id)?.selectedOption === question.correctOption,
  ).length;
  const percent = relevant.length === 0 ? 0 : roundPercent(correct, relevant.length);

  return {
    correct,
    total: relevant.length,
    percent,
    estimatedBand: bandFromPercent(percent),
  };
}

function scoreUpperSkill(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
  skill: AssessmentSection,
) {
  return percentFor(
    questions.filter(
      (question) =>
        question.skill === skill &&
        (question.evidenceBand === "B2Entry" ||
          (skill === "reading" && (question.slotId === "R09" || question.slotId === "R10"))),
    ),
    answerByQuestion,
  );
}

function percentFor(
  questions: readonly AssessmentQuestion[],
  answerByQuestion: ReadonlyMap<string, StoredAnswer>,
) {
  if (questions.length === 0) return 0;
  const correct = questions.filter(
    (question) => answerByQuestion.get(question.id)?.selectedOption === question.correctOption,
  ).length;
  return roundPercent(correct, questions.length);
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

function isNearB2Boundary(values: {
  B2Entry: number;
  upperListening: number;
  upperReading: number;
  upperLanguageUse: number;
}) {
  const checks = [
    [values.B2Entry, PLACEMENT_THRESHOLDS.B2Entry],
    [values.upperListening, PLACEMENT_THRESHOLDS.upperListening],
    [values.upperReading, PLACEMENT_THRESHOLDS.upperReading],
    [values.upperLanguageUse, PLACEMENT_THRESHOLDS.upperLanguageUse],
  ] as const;

  return checks.every(
    ([value, threshold]) => value >= threshold - PLACEMENT_THRESHOLDS.boundaryMargin,
  ) && checks.some(
    ([value, threshold]) => Math.abs(value - threshold) <= PLACEMENT_THRESHOLDS.boundaryMargin,
  );
}

function classifyConfidence(
  placement: PlacementLevel,
  evidence: PlacementProfile["evidence"],
  confirmationUsed: boolean,
): PlacementConfidence {
  if (confirmationUsed) return "low";

  const relevantDistance =
    placement === "A1"
      ? Math.abs(evidence.A1 - PLACEMENT_THRESHOLDS.A1)
      : placement === "A2"
        ? Math.min(
            Math.abs(evidence.A1 - PLACEMENT_THRESHOLDS.A1),
            Math.abs(evidence.A2 - PLACEMENT_THRESHOLDS.A2),
          )
        : placement === "B1"
          ? Math.min(
              Math.abs(evidence.A2 - PLACEMENT_THRESHOLDS.A2),
              Math.abs(evidence.B1 - PLACEMENT_THRESHOLDS.B1),
              Math.abs(evidence.B2Entry - PLACEMENT_THRESHOLDS.B2Entry),
            )
          : Math.abs(evidence.B2Entry - PLACEMENT_THRESHOLDS.B2Entry);

  if (relevantDistance <= PLACEMENT_THRESHOLDS.boundaryMargin) return "low";
  if (relevantDistance <= PLACEMENT_THRESHOLDS.boundaryMargin * 2) return "medium";
  return "high";
}
