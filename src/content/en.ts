import type { LandingContent } from "./types";

export const enContent: LandingContent = {
  nav: {
    why: "The problem",
    assessment: "Free level check",
    process: "The path",
    faq: "FAQ",
    language: "العربية",
    book: "Get your level",
  },
  hero: {
    eyebrow: "Success Academy | Not Just A Course... A Direction",
    title: "Most people don't fail at learning English...\nthey learn it the wrong way.",
    subtitle:
      "At Success Academy, we don't just place you in a course. We understand your goal, find the right starting point, and guide you through a practical plan with daily practice, short tasks, and real accountability until English becomes something you can use.",
    primaryCta: "Get Your Free Level Check",
    whatsappCta: "Talk to a Success Manager",
    badge: "programs start from 1750 EGP",
    note: "The level check is free and external. Leave your details, choose a time, and our team will explain the next step.",
    cardLabel: "Direction plan",
    directionRows: [
      { title: "Free level check", description: "Know your starting point first." },
      { title: "Right plan", description: "Steps based on your level and goal." },
      { title: "Practical training", description: "Practice and short tasks for real use." },
      { title: "Real follow-up", description: "Daily accountability and clear next steps." },
    ],
  },
  why: {
    title: "The issue is usually not you. It is the system.",
    subtitle:
      "If you started more than once and stopped, the problem was probably not ability. You were learning without diagnosis, enough usage, or consistent follow-up.",
    items: [
      {
        title: "No clear diagnosis",
        description: "The wrong level wastes time: either repeating what you know or struggling with what you are not ready for.",
      },
      {
        title: "Studying without using",
        description: "English needs practical training, real situations, short tasks, and daily practice that turns knowledge into use.",
      },
      {
        title: "A course without follow-up",
        description: "The first week is easy. What matters after that is accountability and small steps you can keep following.",
      },
    ],
  },
  assessment: {
    title: "The free level check is the logical first step",
    description:
      "The assessment is external. This page lets you register and choose a suitable time. Then our follow-up team contacts you, understands your goal, and explains the right next step.",
    bullets: ["Quick registration with no payment", "Choose a suitable assessment time", "Get a plan that fits your level and goal"],
    cta: "Choose your free assessment time",
  },
  steps: {
    title: "A clear direction instead of random decisions",
    items: [
      { title: "Know your level", description: "Start with an external assessment that gives you a real starting point." },
      { title: "Define your goal", description: "Work, travel, study, interviews, or speaking confidence. The goal shapes the plan." },
      { title: "Build the right plan", description: "Practical training, short tasks, and real English usage." },
      { title: "Train with follow-up", description: "The team helps you stay committed and know what comes next." },
    ],
  },
  delivery: {
    title: "Learn online or at the Dokki branch",
    onlineLabel: "Online",
    online: "Built for busy schedules, with structured training, follow-up, and practice instead of passive lessons.",
    branchLabel: "Dokki branch",
    branch: "A good option if learning in person helps you stay committed in a clear training environment.",
  },
  successManager: {
    title: "A Success Manager follows the plan with you",
    description:
      "The point is not just to start. It is to keep moving with someone helping you understand what to do, stay committed, and adjust when needed.",
    points: ["Daily follow-up on practice and commitment", "Short tasks and projects for real language use", "Clear next steps instead of confusion"],
  },
  cta: {
    title: "Start with a free level check before choosing any program",
    description:
      "You do not need to make a big decision now. Register, choose a suitable time, and after the assessment we will guide you toward the right path.",
    primary: "Start with a free level check",
    secondary: "Talk to a Success Manager",
  },
  faq: {
    title: "Questions before you register",
    items: [
      {
        question: "Is the assessment inside the website?",
        answer: "No. The assessment is external. This website is for registration and selecting a suitable time, then the Success Academy team contacts you.",
      },
      {
        question: "Do I need to be good at English already?",
        answer: "No. The point is to understand your current level first, then build the right plan around it.",
      },
      {
        question: "What makes Success Academy different?",
        answer: "Direction and accountability: practical training, daily practice, short tasks, and a clear next step after each stage.",
      },
      {
        question: "Can I learn online or in person?",
        answer: "Yes. Online learning is available, and in-person learning is available at the Dokki branch depending on your suitable path and available times.",
      },
      {
        question: "How much do programs start from?",
        answer: "Programs start from 1750 EGP. Details are confirmed after your level and English goal are clear.",
      },
    ],
  },
  form: {
    title: "Start with a free level check",
    subtitle: "Leave your details, choose a suitable assessment time, and our team will contact you with the next step.",
    stepOne: "Your details",
    stepTwo: "Assessment time",
    labels: {
      fullName: "Full name",
      phone: "Mobile / WhatsApp number",
      email: "Email address",
      learningGoal: "Your English goal",
      currentLevel: "Current level",
      preferredLearningMode: "Preferred learning mode",
      preferredAssessmentTime: "Preferred assessment time",
      notes: "Additional notes",
      consent: "I agree that Success Academy may contact me about the free assessment",
    },
    placeholders: {
      fullName: "Your name",
      phone: "Example: 01000000000",
      email: "name@example.com",
      notes: "Anything you want us to know before contacting you",
    },
    learningGoalOptions: [
      { value: "work", label: "Work" },
      { value: "travel", label: "Travel" },
      { value: "study", label: "Study" },
      { value: "speaking", label: "Speaking confidence" },
      { value: "interviews", label: "Job interviews" },
      { value: "general", label: "General improvement" },
      { value: "not_sure", label: "Not sure yet" },
    ],
    currentLevelOptions: [
      { value: "beginner", label: "Beginner" },
      { value: "basic", label: "Basic knowledge" },
      { value: "intermediate", label: "Intermediate" },
      { value: "understand_not_speak", label: "I understand but cannot speak confidently" },
      { value: "unknown", label: "I do not know my level" },
    ],
    learningModeOptions: [
      { value: "online", label: "Online" },
      { value: "dokki", label: "Dokki branch" },
      { value: "not_sure", label: "Not sure yet" },
    ],
    assessmentTimeOptions: [
      { value: "earliest", label: "Earliest available" },
      { value: "morning", label: "Morning" },
      { value: "afternoon", label: "Afternoon" },
      { value: "evening", label: "Evening" },
      { value: "weekend", label: "Weekend" },
      { value: "suggest", label: "Let the follow-up team suggest a time" },
    ],
    errors: {
      fullName: "Please enter your full name.",
      phone: "Please enter your mobile or WhatsApp number.",
      learningGoal: "Please choose your English goal.",
      preferredAssessmentTime: "Please choose a suitable assessment time.",
      consent: "Please agree to be contacted about the free assessment.",
      submit: "Something went wrong. Please try again or contact us on WhatsApp.",
    },
    buttons: {
      next: "Continue to time selection",
      back: "Back",
      submit: "Register for the free level check",
      loading: "Submitting your request...",
      success: "Your request has been submitted",
    },
    fallback: "If something goes wrong, you can contact us directly on WhatsApp.",
  },
  thankYou: {
    title: "Your request has been received",
    subtitle:
      "We received your details. The Success Academy team will contact you to explain your assessment appointment and the right next step for your level and goal.",
    whatsapp: "Open WhatsApp",
    requestCall: "Request a call",
    note: "You do not need to decide now. Start with the level check, then we will guide you toward the right path.",
  },
  sticky: {
    primary: "Free Level Check",
    whatsapp: "WhatsApp",
  },
  footer: {
    slogan: "Not Just A Course... A Direction",
    rights: "Success Academy. All rights reserved.",
  },
};
