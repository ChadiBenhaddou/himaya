import { LIMITATIONS } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import styles from "./Limitations.module.css";

export function Limitations() {
  return (
    <section id="limits" className="section section--alt" aria-labelledby="limits-title">
      <div className="container">
        <div className={styles.panel}>
          <div className={styles.head}>
            <span className={styles.headIcon}>
              <Icon name="info" size={26} />
            </span>
            <div>
              <h2 id="limits-title">مهم تعرف</h2>
              <p>بغينا نكونو واضحين معاك من الأول، باش تعرف شنو تقدر تتسنّى من الخدمة.</p>
            </div>
          </div>

          <ul role="list" className={styles.grid}>
            {LIMITATIONS.map((item) => (
              <li key={item.title} className={styles.item}>
                <span className="icon-badge">
                  <Icon name={item.icon} size={22} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className={styles.footer}>
            ما كنوعدوش بحماية كاملة، ولكن كنعاونوك تزيد طبقة حماية مفيدة على الإنترنت ديال الدار.
          </p>
        </div>
      </div>
    </section>
  );
}
