import "server-only";
import type { PaymentProofStorage, PaymentProofUpload } from "./payment-proof-storage";
import { PaymentProofStorageUnavailableError } from "./payment-proof-storage";
import { isTrustedDriveProofUrl } from "./proof-receipt";

const REQUEST_TIMEOUT_MS = 15_000;

export class GoogleDrivePaymentProofStorage implements PaymentProofStorage {
  constructor(private readonly options: {
    webhookUrl: string;
    webhookSecret: string;
    fetchImpl?: typeof fetch;
  }) {}

  async store(upload: PaymentProofUpload) {
    if (!this.options.webhookUrl.trim() || !this.options.webhookSecret.trim()) {
      throw new PaymentProofStorageUnavailableError();
    }

    try {
      const response = await (this.options.fetchImpl ?? fetch)(this.options.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          secret: this.options.webhookSecret,
          domain: "payments",
          action: "upload_payment_proof",
          payload: {
            contractVersion: 3,
            uploadKeyHash: upload.uploadKeyHash,
            fileName: upload.fileName,
            mimeType: upload.mimeType,
            contentBase64: Buffer.from(upload.bytes).toString("base64"),
          },
        }),
      });
      if (!response.ok) throw new PaymentProofStorageUnavailableError();
      const result = await response.json();
      const url = result?.data?.proofUrl;
      if (result?.success !== true || typeof url !== "string" || !isTrustedDriveProofUrl(url)) {
        throw new PaymentProofStorageUnavailableError();
      }
      return { url };
    } catch (error) {
      if (error instanceof PaymentProofStorageUnavailableError) throw error;
      throw new PaymentProofStorageUnavailableError();
    }
  }
}
