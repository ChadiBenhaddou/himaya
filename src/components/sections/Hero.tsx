import { CTA, HERO, PRICE_LABEL } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { RouterIllustration } from "@/components/ui/RouterIllustration";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={`${styles.copy} fade-up`}>
          <p className="eyebrow">
            <Icon name="wifi" size={18} />
            <span>
              إعداد الرقابة الأبوية على <bdi>Wi-Fi</bdi> ديال الدار
            </span>
          </p>
          <h1 id="hero-title" className={styles.title}>
            {HERO.title}
          </h1>
          <p className={styles.text}>{HERO.text}</p>

          <div className={styles.priceBadge}>
            <span className={styles.priceAmount}>{PRICE_LABEL}</span>
            <span className={styles.priceNote}>ثمن الخدمة</span>
          </div>

          <div className={styles.ctas}>
            <a href="#request" className="btn">
              {CTA.primary}
              <Icon name="arrowLeft" size={20} />
            </a>
            <a href="#how" className="btn btn--ghost">
              {CTA.secondaryHero}
              <Icon name="chevronDown" size={20} />
            </a>
          </div>

          <ul role="list" className={styles.points}>
            {HERO.points.map((point) => (
              <li key={point}>
                <Icon name="check" size={18} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.visual} fade-up fade-up--delay`}>
          <RouterIllustration className={styles.illustration} />
        </div>
      </div>
    </section>
  );
}
