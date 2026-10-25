/**
 * Local emulator for apps-script/Code.gs — FOR DEVELOPMENT ONLY.
 *
 * Runs the real Code.gs inside Node with in-memory stand-ins for
 * SpreadsheetApp, CacheService, LockService, PropertiesService, Utilities and
 * ContentService, and mimics the Web App's POST → 302 → GET redirect.
 *
 * It does NOT write to Google Sheets. It only proves that the Pages Function and
 * the script logic work together. Always finish with a test against a real sheet.
 *
 * Usage:
 *   SHEETS_WEBHOOK_SECRET=<32+ chars> node scripts/apps-script-emulator.mjs
 *   then in .dev.vars:  SHEETS_WEBHOOK_URL=http://localhost:8787/exec
 *   GET http://localhost:8787/rows shows the rows written so far.
 */
import http from "node:http";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const PORT = Number(process.env.EMULATOR_PORT || 8787);
const SECRET = process.env.SHEETS_WEBHOOK_SECRET || randomBytes(32).toString("hex");
const here = path.dirname(fileURLToPath(import.meta.url));
const code = readFileSync(path.join(here, "..", "apps-script", "Code.gs"), "utf8");

/* ── minimal Google service stand-ins ── */

/** Any method call returns the same object, so formatting chains are no-ops. */
function chain() {
  const p = new Proxy({}, { get: () => () => p });
  return p;
}

function makeSheet(name) {
  const rows = [];
  let maxRows = 1000;
  const sheet = {
    rows,
    getName: () => name,
    getLastRow: () => rows.length,
    getMaxRows: () => maxRows,
    getMaxColumns: () => 26,
    insertRowsAfter: (_after, n) => void (maxRows += n),
    getFilter: () => null,
    getRange(row, col, numRows = 1, numCols = 1) {
      if (row > maxRows) throw new Error(`Range out of bounds (row ${row} > ${maxRows})`);
      const range = {
        setValues(values) {
          values.forEach((vals, i) => {
            const r = (rows[row - 1 + i] ||= []);
            vals.forEach((v, j) => {
              // Mimic Sheets: leading apostrophe forces text; other leading "=" would be a formula.
              let stored = v;
              if (typeof v === "string" && v.startsWith("'")) stored = v.slice(1);
              else if (typeof v === "string" && /^[=+\-@]/.test(v)) stored = `⚠ FORMULA EVALUATED: ${v}`;
              r[col - 1 + j] = stored instanceof Date ? stored.toISOString() : stored;
            });
          });
          return proxy;
        },
        getValues() {
          return Array.from({ length: numRows }, (_, i) =>
            Array.from({ length: numCols }, (_, j) => rows[row - 1 + i]?.[col - 1 + j] ?? ""),
          );
        },
      };
      const proxy = new Proxy(range, { get: (t, prop) => t[prop] ?? (() => proxy) });
      return proxy;
    },
  };
  return new Proxy(sheet, { get: (t, prop) => t[prop] ?? (() => undefined) });
}

const sheets = new Map();
const spreadsheet = {
  getSheetByName: (n) => sheets.get(n) || null,
  insertSheet: (n) => {
    const s = makeSheet(n);
    sheets.set(n, s);
    return s;
  },
  setSpreadsheetTimeZone: () => {},
  getUrl: () => "https://docs.google.com/spreadsheets/d/EMULATED/edit",
};

const props = new Map([["WEBHOOK_SECRET", SECRET]]);
// EMULATE_NOTIFY=1 turns on fake Telegram + email channels; EMULATE_NOTIFY=fail makes Telegram reject.
if (process.env.EMULATE_NOTIFY) {
  props.set("TELEGRAM_BOT_TOKEN", "123456:FAKE-TOKEN");
  props.set("TELEGRAM_CHAT_ID", "987654321");
  props.set("NOTIFY_EMAIL", "owner@example.com");
}
const cache = new Map();
const notifications = []; // outgoing Telegram/email calls, recorded instead of sent

function formatDate(date, tz, fmt) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return fmt.replace("yyyy", parts.year).replace("yy", parts.year.slice(2)).replace("MM", parts.month).replace("dd", parts.day);
}

const context = vm.createContext({
  console,
  Logger: { log: (...a) => console.log("[Logger]", ...a) },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => spreadsheet,
    newDataValidation: chain,
    newConditionalFormatRule: chain,
  },
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }),
  },
  CacheService: {
    getScriptCache: () => ({
      get: (k) => {
        const e = cache.get(k);
        return e && e.exp > Date.now() ? e.v : null;
      },
      put: (k, v, ttl = 600) => cache.set(k, { v, exp: Date.now() + ttl * 1000 }),
    }),
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  UrlFetchApp: {
    fetch: (url, opts = {}) => {
      const fail = process.env.EMULATE_NOTIFY === "fail";
      notifications.push({ channel: "telegram", url: url.replace(/bot[^/]+/, "bot<token>"), payload: opts.payload ? JSON.parse(opts.payload) : null, simulatedFailure: fail });
      const body = fail ? { ok: false, description: "Bad Request: chat not found" } : { ok: true, result: [] };
      return { getResponseCode: () => (fail ? 400 : 200), getContentText: () => JSON.stringify(body) };
    },
  },
  MailApp: { sendEmail: (msg) => void notifications.push({ channel: "email", ...msg }) },
  Utilities: { getUuid: () => randomUUID(), formatDate },
  ContentService: {
    MimeType: { JSON: "application/json" },
    createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }),
  },
});
vm.runInContext(code, context, { filename: "Code.gs" });
context.setupSheet();

/* ── HTTP layer that mimics the Web App redirect ── */
const pending = new Map();

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === "POST" && url.pathname === "/exec") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const out = context.doPost({ postData: { contents: body, type: req.headers["content-type"] } }).getContent();
        const key = randomUUID();
        pending.set(key, out);
        console.log("[emulator] doPost →", out);
        res.writeHead(302, { Location: `/echo?key=${key}` }).end();
      });
      return;
    }
    if (req.method === "GET" && url.pathname === "/echo") {
      const out = pending.get(url.searchParams.get("key"));
      pending.delete(url.searchParams.get("key"));
      res.writeHead(out ? 200 : 404, { "Content-Type": "application/json" }).end(out ?? '{"ok":false}');
      return;
    }
    if (req.method === "GET" && url.pathname === "/rows") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(sheets.get("Leads").rows, null, 2));
      return;
    }
    if (req.method === "GET" && url.pathname === "/notifications") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(notifications, null, 2));
      return;
    }
    res.writeHead(404).end();
  })
  .listen(PORT, () => {
    console.log(`Apps Script emulator on http://localhost:${PORT}/exec`);
    if (!process.env.SHEETS_WEBHOOK_SECRET) console.log(`Generated secret (put in .dev.vars): ${SECRET}`);
  });
