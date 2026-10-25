import type { LeadApiErrorCode, LeadApiResponse } from "@/lib/lead/api-types";
import { validateLead, type FieldErrors } from "@/lib/lead/validation";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { forwardLeadToSheet } from "@/lib/server/sheets-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const MIN_FILL_TIME_MS = 2_500;
const RATE_LIMIT = { max: 5, windowMs: 15 * 60_000 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MESSAGES: Record<LeadApiErrorCode, string> = {
  invalid_request: "الطلب ماشي صحيح. عاود حمّل الصفحة وجرب مرة أخرى.",
  forbidden: "الطلب ماشي مسموح.",
  payload_too_large: "المعلومات لي صيفطتي طويلة بزاف.",
  validation_error: "عافاك صحح الخانات لي فيهم خطأ.",
  rate_limited: "صيفطتي بزاف ديال الطلبات. عاود جرب من بعد شوية.",
  not_configured: "الخدمة ما زال ما مفعّلاش. عاود جرب من بعد.",
  upstream_error: "وقع مشكل تقني. المعلومات ديالك باقية، عاود جرب من بعد شوية.",
};

function json(body: LeadApiResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function fail(error: LeadApiErrorCode, status: number, fieldErrors?: FieldErrors) {
  return json({ ok: false, error, message: MESSAGES[error], ...(fieldErrors ? { fieldErrors } : {}) }, status);
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function buildSource(utm: unknown): string {
  const parts = ["website"];
  if (utm && typeof utm === "object") {
    for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
      const value = (utm as Record<string, unknown>)[key];
      if (typeof value === "string") {
        const safe = value.replace(/[^\w.\-]/g, "").slice(0, 40);
        if (safe) parts.push(`${key}=${safe}`);
      }
    }
  }
  return parts.join(" | ");
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("forbidden", 403);

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return fail("invalid_request", 415);
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return fail("payload_too_large", 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return fail("invalid_request", 400);
  }

  // Spam signals: answer as if accepted so bots get no feedback, but store nothing.
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : NaN;
  if (!Number.isFinite(startedAt)) return fail("invalid_request", 400);
  if (honeypot || Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return json({ ok: true, leadId: null }, 200);
  }

  const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
  if (!UUID_RE.test(submissionId)) return fail("invalid_request", 400);

  if (!rateLimit(`ip:${clientIp(req.headers)}`, RATE_LIMIT.max, RATE_LIMIT.windowMs)) {
    return fail("rate_limited", 429);
  }

  const result = validateLead(body);
  if (!result.ok) return fail("validation_error", 400, result.errors);

  const forwarded = await forwardLeadToSheet(result.data, {
    submissionId,
    source: buildSource(body.utm),
  });

  if (forwarded.ok) return json({ ok: true, leadId: forwarded.leadId }, 201);

  switch (forwarded.reason) {
    case "rate_limited":
      return fail("rate_limited", 429);
    case "validation_error":
      return fail("validation_error", 400);
    case "not_configured":
      return fail("not_configured", 503);
    default:
      return fail("upstream_error", 502);
  }
}
