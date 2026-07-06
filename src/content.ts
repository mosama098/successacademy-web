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
    floatingCards: string[];
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
  steps: {
    title: string;
    items: Card[];
  };
  delivery: {
    title: string;
    onlineLabel: string;
    online: string;
    branchLabel: string;
    branch: string;
    note: string;
  };
  successManager: {
    title: string;
    description: string;
    points: string[];
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
  };
};

export const content: Record<Locale, LandingContent> = {
  ar: {
    nav: {
      why: "المشكلة",
      assessment: "التقييم المجاني",
      process: "الخطوات",
      faq: "الأسئلة",
      language: "English",
      book: "اعرف مستواك",
    },
    hero: {
      eyebrow: "Success Academy | Not Just A Course... A Direction",
      title: "معظم الناس مش بتفشل في الإنجليزية...\nهي بتتعلمها بالطريقة الغلط.",
      subtitle:
        "في Success Academy مش بندخلك برنامج وخلاص. بنفهم هدفك من اللغة، نشوف نقطة البداية المناسبة، ونمشيك في خطة عملية فيها ممارسة يومية ومهام قصيرة ومتابعة على الالتزام لحد ما الإنجليزي يبقى استخدام حقيقي.",
      primaryCta: "اعرف مستواك مجانًا",
      whatsappCta: "تحدث مع Success Manager",
      badge: "البرامج تبدأ من 1750 جنيه",
      note: "ابدأ بتقييم مجاني خارجي، وبعده فريق المتابعة يوضح لك الخطوة الأنسب.",
      cardLabel: "خطة الطريق",
      floatingCards: ["مستوى مبدئي", "خطة مناسبة", "متابعة حقيقية", "تقييم مجاني"],
    },
    why: {
      title: "المشكلة مش في قدرتك... المشكلة في النظام اللي بتتعلم بيه",
      subtitle:
        "لو بدأت أكتر من مرة ووقفت، فده غالبًا لأنك كنت بتتحرك من غير تشخيص، من غير ممارسة كفاية، ومن غير حد يتابع التزامك.",
      items: [
        {
          title: "بداية عشوائية",
          description:
            "تدخل مستوى مش مناسب، فتلاقي نفسك يا بتعيد حاجات عارفها يا بتغرق في حاجات لسه بدري عليها.",
        },
        {
          title: "مذاكرة من غير استخدام",
          description:
            "اللغة محتاجة تدريب عملي، مواقف، مهام قصيرة، وممارسة يومية تخليك تستخدمها بدل ما تحفظها بس.",
        },
        {
          title: "حماس من غير متابعة",
          description:
            "أول أسبوع بيكون سهل. اللي بيفرق بعده هو متابعة على الالتزام وخطوات صغيرة تكمل عليها.",
        },
      ],
    },
    assessment: {
      title: "التقييم المجاني هو نقطة البداية المنطقية",
      description:
        "التقييم نفسه خارجي، والموقع هنا علشان تسجل وتختار وقت مناسب. بعدها فريق المتابعة يتواصل معاك، يفهم هدفك، ويوضح لك أنسب خطوة بناءً على مستواك.",
      bullets: [
        "تسجيل سريع بدون دفع",
        "اختيار وقت مناسب للتقييم",
        "توضيح خطة مناسبة لمستواك وهدفك",
      ],
      cta: "اختار ميعاد تقييمك المجاني",
    },
    steps: {
      title: "رحلة واضحة بدل قرارات عشوائية",
      items: [
        {
          title: "اعرف مستواك",
          description: "ابدأ بتقييم خارجي يوضح نقطة البداية بدل التخمين.",
        },
        {
          title: "نفهم هدفك",
          description: "شغل، سفر، دراسة، مقابلات، أو ثقة في المحادثة. الهدف يغير الخطة.",
        },
        {
          title: "خطة مناسبة",
          description: "برنامج عملي فيه تدريب ومهام وممارسة على استخدام حقيقي للغة.",
        },
        {
          title: "متابعة وممارسة",
          description: "فريق المتابعة يساعدك تفضل ملتزم وتعرف الخطوة اللي بعدها.",
        },
      ],
    },
    delivery: {
      title: "أونلاين أو من فرع الدقي",
      onlineLabel: "أونلاين",
      online:
        "مناسب لو جدولك مزدحم، مع تدريب منظم ومتابعة وممارسة مش مجرد مشاهدة محاضرات.",
      branchLabel: "فرع الدقي",
      branch:
        "اختيار مناسب لو الحضور بيساعدك تلتزم أكتر وتتعلم وسط بيئة تدريب واضحة.",
      note: "الاختيار بين الأونلاين وفرع الدقي بيتم بعد معرفة مستواك وهدفك والمواعيد المتاحة.",
    },
    successManager: {
      title: "Success Manager يتابع الخطة معاك",
      description:
        "الفكرة مش إنك تبدأ وخلاص. في متابعة تساعدك تعرف المطلوب، تلتزم بالتدريب، وتعدل الخطة لو احتجت.",
      points: [
        "متابعة يومية على التدريب والالتزام",
        "مهام ومشاريع قصيرة لاستخدام اللغة",
        "تنبيه واضح للخطوة الجاية بدل التوهان",
      ],
    },
    cta: {
      title: "ابدأ بتقييم مجاني قبل ما تختار أي برنامج",
      description:
        "مش محتاج تاخد قرار كبير دلوقتي. سجل بياناتك، اختار وقت مناسب، وبعد التقييم هتعرف أنسب طريق ليك.",
      primary: "ابدأ بتقييم مجاني",
      secondary: "تحدث مع Success Manager",
    },
    faq: {
      title: "أسئلة مهمة قبل التسجيل",
      items: [
        {
          question: "هل التقييم جوه الموقع؟",
          answer:
            "لا. التقييم خارجي. الموقع مخصص للتسجيل واختيار وقت مناسب، وبعدها فريق Success Academy يتواصل معاك.",
        },
        {
          question: "هل لازم أكون كويس في الإنجليزي؟",
          answer:
            "لا. الهدف من البداية هو معرفة مستواك الحقيقي وبناء خطة مناسبة ليه.",
        },
        {
          question: "إيه المختلف في Success Academy؟",
          answer:
            "الاختلاف في الاتجاه والمتابعة: تدريب عملي، ممارسة يومية، مهام قصيرة، وخطوة واضحة بعد كل مرحلة.",
        },
        {
          question: "هل في أونلاين وحضور؟",
          answer:
            "نعم. متاح تعلم أونلاين، ومتاح حضور في فرع الدقي حسب المناسب لمستواك والمواعيد المتاحة.",
        },
        {
          question: "التكلفة تبدأ من كام؟",
          answer:
            "البرامج تبدأ من 1750 جنيه. التفاصيل بتتحدد بعد معرفة مستواك وهدفك من اللغة.",
        },
      ],
    },
    form: {
      title: "ابدأ بتقييم مجاني واعرف أنسب طريق ليك",
      subtitle:
        "سيب بياناتك واختار ميعاد مناسب، وفريق المتابعة هيتواصل معاك يشرح لك الخطوة الجاية.",
      stepOne: "بيانات البداية",
      stepTwo: "اختيار الميعاد",
      labels: {
        fullName: "الاسم بالكامل",
        phone: "رقم الموبايل / واتساب",
        email: "البريد الإلكتروني",
        learningGoal: "هدفك من الإنجليزي",
        currentLevel: "مستواك الحالي",
        preferredLearningMode: "تفضل تتعلم إزاي؟",
        preferredAssessmentTime: "اختار ميعاد مناسب للتقييم",
        notes: "ملاحظات إضافية",
        consent: "أوافق أن يتواصل معي فريق Success Academy بخصوص التقييم المجاني",
      },
      placeholders: {
        fullName: "اكتب اسمك",
        phone: "مثال: 01000000000",
        email: "name@example.com",
        notes: "أي تفاصيل تحب نعرفها قبل التواصل",
      },
      learningGoalOptions: [
        { value: "work", label: "شغل" },
        { value: "travel", label: "سفر" },
        { value: "study", label: "دراسة" },
        { value: "speaking", label: "محادثة وثقة" },
        { value: "interviews", label: "مقابلات عمل" },
        { value: "general", label: "تطوير عام" },
        { value: "not_sure", label: "مش متأكد" },
      ],
      currentLevelOptions: [
        { value: "beginner", label: "مبتدئ" },
        { value: "basic", label: "عندي أساسيات" },
        { value: "intermediate", label: "متوسط" },
        { value: "understand_not_speak", label: "كويس بس مش بعرف أتكلم" },
        { value: "unknown", label: "مش عارف مستوايا" },
      ],
      learningModeOptions: [
        { value: "online", label: "أونلاين" },
        { value: "dokki", label: "فرع الدقي" },
        { value: "not_sure", label: "مش متأكد" },
      ],
      assessmentTimeOptions: [
        { value: "earliest", label: "أقرب ميعاد متاح" },
        { value: "morning", label: "صباحًا" },
        { value: "afternoon", label: "بعد الظهر" },
        { value: "evening", label: "مساءً" },
        { value: "weekend", label: "ويك إند" },
        { value: "suggest", label: "خلّي فريق المتابعة يرشحلي ميعاد" },
      ],
      errors: {
        fullName: "اكتب اسمك بالكامل.",
        phone: "اكتب رقم الموبايل أو واتساب.",
        learningGoal: "اختار هدفك من الإنجليزي.",
        preferredAssessmentTime: "اختار ميعاد مناسب للتقييم.",
        consent: "لازم توافق على التواصل بخصوص التقييم المجاني.",
        submit: "حصل خطأ أثناء التسجيل. جرّب مرة تانية أو تواصل معنا على واتساب.",
      },
      buttons: {
        next: "كمل اختيار الميعاد",
        back: "رجوع",
        submit: "سجل للتقييم المجاني",
        loading: "جاري تسجيل طلبك...",
        success: "تم تسجيل طلبك بنجاح",
      },
      fallback: "لو واجهت مشكلة، تقدر تتواصل معنا مباشرة على واتساب.",
    },
    thankYou: {
      title: "تم تسجيل طلبك بنجاح",
      subtitle:
        "وصلنا بياناتك. فريق Success Academy هيراجع طلبك ويتواصل معاك علشان يوضح لك ميعاد التقييم والخطوة المناسبة لمستواك وهدفك.",
      whatsapp: "افتح واتساب",
      requestCall: "اطلب مكالمة",
      note: "مش محتاج تاخد قرار دلوقتي. ابدأ بالتقييم، وبعدها هنعرف أنسب طريق ليك.",
    },
    sticky: {
      primary: "اعرف مستواك مجانًا",
      whatsapp: "تواصل واتساب",
    },
    footer: {
      slogan: "Not Just A Course... A Direction",
      rights: "Success Academy. جميع الحقوق محفوظة.",
    },
  },
  en: {
    nav: {
      why: "The problem",
      assessment: "Free level check",
      process: "How it works",
      faq: "FAQ",
      language: "العربية",
      book: "Get your level",
    },
    hero: {
      eyebrow: "Success Academy | Not Just A Course... A Direction",
      title: "Most people don’t fail at learning English...\nthey learn it the wrong way.",
      subtitle:
        "At Success Academy, we don’t just place you in a course. We understand your goal, identify the right starting point, and guide you through a practical plan with daily practice, short tasks, and real accountability until English becomes something you can use.",
      primaryCta: "Get Your Free Level Check",
      whatsappCta: "Talk to a Success Manager",
      badge: "programs start from 1750 EGP",
      note: "Start with an external free assessment, then our team will explain the right next step.",
      cardLabel: "Direction plan",
      floatingCards: ["Starting level", "Right plan", "Real follow-up", "Free assessment"],
    },
    why: {
      title: "The issue is usually not your ability. It is the system.",
      subtitle:
        "If you started more than once and stopped, it probably was not about motivation. You were moving without diagnosis, enough practice, or accountability.",
      items: [
        {
          title: "Random starting point",
          description:
            "The wrong level wastes time: either repeating what you know or struggling with what you are not ready for.",
        },
        {
          title: "Studying without using",
          description:
            "English needs practical training, real situations, short tasks, and daily practice that turns knowledge into use.",
        },
        {
          title: "Motivation without follow-up",
          description:
            "The first week is easy. What matters after that is accountability and small steps you can keep following.",
        },
      ],
    },
    assessment: {
      title: "The free level check is the logical first step",
      description:
        "The assessment is external. This page lets you register and choose a suitable time. Then our follow-up team contacts you, understands your goal, and explains the right next step.",
      bullets: [
        "Quick registration with no payment",
        "Choose a suitable assessment time",
        "Get a plan that fits your level and goal",
      ],
      cta: "Choose your free assessment time",
    },
    steps: {
      title: "A clear journey instead of random decisions",
      items: [
        {
          title: "Know your level",
          description: "Start with an external assessment that gives you a real starting point.",
        },
        {
          title: "Define your goal",
          description: "Work, travel, study, interviews, or speaking confidence. The goal shapes the plan.",
        },
        {
          title: "Get the right plan",
          description: "A practical program with training, tasks, and real use of English.",
        },
        {
          title: "Follow up and practice",
          description: "The team helps you stay committed and know what comes next.",
        },
      ],
    },
    delivery: {
      title: "Learn online or at the Dokki branch",
      onlineLabel: "Online",
      online:
        "Built for busy schedules, with structured training, follow-up, and practice instead of passive lessons.",
      branchLabel: "Dokki branch",
      branch:
        "A good option if learning in person helps you stay committed in a clear training environment.",
      note: "Online or Dokki branch options are confirmed after your level, goal, and available times are clear.",
    },
    successManager: {
      title: "A Success Manager follows the plan with you",
      description:
        "The point is not just to start. It is to keep moving with someone helping you understand what to do, stay committed, and adjust when needed.",
      points: [
        "Daily follow-up on practice and commitment",
        "Short tasks and projects for real language use",
        "Clear next steps instead of confusion",
      ],
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
          answer:
            "No. The assessment is external. This website is for registration and selecting a suitable time, then the Success Academy team contacts you.",
        },
        {
          question: "Do I need to be good at English already?",
          answer:
            "No. The point is to understand your current level first, then build the right plan around it.",
        },
        {
          question: "What makes Success Academy different?",
          answer:
            "Direction and accountability: practical training, daily practice, short tasks, and a clear next step after each stage.",
        },
        {
          question: "Can I learn online or in person?",
          answer:
            "Yes. Online learning is available, and in-person learning is available at the Dokki branch depending on your suitable path and available times.",
        },
        {
          question: "How much do programs start from?",
          answer:
            "programs start from 1750 EGP. Details are confirmed after your level and English goal are clear.",
        },
      ],
    },
    form: {
      title: "Start with a free level check",
      subtitle:
        "Leave your details, choose a suitable assessment time, and our team will contact you with the next step.",
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
  },
};
