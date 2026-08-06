import type { Locale } from "@/lib/i18n";

type Card = {
  title: string;
  description: string;
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
  about: {
    badge: string;
    title: string;
    description: string;
    stats: [
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
    ];
    slogan: string;
  };
  form: {
    badge: string;
    title: string;
    subtitle: string;
    trustItems: string[];
    optional: string;
    labels: {
      fullName: string;
      phone: string;
      email: string;
      learningGoal: string;
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
    learningModeOptions: Option[];
    assessmentTimeOptions: Option[];
    errors: {
      fullName: string;
      phone: string;
      email: string;
      learningGoal: string;
      preferredLearningMode: string;
      preferredAssessmentTime: string;
      consent: string;
    };
    buttons: {
      submit: string;
      loading: string;
    };
    reassurance: string;
    success: {
      title: string;
      message: string;
      whatsapp: string;
      back: string;
    };
    failure: {
      title: string;
      messageLead: string;
      whatsapp: string;
      messageTail: string;
    };
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
    description: string;
    rights: string;
    whatsapp: string;
    call: string;
    online: string;
    branch: string;
    quickLinksTitle: string;
    quickLinks: {
      why: string;
      trainers: string;
      registration: string;
      assessment: string;
      faq: string;
      about: string;
      blog: string;
      business: string;
    };
    legalLinks: {
      privacy: string;
      terms: string;
    };
    contactTitle: string;
    socialTitle: string;
    languageTitle: string;
    languages: {
      ar: string;
      en: string;
    };
  };
};

export type ContentMap = Record<Locale, LandingContent>;
