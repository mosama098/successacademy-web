import "server-only";
import { cookies } from "next/headers";
import { getExistingAttempt } from "@/features/placement-test/server/attempt-service";
import { PLACEMENT_ATTEMPT_COOKIE } from "@/features/placement-test/server/cookie";
import type { LearningLevel } from "../config";

export type PlacementPlanContext = {
  startLevel: LearningLevel;
  hasLeadReference: true;
};

export async function getPlacementPlanContext(): Promise<PlacementPlanContext | null> {
  const token = (await cookies()).get(PLACEMENT_ATTEMPT_COOKIE)?.value;
  if (!token) return null;

  const attempt = await getExistingAttempt(token);
  if (!attempt?.finalProfile || !attempt.leadReference) return null;

  return {
    startLevel: attempt.finalProfile.placement,
    hasLeadReference: true,
  };
}

