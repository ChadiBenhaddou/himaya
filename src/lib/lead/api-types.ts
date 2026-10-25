import type { FieldErrors } from "./validation";

/** Body the browser sends to POST /api/leads. */
export interface LeadRequestBody {
  fullName: string;
  phone: string;
  city: string;
  provider: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  consent: boolean;
  /** Honeypot — real users never see or fill this field. */
  website: string;
  /** Epoch ms when the form was first rendered (basic bot timing check). */
  startedAt: number;
  /** Random UUID per form fill; lets the backend ignore accidental re-sends. */
  submissionId: string;
  /** Optional campaign attribution from the page URL. */
  utm?: Partial<Record<"utm_source" | "utm_medium" | "utm_campaign", string>>;
}

export type LeadApiErrorCode =
  | "invalid_request"
  | "forbidden"
  | "payload_too_large"
  | "validation_error"
  | "rate_limited"
  | "not_configured"
  | "upstream_error";

export type LeadApiResponse =
  | { ok: true; leadId: string | null }
  | { ok: false; error: LeadApiErrorCode; message: string; fieldErrors?: FieldErrors };
