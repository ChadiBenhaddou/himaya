"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  EMPTY_LEAD,
  FIELD_ORDER,
  LIMITS,
  PROVIDER_OPTIONS,
  TIME_SLOT_OPTIONS,
  moroccoDate,
  validateLead,
  type FieldErrors,
  type LeadField,
  type LeadFormValues,
} from "@/lib/lead/validation";
import { newSubmissionId, readUtmParams, submitLead } from "@/lib/lead/submit-lead";
import { Icon } from "@/components/ui/Icon";
import { Field } from "./Field";
import styles from "./LeadForm.module.css";

type Status = "idle" | "submitting" | "success" | "error";

const ALL_TOUCHED = Object.fromEntries(FIELD_ORDER.map((f) => [f, true])) as Record<LeadField, boolean>;

function fieldError(field: LeadField, values: LeadFormValues): string | undefined {
  const result = validateLead(values);
  return result.ok ? undefined : result.errors[field];
}

export function LeadForm() {
  const [values, setValues] = useState<LeadFormValues>(EMPTY_LEAD);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<LeadField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string }>();

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);
  const submissionId = useRef("");
  const inFlight = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    // One id per form fill: if a retry happens after a timeout, the backend
    // recognises it and does not create a second row.
    submissionId.current = newSubmissionId();
    setDateBounds({ min: moroccoDate(), max: moroccoDate(LIMITS.maxDaysAhead) });
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function update<K extends LeadField>(field: K, value: LeadFormValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Re-check live only once the user has left the field (or after a submit attempt).
    if (touched[field]) setErrors((prev) => ({ ...prev, [field]: fieldError(field, next) }));
  }

  function handleBlur(field: LeadField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: fieldError(field, values) }));
  }

  function onText(field: Exclude<LeadField, "consent">) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(field, e.target.value);
  }

  function focusFirstError(errs: FieldErrors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#lead-${first}`)?.focus();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    const result = validateLead(values);
    if (!result.ok) {
      setErrors(result.errors);
      setTouched(ALL_TOUCHED);
      setFormError("");
      focusFirstError(result.errors);
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    setFormError("");

    const response = await submitLead({
      ...values,
      website: honeypotRef.current?.value ?? "",
      startedAt: startedAt.current,
      submissionId: submissionId.current,
      utm: readUtmParams(),
    });

    inFlight.current = false;

    if (response.ok) {
      setLeadId(response.leadId);
      setStatus("success");
      return;
    }

    // Keep everything the user typed; just explain what went wrong.
    if (response.fieldErrors) {
      setErrors(response.fieldErrors);
      setTouched(ALL_TOUCHED);
      focusFirstError(response.fieldErrors);
    }
    setFormError(response.message);
    setStatus("error");
  }

  if (status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className={styles.success}>
        <span className={styles.successIcon}>
          <Icon name="check" size={34} strokeWidth={2.4} />
        </span>
        <h3>توصلنا بالطلب ديالك!</h3>
        <p>غادي نتواصلو معاك باش نأكدو التفاصيل والموعد.</p>
        {leadId && (
          <p className={styles.reference}>
            رقم الطلب: <bdi dir="ltr">{leadId}</bdi>
          </p>
        )}
      </div>
    );
  }

  const submitting = status === "submitting";
  const show = (field: LeadField) => (touched[field] ? errors[field] : undefined);

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-describedby="lead-form-note">
      <p id="lead-form-note" className={styles.formNote}>
        الخانات لي فيهم <span aria-hidden="true">*</span> ضروريين.
      </p>

      <div className={styles.grid}>
        <Field id="lead-fullName" label="الاسم الكامل" required error={show("fullName")} className={styles.full}>
          {(a11y) => (
            <input
              {...a11y}
              className={styles.input}
              type="text"
              name="fullName"
              autoComplete="name"
              maxLength={LIMITS.nameMax + 20}
              value={values.fullName}
              onChange={onText("fullName")}
              onBlur={() => handleBlur("fullName")}
            />
          )}
        </Field>

        <Field id="lead-phone" label="رقم الهاتف" required error={show("phone")} hint="مثال: 0612345678 ولا ‎+212612345678">
          {(a11y) => (
            <input
              {...a11y}
              className={`${styles.input} ${styles.phone}`}
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="06 12 34 56 78"
              maxLength={20}
              value={values.phone}
              onChange={onText("phone")}
              onBlur={() => handleBlur("phone")}
            />
          )}
        </Field>

        <Field id="lead-city" label="المدينة أو الحي" required error={show("city")}>
          {(a11y) => (
            <input
              {...a11y}
              className={styles.input}
              type="text"
              name="city"
              autoComplete="address-level2"
              placeholder="مثال: الدار البيضاء، المعاريف"
              maxLength={LIMITS.cityMax + 20}
              value={values.city}
              onChange={onText("city")}
              onBlur={() => handleBlur("city")}
            />
          )}
        </Field>

        <Field id="lead-provider" label="مزود الإنترنت" error={show("provider")} className={styles.full}>
          {(a11y) => (
            <select
              {...a11y}
              className={`${styles.input} ${styles.select}`}
              name="provider"
              value={values.provider}
              onChange={onText("provider")}
              onBlur={() => handleBlur("provider")}
            >
              <option value="">اختار المزود…</option>
              {PROVIDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="lead-preferredDate" label="التاريخ المفضل" error={show("preferredDate")}>
          {(a11y) => (
            <input
              {...a11y}
              className={styles.input}
              type="date"
              name="preferredDate"
              min={dateBounds?.min}
              max={dateBounds?.max}
              value={values.preferredDate}
              onChange={onText("preferredDate")}
              onBlur={() => handleBlur("preferredDate")}
            />
          )}
        </Field>

        <Field id="lead-preferredTime" label="الوقت المفضل" error={show("preferredTime")}>
          {(a11y) => (
            <select
              {...a11y}
              className={`${styles.input} ${styles.select}`}
              name="preferredTime"
              value={values.preferredTime}
              onChange={onText("preferredTime")}
              onBlur={() => handleBlur("preferredTime")}
            >
              <option value="">اختار الوقت…</option>
              {TIME_SLOT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="lead-notes"
          label="ملاحظات إضافية"
          error={show("notes")}
          className={styles.full}
          hint={
            <>
              <strong>
                ما تكتبش كلمة السر ديال الراوتر ولا ديال شبكة <bdi>Wi-Fi</bdi>
              </strong>
              ، ما محتاجينهاش هنا.
            </>
          }
        >
          {(a11y) => (
            <textarea
              {...a11y}
              className={`${styles.input} ${styles.textarea}`}
              name="notes"
              rows={3}
              maxLength={LIMITS.notesMax + 50}
              placeholder="مثال: نوع الراوتر إلا كنتي عارفو، ولا أي معلومة مفيدة."
              value={values.notes}
              onChange={onText("notes")}
              onBlur={() => handleBlur("notes")}
            />
          )}
        </Field>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input ref={honeypotRef} id="lead-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.consent} data-invalid={Boolean(show("consent")) || undefined}>
        <label className={styles.checkboxLabel}>
          <input
            id="lead-consent"
            type="checkbox"
            name="consent"
            className={styles.checkbox}
            checked={values.consent}
            onChange={(e) => update("consent", e.target.checked)}
            onBlur={() => handleBlur("consent")}
            aria-invalid={Boolean(show("consent"))}
            aria-required
            aria-describedby={show("consent") ? "lead-consent-error" : undefined}
          />
          <span>
            كنوافق على التواصل معايا بخصوص طلب الخدمة ديالي.
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {show("consent") && (
          <p id="lead-consent-error" className={styles.error}>
            {show("consent")}
          </p>
        )}
      </div>

      {formError && (
        <div role="alert" className={styles.formError}>
          <Icon name="alert" size={20} />
          <span>{formError}</span>
        </div>
      )}

      <button type="submit" className={`btn btn--block ${styles.submit}`} disabled={submitting} aria-busy={submitting}>
        {submitting ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            كنصيفطو الطلب…
          </>
        ) : (
          "صيفط طلب الخدمة"
        )}
      </button>

      <p className={styles.privacy}>
        <Icon name="lock" size={16} />
        كنستعملو المعلومات ديالك غير باش نتواصلو معاك بخصوص هاد الطلب.
      </p>
    </form>
  );
}
