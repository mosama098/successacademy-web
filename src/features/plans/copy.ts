import type { Locale } from "@/lib/i18n";
import type { AttendanceMode, LearningLevel, PaymentMethodId, ProgramType } from "./config";

type BenefitId = "training" | "tools" | "support" | "progress";

export type PlansCopy = {
  meta: { title: string; description: string };
  gate: {
    eyebrow: string;
    title: string;
    description: string;
    labels: { fullName: string; phone: string; email: string; optional: string };
    placeholders: { fullName: string; phone: string; email: string };
    consentPrefix: string;
    privacyPolicy: string;
    submit: string;
    submitting: string;
    errors: {
      fullName: string;
      phone: string;
      email: string;
      consent: string;
      submission: string;
    };
  };
  hero: {
    placementEyebrow: string;
    directEyebrow: string;
    placementTitle: string;
    directTitle: string;
    placementDescription: (level: LearningLevel) => string;
    directDescription: string;
    startLabel: string;
    lockedLabel: string;
    chooseStart: string;
    chooseStartHelp: string;
    assessmentCta: string;
  };
  program: {
    selectorLabel: string;
    options: Record<ProgramType, string>;
    sessionDurationLabel: string;
    sessionDuration: (hours: number) => string;
  };
  goal: {
    eyebrow: string;
    title: string;
    description: string;
    finishLevel: (level: LearningLevel) => string;
    selected: string;
    outcomes: Record<LearningLevel, string>;
  };
  plan: {
    eyebrow: string;
    title: string;
    placeholderTitle: string;
    placeholderBody: string;
    route: (start: LearningLevel, target: LearningLevel) => string;
    singleLevelRoute: (level: LearningLevel) => string;
    levelsLabel: string;
    startLabel: string;
    targetLabel: string;
    hoursLabel: string;
    sessionsLabel: string;
    durationLabel: string;
    packageLabel: string;
    priceLabel: string;
    savingLabel: string;
    regularPriceLabel: string;
    estimatedDuration: (weeks: number) => string;
    reason: (
      packageName: string,
      start: LearningLevel,
      target: LearningLevel,
      levels: number,
    ) => string;
    b2NextStep: string;
    primaryCta: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    description: string;
    groups: ReadonlyArray<{ id: BenefitId; title: string; details: readonly string[] }>;
  };
  comparison: {
    eyebrow: string;
    title: string;
    description: string;
    swipeHint: string;
    recommended: string;
    offer: string;
    save: (amount: string) => string;
    includes: string;
    inclusions: readonly string[];
    selectPackage: string;
    selectedPackage: string;
    chooseStartFirst: string;
    unavailableForStart: string;
  };
  payment: {
    eyebrow: string;
    title: string;
    description: string;
    displayOnly: string;
  };
  support: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    message: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: ReadonlyArray<{ question: string; answer: string }>;
  };
  checkout: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    summaryTitle: string;
    pathLabel: string;
    levelsLabel: string;
    methodsTitle: string;
    methodsBody: string;
    backToPlans: string;
    invalidTitle: string;
    invalidBody: string;
    attendanceTitle: string;
    attendanceBody: string;
    attendanceRequired: string;
    attendanceSelected: string;
    attendanceChange: string;
    attendanceOptions: Record<AttendanceMode, { title: string; description: string }>;
    continueToPayment: string;
    continueUnavailable: string;
  };
  common: {
    hours: string;
    sessions: string;
    currency: string;
    level: string;
  };
  paymentMethods: Record<PaymentMethodId, { title: string; description: string }>;
};

const ar: PlansCopy = {
  meta: {
    title: "خطتك التعليمية المقترحة | Success Academy",
    description: "حدد نقطة البداية والهدف، واعرف المستويات والساعات والباقة المناسبة لمسارك.",
  },
  gate: {
    eyebrow: "الباقات والأسعار",
    title: "شوف الباقات والأسعار",
    description: "سجّل بيانات بسيطة علشان تشوف الباقات والأسعار وتختار الأنسب ليك.",
    labels: {
      fullName: "الاسم بالكامل",
      phone: "رقم الموبايل / واتساب",
      email: "البريد الإلكتروني",
      optional: "اختياري",
    },
    placeholders: {
      fullName: "اكتب اسمك بالكامل",
      phone: "01xxxxxxxxx",
      email: "name@example.com",
    },
    consentPrefix: "أوافق على استخدام بياناتي للتواصل معي ومتابعة طلبي وفقًا لـ",
    privacyPolicy: "سياسة الخصوصية",
    submit: "سجّل وشاهد الباقات",
    submitting: "جارٍ التسجيل...",
    errors: {
      fullName: "اكتب اسمك بالكامل.",
      phone: "اكتب رقم موبايل صحيح.",
      email: "اكتب بريدًا إلكترونيًا صحيحًا أو اتركه فارغًا.",
      consent: "يلزم الموافقة للمتابعة.",
      submission: "تعذر تسجيل بياناتك الآن. راجع الاتصال وحاول مرة أخرى.",
    },
  },
  hero: {
    placementEyebrow: "نتيجة تقييمك جاهزة",
    directEyebrow: "استشارة تعليمية بخطوات واضحة",
    placementTitle: "ابدأ من المستوى المناسب ليك، وأوصل لهدفك بخطة واضحة",
    directTitle: "ابدأ من المستوى المناسب ليك، وأوصل لهدفك بخطة واضحة",
    placementDescription: (level) =>
      `بناءً على تقييمك، هتبدأ من مستوى ${level}. اختار المستوى اللي عايز تخلصه، وهنحسب لك المسار والساعات ومدة الدراسة.`,
    directDescription:
      "حدد نقطة البداية والهدف، وإحنا هنرتب لك المسار والساعات ومدة الدراسة.",
    startLabel: "المستوى اللي هتبدأ منه",
    lockedLabel: "بناءً على نتيجة تحديد المستوى",
    chooseStart: "اختار المستوى اللي هتبدأ منه",
    chooseStartHelp: "اختار أقرب نقطة بداية ليك، وتقدر تغيّرها قبل تحديد هدفك.",
    assessmentCta: "مش متأكد من مستواك؟ اعمل تحديد المستوى مجانًا",
  },
  program: {
    selectorLabel: "اختار نوع البرنامج",
    options: { group: "مجموعات", private: "برايفت 1:1" },
    sessionDurationLabel: "مدة الجلسة",
    sessionDuration: (hours) => `${hours} ساعة للجلسة`,
  },
  goal: {
    eyebrow: "خطوتك الجاية",
    title: "عايز تكمّل دراسة لحد أنهي مستوى؟",
    description:
      "هنحسب لك كل المستويات اللي هتدرسها بداية من مستواك وحتى نهاية المستوى اللي تختاره.",
    finishLevel: (level) => `إنهاء ${level}`,
    selected: "اختيارك",
    outcomes: {
      A1: "أساس قوي وواضح",
      A2: "تواصل يومي بثقة أكبر",
      B1: "مرونة في الدراسة والعمل",
      B2: "استخدام متقدم ومستقل",
    },
  },
  plan: {
    eyebrow: "توصية مبنية على هدفك",
    title: "خطتك المقترحة",
    placeholderTitle: "اختار نقطة البداية والهدف",
    placeholderBody: "بمجرد ما تختار، هنظهر لك المسار والمدة والباقة المناسبة في مكان واحد.",
    route: (start, target) => `من ${start} لحد نهاية ${target}`,
    singleLevelRoute: (level) => `هتبدأ من ${level} وتدرسه كاملًا`,
    levelsLabel: "المستويات اللي هتدرسها",
    startLabel: "البداية",
    targetLabel: "نهاية المسار",
    hoursLabel: "ساعات التدريب",
    sessionsLabel: "الجلسات",
    durationLabel: "المدة التقديرية",
    packageLabel: "الباقة المناسبة",
    priceLabel: "قيمة الخطة",
    savingLabel: "توفير",
    regularPriceLabel: "بدلًا من",
    estimatedDuration: (weeks) =>
      weeks === 20 ? "حوالي 20 أسبوعًا / 5 شهور" : `حوالي ${weeks} أسابيع`,
    reason: (packageName, start, target, levels) => {
      if (levels === 1) {
        return `اخترنا لك ${packageName} لأنها تغطي دراسة مستوى ${start} كاملًا حتى نهايته.`;
      }
      return `اخترنا لك ${packageName} لأنها تغطي مسارك من ${start} حتى نهاية ${target} في باقة واحدة.`;
    },
    b2NextStep: "بعد إتمام B2 تقدر تنتقل لمسار C1.",
    primaryCta: "احجز خطتك",
  },
  benefits: {
    eyebrow: "أكتر من مجرد ساعات",
    title: "كل اللي تحتاجه علشان تكمل بثقة",
    description: "الخطة تجمع التدريب المباشر، أدوات التعلم، والمتابعة في تجربة واحدة مترابطة.",
    groups: [
      { id: "training", title: "تدريب حقيقي", details: ["محاضرات LIVE تفاعلية", "تسجيلات المحاضرات مدى الحياة"] },
      { id: "tools", title: "أدوات تساعدك تتقدم", details: ["كتب + اختبارات + مهام", "أدوات المراجعة والمتابعة"] },
      { id: "support", title: "متابعة ودعم", details: ["متابعة من Success Member", "دعم فني أثناء الدراسة"] },
      { id: "progress", title: "إثبات تقدمك", details: ["شهادة بعد اجتياز كل مرحلة بنجاح", "متابعة التقدم"] },
    ],
  },
  comparison: {
    eyebrow: "كل الاختيارات قدامك",
    title: "قارن الباقات بهدوء",
    description: "كل باقة تغطي عددًا واضحًا من المستويات. الباقة الأنسب لهدفك مميزة علشان القرار يكون أسهل.",
    swipeHint: "اسحب للمقارنة بين الباقات",
    recommended: "الأنسب لخطتك",
    offer: "عرض الانطلاق",
    save: (amount) => `وفّر ${amount} جنيه`,
    includes: "تشمل",
    inclusions: ["محاضرات LIVE", "الكتب والامتحانات والمهام", "التسجيلات مدى الحياة", "المتابعة والدعم والشهادات"],
    selectPackage: "اختار الباقة",
    selectedPackage: "احجز خطتك",
    chooseStartFirst: "حدد نقطة البداية أولًا",
    unavailableForStart: "غير مطلوبة من نقطة البداية دي",
  },
  payment: {
    eyebrow: "مرونة من أول خطوة",
    title: "طريقة دفع تناسب خطتك",
    description: "إمكانية التقسيط متاحة وفق وسيلة الدفع المناسبة، ويمكن تأكيد التفاصيل عند الحجز أو عبر واتساب.",
    displayOnly: "الوسائل معروضة للتوضيح فقط، ومفيش أي مبلغ بيتحصّل في النسخة الحالية.",
  },
  support: {
    eyebrow: "محتاج تتأكد؟",
    title: "خد رأي فريقنا قبل الحجز",
    description: "هنساعدك تختار الباقة وطريقة الحضور الأنسب من غير ما تبدأ تسجيل جديد.",
    cta: "تواصل معنا على واتساب",
    message: "مرحبًا، أنا مهتم ببرامج Success Academy وعايز أعرف أنسب باقة وطريقة الحضور قبل إتمام الحجز.",
  },
  faq: {
    eyebrow: "قبل ما تبدأ",
    title: "إجابات واضحة على أهم الأسئلة",
    items: [
      { question: "عدد المحاضرات بيتحسب إزاي؟", answer: "كل مستوى يشمل 10 جلسات. مدة الجلسة 3 ساعات في المجموعات و1.5 ساعة في البرايفت 1:1، ويزيد عدد الجلسات حسب طول المسار." },
      { question: "الخطة بتاخد وقت قد إيه؟", answer: "الإيقاع المعتاد جلستان أسبوعيًا. التقديرات تبدأ من حوالي 5 أسابيع لمستوى واحد وتصل إلى حوالي 20 أسبوعًا لأربعة مستويات، ودي مدد تقديرية وليست مواعيد مضمونة." },
      { question: "المحاضرات LIVE؟", answer: "نعم، التدريب LIVE وتفاعلي علشان تمارس اللغة وتشارك أثناء المحاضرة." },
      { question: "لو فاتتني محاضرة؟", answer: "تسجيلات المحاضرات متاحة لك مدى الحياة، فتقدر ترجع للمحتوى وتراجعه وقت ما تحتاج." },
      { question: "هل فيه متابعة أثناء الدراسة؟", answer: "فيه متابعة من Success Member، وتطبيق مخصص للمراجعة والمتابعة، ودعم فني طوال فترة الدراسة." },
      { question: "هل فيه شهادة؟", answer: "تحصل على شهادة بعد إتمام كل مرحلة بنجاح." },
      { question: "هل أقدر أدفع بالتقسيط؟", answer: "أيوه، التقسيط متاح ضمن طرق الدفع المتوفرة وقت الحجز. هتظهر لك الخيارات المتاحة وتقدر تتأكد من التفاصيل قبل إتمام الدفع أو تتواصل معانا على واتساب." },
    ],
  },
  checkout: {
    metaTitle: "مراجعة خطتك | Success Academy",
    metaDescription: "راجع نقطة البداية والمستويات والباقة المقترحة قبل اختيار وسيلة الدفع.",
    title: "راجع خطتك قبل الحجز",
    description: "تأكد من التفاصيل واختر طريقة الحضور.",
    summaryTitle: "ملخص خطتك",
    pathLabel: "المسار",
    levelsLabel: "هتدرس",
    methodsTitle: "طرق الدفع المتاحة",
    methodsBody: "اختار طريقة الدفع في الخطوة التالية.",
    backToPlans: "تعديل الخطة",
    invalidTitle: "بيانات الخطة غير مكتملة",
    invalidBody: "ارجع لصفحة الخطط وحدد نقطة بداية وهدفًا صالحين للحصول على توصية صحيحة.",
    attendanceTitle: "هتحضر إزاي؟",
    attendanceBody: "اختار طريقة الحضور المناسبة ليك.",
    attendanceRequired: "اختر طريقة الحضور للمتابعة",
    attendanceSelected: "طريقة الحضور",
    attendanceChange: "تعديل",
    attendanceOptions: {
      online: { title: "أونلاين", description: "محاضرات LIVE" },
      branch: { title: "فرع الدقي", description: "حضور داخل الفرع" },
    },
    continueToPayment: "متابعة للدفع",
    continueUnavailable: "سيتم تفعيل الدفع قريباً",
  },
  common: { hours: "ساعة", sessions: "جلسات", currency: "جنيه", level: "مستوى" },
  paymentMethods: {
    card: { title: "بطاقات بنكية", description: "دفع إلكتروني في خطوة الحجز." },
    installments: { title: "التقسيط", description: "اختيارات السداد تظهر قبل التأكيد." },
    instapay: { title: "InstaPay", description: "تحويل مباشر بخطوات واضحة." },
    wallet: { title: "محافظ إلكترونية", description: "استخدم المحفظة المناسبة ليك." },
    branch: { title: "الدفع في الفرع", description: "أكمل الحجز من فرع الدقي." },
  },
};

const en: PlansCopy = {
  meta: {
    title: "Your Recommended Learning Plan | Success Academy",
    description: "Choose your starting point and goal to see the levels, hours, and package designed for your path.",
  },
  gate: {
    eyebrow: "Plans & Pricing",
    title: "View Plans & Pricing",
    description: "Enter a few details to view our plans and pricing and choose what works best for you.",
    labels: {
      fullName: "Full name",
      phone: "Mobile / WhatsApp",
      email: "Email",
      optional: "Optional",
    },
    placeholders: {
      fullName: "Enter your full name",
      phone: "01xxxxxxxxx",
      email: "name@example.com",
    },
    consentPrefix: "I agree that my information may be used to contact me and follow up on my request in line with the",
    privacyPolicy: "Privacy Policy",
    submit: "Register & View Plans",
    submitting: "Registering...",
    errors: {
      fullName: "Enter your full name.",
      phone: "Enter a valid mobile number.",
      email: "Enter a valid email or leave it blank.",
      consent: "Consent is required to continue.",
      submission: "We could not register your details right now. Check your connection and try again.",
    },
  },
  hero: {
    placementEyebrow: "Your assessment result is ready",
    directEyebrow: "A guided learning consultation",
    placementTitle: "Start at the right level and reach your goal with a clear plan",
    directTitle: "Start at the right level and reach your goal with a clear plan",
    placementDescription: (level) =>
      `Your assessment recommends starting with ${level}. Choose the final level you want to complete and we will map the full journey.`,
    directDescription:
      "Select the level you will begin studying, then choose the final level you want to complete. We will organize the path for you.",
    startLabel: "Your study starting level",
    lockedLabel: "Set by your assessment result",
    chooseStart: "Choose the level you will start studying",
    chooseStartHelp: "Select your closest starting point. You can adjust it before choosing your goal.",
    assessmentCta: "Not sure where to start? Take the free placement assessment",
  },
  program: {
    selectorLabel: "Choose Your Program",
    options: { group: "Group", private: "Private 1:1" },
    sessionDurationLabel: "Session length",
    sessionDuration: (hours) => `${hours}-hour session`,
  },
  goal: {
    eyebrow: "Choose your destination",
    title: "Which level would you like to complete through?",
    description: "We will include every level from your starting point through the end of the level you select.",
    finishLevel: (level) => `Complete through ${level}`,
    selected: "Selected",
    outcomes: {
      A1: "Build a confident foundation",
      A2: "Handle everyday communication",
      B1: "Study and work with greater ease",
      B2: "Use English independently",
    },
  },
  plan: {
    eyebrow: "Recommended around your goal",
    title: "Your recommended plan",
    placeholderTitle: "Choose your starting point and goal",
    placeholderBody: "Your levels, estimated timeline, and best-fit package will appear together here.",
    route: (start, target) => `From ${start} through the end of ${target}`,
    singleLevelRoute: (level) => `Start with ${level} and complete the full level`,
    levelsLabel: "Levels you will study",
    startLabel: "Starting level",
    targetLabel: "Final level",
    hoursLabel: "Training hours",
    sessionsLabel: "Sessions",
    durationLabel: "Estimated duration",
    packageLabel: "Recommended package",
    priceLabel: "Plan price",
    savingLabel: "You save",
    regularPriceLabel: "Instead of",
    estimatedDuration: (weeks) =>
      weeks === 20 ? "About 20 weeks / 5 months" : `About ${weeks} weeks`,
    reason: (packageName, start, target, levels) =>
      levels === 1
        ? `${packageName} covers studying the complete ${start} level from beginning to end.`
        : `${packageName} covers your complete path from ${start} through the end of ${target} in one plan.`,
    b2NextStep: "After completing B2, you can move into a C1 learning path.",
    primaryCta: "Book My Plan",
  },
  benefits: {
    eyebrow: "More than a block of hours",
    title: "Everything you need to keep moving confidently",
    description: "Live training, learning tools, and ongoing support work together as one connected experience.",
    groups: [
      { id: "training", title: "Real training", details: ["Interactive LIVE sessions", "Lifetime access to session recordings"] },
      { id: "tools", title: "Tools that move you forward", details: ["Books, assessments, and tasks", "Review and follow-up tools"] },
      { id: "support", title: "Follow-up and support", details: ["Success Member follow-up", "Technical support while you study"] },
      { id: "progress", title: "Proof of progress", details: ["Certificate after each successful stage", "Ongoing progress follow-up"] },
    ],
  },
  comparison: {
    eyebrow: "Every option, clearly explained",
    title: "Compare packages with confidence",
    description: "Each package covers a clear number of levels. Your best-fit option is highlighted to make the decision easier.",
    swipeHint: "Swipe to compare packages",
    recommended: "Best fit for your plan",
    offer: "Starter offer",
    save: (amount) => `Save EGP ${amount}`,
    includes: "Includes",
    inclusions: ["Interactive LIVE sessions", "Books, assessments, and tasks", "Lifetime recording access", "Follow-up, support, and certificates"],
    selectPackage: "Choose plan",
    selectedPackage: "Book this plan",
    chooseStartFirst: "Choose a starting level first",
    unavailableForStart: "Not required from this starting point",
  },
  payment: {
    eyebrow: "Flexibility from the start",
    title: "A payment option that fits your plan",
    description: "Installment availability depends on the payment method and can be confirmed during booking or through WhatsApp.",
    displayOnly: "Methods are shown for clarity only. No payment is collected in this version.",
  },
  support: {
    eyebrow: "Want a second opinion?",
    title: "Talk to our team before booking",
    description: "We will help you choose the right package and attendance option without creating another registration.",
    cta: "Chat with us on WhatsApp",
    message: "Hi, I'm interested in Success Academy programs and would like help choosing the right package and attendance option before booking.",
  },
  faq: {
    eyebrow: "Before you begin",
    title: "Clear answers to the questions that matter",
    items: [
      { question: "How many sessions are included?", answer: "Each level includes 10 sessions. Group sessions last 3 hours and Private 1:1 sessions last 1.5 hours, with the session count increasing according to your path." },
      { question: "How long will my plan take?", answer: "The regular rhythm is two sessions per week. Estimates range from around five weeks for one level to around twenty weeks for four levels. These are estimates, not guaranteed completion dates." },
      { question: "Are the sessions LIVE?", answer: "Yes. Training is LIVE and interactive so you can participate and practise during each session." },
      { question: "What if I miss a lecture?", answer: "Lecture recordings remain available for life, so you can revisit the material whenever needed." },
      { question: "Will someone follow my progress?", answer: "You receive Success Member follow-up, a dedicated review application, and technical support throughout your studies." },
      { question: "Will I receive a certificate?", answer: "You receive a certificate after successfully completing each stage." },
      { question: "Can I pay in installments?", answer: "Installment availability depends on the payment method and can be confirmed during booking or through WhatsApp." },
    ],
  },
  checkout: {
    metaTitle: "Review Your Learning Plan | Success Academy",
    metaDescription: "Review your starting level, study path, and recommended package before choosing a payment method.",
    title: "Review your plan before booking",
    description: "Confirm the details and choose how you would like to attend.",
    summaryTitle: "Your plan summary",
    pathLabel: "Path",
    levelsLabel: "You will study",
    methodsTitle: "Available payment methods",
    methodsBody: "You will choose your payment method in the next step.",
    backToPlans: "Edit plan",
    invalidTitle: "This plan is incomplete",
    invalidBody: "Return to the plans page and select a valid starting point and goal.",
    attendanceTitle: "How would you like to attend?",
    attendanceBody: "Choose the attendance option that works for you.",
    attendanceRequired: "Choose an attendance option to continue.",
    attendanceSelected: "Attendance",
    attendanceChange: "Change",
    attendanceOptions: {
      online: { title: "Online", description: "LIVE sessions" },
      branch: { title: "Dokki branch", description: "Attend at the branch" },
    },
    continueToPayment: "Continue to payment",
    continueUnavailable: "Payment will be enabled soon.",
  },
  common: { hours: "hours", sessions: "sessions", currency: "EGP", level: "level" },
  paymentMethods: {
    card: { title: "Bank Cards", description: "Electronic payment at booking." },
    installments: { title: "Installments", description: "Repayment options appear before confirmation." },
    instapay: { title: "InstaPay", description: "A direct transfer with clear steps." },
    wallet: { title: "Electronic Wallets", description: "Use the wallet that suits you." },
    branch: { title: "Pay at the Branch", description: "Complete booking at the Dokki branch." },
  },
};

export const plansCopy = { ar, en } satisfies Record<Locale, PlansCopy>;
