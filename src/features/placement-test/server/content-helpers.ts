import type {
  AssessmentOption,
  AssessmentQuestion,
  DifficultyTier,
  EvidenceBand,
  PlacementLevel,
} from "../types";

const optionIds = ["A", "B", "C", "D"] as const;

export function options(values: readonly [string, string, string, string]): AssessmentOption[] {
  return values.map((text, index) => ({ id: optionIds[index], text }));
}

export function question(
  value: Omit<AssessmentQuestion, "skill" | "isAnchor" | "isConfirmation"> & {
    skill?: AssessmentQuestion["skill"];
    isAnchor?: boolean;
    isConfirmation?: boolean;
  },
): AssessmentQuestion {
  return {
    ...value,
    skill: value.skill ?? value.section,
    isAnchor: value.isAnchor ?? false,
    isConfirmation: value.isConfirmation ?? false,
  };
}

export function bandMetadata(band: EvidenceBand): {
  targetBand: PlacementLevel;
  difficultyTier: DifficultyTier;
} {
  if (band === "A1") return { targetBand: "A1", difficultyTier: "foundation" };
  if (band === "A2") return { targetBand: "A2", difficultyTier: "developing" };
  if (band === "B1") return { targetBand: "B1", difficultyTier: "anchor" };
  return { targetBand: "B2", difficultyTier: "upper" };
}
