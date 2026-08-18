import { createHash } from "node:crypto";
import type { AssessmentQuestion, SelectedForms } from "../types";

export const CORE_BLOCK_IDS = [
  "L01",
  "L02",
  "L03-04",
  "L05-07",
  "L08-10",
  "R01",
  "R02",
  "R03-04",
  "R05-06",
  "R07-10",
  ...Array.from({ length: 16 }, (_, index) => `LU${String(index + 1).padStart(2, "0")}`),
] as const;

export function selectForms(seed: string): SelectedForms {
  return Object.fromEntries(
    CORE_BLOCK_IDS.map((blockId) => [blockId, seededBit(seed, blockId) ? "B" : "A"]),
  );
}

export function buildCoreSequence(
  questions: readonly AssessmentQuestion[],
  selectedForms: SelectedForms,
) {
  return questions
    .filter((question) => !question.isConfirmation)
    .filter((question) => question.form === selectedForms[question.blockId])
    .sort((left, right) => slotOrder(left.slotId) - slotOrder(right.slotId))
    .map((question) => question.id);
}

function seededBit(seed: string, blockId: string) {
  const digest = createHash("sha256").update(`${seed}:${blockId}`).digest();
  return (digest[0] & 1) === 1;
}

function slotOrder(slotId: string) {
  if (slotId.startsWith("LU")) return Number(slotId.slice(2));
  if (slotId.startsWith("R")) return 100 + Number(slotId.slice(1));
  return 200 + Number(slotId.slice(1));
}
