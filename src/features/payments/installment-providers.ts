export type InstallmentProvider = {
  id: "nbe" | "valu" | "aman" | "souhoola" | "contact" | "tru" | "klivvr";
  name: string;
  logoPath: string | null;
};

export const installmentProviders: readonly InstallmentProvider[] = [
  { id: "nbe", name: "National Bank of Egypt (NBE)", logoPath: null },
  { id: "valu", name: "ValU", logoPath: "/payments/installments/valu.jpeg" },
  { id: "aman", name: "Aman", logoPath: "/payments/installments/aman.jpeg" },
  { id: "souhoola", name: "Souhoola", logoPath: "/payments/installments/souhoola.jpeg" },
  { id: "contact", name: "Contact", logoPath: "/payments/installments/contact.png" },
  { id: "tru", name: "Tru", logoPath: "/payments/installments/truapp.jpeg" },
  { id: "klivvr", name: "Klivvr", logoPath: "/payments/installments/klivvr.png" },
] as const;
