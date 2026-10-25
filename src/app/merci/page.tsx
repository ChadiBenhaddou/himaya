import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ThankYou } from "@/components/sections/ThankYou";
import { SITE } from "@/content/site";

/**
 * Thank-you page after a successful request. Its URL (/merci) can also be used in
 * Meta Events Manager as a URL-based custom conversion ("URL contains /merci").
 */
export const metadata: Metadata = {
  title: `شكراً | ${SITE.name}`,
  robots: { index: false, follow: false },
};

export default function MerciPage() {
  return (
    <>
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ height: "var(--header-h)", display: "flex", alignItems: "center" }}>
          <a href="/" aria-label="حماية — الصفحة الرئيسية" style={{ textDecoration: "none" }}>
            <Logo />
          </a>
        </div>
      </header>
      <main className="section" style={{ background: "var(--navy-50)", minHeight: "calc(100vh - var(--header-h))" }}>
        <div className="container">
          <ThankYou />
        </div>
      </main>
    </>
  );
}
