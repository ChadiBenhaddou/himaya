import { CTA, STEPS } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  return (
    <section id="how" className="section section--alt" aria-labelledby="how-title">
      <div className="container">
        <div className="section-head">
          <h2 id="how-title">{CTA.secondary}</h2>
          <p>أربع خطوات بسيطة، من الطلب حتى التفعيل.</p>
        </div>

        <ol role="list" className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.marker}>
                <span className={styles.number} aria-hidden="true">
                  {i + 1}
                </span>
                <span className="icon-badge">
                  <Icon name={step.icon} size={24} />
                </span>
              </div>
              <h3>
                <span className="sr-only">الخطوة {i + 1}: </span>
                {step.title}
              </h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className={styles.cta}>
          <a href="#request" className="btn">
            {CTA.primary}
          </a>
        </div>
      </div>
    </section>
  );
}
