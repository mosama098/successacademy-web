import "server-only";
import type { AssessmentQuestion, ReadingPassage } from "../types";
import { languageUseQuestions } from "./language-use-content";
import { listeningQuestions } from "./listening-content";
import { readingPassages, readingQuestions } from "./reading-content";

export const assessmentQuestions: readonly AssessmentQuestion[] = [
  ...listeningQuestions,
  ...readingQuestions,
  ...languageUseQuestions,
];

const questionById = new Map(assessmentQuestions.map((question) => [question.id, question]));
const passageById = new Map(readingPassages.map((passage) => [passage.id, passage]));

export function getQuestion(id: string) {
  return questionById.get(id) ?? null;
}

export function getQuestions(ids: readonly string[]) {
  return ids.map((id) => getQuestion(id)).filter(isQuestion);
}

export function getPassage(id: string | undefined): ReadingPassage | null {
  return id ? passageById.get(id) ?? null : null;
}

export function getConfirmationSequence(selectedUpperListeningForm: "A" | "B") {
  return [`C01-${selectedUpperListeningForm}`, "C02", "C03", "C04"];
}

function isQuestion(value: AssessmentQuestion | null): value is AssessmentQuestion {
  return value !== null;
}
