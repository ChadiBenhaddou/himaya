import type { ValidLead } from "../src/lib/lead/validation";

/**
 * Server-side client for the Google Apps Script Web App.
 * URL and secret come from Cloudflare environment variables and never reach the browser.
 */

export interface WebhookEnv {
  SHEETS_WEBHOOK_URL?: string;
  SHEETS_WEBHOOK_SECRET?: string;
}

export type ForwardResult =
  | { ok: true; leadId: string }
  | { ok: false; reason: "not_configured" | "rate_limited" | "validation_error" | "upstream_error" };

interface AppsScriptResponse {
  ok?: boolean;
  leadId?: string;
  error?: string;
}

function readConfig(env: WebhookEnv, isLocalRequest: boolean): { url: string; secret: string } | null {
  const url = env.SHEETS_WEBHOOK_URL?.trim();
  const secret = env.SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret || secret.length < 32) return null;
  // Plain http is only accepted for the local emulator, and only for requests made on localhost.
  const isLocalUrl = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  if (!url.startsWith("https://") && !(isLocalUrl && isLocalRequest)) return null;
  return { url, secret };
}

export async function forwardLeadToSheet(
  env: WebhookEnv,
  lead: ValidLead,
  meta: { submissionId: string; source: string; isLocalRequest: boolean },
): Promise<ForwardResult> {
  const config = readConfig(env, meta.isLocalRequest);
  if (!config) {
    console.error("[leads] SHEETS_WEBHOOK_URL / SHEETS_WEBHOOK_SECRET missing or invalid.");
    return { ok: false, reason: "not_configured" };
  }

  let res: Response;
  try {
    // Apps Script answers POSTs with a 302 to googleusercontent.com; fetch
    // follows it with a GET that returns the script's JSON output.
    res = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.secret,
        submissionId: meta.submissionId,
        source: meta.source,
        lead,
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[leads] Webhook request failed:", err instanceof Error ? err.name : "unknown");
    return { ok: false, reason: "upstream_error" };
  }

  const text = await res.text();
  let data: AppsScriptResponse | null = null;
  try {
    data = JSON.parse(text) as AppsScriptResponse;
  } catch {
    // Usually an HTML error page: wrong URL, deployment not public, or script crashed.
    console.error(`[leads] Webhook returned non-JSON (HTTP ${res.status}). Check the deployment URL and access settings.`);
    return { ok: false, reason: "upstream_error" };
  }

  if (data?.ok === true && typeof data.leadId === "string") {
    return { ok: true, leadId: data.leadId };
  }

  console.error(`[leads] Webhook rejected the lead: ${data?.error ?? "unknown_error"}`);
  if (data?.error === "rate_limited") return { ok: false, reason: "rate_limited" };
  if (data?.error === "validation_error") return { ok: false, reason: "validation_error" };
  return { ok: false, reason: "upstream_error" };
}
