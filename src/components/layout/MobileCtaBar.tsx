"use client";

import { useEffect, useState } from "react";
import { CTA, PRICE_LABEL } from "@/content/site";
import styles from "./MobileCtaBar.module.css";

/**
 * Small sticky CTA for phones. Appears after the hero scrolls away and hides
 * again while the request form is on screen, so it never covers the form.
 */
export function MobileCtaBar() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const form = document.getElementById("request");
    if (!hero || !form || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroVisible(entry.isIntersecting);
        if (entry.target === form) setFormVisible(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  const visible = !heroVisible && !formVisible;

  return (
    <div className={styles.bar} data-visible={visible} aria-hidden={!visible}>
      <div className={styles.price}>
        <span className={styles.amount}>{PRICE_LABEL}</span>
        <span className={styles.label}>ثمن الخدمة</span>
      </div>
      <a href="#request" className="btn" tabIndex={visible ? 0 : -1}>
        {CTA.primary}
      </a>
    </div>
  );
}
