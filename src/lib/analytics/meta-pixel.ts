import { SITE } from "@/content/site";

/** Meta (Facebook) Pixel ID. Public by design: it's visible in every page that uses it. */
export const META_PIXEL_ID = "1067427867822542";

type Fbq = (command: "init" | "track" | "trackCustom", event: string, params?: object, options?: object) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const LEAD_ID_RE = /^HM-[A-Z0-9-]{6,40}$/;

export function isValidLeadId(value: string | null): value is string {
  return !!value && LEAD_ID_RE.test(value);
}

/**
 * Fires the standard "Lead" event once per lead, on the /merci thank-you page.
 * - Waits up to 10 s for the pixel script (loaded "afterInteractive") to define fbq.
 * - eventID = the sheet's Lead ID, so Meta de-duplicates repeats (and a future Conversions API).
 * - A sessionStorage flag stops reloads of the thank-you page from re-firing it.
 * No personal data (name, phone…) is sent to Meta.
 */
export function trackLead(leadId: string) {
  const key = `himaya:lead-tracked:${leadId}`;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    /* storage blocked: rely on eventID de-duplication */
  }

  const started = Date.now();
  const fire = () => {
    if (typeof window.fbq !== "function") {
      if (Date.now() - started < 10_000) setTimeout(fire, 200);
      return;
    }
    window.fbq(
      "track",
      "Lead",
      { value: SITE.priceMad, currency: "MAD", content_name: SITE.tagline },
      { eventID: leadId },
    );
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  };
  fire();
}
