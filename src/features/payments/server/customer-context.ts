import "server-only";
import { createHash, createHmac } from "node:crypto";
import { getExistingAttempt } from "../../placement-test/server/attempt-service";
import { readAttemptToken } from "../../placement-test/server/cookie";
import type { LearningLevel } from "../../plans/config";
import type { OrderCustomer } from "../types";
import type { CustomerContact } from "../validation";

export type OrderCustomerContext = { customer: OrderCustomer; startLevel: LearningLevel | null };

export async function resolveOrderCustomer(
  request: Request,
  contact: CustomerContact,
  idempotencyKey: string,
  secret: string,
): Promise<OrderCustomerContext> {
  const token = readAttemptToken(request.headers.get("cookie"));
  const attempt = token ? await getExistingAttempt(token) : null;
  if (attempt?.leadReference) {
    return {
      customer: {
        id: `lead_${createHash("sha256").update(attempt.leadReference).digest("hex")}`,
        leadReference: attempt.leadReference,
        identitySource: "existing_lead",
        ...contact,
      },
      startLevel: attempt.finalProfile?.placement ?? null,
    };
  }

  // A checkout contact is not an authenticated identity. No account or lead is created.
  return {
    customer: {
      id: `checkout_${createHmac("sha256", secret).update(`checkout:${idempotencyKey}`).digest("hex")}`,
      leadReference: null,
      identitySource: "checkout_contact",
      ...contact,
    },
    startLevel: null,
  };
}
