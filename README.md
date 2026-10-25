# حماية (Himaya): landing page for home Wi-Fi parental-control setup

Mobile-first Arabic/Darija (RTL) landing page that collects appointment requests for a 200 MAD
home-router filtering service and saves each lead to Google Sheets.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · plain CSS Modules
- **Runtime dependencies:** `next`, `react`, `react-dom`, `server-only`. No UI kit, icon pack
  or form library.
- **Lead flow:** form → `POST /api/leads` (server) → Google Apps Script Web App → "Leads" sheet

```
src/
  app/
    layout.tsx            RTL <html>, font, SEO metadata
    page.tsx              composes sections + JSON-LD
    api/leads/route.ts    server endpoint: origin check, spam checks, rate limit, validation, forward
    robots.ts · sitemap.ts · icon.svg · globals.css (design tokens)
  components/
    layout/               Header, Footer, MobileCtaBar
    sections/             Hero, Benefits, HowItWorks, Pricing, Limitations, LeadSection
    form/                 LeadForm (client), Field
    ui/                   Icon, Logo, RouterIllustration (inline SVG)
  content/site.ts         ALL page copy, price and lists, edit text here
  lib/
    lead/validation.ts    shared validation + Moroccan phone normalization (browser + server)
    lead/submit-lead.ts   browser → /api/leads call
    lead/api-types.ts     request/response types
    server/sheets-webhook.ts  server-only Apps Script client (reads env vars)
    server/rate-limit.ts      in-memory per-IP limiter
apps-script/
  Code.gs · appsscript.json · SETUP.md   Google Sheets backend + step-by-step guide
scripts/
  apps-script-emulator.mjs  runs Code.gs locally with fake Google services (dev only)
```

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000
```

Without the env vars the page works, but submitting the form shows a "service not enabled yet"
error (HTTP 503). It never pretends to succeed.

### Test locally without Google (optional)

The emulator runs the real `apps-script/Code.gs` against an in-memory sheet:

```bash
# terminal 1: pick any 32+ character secret
SHEETS_WEBHOOK_SECRET=local-dev-secret-0123456789abcdef0123 npm run emulate:webhook
```
```bash
# .env.local
SHEETS_WEBHOOK_URL=http://localhost:8787/exec
SHEETS_WEBHOOK_SECRET=local-dev-secret-0123456789abcdef0123
```
Restart `npm run dev`, submit the form, then open <http://localhost:8787/rows> to see stored rows.
Plain `http://localhost` URLs are accepted **only** in development; production requires `https://`.
The emulator does not touch Google Sheets, so always finish with the real-sheet test below.

---

## Deployment

### 1. Google Sheet + Apps Script
Follow **[apps-script/SETUP.md](apps-script/SETUP.md)**. You'll end up with a Web App URL and a secret.

### 2. Host the site (Vercel example)
1. Push this folder to a GitHub repository.
2. On <https://vercel.com> → **Add New → Project** → import the repo (framework auto-detected).
3. **Settings → Environment Variables**:

   | Name                    | Value                                         | Exposed to browser? |
   |-------------------------|-----------------------------------------------|---------------------|
   | `SHEETS_WEBHOOK_URL`    | `https://script.google.com/macros/s/…/exec`   | No                  |
   | `SHEETS_WEBHOOK_SECRET` | 64-char secret from `setup()`                 | No                  |
   | `NEXT_PUBLIC_SITE_URL`  | `https://your-domain.ma`                      | Yes (it's public)   |

4. **Deploy** (or **Redeploy** after changing variables).
5. Optional: **Settings → Domains** to attach your domain.

Vercel's free Hobby plan is for non-commercial use; a business site should use Vercel Pro or
another Node.js host. Any host that runs `npm run build && npm start` (Node ≥ 20.9) works,
e.g. Netlify, Render, Railway or a VPS. Set the same three variables there.

> The rate limiter is in-memory, so on serverless hosts each instance counts separately. It's
> a first line of defence. The Apps Script adds a per-phone limit and duplicate detection.

---

## API responses (`POST /api/leads`)

Request body (sent by the form):
```json
{
  "fullName": "مريم بناني", "phone": "0612 34 56 78", "city": "طنجة",
  "provider": "orange", "preferredDate": "2026-11-03", "preferredTime": "afternoon",
  "notes": "", "consent": true,
  "website": "", "startedAt": 1761349999000, "submissionId": "3b0c…-uuid",
  "utm": { "utm_source": "facebook" }
}
```

| Case | HTTP | Body |
|---|---|---|
| Success | 201 | `{"ok":true,"leadId":"HM-261025-7FCD84"}` |
| Same `submissionId` re-sent | 201 | `{"ok":true,"leadId":"HM-261025-7FCD84"}` (no new row) |
| Invalid fields | 400 | `{"ok":false,"error":"validation_error","message":"عافاك صحح الخانات لي فيهم خطأ.","fieldErrors":{"phone":"رقم الهاتف ماشي صحيح. دخل رقم مغربي بحال 0612345678.","consent":"خاصك توافق باش نقدرو نتواصلو معاك."}}` |
| Malformed JSON / missing fields | 400 | `{"ok":false,"error":"invalid_request","message":"الطلب ماشي صحيح. عاود حمّل الصفحة وجرب مرة أخرى."}` |
| Other website posting to your API | 403 | `{"ok":false,"error":"forbidden","message":"الطلب ماشي مسموح."}` |
| Body > 8 KB | 413 | `{"ok":false,"error":"payload_too_large",…}` |
| Too many requests (5 / 15 min per IP, or 3 / hour per phone) | 429 | `{"ok":false,"error":"rate_limited","message":"صيفطتي بزاف ديال الطلبات. عاود جرب من بعد شوية."}` |
| Env vars missing | 503 | `{"ok":false,"error":"not_configured","message":"الخدمة ما زال ما مفعّلاش. عاود جرب من بعد."}` |
| Apps Script unreachable / wrong secret / script error | 502 | `{"ok":false,"error":"upstream_error","message":"وقع مشكل تقني. المعلومات ديالك باقية، عاود جرب من بعد شوية."}` |
| Honeypot filled or submitted < 2.5 s after load (bot) | 200 | `{"ok":true,"leadId":null}` (nothing stored, bot gets no signal) |

Apps Script itself replies (always HTTP 200) with `{"ok":true,"leadId":"…"}` or
`{"ok":false,"error":"unauthorized" | "validation_error" | "rate_limited" | "busy" | "not_configured" | "server_error"}`.

---

## Managing leads in the sheet

- **New requests:** click the filter icon on **Status** → show only `New`.
- **Contact:** the phone is stored as `+212…`. Call it, or open `https://wa.me/212XXXXXXXXX`
  (drop the `+`).
- **Progress:** change Status via the dropdown: `New → Contacted → Appointment Confirmed → Completed`
  (or `Cancelled`). Each status has its own colour.
- **Newest first:** Data → Sort range → by column B, Z→A. You can also sort with the column filter.
- Put the confirmed appointment details in **Notes** or **Preferred Date/Time** as you prefer.

---

## End-to-end test checklist

Run on the **deployed** site, with a phone and a desktop browser.

**Page**
- [ ] On a phone, the first screen shows headline, 200 درهم, and «طلب الخدمة دابا» without scrolling.
- [ ] Text is right-to-left everywhere; no sideways scrolling on phone or tablet.
- [ ] «شوف كيفاش كتخدم» scrolls to the steps; header links scroll to the right sections.
- [ ] On a phone, the bottom CTA bar appears after the hero and hides when the form is visible.

**Form validation**
- [ ] Submitting empty shows an error under each required field and the consent box; focus jumps to «الاسم الكامل».
- [ ] Phone `12345` gets an error; `06 12 34 56 78`, `+212612345678` and `00212612345678` are accepted.
- [ ] A past date is rejected.

**Submission**
- [ ] Valid submit: the button shows «كنصيفطو الطلب…», then the success message «توصلنا بالطلب ديالك! …» with a `HM-…` reference.
- [ ] A new row appears in **Leads** with Status `New`, phone as `+212…`, and correct Morocco time.
- [ ] Double-clicking submit creates **one** row only.
- [ ] Put `=1+1` in Notes. The sheet shows the text `=1+1`, not `2`.
- [ ] Visit with `?utm_source=test`. The Source column shows `website | utm_source=test`.

**Failure handling**
- [ ] Temporarily set a wrong `SHEETS_WEBHOOK_SECRET` and redeploy. The form shows the technical-error message, typed data stays in the fields, and no row is added. Then restore the correct secret.
- [ ] Submitting 4 times with the same phone within an hour → the 4th is refused with the "too many requests" message.

**Security**
- [ ] View page source and DevTools → Network: no `script.google.com` URL or secret appears anywhere.
- [ ] `curl -X POST https://your-domain/api/leads -H "Origin: https://evil.example" -H "Content-Type: application/json" -d "{}"` → 403.

---

## Editing content

All text, the price and the lists live in [`src/content/site.ts`](src/content/site.ts). The form's
labels and error messages are in [`LeadForm.tsx`](src/components/form/LeadForm.tsx) and
[`validation.ts`](src/lib/lead/validation.ts). If you change provider or time-slot options,
update `PROVIDERS` / `TIME_SLOTS` in `apps-script/Code.gs` too, then redeploy the script as a new version.

No contact details, testimonials, ratings or statistics are included. Add only real ones.
