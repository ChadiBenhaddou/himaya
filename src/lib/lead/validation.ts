/**
 * Lead validation shared by the browser form and the /api/leads route.
 * Pure functions only — no DOM or Node APIs — so both sides run the same rules.
 * The Apps Script backend re-implements the same checks (apps-script/Code.gs).
 */

export const PROVIDER_OPTIONS = [
  { value: "iam", label: "اتصالات المغرب (Maroc Telecom)" },
  { value: "orange", label: "Orange" },
  { value: "inwi", label: "inwi" },
  { value: "other", label: "شي مزود آخر" },
  { value: "unknown", label: "ما عارفش" },
] as const;

export const TIME_SLOT_OPTIONS = [
  { value: "morning", label: "الصباح (9:00 – 12:00)" },
  { value: "midday", label: "بعد الزوال (12:00 – 15:00)" },
  { value: "afternoon", label: "العشية (15:00 – 18:00)" },
  { value: "evening", label: "فالليل (18:00 – 20:00)" },
] as const;

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  cityMin: 2,
  cityMax: 80,
  notesMax: 500,
  maxDaysAhead: 90,
} as const;

export interface LeadFormValues {
  fullName: string;
  phone: string;
  city: string;
  provider: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  consent: boolean;
}

export type LeadField = keyof LeadFormValues;
export type FieldErrors = Partial<Record<LeadField, string>>;

/** A lead that passed validation; phone is normalized to +212XXXXXXXXX. */
export interface ValidLead extends LeadFormValues {
  consent: true;
}

export type ValidationResult =
  | { ok: true; data: ValidLead }
  | { ok: false; errors: FieldErrors };

export const EMPTY_LEAD: LeadFormValues = {
  fullName: "",
  phone: "",
  city: "",
  provider: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
  consent: false,
};

/** Order used to focus the first invalid field. */
export const FIELD_ORDER: LeadField[] = [
  "fullName",
  "phone",
  "city",
  "provider",
  "preferredDate",
  "preferredTime",
  "notes",
  "consent",
];

export const MESSAGES = {
  fullNameRequired: "عافاك دخل الاسم ديالك.",
  fullNameShort: "الاسم قصير بزاف.",
  fullNameLong: `الاسم طويل بزاف (${LIMITS.nameMax} حرف ماكسيموم).`,
  fullNameInvalid: "دخل اسم صحيح.",
  phoneRequired: "عافاك دخل رقم الهاتف.",
  phoneInvalid: "رقم الهاتف ماشي صحيح. دخل رقم مغربي بحال 0612345678.",
  cityRequired: "عافاك دخل المدينة أو الحي.",
  cityShort: "دخل سمية المدينة أو الحي كاملة.",
  cityLong: `النص طويل بزاف (${LIMITS.cityMax} حرف ماكسيموم).`,
  providerInvalid: "اختار مزود من اللائحة.",
  dateInvalid: "التاريخ ماشي صحيح.",
  datePast: "اختار تاريخ من اليوم ولقدام.",
  dateTooFar: `اختار تاريخ فـ${LIMITS.maxDaysAhead} يوم الجاية.`,
  timeInvalid: "اختار وقت من اللائحة.",
  notesLong: `الملاحظات طويلة بزاف (${LIMITS.notesMax} حرف ماكسيموم).`,
  consentRequired: "خاصك توافق باش نقدرو نتواصلو معاك.",
} as const;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Single-line text: strip control/bidi chars and collapse whitespace. */
export function cleanLine(value: unknown): string {
  return asString(value).replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/** Multi-line text: strip control chars, keep at most two consecutive newlines. */
export function cleanMultiline(value: unknown): string {
  return asString(value)
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Converts Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to 0-9. */
export function toWesternDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Accepts common Moroccan formats and returns E.164 (+212XXXXXXXXX), or null.
 *   0612345678 · 06 12 34 56 78 · +212612345678 · 00212612345678 · 212612345678 · +212 0612345678
 * Valid national numbers start with 5 (fixed), 6/7 (mobile) or 8 (fixed/VoIP) after the leading 0.
 */
export function normalizeMoroccanPhone(raw: unknown): string | null {
  let s = toWesternDigits(asString(raw)).replace(/[\s().\-‎‏‪-‮]/g, "");
  if (s.startsWith("00212")) s = "+212" + s.slice(5);
  else if (s.startsWith("212")) s = "+212" + s.slice(3);
  else if (s.startsWith("0")) s = "+212" + s.slice(1);
  if (s.startsWith("+2120")) s = "+212" + s.slice(5);
  return /^\+212[5-8]\d{8}$/.test(s) ? s : null;
}

/** Today's date (YYYY-MM-DD) in Morocco, optionally shifted by N days. */
export function moroccoDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const providerValues = new Set<string>(PROVIDER_OPTIONS.map((o) => o.value));
const timeSlotValues = new Set<string>(TIME_SLOT_OPTIONS.map((o) => o.value));
const hasLetter = /\p{L}/u;

export function validateLead(input: unknown): ValidationResult {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const fullName = cleanLine(src.fullName);
  if (!fullName) errors.fullName = MESSAGES.fullNameRequired;
  else if (fullName.length < LIMITS.nameMin) errors.fullName = MESSAGES.fullNameShort;
  else if (fullName.length > LIMITS.nameMax) errors.fullName = MESSAGES.fullNameLong;
  else if (!hasLetter.test(fullName)) errors.fullName = MESSAGES.fullNameInvalid;

  const rawPhone = cleanLine(src.phone);
  const phone = normalizeMoroccanPhone(rawPhone);
  if (!rawPhone) errors.phone = MESSAGES.phoneRequired;
  else if (!phone) errors.phone = MESSAGES.phoneInvalid;

  const city = cleanLine(src.city);
  if (!city) errors.city = MESSAGES.cityRequired;
  else if (city.length < LIMITS.cityMin) errors.city = MESSAGES.cityShort;
  else if (city.length > LIMITS.cityMax) errors.city = MESSAGES.cityLong;

  const provider = cleanLine(src.provider);
  if (provider && !providerValues.has(provider)) errors.provider = MESSAGES.providerInvalid;

  const preferredDate = cleanLine(src.preferredDate);
  if (preferredDate) {
    if (!isRealDate(preferredDate)) errors.preferredDate = MESSAGES.dateInvalid;
    else if (preferredDate < moroccoDate()) errors.preferredDate = MESSAGES.datePast;
    else if (preferredDate > moroccoDate(LIMITS.maxDaysAhead)) errors.preferredDate = MESSAGES.dateTooFar;
  }

  const preferredTime = cleanLine(src.preferredTime);
  if (preferredTime && !timeSlotValues.has(preferredTime)) errors.preferredTime = MESSAGES.timeInvalid;

  const notes = cleanMultiline(src.notes);
  if (notes.length > LIMITS.notesMax) errors.notes = MESSAGES.notesLong;

  if (src.consent !== true) errors.consent = MESSAGES.consentRequired;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      fullName,
      phone: phone as string,
      city,
      provider,
      preferredDate,
      preferredTime,
      notes,
      consent: true,
    },
  };
}
