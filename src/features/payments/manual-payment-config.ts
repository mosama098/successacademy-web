export const manualPaymentConfig = {
  instapay: {
    address: "successacademyeg@instapay",
    paymentUrl: "https://ipn.eg/S/successacademyeg/instapay/0v6ZNw",
    qrAssetPath: "/payments/instapay-qr.jpg",
  },
  wallet: {
    provider: "Vodafone Cash",
    number: "01090323096",
  },
  branch: {
    name: {
      ar: "فرع Success Academy بالدقي",
      en: "Success Academy Dokki Branch",
    },
    address: {
      ar: "54 شارع مصدق – الدور الأول – أمام هارديز – الدقي، الجيزة",
      en: "54 Mossad Street, First Floor, opposite Hardee's, Dokki, Giza",
    },
    mapsUrl: "https://share.google/FG28DyvPaSVj6KpWj",
    reservationHours: 72,
    workingHours: {
      ar: "يوميًا من 1 مساءً إلى 9 مساءً",
      en: "Every day, 1:00 PM–9:00 PM",
    },
    fridayClosed: {
      ar: "الجمعة إجازة",
      en: "Friday: Closed",
    },
    paymentMethods: {
      ar: ["كاش", "فيزا", "كريديت كارد", "InstaPay", "Vodafone Cash", "التقسيط"],
      en: ["Cash", "Visa", "Credit Card", "InstaPay", "Vodafone Cash", "Installments"],
    },
  },
} as const;
