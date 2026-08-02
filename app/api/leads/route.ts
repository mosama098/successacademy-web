import { NextResponse } from "next/server";
import { normalizeEgyptianMobile } from "@/lib/phone";

type LeadRequest = {
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
  metadata?: Record<string, string>;
};

const requiredFields: Array<keyof LeadRequest> = [
  "fullName",
  "phone",
  "learningGoal",
  "preferredLearningMode",
  "preferredAssessmentTime",
];

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

  const missing = requiredFields.filter((field) => !String(body[field] ?? "").trim());
  const normalizedPhone = normalizeEgyptianMobile(String(body.phone ?? ""));

  if (!normalizedPhone && !missing.includes("phone")) {
    missing.push("phone");
  }

  if (missing.length > 0 || body.consent !== true) {
    return NextResponse.json(
      { ok: false, error: "validation_error", missing: body.consent === true ? missing : [...missing, "consent"] },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "submission_unavailable" }, { status: 500 });
  }

  const submittedAt = new Date().toISOString();
  const payload = {
    secret: webhookSecret,
    status: "new_assessment_lead",
    source: "website",
    submittedAt,
    fullName: body.fullName?.trim(),
    phone: normalizedPhone,
    email: body.email?.trim() ?? "",
    learningGoal: body.learningGoal,
    currentLevel: body.currentLevel ?? "",
    preferredLearningMode: body.preferredLearningMode ?? "",
    preferredAssessmentTime: body.preferredAssessmentTime,
    notes: body.notes?.trim() ?? "",
    metadata: {
      locale: body.metadata?.locale ?? "",
      pagePath: body.metadata?.pagePath ?? "",
      referrer: body.metadata?.referrer ?? "",
      userAgent: body.metadata?.userAgent ?? request.headers.get("user-agent") ?? "",
      utm_source: body.metadata?.utm_source ?? "",
      utm_medium: body.metadata?.utm_medium ?? "",
      utm_campaign: body.metadata?.utm_campaign ?? "",
      utm_content: body.metadata?.utm_content ?? "",
      utm_term: body.metadata?.utm_term ?? "",
      gclid: body.metadata?.gclid ?? "",
      fbclid: body.metadata?.fbclid ?? "",
      ttclid: body.metadata?.ttclid ?? "",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    let result: unknown;

    try {
      result = await response.json();
    } catch {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    if (!isSuccessfulWebhookResponse(result)) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
  }
}

function isSuccessfulWebhookResponse(value: unknown): value is { success: true } {
  return typeof value === "object" && value !== null && "success" in value && value.success === true;
}
