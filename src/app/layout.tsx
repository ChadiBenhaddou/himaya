import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { SITE } from "@/content/site";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import "./globals.css";

// Self-hosted at build time by next/font — no request to Google from the visitor.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: SITE.title,
  description: SITE.description,
  applicationName: SITE.nameLatin,
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: "ar_MA",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1b3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-MA" dir="rtl" className={plexArabic.variable}>
      {/* Extensions like Grammarly add attributes to <body> before hydration; ignore those. */}
      <body suppressHydrationWarning>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
