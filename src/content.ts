import type { Locale } from "@/lib/i18n";

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
  };
  why: {
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  assessment: {
    title: string;
    description: string;
    bullets: string[];
    cta: string;
  };
  steps: {
    title: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  delivery: {
    title: string;
    online: string;
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
  footer: {
    slogan: string;
    rights: string;
  };
};

export const content: Record<Locale, LandingContent> = {
  ar: {
    nav: {
      why: "لماذا نحن",
      assessment: "التقييم المجاني",
      process: "الخطوات",
      faq: "الأسئلة",
      language: "English",
      book: "احجز تقييمك",
    },
    hero: {
      eyebrow: "Success Academy لتعلم الإنجليزية",
      title: "مش مجرد كورس... اتجاه واضح لتطوير إنجليزيتك",
      subtitle:
        "ابدأ بتقييم خارجي بسيط، ثم اختر موعد مناسب واحصل على ترشيح للمسار الأنسب حسب مستواك وهدفك.",
      primaryCta: "احجز تقييمك المجاني",
      whatsappCta: "تواصل واتساب",
      badge: "تبدأ من 1750 جنيه",
      note: "التقييم خارج الموقع. الموقع مخصص للحجز وجمع بيانات التواصل فقط.",
    },
    why: {
      title: "لماذا Success Academy؟",
      subtitle:
        "تجربة منظمة للطلاب الجادين: تقييم، توجيه، متابعة، وخطة تعلم واضحة بدون تعقيد.",
      items: [
        {
          title: "مسار حسب مستواك",
          description:
            "نبدأ من مستواك الحقيقي، ثم نرشح المسار المناسب بدل اختيار كورس عشوائي.",
        },
        {
          title: "تعلم عملي",
          description:
            "التركيز على الاستخدام اليومي، المحادثة، الثقة، والمهارات المطلوبة للدراسة والعمل.",
        },
        {
          title: "متابعة مستمرة",
          description:
            "Success Manager يساعدك تتابع الحضور، الالتزام، والتقدم خطوة بخطوة.",
        },
      ],
    },
    assessment: {
      title: "احجز تقييمك المجاني",
      description:
        "اختر موعد مناسب للتقييم الخارجي، واترك بياناتك ليتم التواصل معك وتأكيد الخطوة التالية.",
      bullets: [
        "لا يوجد امتحان داخل الموقع الآن",
        "سنرشدك للتقييم الخارجي المناسب",
        "بعد التقييم نساعدك تختار المسار والموعد",
      ],
      cta: "اختيار موعد التقييم",
    },
    steps: {
      title: "كيف تبدأ؟",
      items: [
        {
          title: "اترك بياناتك",
          description: "املأ نموذج الحجز أو تواصل معنا عبر واتساب.",
        },
        {
          title: "اختار موعد تقييم",
          description: "حدد الموعد الأنسب لك للتقييم الخارجي.",
        },
        {
          title: "استلم ترشيح المسار",
          description: "نساعدك تختار المجموعة أو الخطة المناسبة لهدفك.",
        },
        {
          title: "ابدأ وتابع تقدمك",
          description: "ابدأ الكورس مع متابعة من فريق Success Academy.",
        },
      ],
    },
    delivery: {
      title: "أونلاين أو في فرع الدقي",
      online:
        "تعلم من أي مكان عبر مجموعات أونلاين منظمة ومناسبة لجدولك.",
      branch:
        "لمن يفضل الحضور، يمكن اختيار مجموعات في فرع الدقي حسب المتاح.",
      note: "اختيار طريقة الحضور يتم بعد التواصل وتأكيد المستوى والموعد.",
    },
    successManager: {
      title: "Success Manager يتابعك",
      description:
        "المتابعة جزء أساسي من التجربة، حتى لا تشعر أنك بدأت وحدك أو فقدت الاتجاه.",
      points: [
        "تذكير بالمواعيد والخطوات المهمة",
        "متابعة الالتزام والحضور",
        "توجيه عند الحاجة لتعديل المسار",
      ],
    },
    cta: {
      title: "جاهز تحدد اتجاهك؟",
      description:
        "احجز تقييمك الآن، وسنساعدك تبدأ من المكان الصحيح بدون وعود مبالغ فيها أو تفاصيل معقدة.",
      primary: "احجز موعد تقييم",
      secondary: "اسأل عبر واتساب",
    },
    faq: {
      title: "أسئلة شائعة",
      items: [
        {
          question: "هل يوجد امتحان داخل الموقع؟",
          answer:
            "لا. التقييم خارجي في هذه المرحلة، والموقع مخصص للحجز وجمع بيانات المهتمين.",
        },
        {
          question: "هل الأسعار موجودة بالتفصيل؟",
          answer:
            "لا نعرض جداول أسعار تفصيلية. الأسعار تبدأ من 1750 جنيه حسب المسار والتفاصيل المتاحة.",
        },
        {
          question: "هل يوجد كورسات أونلاين؟",
          answer:
            "نعم، توجد خيارات أونلاين، بالإضافة إلى اختيارات حضور في فرع الدقي حسب المتاح.",
        },
        {
          question: "هل يوجد بوابة طالب أو نظام إدارة داخل الموقع؟",
          answer:
            "لا. Success Academy تستخدم أنظمة خارجية مثل Tamkeen TMS، والموقع الحالي مخصص للتسويق والحجز.",
        },
      ],
    },
    footer: {
      slogan: "Not Just A Course... A Direction",
      rights: "Success Academy. جميع الحقوق محفوظة.",
    },
  },
  en: {
    nav: {
      why: "Why us",
      assessment: "Free assessment",
      process: "How it works",
      faq: "FAQ",
      language: "العربية",
      book: "Book assessment",
    },
    hero: {
      eyebrow: "Success Academy English Courses",
      title: "Not just a course... a clear direction for your English",
      subtitle:
        "Start with a simple external assessment, choose a suitable appointment, and get guided toward the right learning path for your level and goal.",
      primaryCta: "Book your free assessment",
      whatsappCta: "WhatsApp us",
      badge: "starts from 1750 EGP",
      note: "The assessment is external. This website is for booking and lead capture only.",
    },
    why: {
      title: "Why Success Academy?",
      subtitle:
        "A focused experience for serious learners: assessment, guidance, follow-up, and a clear learning path without unnecessary complexity.",
      items: [
        {
          title: "A path based on your level",
          description:
            "We start from your real level, then recommend a suitable track instead of pushing a random course.",
        },
        {
          title: "Practical learning",
          description:
            "The focus is daily use, conversation, confidence, and skills needed for study and work.",
        },
        {
          title: "Consistent follow-up",
          description:
            "A Success Manager helps you track attendance, commitment, and progress step by step.",
        },
      ],
    },
    assessment: {
      title: "Book your free assessment",
      description:
        "Choose a suitable external assessment appointment and leave your details so our team can confirm the next step.",
      bullets: [
        "No exam is built inside the website now",
        "We guide you to the right external assessment",
        "After assessment, we help you choose the path and schedule",
      ],
      cta: "Select assessment appointment",
    },
    steps: {
      title: "How it works",
      items: [
        {
          title: "Leave your details",
          description: "Submit the booking form or contact us on WhatsApp.",
        },
        {
          title: "Choose assessment time",
          description: "Pick the most suitable appointment for the external assessment.",
        },
        {
          title: "Get a path recommendation",
          description: "We help you choose the group or plan that fits your goal.",
        },
        {
          title: "Start and follow progress",
          description: "Begin your course with follow-up from the Success Academy team.",
        },
      ],
    },
    delivery: {
      title: "Online or at the Dokki branch",
      online:
        "Learn from anywhere through structured online groups that fit your schedule.",
      branch:
        "If you prefer in-person learning, you can choose available groups at the Dokki branch.",
      note: "Delivery format is confirmed after contact, level confirmation, and appointment selection.",
    },
    successManager: {
      title: "A Success Manager follows up with you",
      description:
        "Follow-up is part of the experience, so you do not feel like you started alone or lost direction.",
      points: [
        "Reminders for appointments and key steps",
        "Attendance and commitment follow-up",
        "Guidance if your path needs adjustment",
      ],
    },
    cta: {
      title: "Ready to choose your direction?",
      description:
        "Book your assessment now, and we will help you start from the right place without exaggerated promises or complicated details.",
      primary: "Book assessment time",
      secondary: "Ask on WhatsApp",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          question: "Is the exam inside the website?",
          answer:
            "No. The assessment is external at this stage. This website is for booking and lead capture.",
        },
        {
          question: "Do you show detailed pricing?",
          answer:
            "No detailed pricing tables are shown. Pricing starts from 1750 EGP depending on the path and available details.",
        },
        {
          question: "Are online courses available?",
          answer:
            "Yes. Online options are available, along with in-person options at the Dokki branch depending on availability.",
        },
        {
          question: "Is there a student portal or admin system here?",
          answer:
            "No. Success Academy already uses external systems such as Tamkeen TMS. This website is only for marketing and booking.",
        },
      ],
    },
    footer: {
      slogan: "Not Just A Course... A Direction",
      rights: "Success Academy. All rights reserved.",
    },
  },
};
