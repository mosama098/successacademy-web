import type { Locale } from "@/lib/i18n";

type LegalSection = {
  id: "privacy" | "terms" | "cookies" | "data" | "tracking" | "contact";
  title: string;
  paragraphs: string[];
  items?: string[];
};

type BusinessOption = {
  value: string;
  label: string;
};

type SitePagesContent = {
  blog: {
    badge: string;
    title: string;
    description: string;
    readArticle: string;
    breadcrumbHome: string;
    breadcrumbBlog: string;
    assessmentCta: string;
  };
  legal: {
    badge: string;
    title: string;
    description: string;
    updated: string;
    navigationLabel: string;
    sections: LegalSection[];
    whatsapp: string;
    call: string;
  };
  business: {
    badge: string;
    heroTitle: string;
    heroDescription: string;
    heroCta: string;
    benefitsTitle: string;
    benefitsDescription: string;
    benefits: string[];
    audienceTitle: string;
    audienceDescription: string;
    audience: string[];
    processTitle: string;
    processDescription: string;
    process: Array<{ title: string; description: string }>;
    form: {
      badge: string;
      title: string;
      description: string;
      optional: string;
      labels: {
        companyName: string;
        contactName: string;
        phone: string;
        email: string;
        employeeCount: string;
        preferredTrainingMode: string;
        trainingGoal: string;
        notes: string;
        consent: string;
      };
      placeholders: {
        companyName: string;
        contactName: string;
        phone: string;
        email: string;
        trainingGoal: string;
        notes: string;
      };
      employeeCountOptions: BusinessOption[];
      trainingModeOptions: BusinessOption[];
      errors: {
        companyName: string;
        contactName: string;
        phone: string;
        email: string;
        employeeCount: string;
        preferredTrainingMode: string;
        trainingGoal: string;
        consent: string;
      };
      submit: string;
      loading: string;
      success: string;
      failure: string;
      reassurance: string;
    };
    finalTitle: string;
    finalDescription: string;
    finalCta: string;
  };
};

const ar: SitePagesContent = {
  blog: {
    badge: "المدونة",
    title: "محتوى يساعدك تتعلم الإنجليزي باتجاه أوضح",
    description:
      "نصائح عملية وأفكار بسيطة تساعدك تطور مهاراتك، تتجنب الأخطاء الشائعة، وتختار طريقة التعلم المناسبة ليك.",
    readArticle: "اقرأ المقال",
    breadcrumbHome: "الرئيسية",
    breadcrumbBlog: "المدونة",
    assessmentCta: "ابدأ بتقييم مستواك مجانًا",
  },
  legal: {
    badge: "معلومات قانونية",
    title: "السياسات والشروط والأحكام",
    description:
      "معلومات واضحة عن استخدام الموقع، البيانات التي ترسلها، وأدوات القياس والتواصل المستخدمة.",
    updated: "آخر تحديث: أغسطس 2026",
    navigationLabel: "محتويات الصفحة",
    sections: [
      {
        id: "privacy",
        title: "سياسة الخصوصية",
        paragraphs: [
          "نحترم خصوصيتك ونجمع فقط المعلومات التي ترسلها لنا مباشرة، أو البيانات التقنية الأساسية التي تساعدنا نفهم أداء الموقع ومصادر الزيارات.",
          "قد تشمل البيانات التي تقدمها الاسم، رقم الموبايل، البريد الإلكتروني، هدف التعلم، وطريقة أو وقت التواصل المفضل. لا نطلب بيانات دفع من خلال نماذج هذا الموقع.",
        ],
      },
      {
        id: "terms",
        title: "الشروط والأحكام",
        paragraphs: [
          "باستخدام الموقع، أنت توافق على استخدامه بصورة قانونية وعدم محاولة تعطيله أو إساءة استخدام محتواه أو نماذجه.",
          "المحتوى التعليمي والنصوص والتصميمات والعلامات المعروضة على الموقع مملوكة لأصحابها، ولا يجوز إعادة استخدامها تجاريًا من غير إذن. الروابط الخارجية تخضع لسياسات المواقع التي تنتقل إليها، ولسنا مسؤولين عن محتواها أو توافرها.",
          "قد نحدّث هذه السياسات عند تغير خدمات الموقع أو أدواته. يظهر تاريخ آخر تحديث أعلى الصفحة، ويُعد استمرار استخدام الموقع بعد التحديث قبولًا للنسخة المنشورة.",
        ],
      },
      {
        id: "cookies",
        title: "إشعار ملفات الارتباط والتتبع",
        paragraphs: [
          "قد تستخدم أدوات القياس والتسويق ملفات ارتباط أو معرفات مشابهة لقياس الزيارات، فهم التفاعل مع الصفحات، وتحسين الحملات. تتحكم إعدادات متصفحك في قبول ملفات الارتباط أو حذفها.",
          "تعطيل بعض أدوات التتبع لا يمنعك من قراءة المحتوى أو إرسال نموذج التواصل، لكنه قد يقلل دقة قياس الأداء.",
        ],
      },
      {
        id: "data",
        title: "استخدام بيانات نموذج التواصل",
        paragraphs: [
          "نستخدم البيانات التي ترسلها لتأكيد طلبك، التواصل معك، فهم احتياجك، واقتراح نقطة البداية أو برنامج التدريب المناسب. لا نعرض بيانات النموذج للعامة.",
          "نحتفظ بالبيانات للمدة اللازمة للمتابعة وتشغيل الخدمة وحل أي طلبات مرتبطة بها. يمكنك طلب تصحيح بياناتك أو الاستفسار عن استخدامها أو طلب حذفها من خلال وسائل التواصل المتاحة، مع مراعاة أي احتياج تشغيلي مشروع للاحتفاظ بسجل أساسي.",
        ],
      },
      {
        id: "tracking",
        title: "Google Analytics وGTM وMeta Pixel وTikTok Pixel",
        paragraphs: [
          "يستخدم الموقع Google Tag Manager لإدارة قياس الزيارات، وقد يتضمن Google Analytics لعرض بيانات مجمعة عن استخدام الصفحات. كما قد تُستخدم Meta Pixel وTikTok Pixel لقياس نتائج الحملات والإجراءات المهمة مثل إرسال نموذج أو الضغط على وسيلة تواصل.",
          "هذه الأدوات قد تستقبل معلومات تقنية مثل الصفحة، نوع الجهاز، مصدر الزيارة، أو معرفات الحملات. إعدادات هذه الأدوات تعتمد على القيم المفعّلة في بيئة تشغيل الموقع.",
        ],
      },
      {
        id: "contact",
        title: "واتساب والتواصل ومعلومات الاتصال",
        paragraphs: [
          "عند الضغط على رابط واتساب أو الاتصال، تنتقل إلى خدمة خارجية أو تطبيق الهاتف، وتخضع المحادثة أو المكالمة لسياسة تلك الخدمة. استخدم وسائل التواصل الرسمية المعروضة في الموقع للاستفسار عن بياناتك أو هذه السياسات.",
          "لا ينشر الموقع عنوانًا بريديًا أو بريدًا إلكترونيًا قانونيًا غير موثّق. يمكن التواصل معنا من خلال رقم واتساب أو رقم الاتصال المكوّنَين للموقع.",
        ],
      },
    ],
    whatsapp: "تواصل على واتساب",
    call: "اتصل بنا",
  },
  business: {
    badge: "تدريب الشركات",
    heroTitle: "طوّر مستوى فريقك في الإنجليزي بخطة تدريب تناسب شركتك",
    heroDescription:
      "برامج تدريب عملية للشركات تساعد فرق العمل على التواصل بثقة، وتحسين الأداء، وتحقيق نتائج أوضح في بيئة العمل.",
    heroCta: "اطلب عرض تدريب",
    benefitsTitle: "تدريب مبني على احتياج فريقك",
    benefitsDescription:
      "نرتب البرنامج حول طبيعة العمل، مستوى الموظفين، والمهارات التي تحتاجها الشركة في التواصل اليومي.",
    benefits: [
      "برامج مخصصة حسب احتياج الشركة",
      "تقييم مستوى قبل البداية",
      "تدريب أونلاين أو داخل المقر",
      "مواعيد مرنة",
      "تقارير متابعة للإدارة",
      "مدربون بخبرة عملية",
    ],
    audienceTitle: "مناسب لفرق العمل المختلفة",
    audienceDescription:
      "يمكن تكييف المحتوى والمواقف التدريبية حسب مسؤوليات كل فريق داخل الشركة.",
    audience: [
      "فرق المبيعات",
      "فرق خدمة العملاء",
      "فرق الموارد البشرية",
      "فرق الإدارة",
      "فرق العمليات",
      "الموظفون الجدد",
    ],
    processTitle: "خطوات تعاون واضحة",
    processDescription:
      "من أول مناقشة للاحتياج لحد تقارير التقدم، كل خطوة لها هدف وتسليم واضح.",
    process: [
      { title: "استشارة أولية", description: "نفهم طبيعة العمل والأهداف والتحديات الأساسية." },
      { title: "تقييم الاحتياجات", description: "نراجع مستويات الفريق والمهارات المطلوبة." },
      { title: "عرض تدريبي", description: "نقترح المحتوى، نظام التنفيذ، والجدول المناسب." },
      { title: "تنفيذ البرنامج", description: "نقدم تدريبًا عمليًا مرتبطًا بمواقف العمل." },
      { title: "تقارير التقدم", description: "نشارك الإدارة بصورة واضحة عن الحضور والتطور." },
    ],
    form: {
      badge: "ابدأ المحادثة",
      title: "احكِ لنا عن احتياج شركتك",
      description: "املأ البيانات الأساسية، وفريقنا هيتواصل معاك لمناقشة الخطة المناسبة.",
      optional: "اختياري",
      labels: {
        companyName: "اسم الشركة",
        contactName: "اسم مسؤول التواصل",
        phone: "رقم الموبايل",
        email: "البريد الإلكتروني",
        employeeCount: "عدد الموظفين المطلوب تدريبهم",
        preferredTrainingMode: "طريقة التدريب المفضلة",
        trainingGoal: "هدف التدريب",
        notes: "ملاحظات إضافية",
        consent: "أوافق إن فريق Success Academy يتواصل معايا بخصوص طلب تدريب الشركة.",
      },
      placeholders: {
        companyName: "اكتب اسم الشركة",
        contactName: "اكتب اسم مسؤول التواصل",
        phone: "01012345678",
        email: "name@company.com",
        trainingGoal: "مثال: تحسين المحادثات مع العملاء وكتابة الإيميلات",
        notes: "أي تفاصيل إضافية عن الفريق أو المواعيد",
      },
      employeeCountOptions: [
        { value: "1-10", label: "1–10" },
        { value: "11-25", label: "11–25" },
        { value: "26-50", label: "26–50" },
        { value: "51-100", label: "51–100" },
        { value: "100+", label: "+100" },
      ],
      trainingModeOptions: [
        { value: "online", label: "أونلاين" },
        { value: "on_site", label: "داخل مقر الشركة" },
        { value: "hybrid", label: "نظام مرن" },
      ],
      errors: {
        companyName: "اسم الشركة مطلوب",
        contactName: "اسم مسؤول التواصل مطلوب",
        phone: "من فضلك اكتب رقم موبايل مصري صحيح، مثل 01012345678",
        email: "اكتب بريدًا إلكترونيًا صحيحًا",
        employeeCount: "اختار عدد الموظفين",
        preferredTrainingMode: "اختار طريقة التدريب المفضلة",
        trainingGoal: "اكتب هدف التدريب",
        consent: "لازم توافق على التواصل لإرسال الطلب",
      },
      submit: "اطلب عرض تدريب للشركات",
      loading: "جاري إرسال طلبك…",
      success: "تم استلام طلبك بنجاح، وسيتواصل معك فريقنا لمناقشة احتياجات شركتك.",
      failure: "حصلت مشكلة أثناء إرسال طلبك. جرّب مرة تانية أو تواصل معانا على واتساب.",
      reassurance: "بياناتك لفريق الشركات فقط، ولن يتم نشرها أو مشاركتها للعامة.",
    },
    finalTitle: "جاهز تبدأ خطة تدريب تناسب فريقك؟",
    finalDescription: "شاركنا احتياج شركتك، ونرتب معاك الخطوة الأولى بصورة واضحة.",
    finalCta: "تواصل مع فريق الشركات",
  },
};

const en: SitePagesContent = {
  blog: {
    badge: "The Blog",
    title: "Practical Guidance for a Clearer English Learning Direction",
    description:
      "Useful ideas to help you build your skills, avoid common learning mistakes, and choose an approach that fits your goals.",
    readArticle: "Read Article",
    breadcrumbHome: "Home",
    breadcrumbBlog: "Blog",
    assessmentCta: "Start Your Free Assessment",
  },
  legal: {
    badge: "Legal Information",
    title: "Privacy Policy, Terms and Conditions",
    description:
      "Clear information about using this website, the data you submit, and the measurement and contact tools it uses.",
    updated: "Last updated: August 2026",
    navigationLabel: "On this page",
    sections: [
      {
        id: "privacy",
        title: "Privacy Policy",
        paragraphs: [
          "We respect your privacy and collect only information you submit directly, together with basic technical data that helps us understand website performance and traffic sources.",
          "The details you provide may include your name, mobile number, email address, learning goal, and preferred learning or contact time. We do not request payment details through this website's lead forms.",
        ],
      },
      {
        id: "terms",
        title: "Terms and Conditions",
        paragraphs: [
          "By using this website, you agree to use it lawfully and not attempt to disrupt it or misuse its content or forms.",
          "Educational content, copy, designs, and marks displayed on the website belong to their respective owners and may not be reused commercially without permission. External links are governed by the policies of the destination services, and we are not responsible for their content or availability.",
          "We may update these policies when the website, its services, or its tools change. The latest revision date appears at the top of this page, and continued use after an update means that the published version applies.",
        ],
      },
      {
        id: "cookies",
        title: "Cookie and Tracking Notice",
        paragraphs: [
          "Measurement and advertising tools may use cookies or similar identifiers to measure visits, understand page interaction, and improve campaigns. Your browser settings control whether cookies are accepted or removed.",
          "Disabling some tracking tools does not prevent you from reading content or submitting a contact form, although it may reduce the accuracy of performance measurement.",
        ],
      },
      {
        id: "data",
        title: "Lead Form Data Use",
        paragraphs: [
          "We use the data you submit to confirm your request, contact you, understand your needs, and recommend a suitable starting point or training programme. Form details are not displayed publicly.",
          "We retain data for as long as reasonably needed to follow up, operate the service, and resolve related requests. You may ask to correct your details, enquire about their use, or request deletion through the available contact methods, subject to any legitimate operational need to retain a basic record.",
        ],
      },
      {
        id: "tracking",
        title: "Google Analytics, GTM, Meta Pixel and TikTok Pixel",
        paragraphs: [
          "The website uses Google Tag Manager to manage visit measurement and may include Google Analytics for aggregated page-usage reporting. Meta Pixel and TikTok Pixel may also be used to measure campaign results and important actions such as form submissions or contact clicks.",
          "These tools may receive technical information such as the page visited, device type, traffic source, or campaign identifiers. Their availability depends on the configuration enabled in the website's deployment environment.",
        ],
      },
      {
        id: "contact",
        title: "WhatsApp, Contact and Contact Information",
        paragraphs: [
          "When you follow a WhatsApp or call link, you move to an external service or telephone application. The resulting conversation or call is subject to that service's policies. Use the official contact methods shown on this website for questions about your data or these policies.",
          "The website does not publish an undocumented postal address or legal email address. You can contact us using the configured WhatsApp number or call number available on the site.",
        ],
      },
    ],
    whatsapp: "Contact Us on WhatsApp",
    call: "Call Us",
  },
  business: {
    badge: "Corporate Training",
    heroTitle: "Improve Your Team’s English with Training Built for Your Business",
    heroDescription:
      "Practical corporate English programmes designed to help teams communicate confidently, improve performance, and achieve clearer workplace results.",
    heroCta: "Request a Training Proposal",
    benefitsTitle: "Training Built Around Your Team",
    benefitsDescription:
      "We shape the programme around your workplace, employee levels, and the communication skills your organisation needs every day.",
    benefits: [
      "Programmes tailored to company needs",
      "Pre-training level assessment",
      "Online or on-site training",
      "Flexible scheduling",
      "Progress reports for management",
      "Trainers with practical experience",
    ],
    audienceTitle: "Designed for Different Workplace Teams",
    audienceDescription:
      "Content and practice situations can be adapted to the responsibilities of each team in your organisation.",
    audience: [
      "Sales teams",
      "Customer service teams",
      "HR teams",
      "Management teams",
      "Operations teams",
      "New employees",
    ],
    processTitle: "A Clear Cooperation Process",
    processDescription:
      "From the first conversation to progress reporting, every stage has a clear purpose and outcome.",
    process: [
      { title: "Initial consultation", description: "We understand your workplace, goals, and current challenges." },
      { title: "Needs assessment", description: "We review team levels and the skills the programme should address." },
      { title: "Training proposal", description: "We recommend content, delivery mode, and a suitable schedule." },
      { title: "Programme delivery", description: "We deliver practical training connected to workplace situations." },
      { title: "Progress reporting", description: "Management receives clear updates on attendance and development." },
    ],
    form: {
      badge: "Start the Conversation",
      title: "Tell Us About Your Company’s Needs",
      description: "Complete the essential details and our team will contact you to discuss a suitable plan.",
      optional: "Optional",
      labels: {
        companyName: "Company Name",
        contactName: "Contact Name",
        phone: "Phone Number",
        email: "Email Address",
        employeeCount: "Employee Count",
        preferredTrainingMode: "Preferred Training Mode",
        trainingGoal: "Training Goal",
        notes: "Additional Notes",
        consent: "I agree to be contacted by the Success Academy team regarding this corporate training request.",
      },
      placeholders: {
        companyName: "Enter your company name",
        contactName: "Enter the contact person's name",
        phone: "01012345678",
        email: "name@company.com",
        trainingGoal: "For example: improve client conversations and email writing",
        notes: "Any additional details about the team or preferred schedule",
      },
      employeeCountOptions: [
        { value: "1-10", label: "1–10" },
        { value: "11-25", label: "11–25" },
        { value: "26-50", label: "26–50" },
        { value: "51-100", label: "51–100" },
        { value: "100+", label: "100+" },
      ],
      trainingModeOptions: [
        { value: "online", label: "Online" },
        { value: "on_site", label: "On-site" },
        { value: "hybrid", label: "Flexible" },
      ],
      errors: {
        companyName: "Company name is required",
        contactName: "Contact name is required",
        phone: "Please enter a valid Egyptian mobile number, such as 01012345678.",
        email: "Enter a valid email address",
        employeeCount: "Choose an employee count",
        preferredTrainingMode: "Choose a preferred training mode",
        trainingGoal: "Enter a training goal",
        consent: "Consent is required to submit the request",
      },
      submit: "Request a Corporate Training Proposal",
      loading: "Submitting Your Request…",
      success: "Your request has been received successfully. Our team will contact you to discuss your company’s needs.",
      failure: "We could not submit your request. Please try again or contact us on WhatsApp.",
      reassurance: "Your details are used only by our corporate team and are not published or displayed publicly.",
    },
    finalTitle: "Ready to Build the Right Training Plan for Your Team?",
    finalDescription: "Tell us what your company needs and we will organise a clear first step with you.",
    finalCta: "Contact the Corporate Team",
  },
};

export const sitePagesContent = { ar, en } satisfies Record<Locale, SitePagesContent>;

export type BusinessPageContent = SitePagesContent["business"];
export type BusinessFormContent = SitePagesContent["business"]["form"];
