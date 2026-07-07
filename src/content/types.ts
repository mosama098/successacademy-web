import type { Locale } from "@/lib/i18n";

type Card = {
  title: string;
  description: string;
};

type VideoCard = Card & {
  placeholder: string;
};

type Option = {
  value: string;
  label: string;
};

export type LandingContent = {
  nav: {
    why: string;
    assessment: string;
    process: string;
    faq: string;
    language: string;
    book: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    whatsappCta: string;
    badge: string;
    note: string;
    cardLabel: string;
    directionRows: Card[];
  };
  why: {
    title: string;
    subtitle: string;
    items: Card[];
  };
  assessment: {
    title: string;
    description: string;
    bullets: string[];
    cta: string;
  };
  videoPreview: {
    title: string;
    subtitle: string;
    cta: string;
    placeholder: string;
  };
  steps: {
    title: string;
    subtitle: string;
    items: Card[];
  };
  experienceVideos: {
    title: string;
    items: VideoCard[];
  };
  delivery: {
    title: string;
    onlineLabel: string;
    online: string;
    branchLabel: string;
    branch: string;
  };
  successManager: {
    title: string;
    description: string;
    points: string[];
    cards: Card[];
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  faq: {
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  form: {
    title: string;
    subtitle: string;
    benefitTitle: string;
    benefitItems: string[];
    stepOne: string;
    stepTwo: string;
    labels: {
      fullName: string;
      phone: string;
      email: string;
      learningGoal: string;
      currentLevel: string;
      preferredLearningMode: string;
      preferredAssessmentTime: string;
      notes: string;
      consent: string;
    };
    placeholders: {
      fullName: string;
      phone: string;
      email: string;
      notes: string;
    };
    learningGoalOptions: Option[];
    currentLevelOptions: Option[];
    learningModeOptions: Option[];
    assessmentTimeOptions: Option[];
    errors: {
      fullName: string;
      phone: string;
      learningGoal: string;
      preferredAssessmentTime: string;
      consent: string;
      submit: string;
    };
    buttons: {
      next: string;
      back: string;
      submit: string;
      loading: string;
      success: string;
    };
    fallback: string;
  };
  thankYou: {
    title: string;
    subtitle: string;
    whatsapp: string;
    requestCall: string;
    note: string;
  };
  sticky: {
    primary: string;
    whatsapp: string;
  };
  footer: {
    slogan: string;
    rights: string;
    whatsapp: string;
  };
};

export type ContentMap = Record<Locale, LandingContent>;
