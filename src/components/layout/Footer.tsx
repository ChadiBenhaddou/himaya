import { NAV_LINKS, SITE } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Logo inverted />
          <p>{SITE.tagline} فالمغرب.</p>
        </div>
        <nav aria-label="روابط أسفل الصفحة">
          <ul role="list" className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li>
              <a href="#request">طلب الخدمة</a>
            </li>
          </ul>
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>
          © {new Date().getFullYear()} {SITE.name}. الفلترة كتنقص من الوصول للمحتوى غير المناسب، ولكن ما كتعوّضش
          المراقبة ديال الوالدين.
        </p>
      </div>
    </footer>
  );
}
