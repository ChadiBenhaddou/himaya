# Google Sheets backend — setup guide

This connects the landing-page form to a Google Sheet:

```
Visitor's browser ──► /api/leads (Cloudflare Pages Function) ──► Apps Script Web App ──► "Leads" sheet
                       holds URL + secret (encrypted secrets)      checks secret, validates, writes row
```

The browser only ever talks to your own site (`/api/leads`). The Apps Script URL and the
shared secret are stored as Cloudflare secrets, so they never appear in page source.

---

## 1. Create the spreadsheet

1. Go to <https://sheets.google.com> and create a blank spreadsheet, e.g. **"Himaya – Leads"**.
2. Use a personal Google account, or a Workspace account whose admin allows Web Apps with
   access set to "Anyone". Some Workspace domains block this.

## 2. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the sample code in `Code.gs` and paste the full contents of [`Code.gs`](./Code.gs).
3. Optional (recommended): **Project Settings (⚙) → tick "Show appsscript.json manifest file"**,
   then open `appsscript.json` in the editor and replace it with [`appsscript.json`](./appsscript.json).
   It sets the time zone to `Africa/Casablanca` and limits the script to *this spreadsheet only*
   (`spreadsheets.currentonly` scope).
4. Click **Save** (💾).

## 3. Run `setup()` once

1. In the toolbar's function dropdown pick **`setup`** and click **Run**.
2. Google asks for authorization → **Review permissions** → choose your account.
   You may see *"Google hasn't verified this app"*: that's normal for your own script. Click
   **Advanced → Go to (project name) (unsafe)** → **Allow**.
3. Open **Execution log** (bottom panel). It prints:
   ```
   WEBHOOK_SECRET created. Copy this value into SHEETS_WEBHOOK_SECRET on your hosting platform:
   3f9c…(64 characters)
   ```
   Copy that value. You need it in step 5. (Run `showWebhookSecret()` any time to see it again.)

`setup()` creates the **Leads** sheet with:

| Col | Header            | Filled by | Notes                                                        |
|-----|-------------------|-----------|--------------------------------------------------------------|
| A   | Lead ID           | server    | `HM-YYMMDD-XXXXXX`, unique                                   |
| B   | Created At        | server    | Timestamp, Africa/Casablanca                                 |
| C   | Full Name         | form      | required                                                     |
| D   | Phone             | form      | required, normalized to `+212XXXXXXXXX`                      |
| E   | City              | form      | required (city or neighbourhood)                             |
| F   | Internet Provider | form      | optional (Maroc Telecom / Orange / inwi / Other / Unknown)   |
| G   | Preferred Date    | form      | optional, `YYYY-MM-DD` (today … +90 days)                    |
| H   | Preferred Time    | form      | optional time slot                                           |
| I   | Notes             | form      | optional, max 500 chars                                      |
| J   | Consent           | server    | always `Yes` (form can't be sent without it)                 |
| K   | Source            | server    | `website` + UTM tags if present                              |
| L   | Status            | server    | starts as `New`; dropdown: New · Contacted · Appointment Confirmed · Completed · Cancelled |

It also freezes the header, adds a filter on all columns, colour-codes the Status dropdown and
sets the spreadsheet time zone. Running `setup()` again is safe. It re-applies formatting and
keeps your data. It refuses to run if a "Leads" sheet exists with different headers.

## 4. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" → **Web app**.
3. Settings:
   - **Description:** `Leads webhook v1`
   - **Execute as:** **Me** (your account, which owns the sheet)
   - **Who has access:** **Anyone**
4. **Deploy** → copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

> **Why "Anyone"?** Your Cloudflare Function calls the script without a Google login, so the Web App
> must accept anonymous requests. It is still protected:
> - the URL is only stored on your server, never sent to browsers;
> - every request must carry the 64-character `WEBHOOK_SECRET` (compared in constant time);
>   requests without it get `{"ok":false,"error":"unauthorized"}` and write nothing;
> - all fields are re-validated, length-limited and formula-escaped;
> - max 3 leads per phone number per hour, plus duplicate-submission detection;
> - the script can only access this one spreadsheet.

> **Important: redeploying after edits.** Saving code does **not** update the live Web App.
> After any change to `Code.gs`: **Deploy → Manage deployments → ✏️ Edit → Version: "New version"
> → Deploy.** The URL stays the same.

## 5. Configure your website

Store these two values as **secrets** (never prefix them with `NEXT_PUBLIC_`):

| Variable                | Value                                   |
|-------------------------|-----------------------------------------|
| `SHEETS_WEBHOOK_URL`    | Web app URL from step 4                 |
| `SHEETS_WEBHOOK_SECRET` | Secret from step 3                      |

- **Cloudflare Pages:** project → **Settings → Variables and Secrets → Add** → type **Secret**
  for both (Production, and Preview if wanted) → then **Deployments → ⋯ → Retry deployment**.
- **Local:** put them in `.dev.vars` (git-ignored) and run `npm run preview`.

## 6. Test it

1. In the Apps Script editor run **`testWebhook()`**. The log should show
   `{"ok":true,"leadId":"HM-…"}` and a TEST row appears. Its Notes cell starts with
   `=HYPERLINK(…`. Confirm it shows as plain text, not a link. Then delete the row.
2. Submit the real form on your site with your own phone number. Check that a row appears with
   Status **New**.
3. Follow the full checklist in the main [README](../README.md#end-to-end-test-checklist).

## Rotating the secret

Run `rotateWebhookSecret()`, copy the new value into `SHEETS_WEBHOOK_SECRET` in Cloudflare and
retry the latest deployment. Until you do, the form returns an error and nothing is lost silently.

## CORS and deployment notes

- **CORS doesn't apply.** Browsers never call Apps Script directly; only your Cloudflare Function does.
  (Apps Script Web Apps can't send CORS headers for JSON POSTs, which is why a direct
  browser→Apps Script setup is unreliable and would expose the URL.)
- **Redirects:** Apps Script answers a POST with `302 → script.googleusercontent.com`. The
  server code follows the redirect and reads the JSON. If you get `upstream_error` and the
  server log says *"non-JSON"*, the URL is wrong, the deployment isn't set to "Anyone", or
  the script threw an error (check **Executions** in the Apps Script sidebar). On Cloudflare, see
  these logs under the Pages project → **Deployments → (latest) → Functions → Real-time logs**.
- **Status codes:** Apps Script always returns HTTP 200, so the `ok` / `error` fields in the JSON
  are what count. The Cloudflare Function maps them to proper HTTP codes for the browser.
- **Quotas:** a consumer Google account allows ample Web App executions for a lead form; each
  submission takes one execution of roughly 1 second.

## What is stored, and what is not

Stored: only the 12 columns above. **Not stored:** IP addresses, user agents, router or Wi-Fi
passwords (the form never asks for them and warns users not to type them), or anything else.
Server logs record only error codes, never personal data.
