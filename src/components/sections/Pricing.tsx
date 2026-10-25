import { CTA, PRICE_INCLUDES, SITE } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import styles from "./Pricing.module.css";

export function Pricing() {
  return (
    <section id="price" className="section" aria-labelledby="price-title">
      <div className="container">
        <div className="section-head">
          <h2 id="price-title">ثمن واضح بلا مفاجآت</h2>
          <p>ثمن واحد للخدمة، وكتعرف من الأول شنو داخل فيه.</p>
        </div>

        <div className={`card ${styles.card}`}>
          <div className={styles.priceCol}>
            <p className={styles.label}>ثمن الخدمة</p>
            <p className={styles.price}>
              <span className={styles.amount}>{SITE.priceMad}</span>
              <span className={styles.currency}>درهم</span>
            </p>
            <a href="#request" className="btn btn--block">
              {CTA.primary}
            </a>
          </div>

          <div className={styles.includesCol}>
            <h3>شنو داخل فالثمن:</h3>
            <ul role="list" className={styles.list}>
              {PRICE_INCLUDES.map((item) => (
                <li key={item}>
                  <span className={styles.check}>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              إلا كان الراوتر ديالك ما كيدعمش خيارات فلترة مناسبة، غادي نقولو ليك هادشي بوضوح فمرحلة التحقق.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
