export const customerCopy = {
  ar: {
    title: "بيانات الحجز",
    fields: {
      name: "الاسم بالكامل", phone: "رقم الموبايل", whatsapp: "رقم واتساب", email: "البريد الإلكتروني",
      age: "العمر", notes: "ملاحظات (اختياري)",
    },
    required: "هذا الحقل مطلوب.", invalid: "راجع القيمة المدخلة.",
    phoneError: "اكتب رقم موبايل مصري صحيح.", emailError: "اكتب بريدًا إلكترونيًا صحيحًا.",
    ageError: "اكتب العمر بالسنوات، كعدد صحيح من 1 إلى 120.",
  },
  en: {
    title: "Booking details",
    fields: {
      name: "Full name", phone: "Mobile number", whatsapp: "WhatsApp number", email: "Email address",
      age: "Age", notes: "Notes (optional)",
    },
    required: "This field is required.", invalid: "Please check this value.",
    phoneError: "Enter a valid Egyptian mobile number.", emailError: "Enter a valid email address.",
    ageError: "Enter your age in whole years, from 1 to 120.",
  },
} as const;
