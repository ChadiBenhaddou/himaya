import { SITE } from "@/content/site";

/** Meta (Facebook) Pixel ID. Public by design: it's visible in every page that uses it. */
export const META_PIXEL_ID = "1067427867822542";

type Fbq = (command: "init" | "track" | "trackCustom", event: string, params?: object, options?: object) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * Fires the standard "Lead" event after a request is really saved.
 * eventID = the sheet's Lead ID, so a future Conversions API setup can de-duplicate.
 * No personal data (name, phone…) is sent to Meta.
 */
export function trackLead(leadId: string) {
  window.fbq?.("track", "Lead", { value: SITE.priceMad, currency: "MAD", content_name: SITE.tagline }, { eventID: leadId });
}
