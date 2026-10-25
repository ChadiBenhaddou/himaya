import type { LeadApiResponse, LeadRequestBody } from "./api-types";

const NETWORK_ERROR_MESSAGE = "ما قدرناش نصيفطو الطلب. تأكد من الإنترنت ديالك وعاود جرب.";

/** Browser-side call to our own API route. Never talks to Google directly. */
export async function submitLead(body: LeadRequestBody): Promise<LeadApiResponse> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    const data = (await res.json().catch(() => null)) as LeadApiResponse | null;
    if (data && typeof data.ok === "boolean") return data;
    return { ok: false, error: "upstream_error", message: NETWORK_ERROR_MESSAGE };
  } catch {
    return { ok: false, error: "upstream_error", message: NETWORK_ERROR_MESSAGE };
  }
}

export function readUtmParams(): LeadRequestBody["utm"] {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const utm: NonNullable<LeadRequestBody["utm"]> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 60);
  }
  return Object.keys(utm).length ? utm : undefined;
}

export function newSubmissionId(): string {
  // randomUUID only exists in secure contexts; plain-http LAN testing falls back below.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
