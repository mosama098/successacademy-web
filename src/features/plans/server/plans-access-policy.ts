import type { PlacementAttempt } from "../../placement-test/types";
import type { PlacementPlanContext } from "./placement-plan-context";

export type PlansAccessContext = {
  registered: boolean;
  placementContext: PlacementPlanContext | null;
};

export function resolvePlansAccess(
  hasGenericAcknowledgement: boolean,
  attempt: PlacementAttempt | null,
): PlansAccessContext {
  const hasPlacementRegistration = Boolean(attempt?.leadReference);
  const placementContext = attempt?.leadReference && attempt.finalProfile
    ? {
        startLevel: attempt.finalProfile.placement,
        hasLeadReference: true as const,
      }
    : null;

  return {
    registered: hasGenericAcknowledgement || hasPlacementRegistration,
    placementContext,
  };
}
