import { SITE } from "@/content/site";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        <rect width="34" height="34" rx="10" fill={inverted ? "#ffffff" : "#102a56"} />
        <path
          d="M17 7.5 24.5 10.5v5.4c0 4.6-3.1 8.5-7.5 10.1-4.4-1.6-7.5-5.5-7.5-10.1v-5.4L17 7.5Z"
          fill="#1a9e68"
        />
        <path d="m13.6 16.6 2.4 2.4 4.4-4.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        style={{
          fontWeight: 700,
          fontSize: "1.25rem",
          lineHeight: 1,
          color: inverted ? "#ffffff" : "var(--navy-900)",
        }}
      >
        {SITE.name}
      </span>
    </span>
  );
}
