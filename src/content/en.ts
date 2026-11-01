import type { LandingContent } from "./types";

export const enContent: LandingContent = {
  nav: {
    why: "The problem",
    assessment: "Placement Test",
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
    badge: "Programs start from 2250 EGP",
    note: "The placement test is free and available on this website immediately after registration. Your result helps identify the right starting level.",
    cardLabel: "Direction plan",
    directionRows: [
      { title: "Free placement test", description: "Know your starting point before deciding." },
      { title: "Clear goal", description: "We understand why you need English." },
      { title: "Right plan", description: "Practical training for your level and goal." },
      { title: "Real follow-up", description: "A team helps you stay consistent and continue." },
    ],
  },
  cta: {
    title: "Start with a free placement test before choosing any programme",
    description:
      "Register your details, start the placement test, and find the right starting point.",
    primary: "Start Your Placement Test",
    secondary: "Talk to a Success Manager",
  },
  faq: {
    title: "Important Questions Before You Register",
    items: [
      {
        question: "Is the Placement Test Free?",
        answer: "Yes. The placement test is free and helps us identify your current level and recommend the right starting point before registration.",
      },
      {
        question: "How Does the Placement Test Work?",
        answer: "After you submit your details, you can start the placement test on this website immediately. It covers Language Use, Reading, and Listening, then shows your result and recommended starting point.",
      },
      {
        question: "Do I Need to Be Good at English Before I Start?",
        answer: "No. You start from your real level, whether you are a complete beginner or already have some basics and want to improve.",
      },
      {
        question: "Are the Classes Live or Recorded?",
        answer: "All teaching happens Live on Zoom with your trainer in real time; this is not a prerecorded course. The recording is of that same Live class and remains available on your account for later review.",
      },
      {
        question: "How Does Online Training Work?",
        answer: "You join your trainer Live, participate in conversations, activities, and practical exercises from anywhere, with ongoing Success Manager follow-up.",
      },
      {
        question: "Who Are the Trainers?",
        answer: "Our team includes more than 30 trainers with over five years of training experience and CELTA or TEFL qualifications.",
      },
      {
        question: "Should I Choose Group or Private 1:1?",
        answer: "Both are interactive Live Online programmes. Group programmes have 7–10 learners with conversations and interactive practice, while Private 1:1 gives you individual attention and practice focused on your level and goals.",
      },
      {
        question: "Will I Actually Get a Chance to Speak?",
        answer: "Yes. Group sessions include live participation, conversations, and interactive practice with your trainer and 7–10 learners. Private 1:1 gives you focused individual practice with your trainer.",
      },
      {
        question: "What If I Miss or Want to Review a Session?",
        answer: "A recording of the same Live session remains available on your account for review. If you miss a session, your Success Manager can help you understand the appropriate next step; the recording is not presented as a complete replacement for live attendance and participation.",
      },
      {
        question: "When Do I Choose My Class Schedule?",
        answer: "You do not choose a schedule during payment. After payment is confirmed, your Success Manager contacts you to arrange a suitable option from the available schedules and complete your programme setup.",
      },
      {
        question: "How Much Do the Programmes Cost?",
        answer: "Programmes start from EGP 2,250, and our follow-up team will explain the suitable option and available payment methods.",
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
      { value: "Live Classes", label: "Learn From Anywhere" },
    ],
    slogan: "Not Just A Course... A Direction",
  },
  form: {
    badge: "Take the First Step",
    title: "Know Your Level and Start in the Right Place",
    subtitle: "Register your details, then start your free placement test immediately.",
    trustItems: [
      "Your details are shared only with our follow-up team",
      "The placement test helps us recommend the right starting point",
      "You can start the test on this website immediately after registration",
    ],
    optional: "Optional",
    labels: {
      fullName: "Full Name",
      phone: "Mobile or WhatsApp Number",
      email: "Email Address",
      learningGoal: "Your English Goal",
      preferredAssessmentTime: "Best Time to Contact You",
      notes: "Additional Notes",
      consent: "I agree to be contacted by the Success Academy team about the placement test.",
    },
    placeholders: {
      fullName: "Enter your full name",
      phone: "Enter your mobile number",
      email: "example@email.com",
      notes: "Anything you would like us to know so we can help you better",
    },
    learningGoalOptions: [
      { value: "work", label: "Work" },
      { value: "university", label: "University" },
      { value: "travel_everyday", label: "Travel and Everyday Life" },
      { value: "general", label: "General English Improvement" },
    ],
    assessmentTimeOptions: [
      { value: "earliest", label: "As Soon as Possible" },
      { value: "morning", label: "Morning" },
      { value: "evening", label: "Evening" },
    ],
    errors: {
      fullName: "Full name is required",
      phone: "Please enter a valid mobile number, such as 01012345678 or +966501234567.",
      email: "Enter a valid email address",
      learningGoal: "Choose your English goal",
      preferredAssessmentTime: "Choose the best time to contact you",
      consent: "Consent is required to submit the request",
    },
    buttons: {
      submit: "Register & Start Your Placement Test",
      loading: "Submitting Your Request…",
    },
    reassurance: "After registration, you can start the placement test immediately on this website.",
    success: {
      title: "Your Request Has Been Submitted",
      message: "You can start the placement test now, and the Success Academy team is available if you need help.",
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
      "We received your details. You can start the placement test on this website, and our team is available if you need help.",
    whatsapp: "Open WhatsApp",
    requestCall: "Request a call",
    note: "The placement test helps identify the best starting point before you continue your journey.",
  },
  sticky: {
    primary: "Free Level Check",
    whatsapp: "WhatsApp",
  },
  footer: {
    slogan: "Not Just A Course... A Direction",
    description: "Live, interactive English training with follow-up that helps you keep moving.",
    rights: "© Success Academy — All Rights Reserved",
    whatsapp: "Contact Us on WhatsApp",
    call: "Call Us",
    online: "Live Online Training",
    recordings: "Sessions Available for Review",
    quickLinksTitle: "Website",
    quickLinks: {
      why: "Why Success Academy?",
      trainers: "Training Team",
      registration: "Registration Steps",
      assessment: "Placement Test",
      plans: "Plans & Pricing",
      faq: "Frequently Asked Questions",
      about: "About Us",
      blog: "Blog",
      business: "Corporate Training",
    },
    legalLinks: {
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
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
