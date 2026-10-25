# Google Sheets backend — setup guide

This connects the landing-page form to a Google Sheet:

```
Visitor's browser ──► /api/leads (Cloudflare Worker)        ──► Apps Script Web App ──► "Leads" sheet
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

> **Why "Anyone"?** Your Cloudflare Worker calls the script without a Google login, so the Web App
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

- **Cloudflare Worker** (default dashboard setup): Worker → **Settings → Variables and Secrets → Add**
  → type **Secret** for both. They take effect immediately and survive future deploys.
- **Cloudflare Pages** (if you chose Pages instead): project → **Settings → Variables and Secrets →
  Add** → type **Secret** → then **Deployments → ⋯ → Retry deployment**.
- **Local:** put them in `.dev.vars` (git-ignored) and run `npm run preview`.

## 6. Test it

1. In the Apps Script editor run **`testWebhook()`**. The log should show
   `{"ok":true,"leadId":"HM-…"}` and a TEST row appears. Its Notes cell starts with
   `=HYPERLINK(…`. Confirm it shows as plain text, not a link. Then delete the row.
2. Submit the real form on your site with your own phone number. Check that a row appears with
   Status **New**.
3. Follow the full checklist in the main [README](../README.md#end-to-end-test-checklist).

## Phone notifications for new leads (optional)

Each new lead can trigger a **Telegram message** (instant push, recommended) and/or an **email**.
Notifications are sent after the row is saved. If one fails, the lead is still saved and the
visitor still sees the success message.

### Telegram (about 3 minutes)

1. Install Telegram on your phone. Open a chat with **@BotFather** (the official bot, with a blue
   check) → send `/newbot` → choose a name (e.g. `Himaya Leads`) and a username ending in `bot`
   (e.g. `himaya_leads_bot`). BotFather replies with a **token** like `7123456789:AAH…`.
   Keep it private: anyone with it can send messages as your bot.
2. Open your new bot (BotFather gives you the link) and press **Start**.
3. In Apps Script: **Project Settings (⚙) → Script properties → Add script property**:
   `TELEGRAM_BOT_TOKEN` = the token → **Save script properties**.
4. In the editor, run **`findTelegramChatId()`**. It finds your chat and saves `TELEGRAM_CHAT_ID`
   automatically. Google asks for one more permission ("connect to an external service"): allow it.
5. Run **`testNotification()`**. A sample message should arrive on your phone within seconds.

Each message shows the name, a phone number you can tap to call, a **WhatsApp** link, city,
provider, preferred date and time, notes, and a link to open the sheet.

> **Team:** to notify several people, create a Telegram group, add the bot to it, send a message in
> the group, and run `findTelegramChatId()` again. If it lists several chats, copy the group's ID
> (it starts with `-`) into `TELEGRAM_CHAT_ID`.

### Email

Add the script property `NOTIFY_EMAIL` = your address (several addresses: separate them with commas),
then run `testNotification()` and allow the "send email" permission. To get a push notification,
turn on notifications in the Gmail app. If emails sent from your own account to the same address
don't trigger a notification, use a different address.
Limit: about 100 emails/day on a free Google account.

### Required after adding notifications

- If you replaced `appsscript.json` with the repo version (step 2.3), paste the **updated**
  [`appsscript.json`](./appsscript.json). It adds the two new permissions.
- After pasting the new `Code.gs`, **redeploy**: **Deploy → Manage deployments → ✏️ Edit →
  Version: New version → Deploy.** The URL stays the same; nothing changes in Cloudflare.

To turn notifications off, delete the script properties.

## Rotating the secret

Run `rotateWebhookSecret()`, copy the new value into `SHEETS_WEBHOOK_SECRET` in Cloudflare and
retry the latest deployment. Until you do, the form returns an error and nothing is lost silently.

## CORS and deployment notes

- **CORS doesn't apply.** Browsers never call Apps Script directly; only your Cloudflare Worker does.
  (Apps Script Web Apps can't send CORS headers for JSON POSTs, which is why a direct
  browser→Apps Script setup is unreliable and would expose the URL.)
- **Redirects:** Apps Script answers a POST with `302 → script.googleusercontent.com`. The
  server code follows the redirect and reads the JSON. If you get `upstream_error` and the
  server log says *"non-JSON"*, the URL is wrong, the deployment isn't set to "Anyone", or
  the script threw an error (check **Executions** in the Apps Script sidebar). On Cloudflare, see
  these logs under the Worker → **Observability / Logs** (Pages: **Deployments → Functions → Real-time logs**).
- **Status codes:** Apps Script always returns HTTP 200, so the `ok` / `error` fields in the JSON
  are what count. The Cloudflare Worker maps them to proper HTTP codes for the browser.
- **Quotas:** a consumer Google account allows ample Web App executions for a lead form; each
  submission takes one execution of roughly 1 second.

## What is stored, and what is not

If notifications are enabled, the same lead details are also sent to your Telegram chat or
email inbox, and nowhere else.

Stored: only the 12 columns above. **Not stored:** IP addresses, user agents, router or Wi-Fi
passwords (the form never asks for them and warns users not to type them), or anything else.
Server logs record only error codes, never personal data.
