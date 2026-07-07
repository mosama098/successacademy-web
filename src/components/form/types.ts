import type { LandingContent } from "@/content";
import type { Locale } from "@/lib/i18n";

export type LeadFormProps = {
  locale: Locale;
  copy: LandingContent["form"];
};

export type FormState = {
  fullName: string;
  phone: string;
  email: string;
  learningGoal: string;
  currentLevel: string;
  preferredLearningMode: string;
  preferredAssessmentTime: string;
  notes: string;
  consent: boolean;
  company: string;
};

export type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

export const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  learningGoal: "",
  currentLevel: "",
  preferredLearningMode: "",
  preferredAssessmentTime: "",
  notes: "",
  consent: false,
  company: "",
};
