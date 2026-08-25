import type { Locale } from "@/lib/i18n";
import type { PaymentMethodId } from "./config";

export type PlansCopy = {
  badge: string;
  assessedBadge: string;
  heroTitle: string;
  directHeroTitle: string;
  heroDescription: string;
  currentLevel: string;
  chooseCurrent: string;
  currentHelp: string;
  journeyTitle: string;
  journeyDescription: string;
  goalTitle: string;
  goalDescription: string;
  targetLabel: string;
  noHigherTarget: string;
  noHigherTargetBody: string;
  planEyebrow: string;
  planTitle: string;
  planPlaceholder: string;
  targetLevel: string;
  requiredHours: string;
  sessions: string;
  packageName: string;
  packageSuffix: string;
  hoursSuffix: string;
  sessionsSuffix: string;
  price: string;
  currency: string;
  primaryCta: string;
  comparisonTitle: string;
  comparisonDescription: string;
  recommended: string;
  pathLabel: string;
  checkoutBadge: string;
  checkoutTitle: string;
  checkoutDescription: string;
  checkoutSummary: string;
  checkoutMethodsTitle: string;
  checkoutMethodsBody: string;
  plannedLabel: string;
  backToPlans: string;
  invalidPlanTitle: string;
  invalidPlanBody: string;
  privacyNote: string;
  existingLeadNote: string;
  paymentMethods: Record<PaymentMethodId, { title: string; description: string }>;
};

const ar: PlansCopy = {
  badge: "مسارك المقترح",
  assessedBadge: "بناءً على نتيجة تقييمك",
  heroTitle: "مبروك، عرفت مستواك الحقيقي",
  directHeroTitle: "ابدأ من نقطة واضحة",
  heroDescription: "اختار هدفك، وإحنا نحدد لك عدد الساعات والخطة الأقرب لرحلتك من غير تعقيد.",
  currentLevel: "مستواك الحالي",
  chooseCurrent: "حدد مستواك الحالي",
  currentHelp: "اختار أقرب مستوى ليك علشان نبني المسار المناسب.",
  journeyTitle: "رحلة التعلم",
  journeyDescription: "مسار واضح من مستواك الحالي لحد الهدف اللي اخترته.",
  goalTitle: "إيه المستوى اللي عايز توصله؟",
  goalDescription: "اختار هدفك، وهتظهر لك الخطة المناسبة فورًا.",
  targetLabel: "هدفك",
  noHigherTarget: "أنت وصلت لأعلى مستوى متاح في المسار الحالي",
  noHigherTargetBody: "فريقنا يقدر يساعدك بخطة مخصصة لتثبيت B2 وتطوير استخدامك العملي للإنجليزي.",
  planEyebrow: "توصيتنا ليك",
  planTitle: "الخطة المناسبة لك",
  planPlaceholder: "اختار مستواك الحالي وهدفك علشان تظهر توصية الخطة.",
  targetLevel: "المستوى المستهدف",
  requiredHours: "ساعات التعلم",
  sessions: "الجلسات",
  packageName: "الباقة",
  packageSuffix: "ساعة",
  hoursSuffix: "ساعة",
  sessionsSuffix: "جلسة",
  price: "السعر",
  currency: "جنيه",
  primaryCta: "ابدأ رحلتك الآن",
  comparisonTitle: "قارن الباقات",
  comparisonDescription: "شوف كل الاختيارات، والتوصية هتفضل واضحة حسب هدفك.",
  recommended: "الأنسب لمسارك",
  pathLabel: "المسار",
  checkoutBadge: "تجهيز الحجز",
  checkoutTitle: "راجع خطتك قبل اختيار طريقة الدفع",
  checkoutDescription: "راجع المسار المقترح، وهنكمل اختيار طريقة الدفع في المرحلة القادمة.",
  checkoutSummary: "ملخص الخطة",
  checkoutMethodsTitle: "طرق الدفع المخطط دعمها",
  checkoutMethodsBody: "وسائل الدفع دي مجهزة للربط في المرحلة القادمة. مفيش أي عملية دفع شغالة حاليًا.",
  plannedLabel: "قيد التجهيز",
  backToPlans: "العودة لاختيار الخطة",
  invalidPlanTitle: "اختار خطة صحيحة أولًا",
  invalidPlanBody: "ارجع لصفحة الخطط وحدد مستواك الحالي والهدف المناسب.",
  privacyNote: "استعراض الخطة لا يرسل بياناتك ولا ينشئ طلب تسجيل جديد.",
  existingLeadNote: "تسجيلك الحالي يفضل مرتبط بالمسار من غير إنشاء تسجيل جديد.",
  paymentMethods: {
    card: { title: "البطاقات وApple Pay", description: "عن طريق Paymob Accept" },
    installments: { title: "التقسيط", description: "عن طريق EasyKash" },
    instapay: { title: "InstaPay", description: "تأكيد يدوي آمن" },
    wallet: { title: "المحافظ الإلكترونية", description: "تأكيد يدوي آمن" },
    branch: { title: "الدفع في الفرع", description: "فاتورة من الفرع" },
  },
};

const en: PlansCopy = {
  badge: "Your Recommended Path",
  assessedBadge: "Based on Your Assessment Result",
  heroTitle: "Congratulations, You Know Your Starting Point",
  directHeroTitle: "Start from a Clear Point",
  heroDescription: "Choose your goal and we will map the learning hours and package that best fit your journey.",
  currentLevel: "Your Current Level",
  chooseCurrent: "Select Your Current Level",
  currentHelp: "Choose the closest level so we can build the right path.",
  journeyTitle: "Your Learning Journey",
  journeyDescription: "A clear path from your current level to the goal you choose.",
  goalTitle: "Which Level Do You Want to Reach?",
  goalDescription: "Choose your target and your recommended plan will appear instantly.",
  targetLabel: "Your Goal",
  noHigherTarget: "You Have Reached the Highest Level in This Path",
  noHigherTargetBody: "Our team can help you build a tailored plan to strengthen B2 and develop practical English use.",
  planEyebrow: "Our Recommendation",
  planTitle: "The Right Plan for You",
  planPlaceholder: "Select your current level and target to see your plan recommendation.",
  targetLevel: "Target Level",
  requiredHours: "Learning Hours",
  sessions: "Sessions",
  packageName: "Package",
  packageSuffix: "Hours",
  hoursSuffix: "hours",
  sessionsSuffix: "sessions",
  price: "Price",
  currency: "EGP",
  primaryCta: "Start Your Journey Now",
  comparisonTitle: "Compare Packages",
  comparisonDescription: "Review every option while keeping the recommendation for your goal clear.",
  recommended: "Best for Your Path",
  pathLabel: "Path",
  checkoutBadge: "Booking Preparation",
  checkoutTitle: "Review Your Plan Before Choosing a Payment Method",
  checkoutDescription: "Review the recommended path before payment selection is enabled in the next phase.",
  checkoutSummary: "Plan Summary",
  checkoutMethodsTitle: "Planned Payment Methods",
  checkoutMethodsBody: "These methods are prepared for the next integration phase. No payment or collection flow is active yet.",
  plannedLabel: "Planned",
  backToPlans: "Back to Plan Selection",
  invalidPlanTitle: "Choose a Valid Plan First",
  invalidPlanBody: "Return to the plans page and select your current level and suitable goal.",
  privacyNote: "Viewing a plan does not submit your data or create another registration.",
  existingLeadNote: "Your existing registration stays linked to this path without creating another registration.",
  paymentMethods: {
    card: { title: "Cards and Apple Pay", description: "Through Paymob Accept" },
    installments: { title: "Installments", description: "Through EasyKash" },
    instapay: { title: "InstaPay", description: "Secure manual confirmation" },
    wallet: { title: "Mobile Wallets", description: "Secure manual confirmation" },
    branch: { title: "Branch Payment", description: "Branch-issued invoice" },
  },
};

export const plansCopy = { ar, en } satisfies Record<Locale, PlansCopy>;
