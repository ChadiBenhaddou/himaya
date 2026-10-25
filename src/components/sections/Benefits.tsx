import { BENEFITS } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import styles from "./Benefits.module.css";

export function Benefits() {
  return (
    <section className="section" aria-labelledby="benefits-title">
      <div className="container">
        <div className="section-head">
          <h2 id="benefits-title">حماية إضافية للإنترنت فالدار</h2>
          <p>
            كنفعّلو خيارات الفلترة لي كيدعمها الراوتر ديالك، باش يكون عندك تحكم أحسن فالمحتوى لي كيوصل عبر{" "}
            <bdi>Wi-Fi</bdi> ديال الدار.
          </p>
        </div>

        <ul role="list" className={styles.grid}>
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className={`card ${styles.item}`}>
              <span className="icon-badge icon-badge--green">
                <Icon name={benefit.icon} size={26} />
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </li>
          ))}
        </ul>

        <p className={styles.note}>
          <Icon name="info" size={20} />
          الفلترة كتنقص من الوصول للمحتوى غير المناسب، ولكن ما كتضمنش تبلوكي كاع المواقع ولا تخدم على كاع الأجهزة بنفس
          الطريقة.
        </p>
      </div>
    </section>
  );
}
