export type PlacementLocale = "ar" | "en";
export type PlacementLevel = "A1" | "A2" | "B1" | "B2";
export type PlacementConfidence = "high" | "medium" | "low";
export type AssessmentSection = "listening" | "reading" | "languageUse";
export type EvidenceBand = "A1" | "A2" | "B1" | "B2Entry";
export type QuestionForm = "A" | "B" | "confirmation";
export type DifficultyTier = "foundation" | "developing" | "anchor" | "upper";

export type AssessmentOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type AssessmentQuestion = {
  id: string;
  slotId: string;
  section: AssessmentSection;
  form: QuestionForm;
  targetBand: PlacementLevel;
  evidenceBand: EvidenceBand;
  construct: string;
  skill: AssessmentSection;
  blockId: string;
  difficultyTier: DifficultyTier;
  timeLimitSeconds: number;
  readingTimeSeconds?: number;
  passageId?: string;
  audioId?: string;
  situation?: string;
  prompt: string;
  options: AssessmentOption[];
  correctOption: AssessmentOption["id"];
  isAnchor: boolean;
  isConfirmation: boolean;
};

export type ReadingPassage = {
  id: string;
  form: "A" | "B" | "confirmation";
  text: string;
};

export type AudioAsset = {
  id: string;
  form: "A" | "B";
  source: string;
  startSeconds: number | null;
  endSeconds: number | null;
  expectedDurationSeconds: number | null;
};

export type SelectedForms = Record<string, "A" | "B">;

export type StoredAnswer = {
  questionId: string;
  selectedOption: AssessmentOption["id"] | null;
  submittedAt: string;
  responseTimeMs: number;
  timedOut: boolean;
};

export type SkillEvidence = {
  correct: number;
  total: number;
  percent: number;
  estimatedBand: PlacementLevel;
};

export type PlacementProfile = {
  placement: PlacementLevel;
  confidence: PlacementConfidence;
  listening: SkillEvidence;
  reading: SkillEvidence;
  languageUse: SkillEvidence;
  evidence: {
    A1: number;
    A2: number;
    B1: number;
    B2Entry: number;
  };
  strongestSkill: AssessmentSection;
  weakestSkill: AssessmentSection;
  b2Readiness: boolean;
  confirmationRequired: boolean;
  confirmationUsed: boolean;
};

export type AttemptStatus =
  | "registered_not_started"
  | "in_progress"
  | "completed"
  | "expired";

export type AudioPlaybackState = {
  status: "not_started" | "playing" | "completed";
  progressSeconds: number;
  startedAt: string | null;
  completedAt: string | null;
};

export type PlacementAttempt = {
  schemaVersion: 1;
  id: string;
  tokenHash: string;
  leadReference: string;
  locale: PlacementLocale;
  status: AttemptStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  currentSection: AssessmentSection | null;
  currentIndex: number;
  coreSequence: string[];
  confirmationSequence: string[];
  selectedForms: SelectedForms;
  answers: StoredAnswer[];
  questionStartedAt: string | null;
  questionDeadlineAt: string | null;
  audioCheckCompleted: boolean;
  introducedSections: AssessmentSection[];
  completedReadingBlocks: string[];
  readingReadyAt: string | null;
  audioPlayback: Record<string, AudioPlaybackState>;
  budgetRemainingMs: number;
  budgetRunningSince: string | null;
  confirmationRequired: boolean;
  confirmationStarted: boolean;
  confirmationIntroSeen: boolean;
  finalProfile: PlacementProfile | null;
  resultWebhookClaimedAt: string | null;
  resultWebhookSentAt: string | null;
  resultWebhookAttempts: number;
  updatedAt: string;
};

export type PublicQuestion = Omit<AssessmentQuestion, "correctOption" | "construct" | "evidenceBand"> & {
  passage?: ReadingPassage;
};

export type PublicAttemptState = {
  status: AttemptStatus;
  locale: PlacementLocale;
  phase:
    | "welcome"
    | "audio_check"
    | "section_intro"
    | "reading_period"
    | "audio"
    | "question"
    | "confirmation_intro"
    | "analysis"
    | "result"
    | "expired";
  section: AssessmentSection | null;
  sectionQuestion: number;
  sectionTotal: number;
  overallQuestion: number;
  overallTotal: number;
  progressPercent: number;
  question: PublicQuestion | null;
  questionDeadlineAt: string | null;
  readingReadyAt: string | null;
  audio: (AudioAsset & AudioPlaybackState) | null;
  confirmationRequired: boolean;
  result: PlacementProfile | null;
};

export type PlacementAttemptAction =
  | { action: "start" }
  | { action: "audio_check_complete" }
  | { action: "section_continue"; section: AssessmentSection }
  | { action: "confirmation_continue" }
  | { action: "begin_reading"; questionId: string }
  | { action: "begin_question"; questionId: string }
  | { action: "answer"; questionId: string; optionId: AssessmentOption["id"] }
  | { action: "audio_start"; questionId: string }
  | { action: "audio_progress"; questionId: string; progressSeconds: number }
  | { action: "audio_complete"; questionId: string }
  | { action: "audio_failed"; questionId: string };
