"use client";

import { useEffect, useState } from "react";
import { isValidLeadId, trackLead } from "@/lib/analytics/meta-pixel";
import { PRICE_LABEL } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import styles from "./ThankYou.module.css";

const NEXT_STEPS = [
  "كنتواصلو معاك فالهاتف باش نأكدو المعلومات.",
  "كنتأكدو من التوافق ديال الراوتر ديالك.",
  "كنحددو معاك الموعد لي مناسب ليك.",
];

/** Confirmation shown after a successful request (/merci?ref=HM-…). Fires the Meta "Lead" event. */
export function ThankYou() {
  const [leadId, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (isValidLeadId(ref)) {
      setLeadId(ref);
      trackLead(ref);
    }
  }, []);

  return (
    <div className={styles.card} role="status">
      <span className={styles.icon}>
        <Icon name="check" size={40} strokeWidth={2.4} />
      </span>
      <h1>توصلنا بالطلب ديالك!</h1>
      <p className={styles.lead}>غادي نتواصلو معاك باش نأكدو التفاصيل والموعد.</p>
      {leadId && (
        <p className={styles.reference}>
          رقم الطلب: <bdi dir="ltr">{leadId}</bdi>
        </p>
      )}

      <div className={styles.next}>
        <h2>شنو غادي يوقع من بعد؟</h2>
        <ol role="list">
          {NEXT_STEPS.map((step, i) => (
            <li key={step}>
              <span aria-hidden="true">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className={styles.price}>
          ثمن الخدمة: <strong>{PRICE_LABEL}</strong>
        </p>
      </div>

      <a href="/" className="btn btn--ghost">
        رجع للصفحة الرئيسية
      </a>
    </div>
  );
}
