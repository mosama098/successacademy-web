import { NextResponse } from "next/server";

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

  if (missing.length > 0 || body.consent !== true) {
    return NextResponse.json(
      { ok: false, error: "validation_error", missing: body.consent === true ? missing : [...missing, "consent"] },
      { status: 400 },
    );
  }

  const submittedAt = new Date().toISOString();
  const payload = {
    status: "new_assessment_lead",
    source: "website",
    submittedAt,
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim(),
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

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!webhookUrl) {
    const message = "LEADS_WEBHOOK_URL is not configured.";

    if (!isProduction) {
      console.warn(message, payload);
      return NextResponse.json({ ok: true, dev: true, message, lead: payload });
    }

    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 500 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { "x-leads-secret": webhookSecret } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Lead webhook failed", response.status, await response.text());
      return NextResponse.json({ ok: false, error: "webhook_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lead webhook error", error);
    return NextResponse.json({ ok: false, error: "webhook_error" }, { status: 502 });
  }
}
