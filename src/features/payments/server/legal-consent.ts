import "server-only";
import type { Locale } from "../../../lib/i18n";
import type { LegalConsentSnapshot, LegalPolicyLinks } from "../types";
import { TRAINING_TERMS_VERSION } from "../../../content/training-rules";

export function getLegalPolicyLinks(locale: Locale): LegalPolicyLinks {
  return { terms: `/${locale}/legal#terms`, privacy: `/${locale}/legal#privacy`, trainingTerms: `/${locale}/legal#training-rules` };
}

export class LegalConsentRequiredError extends Error {
  constructor() { super("legal_consent_required"); }
}
export class LegalPoliciesUnavailableError extends Error {
  constructor() { super("legal_policies_unavailable"); }
}

export function requireLegalConsent(value: unknown): asserts value is { accepted: true } {
  if (typeof value !== "object" || value === null || !("accepted" in value) || value.accepted !== true) {
    throw new LegalConsentRequiredError();
  }
}

export function createLegalConsentSnapshot(acceptedAt: string, links: LegalPolicyLinks): LegalConsentSnapshot {
  if (!links.trainingTerms) throw new LegalPoliciesUnavailableError();
  return { accepted: true, acceptedAt, termsVersion: "current", privacyVersion: "current", trainingTermsVersion: TRAINING_TERMS_VERSION };
}
