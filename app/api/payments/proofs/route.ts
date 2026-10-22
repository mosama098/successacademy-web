import { createUploadPaymentProofHandler } from "@/features/payments/server/upload-payment-proof-handler";
import { createConfiguredPaymentProofStorage, getOrderAccessSecret } from "@/features/payments/server/service-factory";

export const runtime = "nodejs";

export const POST = createUploadPaymentProofHandler(createConfiguredPaymentProofStorage, getOrderAccessSecret);
