import { CTA, NAV_LINKS } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#main" className={styles.brand} aria-label="حماية — الصفحة الرئيسية">
          <Logo />
        </a>
        <nav aria-label="روابط الصفحة" className={styles.nav}>
          <ul role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#request" className="btn btn--sm">
          {CTA.primary}
        </a>
      </div>
    </header>
  );
}
