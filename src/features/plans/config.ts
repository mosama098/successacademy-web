import type { Locale } from "@/lib/i18n";

export const learningLevels = ["A1", "A2", "B1", "B2"] as const;

export type LearningLevel = (typeof learningLevels)[number];
export const programTypes = ["group", "private"] as const;
export type ProgramType = (typeof programTypes)[number];
export const DEFAULT_PROGRAM_TYPE: ProgramType = "group";

export type LearningPackageId =
  | "starter-30"
  | "progress-60"
  | "proficiency-90"
  | "excellence-120"
  | "private-starter-15"
  | "private-progress-30"
  | "private-proficiency-45"
  | "private-excellence-60";

export const HOURS_PER_LEVEL = 30;
export const SESSION_HOURS = 3;
export const SESSIONS_PER_WEEK = 2;

type LocalizedText = Record<Locale, string>;

type LearningPackageDefinition = {
  id: LearningPackageId;
  programType: ProgramType;
  levelCount: 1 | 2 | 3 | 4;
  hours: 15 | 30 | 45 | 60 | 90 | 120;
  sessions: 10 | 20 | 30 | 40;
  sessionDurationHours: 1.5 | 3;
  estimatedWeeks: 5 | 10 | 15 | 20;
  priceEgp: 2250 | 4500 | 5000 | 6750 | 9000 | 10000 | 15000 | 20000;
  regularPriceEgp: null;
  savingEgp: 0;
  name: LocalizedText;
  positioning: LocalizedText;
};

export const learningPackages = [
  {
    id: "starter-30",
    programType: "group",
    levelCount: 1,
    hours: 30,
    sessions: 10,
    sessionDurationHours: 3,
    estimatedWeeks: 5,
    priceEgp: 2250,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة الانطلاق", en: "Starter Package" },
    positioning: {
      ar: "مستوى واحد كامل بخطة مركزة.",
      en: "One complete level in a focused plan.",
    },
  },
  {
    id: "progress-60",
    programType: "group",
    levelCount: 2,
    hours: 60,
    sessions: 20,
    sessionDurationHours: 3,
    estimatedWeeks: 10,
    priceEgp: 4500,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة التطور", en: "Progress Package" },
    positioning: {
      ar: "مستويان متتاليان في مسار واحد.",
      en: "Two consecutive levels in one plan.",
    },
  },
  {
    id: "proficiency-90",
    programType: "group",
    levelCount: 3,
    hours: 90,
    sessions: 30,
    sessionDurationHours: 3,
    estimatedWeeks: 15,
    priceEgp: 6750,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة الاحتراف", en: "Proficiency Package" },
    positioning: {
      ar: "3 مستويات لبناء تقدم ثابت.",
      en: "Three levels for steady progress.",
    },
  },
  {
    id: "excellence-120",
    programType: "group",
    levelCount: 4,
    hours: 120,
    sessions: 40,
    sessionDurationHours: 3,
    estimatedWeeks: 20,
    priceEgp: 9000,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة التميز", en: "Excellence Package" },
    positioning: {
      ar: "المسار الكامل حتى نهاية B2.",
      en: "The complete path through the end of B2.",
    },
  },
] as const satisfies readonly LearningPackageDefinition[];

export const privateLearningPackages = [
  {
    id: "private-starter-15",
    programType: "private",
    levelCount: 1,
    hours: 15,
    sessions: 10,
    sessionDurationHours: 1.5,
    estimatedWeeks: 5,
    priceEgp: 5000,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة الانطلاق", en: "Starter Package" },
    positioning: { ar: "مستوى واحد كامل بتدريب برايفت 1:1.", en: "One complete level with Private 1:1 training." },
  },
  {
    id: "private-progress-30",
    programType: "private",
    levelCount: 2,
    hours: 30,
    sessions: 20,
    sessionDurationHours: 1.5,
    estimatedWeeks: 10,
    priceEgp: 10000,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة التطور", en: "Progress Package" },
    positioning: { ar: "مستويان متتاليان بتدريب برايفت 1:1.", en: "Two consecutive levels with Private 1:1 training." },
  },
  {
    id: "private-proficiency-45",
    programType: "private",
    levelCount: 3,
    hours: 45,
    sessions: 30,
    sessionDurationHours: 1.5,
    estimatedWeeks: 15,
    priceEgp: 15000,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة الاحتراف", en: "Proficiency Package" },
    positioning: { ar: "3 مستويات بتدريب برايفت 1:1.", en: "Three levels with Private 1:1 training." },
  },
  {
    id: "private-excellence-60",
    programType: "private",
    levelCount: 4,
    hours: 60,
    sessions: 40,
    sessionDurationHours: 1.5,
    estimatedWeeks: 20,
    priceEgp: 20000,
    regularPriceEgp: null,
    savingEgp: 0,
    name: { ar: "باقة التميز", en: "Excellence Package" },
    positioning: { ar: "المسار الكامل حتى نهاية B2 بتدريب برايفت 1:1.", en: "The complete path through B2 with Private 1:1 training." },
  },
] as const satisfies readonly LearningPackageDefinition[];

export const allLearningPackages = [...learningPackages, ...privateLearningPackages] as const;

export type LearningPackage = (typeof allLearningPackages)[number];

export type PlanRecommendation = {
  programType: ProgramType;
  startLevel: LearningLevel;
  targetLevel: LearningLevel;
  levelsToStudy: LearningLevel[];
  requiredLevels: 1 | 2 | 3 | 4;
  requiredHours: LearningPackage["hours"];
  package: LearningPackage;
};

export type PaymentMethodId = "card" | "installments" | "instapay" | "wallet" | "branch";

export const attendanceModes = ["online", "branch"] as const;

export type AttendanceMode = (typeof attendanceModes)[number];

export const plannedPaymentMethods = [
  { id: "card", provider: "paytabs" },
  { id: "installments", provider: "easykash" },
  { id: "instapay", provider: "manual" },
  { id: "wallet", provider: "manual" },
  { id: "branch", provider: "manual" },
] as const satisfies ReadonlyArray<{
  id: PaymentMethodId;
  provider: "paytabs" | "easykash" | "manual";
}>;

export function isLearningLevel(value: string | null | undefined): value is LearningLevel {
  return learningLevels.includes(value as LearningLevel);
}

export function isLearningPackageId(value: string | null | undefined): value is LearningPackageId {
  return allLearningPackages.some((item) => item.id === value);
}

export function isProgramType(value: string | null | undefined): value is ProgramType {
  return programTypes.includes(value as ProgramType);
}

export function resolveProgramType(value: string | null | undefined): ProgramType | null {
  if (value === null || value === undefined || value === "") return DEFAULT_PROGRAM_TYPE;
  return isProgramType(value) ? value : null;
}

export function getLearningPackages(programType: ProgramType): readonly LearningPackage[] {
  return programType === "private" ? privateLearningPackages : learningPackages;
}

export function isAttendanceMode(value: string | null | undefined): value is AttendanceMode {
  return attendanceModes.includes(value as AttendanceMode);
}

export function getAvailableTargets(startLevel: LearningLevel | null): LearningLevel[] {
  if (!startLevel) return [];
  return learningLevels.slice(learningLevels.indexOf(startLevel));
}

export function getLevelsToStudy(
  startLevel: LearningLevel,
  targetLevel: LearningLevel,
): LearningLevel[] {
  const startIndex = learningLevels.indexOf(startLevel);
  const targetIndex = learningLevels.indexOf(targetLevel);
  if (targetIndex < startIndex) return [];
  return learningLevels.slice(startIndex, targetIndex + 1);
}

export function getLearningPackage(packageId: string | null | undefined): LearningPackage | null {
  return allLearningPackages.find((item) => item.id === packageId) ?? null;
}

export function getTargetForPackage(
  startLevel: LearningLevel | null,
  packageId: LearningPackageId,
): LearningLevel | null {
  if (!startLevel) return null;
  const learningPackage = getLearningPackage(packageId);
  if (!learningPackage) return null;
  const targetIndex = learningLevels.indexOf(startLevel) + learningPackage.levelCount - 1;
  return learningLevels[targetIndex] ?? null;
}

export function getPlanRecommendation(startLevel: LearningLevel | null, targetLevel: LearningLevel | null): PlanRecommendation | null;
export function getPlanRecommendation(programType: ProgramType, startLevel: LearningLevel | null, targetLevel: LearningLevel | null): PlanRecommendation | null;
export function getPlanRecommendation(
  first: ProgramType | LearningLevel | null,
  second: LearningLevel | null,
  third?: LearningLevel | null,
): PlanRecommendation | null {
  const programType = third === undefined ? DEFAULT_PROGRAM_TYPE : first as ProgramType;
  const startLevel = third === undefined ? first as LearningLevel | null : second;
  const targetLevel = third === undefined ? second : third;
  if (!startLevel || !targetLevel) return null;

  const levelsToStudy = getLevelsToStudy(startLevel, targetLevel);
  if (levelsToStudy.length === 0) return null;

  const requiredLevels = levelsToStudy.length as PlanRecommendation["requiredLevels"];
  const recommendedPackage = getLearningPackages(programType).find((item) => item.levelCount === requiredLevels);
  if (!recommendedPackage) return null;
  const requiredHours = recommendedPackage.hours;

  return {
    programType,
    startLevel,
    targetLevel,
    levelsToStudy,
    requiredLevels,
    requiredHours,
    package: recommendedPackage,
  };
}
