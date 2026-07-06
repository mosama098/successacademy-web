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
    cardLabel: string;
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
  footer: {
    slogan: string;
    rights: string;
  };
};

export const content: Record<Locale, LandingContent> = {
  ar: {
    nav: {
      why: "ليه بتفشل؟",
      assessment: "التقييم المجاني",
      process: "هتبدأ إزاي؟",
      faq: "أسئلة مهمة",
      language: "English",
      book: "اعرف مستواك",
    },
    hero: {
      eyebrow: "Success Academy | Not Just A Course... A Direction",
      title: "معظم الناس مش بتفشل في تعلم الإنجليزية... هي بتتعلمها بالطريقة الغلط.",
      subtitle:
        "في Success Academy مش بندخلك كورس وخلاص. إحنا بنحدد مستواك، نفهم هدفك، ونبني لك طريق واضح تتعلم فيه الإنجليزية بطريقة عملية، مع متابعة حقيقية من Success Manager لحد ما تبدأ تستخدم اللغة بثقة.",
      primaryCta: "اعرف مستواك مجانا",
      whatsappCta: "تحدث مع Success Manager",
      badge: "تبدأ من 1750 جنيه",
      note: "سجل بياناتك واختار ميعاد التقييم المجاني. Success Manager هيتواصل معاك ويوضح لك الخطوة اللي بعدها.",
      cardLabel: "Direction Plan",
    },
    why: {
      title: "المشكلة غالبا مش فيك... المشكلة في الطريقة",
      subtitle:
        "ناس كتير بدأت قبل كده، حفظت كلمات، حضرت محاضرات، ودفعت فلوس. وبعد كل ده لسه بتتوتر لما تتكلم. السبب إن الطريق نفسه مكنش واضح.",
      items: [
        {
          title: "بتبدأ من غير تشخيص",
          description:
            "لما تدخل مستوى غلط، بتضيع وقتك بين حاجات سهلة جدا أو صعبة جدا. البداية الصح لازم تكون بعد معرفة مستواك الحقيقي.",
        },
        {
          title: "بتذاكر من غير استخدام",
          description:
            "الإنجليزي مش معلومات تتحفظ وبس. لازم ممارسة يومية، مواقف حقيقية، ومشاريع تخليك تستخدم اللغة مش تتفرج عليها.",
        },
        {
          title: "بتسيب نفسك من غير متابعة",
          description:
            "أغلب الناس مش محتاجة كورس أكتر قد ما محتاجة حد يتابع، يفكرها، ويحاسبها على التقدم بخطوات واضحة.",
        },
      ],
    },
    assessment: {
      title: "ابدأ بتقييم مجاني يوضح لك الطريق",
      description:
        "التقييم خارجي، ومش جوه الموقع. دور الموقع إنك تسجل وتختار ميعاد مناسب، وبعدها Success Manager يتواصل معاك ويفهمك الخطوات بناء على مستواك وهدفك.",
      bullets: [
        "تسجل بياناتك وتختار ميعاد تقييم مجاني",
        "Success Manager يتواصل معاك ويشرح الخطوات",
        "بعد معرفة مستواك نرشح لك المسار الأنسب",
      ],
      cta: "اختار ميعاد التقييم المجاني",
    },
    steps: {
      title: "الطريق واضح من أول خطوة",
      items: [
        {
          title: "سجل بياناتك",
          description: "سيب لنا بيانات التواصل واختار الميعاد المناسب للتقييم المجاني.",
        },
        {
          title: "نتواصل معاك",
          description: "Success Manager هيتكلم معاك، يفهم هدفك، ويوضح لك المطلوب قبل التقييم.",
        },
        {
          title: "نعرف مستواك",
          description: "بعد التقييم الخارجي، نحدد نقطة البداية بدل ما تدخل مسار عشوائي.",
        },
        {
          title: "تبدأ بخطة ومتابعة",
          description: "تتعلم عملي، تتمرن يوميا، وتتابع تقدمك مع Success Manager.",
        },
      ],
    },
    delivery: {
      title: "تعلم أونلاين أو من فرع الدقي",
      onlineLabel: "أونلاين",
      online:
        "لو جدولك مزدحم، تقدر تبدأ أونلاين في مجموعات منظمة، بمتابعة وممارسة مش مجرد حضور محاضرات.",
      branchLabel: "فرع الدقي",
      branch:
        "ولو وجودك في مكان تعليمي بيفرق معاك، تقدر تختار الحضور في فرع الدقي حسب المواعيد المتاحة.",
      note: "اختيار الأونلاين أو الفرع بيتم بعد التواصل ومعرفة مستواك والميعاد المناسب لك.",
    },
    successManager: {
      title: "Success Manager مش رفاهية... ده جزء من الطريقة",
      description:
        "المتابعة اليومية هي اللي بتخلي الخطة تعيش بعد أول أسبوع. في Success Academy في شخص مسؤول يساعدك تفضل ماشي، فاهم المطلوب، وعارف الخطوة الجاية.",
      points: [
        "متابعة يومية للتدريب والالتزام",
        "ممارسة عملية ومشاريع تخليك تستخدم اللغة",
        "توجيه واضح لو مستواك أو هدفك محتاج تعديل",
      ],
    },
    cta: {
      title: "لو جربت قبل كده ومكملتش... ابدأ المرة دي بطريقة مختلفة",
      description:
        "مش مطلوب منك تشتري كورس دلوقتي. سجل، اعرف مستواك مجانا، وخلي Success Manager يشرح لك أنسب طريق قبل أي قرار.",
      primary: "اعرف مستواك مجانا",
      secondary: "تحدث مع Success Manager",
    },
    faq: {
      title: "أسئلة قبل ما تبدأ",
      items: [
        {
          question: "هل لازم أكون مستوايا كويس عشان أبدأ؟",
          answer:
            "لا. الفكرة إننا نعرف مستواك الحقيقي الأول، وبعدها نرشح لك بداية مناسبة بدل ما تدخل في طريق مش معمول لك.",
        },
        {
          question: "هل التقييم موجود داخل الموقع؟",
          answer:
            "لا. التقييم خارجي. الموقع مخصص للتسجيل واختيار ميعاد التقييم المجاني، وبعدها Success Manager يتواصل معاك بالخطوات.",
        },
        {
          question: "إيه المختلف عن الطرق التقليدية؟",
          answer:
            "الاختلاف في الاتجاه والمتابعة. عندك مسار واضح، ممارسة يومية، مشاريع عملية، وSuccess Manager يتابعك بدل ما تسيب نفسك بعد أول حماس.",
        },
        {
          question: "هل في أونلاين وفرع؟",
          answer:
            "نعم. Success Academy عندها تعلم أونلاين، وكمان حضور في فرع الدقي حسب المتاح والمناسب لمستواك وجدولك.",
        },
        {
          question: "التكلفة تبدأ من كام؟",
          answer:
            "تبدأ من 1750 جنيه. التفاصيل بتتحدد حسب المسار المناسب بعد معرفة مستواك وهدفك.",
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
      why: "Why people fail",
      assessment: "Free level check",
      process: "How it works",
      faq: "FAQ",
      language: "العربية",
      book: "Get your level",
    },
    hero: {
      eyebrow: "Success Academy | Not Just A Course... A Direction",
      title: "Most people don’t fail at learning English... they learn it the wrong way.",
      subtitle:
        "At Success Academy, we don’t just place you in a course. We identify your level, understand your goal, and build a clear learning direction with real follow-up from a Success Manager until English becomes something you can actually use.",
      primaryCta: "Get Your Free Level Check",
      whatsappCta: "Talk to a Success Manager",
      badge: "starts from 1750 EGP",
      note: "Register and choose a free assessment appointment. A Success Manager will contact you and explain the next steps.",
      cardLabel: "Direction Plan",
    },
    why: {
      title: "The problem is usually not you. It is the method.",
      subtitle:
        "Many adults have tried before: memorized vocabulary, attended lessons, paid for courses, and still froze when it was time to speak. That happens when there is no clear path.",
      items: [
        {
          title: "No real starting point",
          description:
            "If you start at the wrong level, you waste time on material that is either too easy or too advanced. The right start begins with knowing where you actually are.",
        },
        {
          title: "Studying without using",
          description:
            "English is not only information to memorize. You need daily practice, realistic situations, and projects that make you use the language.",
        },
        {
          title: "No accountability",
          description:
            "Most learners do not need another random course. They need direction, follow-up, reminders, and someone tracking progress with them.",
        },
      ],
    },
    assessment: {
      title: "Start with a free level check that gives you direction",
      description:
        "The assessment is external, not inside the website. Here, you register and select a suitable appointment. Then a Success Manager contacts you and explains the next steps based on your level and goal.",
      bullets: [
        "Register and choose a free assessment appointment",
        "A Success Manager contacts you and explains the process",
        "After your level is clear, we recommend the right path",
      ],
      cta: "Select your free assessment time",
    },
    steps: {
      title: "A clear path from the first step",
      items: [
        {
          title: "Register your details",
          description: "Leave your contact information and choose a suitable free assessment appointment.",
        },
        {
          title: "We contact you",
          description: "A Success Manager speaks with you, understands your goal, and explains what comes next.",
        },
        {
          title: "We identify your level",
          description: "After the external assessment, we define your real starting point instead of guessing.",
        },
        {
          title: "You start with follow-up",
          description: "You learn practically, practice daily, and track progress with your Success Manager.",
        },
      ],
    },
    delivery: {
      title: "Learn online or at the Dokki branch",
      onlineLabel: "Online",
      online:
        "If your schedule is busy, you can start online in structured groups with follow-up and practice, not passive attendance.",
      branchLabel: "Dokki branch",
      branch:
        "If learning in person helps you stay committed, you can choose available sessions at the Dokki branch.",
      note: "Online or branch options are confirmed after we contact you, understand your level, and match the right schedule.",
    },
    successManager: {
      title: "A Success Manager is not an extra. It is part of the method.",
      description:
        "Daily follow-up is what keeps the plan alive after the first week. At Success Academy, someone helps you stay on track, understand what to do, and know the next step.",
      points: [
        "Daily follow-up for practice and commitment",
        "Practical usage through exercises and projects",
        "Clear guidance when your path needs adjustment",
      ],
    },
    cta: {
      title: "If you tried before and stopped, start differently this time",
      description:
        "You do not need to buy a course now. Register, get your free level check, and let a Success Manager explain the right direction before you decide.",
      primary: "Get Your Free Level Check",
      secondary: "Talk to a Success Manager",
    },
    faq: {
      title: "Questions before you start",
      items: [
        {
          question: "Do I need to already be good at English?",
          answer:
            "No. The point is to identify your real level first, then recommend a starting point that fits you.",
        },
        {
          question: "Is the assessment inside the website?",
          answer:
            "No. The assessment is external. This website is for registration and selecting your free assessment appointment. A Success Manager will contact you afterward.",
        },
        {
          question: "What makes this different from a normal English course?",
          answer:
            "The difference is direction and accountability: a clear path, daily practice, practical projects, and follow-up from a Success Manager.",
        },
        {
          question: "Can I learn online or at the branch?",
          answer:
            "Yes. Success Academy offers online learning and in-person options at the Dokki branch, depending on availability and your suitable path.",
        },
        {
          question: "How much does it start from?",
          answer:
            "starts from 1750 EGP. Details depend on the recommended path after your level and goal are clear.",
        },
      ],
    },
    footer: {
      slogan: "Not Just A Course... A Direction",
      rights: "Success Academy. All rights reserved.",
    },
  },
};
