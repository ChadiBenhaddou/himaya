# حماية (Himaya): landing page for home Wi-Fi parental-control setup

Mobile-first Arabic/Darija (RTL) landing page that collects appointment requests for a 200 MAD
home-router filtering service and saves each lead to Google Sheets.
Built to be hosted on **Cloudflare Pages**.

- **Stack:** Next.js 16 (static export) · React 19 · TypeScript · plain CSS Modules
- **Runtime dependencies:** `next`, `react`, `react-dom`. No UI kit, icon pack or form library.
- **Lead flow:** form → `POST /api/leads` (Cloudflare Pages Function) → Google Apps Script Web App → "Leads" sheet

```
src/                      the website (exported to plain HTML/CSS/JS in ./out)
  app/                    layout.tsx (RTL, font, SEO) · page.tsx · robots.ts · sitemap.ts · icon.svg · globals.css
  components/             layout/ · sections/ · form/ (LeadForm, Field) · ui/ (Icon, Logo, RouterIllustration)
  content/site.ts         ALL page copy, price and lists, edit text here
  lib/lead/               validation.ts (shared browser + server) · submit-lead.ts · api-types.ts
functions/api/leads.ts    Cloudflare Pages Function → POST /api/leads (thin wrapper)
server/                   lead-handler.ts (spam checks, rate limit, validation) · sheets-webhook.ts · rate-limit.ts
public/_headers           security + cache headers applied by Cloudflare
apps-script/              Code.gs · appsscript.json · SETUP.md  (Google Sheets backend + guide)
scripts/                  apps-script-emulator.mjs (run Code.gs locally, dev only)
.node-version             tells Cloudflare's build to use Node 22
```

---

## Requirements

- **Node.js 22 or newer** (Node 20 reached end-of-life in April 2026, and Cloudflare's `wrangler`
  CLI requires 22). Download the LTS installer from <https://nodejs.org>.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000 — fast editing of the page design and text
```

`npm run dev` serves the page only. **The form's API is not available there** (submitting shows an
error). To test the form, use the Cloudflare preview:

```bash
cp .dev.vars.example .dev.vars    # fill in SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET
npm run preview                   # builds, then runs Cloudflare's local runtime on http://localhost:8788
```

### Test the form without Google (optional)

The emulator runs the real `apps-script/Code.gs` against an in-memory sheet:

```bash
# terminal 1: any 32+ character secret
SHEETS_WEBHOOK_SECRET=local-dev-secret-0123456789abcdef0123 npm run emulate:webhook
```
```bash
# .dev.vars
SHEETS_WEBHOOK_URL=http://localhost:8787/exec
SHEETS_WEBHOOK_SECRET=local-dev-secret-0123456789abcdef0123
```
Then `npm run preview`, submit the form at <http://localhost:8788>, and see stored rows at
<http://localhost:8787/rows>. Plain `http://localhost` webhook URLs are accepted **only** for requests
made on localhost, so the deployed site always requires `https://`. The emulator does not touch
Google Sheets, so finish with a real-sheet test.

---

## Deploy to Cloudflare Pages

### 1. Google Sheet + Apps Script
Follow **[apps-script/SETUP.md](apps-script/SETUP.md)**. You'll end up with a Web App URL and a secret.

### 2. Create the Pages project (Git integration, recommended)
1. Push this folder to a GitHub or GitLab repository. `.dev.vars` and `.env*` are git-ignored, so
   secrets aren't committed.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **Next.js (Static HTML Export)** |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Root directory | *(leave empty)* |

   The `functions/` folder is detected automatically, and `.node-version` selects Node 22.
4. Before the first deploy, open **Environment variables (advanced)** and add:

   | Name | Type | Value |
   |---|---|---|
   | `SHEETS_WEBHOOK_URL` | **Secret** (Encrypt) | `https://script.google.com/macros/s/…/exec` |
   | `SHEETS_WEBHOOK_SECRET` | **Secret** (Encrypt) | 64-char secret from `setup()` |
   | `NEXT_PUBLIC_SITE_URL` | Plain text | `https://your-domain.ma` (or the `*.pages.dev` URL for now) |

5. **Save and Deploy.** Your site goes live at `https://<project>.pages.dev`.
6. Custom domain: project → **Custom domains → Set up a domain**.

To change variables later: project → **Settings → Variables and Secrets**, then
**Deployments → ⋯ → Retry deployment**. Changes only apply to new deployments.

### Alternative: deploy from your computer (no Git)
```bash
npx wrangler login            # once, opens the browser
npm run deploy                # builds and uploads ./out + functions/
```
On the first run, wrangler asks for a project name. Then set the three variables in the dashboard
as above and run `npm run deploy` again.

### Notes
- Every push to the main branch redeploys automatically; other branches get preview URLs.
- The free plan covers this easily (Pages Functions: 100,000 requests/day).
- If you turn on **Cloudflare Web Analytics**, its script is blocked by the strict Content Security
  Policy. Add `https://static.cloudflareinsights.com` to `script-src` and
  `https://cloudflareinsights.com` to `connect-src` in [public/_headers](public/_headers).
- The rate limiter is in-memory per Cloudflare isolate, so it's a first line of defence. The Apps
  Script adds a per-phone limit and duplicate detection.

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
| Secrets not set | 503 | `{"ok":false,"error":"not_configured","message":"الخدمة ما زال ما مفعّلاش. عاود جرب من بعد."}` |
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

---

## End-to-end test checklist

Run on the **deployed** site (`*.pages.dev` or your domain), with a phone and a desktop browser.

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
- [ ] Temporarily change `SHEETS_WEBHOOK_SECRET` in Cloudflare and retry the deployment. The form shows the technical-error message, typed data stays in the fields, and no row is added. Then restore the correct secret and redeploy.
- [ ] Submitting 4 times with the same phone within an hour → the 4th is refused with the "too many requests" message.

**Security**
- [ ] View page source and DevTools → Network: no `script.google.com` URL or secret appears anywhere.
- [ ] `curl -I https://your-domain/` shows the `content-security-policy` and `x-frame-options` headers.
- [ ] `curl -X POST https://your-domain/api/leads -H "Origin: https://evil.example" -H "Content-Type: application/json" -d "{}"` → 403.

---

## Editing content

All text, the price and the lists live in [`src/content/site.ts`](src/content/site.ts). The form's
labels and error messages are in [`LeadForm.tsx`](src/components/form/LeadForm.tsx) and
[`validation.ts`](src/lib/lead/validation.ts). If you change provider or time-slot options,
update `PROVIDERS` / `TIME_SLOTS` in `apps-script/Code.gs` too, then redeploy the script as a new version.

No contact details, testimonials, ratings or statistics are included. Add only real ones.
