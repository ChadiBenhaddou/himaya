import { PRICE_LABEL } from "@/content/site";
import { LeadForm } from "@/components/form/LeadForm";
import { Icon } from "@/components/ui/Icon";
import styles from "./LeadSection.module.css";

const NEXT_STEPS = [
  "كنتواصلو معاك فالهاتف باش نأكدو المعلومات.",
  "كنتأكدو من التوافق ديال الراوتر ديالك.",
  "كنحددو معاك الموعد لي مناسب ليك.",
];

export function LeadSection() {
  return (
    <section id="request" className={`section ${styles.section}`} aria-labelledby="request-title">
      <div className="container">
        <div className="section-head">
          <h2 id="request-title">طلب الخدمة وتحديد الموعد</h2>
          <p>عمّر المعلومات، ونتواصلو معاك باش نأكدو التفاصيل والموعد.</p>
        </div>

        <div className={styles.layout}>
          <div className={`card ${styles.formCard}`}>
            <LeadForm />
          </div>

          <aside className={styles.aside} aria-label="معلومات على الطلب">
            <div className={styles.priceBox}>
              <span>ثمن الخدمة</span>
              <strong>{PRICE_LABEL}</strong>
            </div>

            <h3>شنو غادي يوقع من بعد؟</h3>
            <ol role="list" className={styles.next}>
              {NEXT_STEPS.map((step, i) => (
                <li key={step}>
                  <span aria-hidden="true">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            <div className={styles.safety}>
              <Icon name="lock" size={20} />
              <p>
                ما غاديش نطلبو منك كلمة السر ديال الراوتر ولا ديال شبكة <bdi>Wi-Fi</bdi> فهاد الفورم.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
