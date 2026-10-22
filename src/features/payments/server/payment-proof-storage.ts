import "server-only";

export type PaymentProofUpload = {
  uploadKeyHash: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  bytes: Uint8Array;
};

export type StoredPaymentProof = {
  url: string;
};

export interface PaymentProofStorage {
  store(upload: PaymentProofUpload): Promise<StoredPaymentProof>;
}

export class PaymentProofStorageUnavailableError extends Error {
  constructor() {
    super("Payment proof storage is unavailable");
    this.name = "PaymentProofStorageUnavailableError";
  }
}
