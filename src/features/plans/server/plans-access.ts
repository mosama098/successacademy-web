import "server-only";
import { cookies } from "next/headers";
import {
  isLeadRegistrationAcknowledged,
  LEAD_REGISTRATION_COOKIE,
} from "@/features/leads/server/registration-cookie";
import { getExistingAttempt } from "@/features/placement-test/server/attempt-service";
import { PLACEMENT_ATTEMPT_COOKIE } from "@/features/placement-test/server/cookie";
import { resolvePlansAccess } from "./plans-access-policy";

export async function getPlansAccessContext() {
  const cookieStore = await cookies();
  const acknowledged = isLeadRegistrationAcknowledged(
    cookieStore.get(LEAD_REGISTRATION_COOKIE)?.value,
  );
  const token = cookieStore.get(PLACEMENT_ATTEMPT_COOKIE)?.value;
  const attempt = token ? await getExistingAttempt(token) : null;

  return resolvePlansAccess(acknowledged, attempt);
}
