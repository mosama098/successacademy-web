import { NextResponse } from "next/server";
import { normalizeEgyptianMobile } from "@/lib/phone";

type LeadMetadata = Record<string, string>;

type IndividualLeadRequest = {
  source?: "website";
  fullName?: string;
  phone?: string;
  email?: string;
  learningGoal?: string;
  currentLevel?: string;
  preferredLearningMode?: string;
  preferredAssessmentTime?: string;
  notes?: string;
  consent?: boolean;
  company?: string;
  metadata?: LeadMetadata;
};

type CorporateLeadRequest = {
  source: "corporate_training";
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  employeeCount?: string;
  preferredTrainingMode?: string;
  trainingGoal?: string;
  notes?: string;
  consent?: boolean;
  company?: string;
  metadata?: LeadMetadata;
};

type LeadRequest = IndividualLeadRequest | CorporateLeadRequest;

const individualRequiredFields: Array<keyof IndividualLeadRequest> = [
  "fullName",
  "phone",
  "learningGoal",
  "preferredLearningMode",
  "preferredAssessmentTime",
];

const corporateRequiredFields: Array<keyof CorporateLeadRequest> = [
  "companyName",
  "contactName",
  "phone",
  "email",
  "employeeCount",
  "preferredTrainingMode",
  "trainingGoal",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: LeadRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (body.company) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const result = body.source === "corporate_training"
    ? prepareCorporateLead(body, request)
    : prepareIndividualLead(body, request);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "validation_error", missing: result.missing },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "submission_unavailable" }, { status: 500 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: webhookSecret, ...result.payload }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    let webhookResult: unknown;

    try {
      webhookResult = await response.json();
    } catch {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    if (!isSuccessfulWebhookResponse(webhookResult)) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
  }
}

function prepareIndividualLead(body: IndividualLeadRequest, request: Request) {
  const missing = individualRequiredFields.filter((field) => !String(body[field] ?? "").trim());
  const normalizedPhone = normalizeEgyptianMobile(String(body.phone ?? ""));

  if (!normalizedPhone && !missing.includes("phone")) missing.push("phone");
  if (body.consent !== true) missing.push("consent");

  if (missing.length > 0 || !normalizedPhone) {
    return { ok: false as const, missing };
  }

  return {
    ok: true as const,
    payload: {
      status: "new_assessment_lead",
      source: "website",
      submittedAt: new Date().toISOString(),
      fullName: body.fullName?.trim(),
      phone: normalizedPhone,
      email: body.email?.trim() ?? "",
      learningGoal: body.learningGoal,
      currentLevel: body.currentLevel ?? "",
      preferredLearningMode: body.preferredLearningMode ?? "",
      preferredAssessmentTime: body.preferredAssessmentTime,
      notes: body.notes?.trim() ?? "",
      metadata: buildMetadata(body.metadata, request),
    },
  };
}

function prepareCorporateLead(body: CorporateLeadRequest, request: Request) {
  const missing = corporateRequiredFields.filter((field) => !String(body[field] ?? "").trim());
  const normalizedPhone = normalizeEgyptianMobile(String(body.phone ?? ""));

  if (!normalizedPhone && !missing.includes("phone")) missing.push("phone");
  if (body.email?.trim() && !emailPattern.test(body.email.trim()) && !missing.includes("email")) missing.push("email");
  if (body.consent !== true) missing.push("consent");

  if (missing.length > 0 || !normalizedPhone) {
    return { ok: false as const, missing };
  }

  return {
    ok: true as const,
    payload: {
      status: "new_corporate_training_lead",
      source: "corporate_training",
      submittedAt: new Date().toISOString(),
      companyName: body.companyName?.trim(),
      contactName: body.contactName?.trim(),
      phone: normalizedPhone,
      email: body.email?.trim(),
      employeeCount: body.employeeCount,
      preferredTrainingMode: body.preferredTrainingMode,
      trainingGoal: body.trainingGoal?.trim(),
      notes: body.notes?.trim() ?? "",
      metadata: buildMetadata(body.metadata, request),
    },
  };
}

function buildMetadata(metadata: LeadMetadata | undefined, request: Request) {
  return {
    locale: metadata?.locale ?? "",
    pagePath: metadata?.pagePath ?? "",
    referrer: metadata?.referrer ?? "",
    userAgent: metadata?.userAgent ?? request.headers.get("user-agent") ?? "",
    utm_source: metadata?.utm_source ?? "",
    utm_medium: metadata?.utm_medium ?? "",
    utm_campaign: metadata?.utm_campaign ?? "",
    utm_content: metadata?.utm_content ?? "",
    utm_term: metadata?.utm_term ?? "",
    gclid: metadata?.gclid ?? "",
    fbclid: metadata?.fbclid ?? "",
    ttclid: metadata?.ttclid ?? "",
  };
}

function isSuccessfulWebhookResponse(value: unknown): value is { success: true } {
  return typeof value === "object" && value !== null && "success" in value && value.success === true;
}
