export const learningLevels = ["A1", "A2", "B1", "B2"] as const;

export type LearningLevel = (typeof learningLevels)[number];

export type LearningPackage = {
  id: "hours-30" | "hours-60" | "hours-90" | "hours-120";
  hours: 30 | 60 | 90 | 120;
  sessions: 10 | 20 | 30 | 40;
  priceEgp: 1750 | 3150 | 4750 | 6300;
};

export const learningPackages = [
  { id: "hours-30", hours: 30, sessions: 10, priceEgp: 1750 },
  { id: "hours-60", hours: 60, sessions: 20, priceEgp: 3150 },
  { id: "hours-90", hours: 90, sessions: 30, priceEgp: 4750 },
  { id: "hours-120", hours: 120, sessions: 40, priceEgp: 6300 },
] as const satisfies readonly LearningPackage[];

const learningHoursByPath = {
  A1: { A2: 30, B1: 60, B2: 120 },
  A2: { B1: 30, B2: 90 },
  B1: { B2: 60 },
  B2: {},
} as const satisfies Record<LearningLevel, Partial<Record<LearningLevel, LearningPackage["hours"]>>>;

export type PlanRecommendation = {
  currentLevel: LearningLevel;
  targetLevel: LearningLevel;
  package: LearningPackage;
};

export type PaymentMethodId = "card" | "installments" | "instapay" | "wallet" | "branch";

export const plannedPaymentMethods = [
  { id: "card", provider: "paymob" },
  { id: "installments", provider: "easykash" },
  { id: "instapay", provider: "manual" },
  { id: "wallet", provider: "manual" },
  { id: "branch", provider: "manual" },
] as const satisfies ReadonlyArray<{ id: PaymentMethodId; provider: "paymob" | "easykash" | "manual" }>;

export function isLearningLevel(value: string | null | undefined): value is LearningLevel {
  return learningLevels.includes(value as LearningLevel);
}

export function getAvailableTargets(currentLevel: LearningLevel | null): LearningLevel[] {
  if (!currentLevel) return [];
  return learningLevels.filter((level) => learningHoursByPath[currentLevel][level as keyof (typeof learningHoursByPath)[typeof currentLevel]] !== undefined);
}

export function getLearningPackage(packageId: string | null | undefined): LearningPackage | null {
  return learningPackages.find((item) => item.id === packageId) ?? null;
}

export function getPlanRecommendation(
  currentLevel: LearningLevel | null,
  targetLevel: LearningLevel | null,
): PlanRecommendation | null {
  if (!currentLevel || !targetLevel) return null;

  const requiredHours = learningHoursByPath[currentLevel][targetLevel as keyof (typeof learningHoursByPath)[typeof currentLevel]];
  if (!requiredHours) return null;

  const recommendedPackage = learningPackages.find((item) => item.hours === requiredHours);
  if (!recommendedPackage) return null;

  return {
    currentLevel,
    targetLevel,
    package: recommendedPackage,
  };
}

