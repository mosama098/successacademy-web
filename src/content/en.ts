import type { LandingContent } from "./types";

export const enContent: LandingContent = {
  nav: {
    why: "The problem",
    assessment: "Free Level Check",
    process: "The path",
    faq: "FAQ",
    language: "العربية",
    book: "Check your level",
  },
  hero: {
    eyebrow: "Success Academy | Not Just A Course... A Direction",
    title: "Most people don’t fail at learning English...\nthey learn it the wrong way.",
    subtitle:
      "If you have started more than once and stopped, the problem is probably not your ability. It is joining a course without diagnosis, without a clear goal, and without follow-up that pushes you to actually use the language.",
    primaryCta: "Get Your Free Level Check",
    whatsappCta: "Talk to a Success Manager",
    badge: "Programs start from 1750 EGP",
    note: "The assessment is free and external. Register, choose a suitable time, and our follow-up team will explain the next step.",
    cardLabel: "Direction plan",
    directionRows: [
      { title: "Free assessment", description: "Know your starting point before deciding." },
      { title: "Clear goal", description: "We understand why you need English." },
      { title: "Right plan", description: "Practical training for your level and goal." },
      { title: "Real follow-up", description: "A team helps you stay consistent and continue." },
    ],
  },
  why: {
    title: "Why old methods usually stop working",
    subtitle:
      "Most learners start without a map. They memorize words, attend lessons, then realize they still do not feel comfortable using English.",
    items: [
      {
        title: "Starting without diagnosis",
        description: "The wrong level wastes energy. You either repeat what you already know or struggle with what is still too advanced.",
      },
      {
        title: "Studying without using",
        description: "English is not just information to memorize. You need practical training, short situations, and daily practice.",
      },
      {
        title: "A course without follow-up",
        description: "Motivation drops after the first week. Without follow-up and accountability, even good content can stop there.",
      },
    ],
  },
  assessment: {
    title: "Before choosing any program, know where you stand",
    description:
      "The free assessment is the logical first step. You do not need to decide now. Register, choose a suitable time, and our follow-up team will explain the best next step.",
    bullets: ["Quick registration without complexity", "Choose a suitable assessment time", "Get an initial plan for your level and goal"],
    cta: "Choose Your Free Assessment Time",
  },
  steps: {
    title: "Success Academy works as a path, not just a course",
    subtitle: "We start from your level and goal, then build a practical learning direction you can continue.",
    items: [
      { title: "Know your level", description: "An external assessment shows your starting point instead of guessing." },
      { title: "Understand your goal", description: "Work, travel, study, interviews, or confidence in conversation." },
      { title: "Build the right plan", description: "Practical training and short tasks based on your level." },
      { title: "Train with follow-up", description: "Accountability and real language use keep you moving." },
    ],
  },
  delivery: {
    title: "Online or at the Dokki branch, based on what fits you",
    onlineLabel: "Online",
    online: "Designed for busy schedules. Structured training, follow-up, and practice, not just watching lessons.",
    branchLabel: "Dokki branch",
    branch: "A good fit if attending in person helps you stay committed. A clear training environment with available time options.",
  },
  successManager: {
    title: "Follow-up is the difference between starting and continuing",
    description:
      "The goal is not to place you in another course and leave you alone. The goal is to help you know what to do, stay accountable, and adjust the plan when needed.",
    points: ["Accountability follow-up", "Short tasks", "Real language use", "Plan adjustments when needed"],
    cards: [
      {
        title: "Accountability follow-up",
        description: "Someone follows your progress and reminds you what needs to happen next.",
      },
      {
        title: "Short tasks",
        description: "Simple ongoing applications that make training practical.",
      },
      {
        title: "Real language use",
        description: "Situations and practice that help you use English instead of only memorizing it.",
      },
      {
        title: "Plan adjustments",
        description: "If your pace or focus needs to change, the plan can be adjusted with you.",
      },
    ],
  },
  cta: {
    title: "Start with a free level check before choosing any program",
    description:
      "You do not need to make a big decision now. Register, choose a suitable time, and after the assessment you will know the right path for you.",
    primary: "Start with a Free Level Check",
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
        answer: "No. The point of the assessment is to understand your real level and start from the right place.",
      },
      {
        question: "What makes Success Academy different?",
        answer: "You are not joining a random course. You start with assessment, a goal, the right plan, practical training, and accountability follow-up.",
      },
      {
        question: "Is online and in-person learning available?",
        answer: "Yes. Online training is available, and in-person options are available from the Dokki branch depending on availability.",
      },
      {
        question: "How much do programs start from?",
        answer: "Programs start from 1750 EGP. Details are confirmed after understanding your level and goal.",
      },
    ],
  },
  form: {
    title: "Start with a free level check",
    subtitle: "Leave your details, choose a suitable assessment time, and our team will contact you with the next step.",
    benefitTitle: "You do not need to buy a course now",
    benefitItems: ["Your details go only to the follow-up team", "The assessment is free and external", "Programs start from 1750 EGP"],
    stepOne: "Starting details",
    stepTwo: "Choose a time",
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
      next: "Continue to choose a time",
      back: "Back",
      submit: "Register for the Free Level Check",
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
