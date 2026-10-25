import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCtaBar } from "@/components/layout/MobileCtaBar";
import { Hero } from "@/components/sections/Hero";
import { Benefits } from "@/components/sections/Benefits";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
import { Limitations } from "@/components/sections/Limitations";
import { LeadSection } from "@/components/sections/LeadSection";
import { PRICE_INCLUDES, SITE } from "@/content/site";

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: SITE.tagline,
    serviceType: "Home Wi-Fi parental control configuration",
    description: SITE.description,
    areaServed: { "@type": "Country", name: "Morocco" },
    inLanguage: "ar-MA",
    offers: {
      "@type": "Offer",
      price: String(SITE.priceMad),
      priceCurrency: "MAD",
      description: PRICE_INCLUDES.join(" · "),
    },
  };
  return (
    <script
      type="application/ld+json"
      // Static, server-generated data only — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        تخطّى للمحتوى
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Benefits />
        <HowItWorks />
        <Pricing />
        <Limitations />
        <LeadSection />
      </main>
      <Footer />
      <MobileCtaBar />
      <StructuredData />
    </>
  );
}
