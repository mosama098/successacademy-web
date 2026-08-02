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
  cta: {
    title: "Start with a free level check before choosing any program",
    description:
      "You do not need to make a big decision now. Register, choose a suitable time, and after the assessment you will know the right path for you.",
    primary: "Start with a Free Level Check",
    secondary: "Talk to a Success Manager",
  },
  faq: {
    title: "Important Questions Before You Register",
    items: [
      {
        question: "Is the Assessment Free?",
        answer: "Yes. The assessment is free and helps us identify your current level and recommend the right starting point before registration.",
      },
      {
        question: "How Does the Assessment Work?",
        answer: "After you submit your details, our follow-up team will contact you to confirm the time and explain the assessment process.",
      },
      {
        question: "Do I Need to Be Good at English Before I Start?",
        answer: "No. You start from your real level, whether you are a complete beginner or already have some basics and want to improve.",
      },
      {
        question: "Is the Training Online or In Person?",
        answer: "You can study online or attend at our Dokki branch and choose the option that suits you best.",
      },
      {
        question: "What Makes Success Academy Different?",
        answer: "Practical training, interactive activities, real conversations, Success Manager follow-up, and clear feedback on your progress.",
      },
      {
        question: "Who Are the Trainers?",
        answer: "Our team includes more than 30 trainers with over five years of training experience and CELTA or TEFL qualifications.",
      },
      {
        question: "How Many Students Are in Each Group?",
        answer: "Groups are kept limited so you can participate, practise, and receive meaningful follow-up.",
      },
      {
        question: "How Long Is Each Level?",
        answer: "Each level includes 30 training hours across 10 sessions, with each session lasting three hours.",
      },
      {
        question: "How Much Do the Programmes Cost?",
        answer: "Programmes start from EGP 1,750, and our follow-up team will explain the suitable option and available payment methods.",
      },
    ],
  },
  about: {
    badge: "About Us",
    title: "Since 2015… We’ve Been Helping Learners Use English in Real Life",
    description: "Success Academy began with one clear goal: English learning should not be just lectures, but a practical system that helps you speak, practise, and move towards your goal with clear steps.",
    stats: [
      { value: "2015", label: "Since We Started" },
      { value: "100K+", label: "Learners Trusted Us" },
      { value: "Online & Dokki", label: "Learn in the Way That Suits You" },
    ],
    slogan: "Not Just A Course... A Direction",
  },
  form: {
    badge: "Take the First Step",
    title: "Start with a Free Assessment and Find the Right Starting Point",
    subtitle: "Complete your details in under a minute and choose the learning method and time that suit you.",
    trustItems: [
      "Your details are shared only with our follow-up team",
      "The assessment helps us recommend the right starting point",
      "Our team will explain every step before you begin",
    ],
    optional: "Optional",
    labels: {
      fullName: "Full Name",
      phone: "Mobile or WhatsApp Number",
      email: "Email Address",
      learningGoal: "Your English Goal",
      preferredLearningMode: "How Would You Prefer to Learn?",
      preferredAssessmentTime: "Preferred Contact or Assessment Time",
      notes: "Additional Notes",
      consent: "I agree to be contacted by the Success Academy team regarding the free assessment.",
    },
    placeholders: {
      fullName: "Enter your full name",
      phone: "Enter your mobile number",
      email: "example@email.com",
      notes: "Anything you would like us to know before we contact you",
    },
    learningGoalOptions: [
      { value: "work", label: "Work" },
      { value: "university", label: "University" },
      { value: "travel_everyday", label: "Travel and Everyday Life" },
      { value: "general", label: "General English Improvement" },
    ],
    learningModeOptions: [
      { value: "online", label: "Online" },
      { value: "dokki", label: "Dokki Branch" },
    ],
    assessmentTimeOptions: [
      { value: "earliest", label: "First Available Time" },
      { value: "morning", label: "Morning" },
      { value: "evening", label: "Evening" },
    ],
    errors: {
      fullName: "Full name is required",
      phone: "Enter a valid mobile number",
      email: "Enter a valid email address",
      learningGoal: "Choose your English goal",
      preferredLearningMode: "Choose a learning method",
      preferredAssessmentTime: "Choose a preferred time",
      consent: "Consent is required to submit the request",
    },
    buttons: {
      submit: "Book Your Free Assessment",
      loading: "Submitting Your Request…",
    },
    reassurance: "Our follow-up team will contact you to confirm the time and explain the next step.",
    success: {
      title: "Your Request Has Been Submitted",
      message: "The Success Academy team will contact you to confirm the time and explain the next step.",
      whatsapp: "Contact Us on WhatsApp",
      back: "Back to Website",
    },
    failure: {
      title: "We Couldn’t Submit Your Request",
      messageLead: "Please try again, or contact us directly on ",
      whatsapp: "WhatsApp",
      messageTail: ".",
    },
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
    description: "Practical training, clear follow-up, and a path that matches your goal.",
    rights: "© Success Academy — All Rights Reserved",
    whatsapp: "Contact Us on WhatsApp",
    call: "Call Us",
    online: "Online",
    branch: "Dokki Branch",
    quickLinksTitle: "Quick Links",
    quickLinks: {
      why: "Why Success Academy?",
      trainers: "Training Team",
      registration: "Registration Steps",
      assessment: "Free Assessment",
      faq: "Frequently Asked Questions",
      about: "About Us",
    },
    contactTitle: "Contact Us",
    socialTitle: "Follow Us",
    languageTitle: "Language",
    languages: {
      ar: "العربية",
      en: "English",
    },
  },
};

