/**
 * @OnlyCurrentDoc
 *
 * Himaya — lead intake webhook for Google Sheets.
 *
 * Flow:  landing page form → /api/leads (Cloudflare Worker) → this Web App → "Leads" sheet
 *                                                                  └→ Telegram / email notification (optional)
 *
 * The Web App URL and WEBHOOK_SECRET are only known to the Cloudflare Worker.
 * Browsers never call this script directly. See SETUP.md for deployment.
 *
 * Functions you can run from the editor:
 *   setup()               – create/format the "Leads" sheet and generate WEBHOOK_SECRET (run once)
 *   showWebhookSecret()   – print the current secret to the execution log
 *   rotateWebhookSecret() – replace the secret (update your hosting env var afterwards)
 *   testWebhook()         – insert one TEST row through the same code path as real requests
 *   findTelegramChatId()  – after messaging your bot, finds and saves TELEGRAM_CHAT_ID
 *   testNotification()    – send a sample notification (no row is written)
 */

var CONFIG = {
  SHEET_NAME: 'Leads',
  TIMEZONE: 'Africa/Casablanca',
  HEADERS: [
    'Lead ID', 'Created At', 'Full Name', 'Phone', 'City', 'Internet Provider',
    'Preferred Date', 'Preferred Time', 'Notes', 'Consent', 'Source', 'Status'
  ],
  STATUSES: ['New', 'Contacted', 'Appointment Confirmed', 'Completed', 'Cancelled'],
  DEFAULT_STATUS: 'New',
  MIN_ROWS: 2000,
  MAX_BODY_CHARS: 10000,
  MAX_LEADS_PER_PHONE_PER_HOUR: 3,
  IDEMPOTENCY_TTL_SECONDS: 6 * 60 * 60,
  MAX_DAYS_AHEAD: 90,
  LIMITS: { nameMin: 2, nameMax: 80, cityMin: 2, cityMax: 80, notesMax: 500, sourceMax: 200 }
};

// Keep in sync with src/lib/lead/validation.ts
var PROVIDERS = {
  iam: 'Maroc Telecom (اتصالات المغرب)',
  orange: 'Orange',
  inwi: 'inwi',
  other: 'Other / آخر',
  unknown: 'Unknown / ما عارفش'
};

var TIME_SLOTS = {
  morning: 'الصباح 09:00–12:00',
  midday: 'بعد الزوال 12:00–15:00',
  afternoon: 'العشية 15:00–18:00',
  evening: 'الليل 18:00–20:00'
};

var STATUS_COLORS = {
  'New': ['#e3f2fd', '#0d47a1'],
  'Contacted': ['#fff8e1', '#7a5200'],
  'Appointment Confirmed': ['#ede7f6', '#4527a0'],
  'Completed': ['#e8f5e9', '#1b5e20'],
  'Cancelled': ['#eceff1', '#546e7a']
};

// Column positions (1-based)
var COL = { createdAt: 2, phone: 4, preferredDate: 7, status: 12 };

/* ───────────────────────── Web App entry points ───────────────────────── */

function doPost(e) {
  try {
    if (!e || !e.postData || typeof e.postData.contents !== 'string') {
      return json_({ ok: false, error: 'invalid_request' });
    }
    if (e.postData.contents.length > CONFIG.MAX_BODY_CHARS) {
      return json_({ ok: false, error: 'payload_too_large' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return json_({ ok: false, error: 'invalid_request' });
    }
    if (!body || typeof body !== 'object') return json_({ ok: false, error: 'invalid_request' });

    var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!expected || expected.length < 32) return json_({ ok: false, error: 'not_configured' });
    if (!safeEqual_(String(body.secret || ''), expected)) return json_({ ok: false, error: 'unauthorized' });

    var submissionId = String(body.submissionId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
      return json_({ ok: false, error: 'invalid_request' });
    }

    var cache = CacheService.getScriptCache();
    var subKey = 'sub:' + submissionId;
    var previous = cache.get(subKey);
    if (previous) return json_({ ok: true, leadId: previous, duplicate: true });

    var check = validateLead_(body.lead);
    if (!check.ok) return json_({ ok: false, error: 'validation_error', fieldErrors: check.errors });
    var lead = check.data;

    var phoneKey = 'phone:' + lead.phone;
    var phoneCount = Number(cache.get(phoneKey) || 0);
    if (phoneCount >= CONFIG.MAX_LEADS_PER_PHONE_PER_HOUR) {
      return json_({ ok: false, error: 'rate_limited' });
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });

    var leadId;
    var source = cleanLine_(body.source).slice(0, CONFIG.LIMITS.sourceMax) || 'website';
    try {
      // Re-check inside the lock in case an identical request just finished.
      previous = cache.get(subKey);
      if (previous) return json_({ ok: true, leadId: previous, duplicate: true });

      leadId = generateLeadId_();
      appendLead_(getLeadsSheet_(), leadId, lead, source);

      cache.put(subKey, leadId, CONFIG.IDEMPOTENCY_TTL_SECONDS);
      cache.put(phoneKey, String(phoneCount + 1), 3600);
    } finally {
      lock.releaseLock();
    }

    // The row is saved; notifications are best-effort and never fail the request.
    notifyNewLead_(leadId, lead, source);

    return json_({ ok: true, leadId: leadId });
  } catch (err) {
    // Log the error type only — never the submitted personal data.
    console.error('doPost failed: ' + (err && err.message ? err.message : err));
    return json_({ ok: false, error: 'server_error' });
  }
}

function doGet() {
  return json_({ ok: false, error: 'method_not_allowed' });
}

/* ───────────────────────── Validation ───────────────────────── */

function validateLead_(input) {
  var src = input && typeof input === 'object' ? input : {};
  var L = CONFIG.LIMITS;
  var errors = {};

  var fullName = cleanLine_(src.fullName);
  if (!fullName) errors.fullName = 'required';
  else if (fullName.length < L.nameMin || fullName.length > L.nameMax || !/\p{L}/u.test(fullName)) errors.fullName = 'invalid';

  var phone = normalizePhone_(src.phone);
  if (!cleanLine_(src.phone)) errors.phone = 'required';
  else if (!phone) errors.phone = 'invalid';

  var city = cleanLine_(src.city);
  if (!city) errors.city = 'required';
  else if (city.length < L.cityMin || city.length > L.cityMax) errors.city = 'invalid';

  var provider = cleanLine_(src.provider);
  if (provider && !Object.prototype.hasOwnProperty.call(PROVIDERS, provider)) errors.provider = 'invalid';

  var preferredDate = cleanLine_(src.preferredDate);
  if (preferredDate) {
    var dateError = checkDate_(preferredDate);
    if (dateError) errors.preferredDate = dateError;
  }

  var preferredTime = cleanLine_(src.preferredTime);
  if (preferredTime && !Object.prototype.hasOwnProperty.call(TIME_SLOTS, preferredTime)) errors.preferredTime = 'invalid';

  var notes = cleanMultiline_(src.notes);
  if (notes.length > L.notesMax) errors.notes = 'too_long';

  if (src.consent !== true) errors.consent = 'required';

  if (Object.keys(errors).length) return { ok: false, errors: errors };
  return {
    ok: true,
    data: {
      fullName: fullName,
      phone: phone,
      city: city,
      provider: provider ? PROVIDERS[provider] : '',
      preferredDate: preferredDate,
      preferredTime: preferredTime ? TIME_SLOTS[preferredTime] : '',
      notes: notes
    }
  };
}

function normalizePhone_(raw) {
  var s = String(raw == null ? '' : raw)
    .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
    .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
    .replace(/[\s().\-\u200E\u200F\u202A-\u202E]/g, '');
  if (s.indexOf('00212') === 0) s = '+212' + s.slice(5);
  else if (s.indexOf('212') === 0) s = '+212' + s.slice(3);
  else if (s.indexOf('0') === 0) s = '+212' + s.slice(1);
  if (s.indexOf('+2120') === 0) s = '+212' + s.slice(5);
  return /^\+212[5-8]\d{8}$/.test(s) ? s : null;
}

function checkDate_(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'invalid';
  var p = iso.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  if (d.getUTCFullYear() !== p[0] || d.getUTCMonth() !== p[1] - 1 || d.getUTCDate() !== p[2]) return 'invalid';
  var today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  var max = Utilities.formatDate(new Date(Date.now() + CONFIG.MAX_DAYS_AHEAD * 86400000), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  if (iso < today) return 'past';
  if (iso > max) return 'too_far';
  return null;
}

var CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

function cleanLine_(value) {
  return typeof value === 'string' ? value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim() : '';
}

function cleanMultiline_(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Neutralises spreadsheet formula injection: a value starting with = + - @
 * (or their full-width forms) is prefixed with an apostrophe, which Sheets
 * treats as "store as plain text" and does not display.
 */
function safeCell_(value) {
  var s = String(value == null ? '' : value);
  return /^[=+\-@\uFF1D\uFF0B\uFF0D\uFF20\t\r]/.test(s) ? "'" + s : s;
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ───────────────────────── Sheet writing ───────────────────────── */

function generateLeadId_() {
  var datePart = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyMMdd');
  var randomPart = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'HM-' + datePart + '-' + randomPart;
}

function getLeadsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = setupSheet();
  return sheet;
}

function appendLead_(sheet, leadId, lead, source) {
  var rowIndex = sheet.getLastRow() + 1;
  if (rowIndex > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), 500);
    applyFormatting_(sheet);
  }

  var row = [
    leadId,
    new Date(),                       // Created At (real timestamp, shown in Africa/Casablanca)
    safeCell_(lead.fullName),
    safeCell_(lead.phone),            // "+212…" gets the apostrophe → stored as text
    safeCell_(lead.city),
    safeCell_(lead.provider),
    lead.preferredDate,               // validated YYYY-MM-DD; column is plain-text formatted
    safeCell_(lead.preferredTime),
    safeCell_(lead.notes),
    'Yes',
    safeCell_(source),
    CONFIG.DEFAULT_STATUS
  ];

  sheet.getRange(rowIndex, COL.preferredDate).setNumberFormat('@');
  sheet.getRange(rowIndex, COL.createdAt).setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  sheet.getRange(rowIndex, COL.status).setDataValidation(statusRule_());
}

/* ───────────────────────── Notifications (optional) ───────────────────────── */
/*
 * Configure in Project Settings (⚙) → Script properties:
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → instant Telegram message (recommended)
 *   NOTIFY_EMAIL                          → email alert (one address, or several separated by commas)
 * Leave them empty to disable. See SETUP.md → "Phone notifications".
 */

function notifyNewLead_(leadId, lead, source) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  var email = props.getProperty('NOTIFY_EMAIL');
  if (!(token && chatId) && !email) return;

  var sheetUrl = '';
  try {
    sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  } catch (err) { /* link is optional */ }

  if (token && chatId) {
    try {
      sendTelegram_(token, chatId, telegramText_(leadId, lead, source, sheetUrl));
    } catch (err) {
      console.error('Telegram notification failed: ' + (err && err.message ? err.message : err));
    }
  }

  if (email) {
    try {
      MailApp.sendEmail({
        to: email,
        name: 'Himaya – طلبات جديدة',
        subject: 'طلب جديد: ' + lead.fullName + ' – ' + lead.city + ' (' + leadId + ')',
        body: emailText_(leadId, lead, source, sheetUrl)
      });
    } catch (err) {
      console.error('Email notification failed: ' + (err && err.message ? err.message : err));
    }
  }
}

function sendTelegram_(token, chatId, html) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true }
    }),
    muteHttpExceptions: true // so errors never print the URL (which contains the token)
  });
  if (res.getResponseCode() !== 200) {
    var description = '';
    try { description = JSON.parse(res.getContentText()).description || ''; } catch (e) {}
    throw new Error('HTTP ' + res.getResponseCode() + ' ' + description);
  }
}

function telegramText_(leadId, lead, source, sheetUrl) {
  var waNumber = lead.phone.replace(/^\+/, '');
  var lines = [
    '🔔 <b>طلب جديد</b> · <code>' + esc_(leadId) + '</code>',
    '',
    '👤 ' + esc_(lead.fullName),
    '📞 ' + esc_(lead.phone) + '  ·  <a href="https://wa.me/' + waNumber + '">WhatsApp</a>',
    '📍 ' + esc_(lead.city)
  ];
  if (lead.provider) lines.push('🌐 ' + esc_(lead.provider));
  if (lead.preferredDate || lead.preferredTime) {
    lines.push('📅 ' + esc_([lead.preferredDate, lead.preferredTime].filter(String).join(' · ')));
  }
  if (lead.notes) lines.push('📝 ' + esc_(lead.notes));
  if (source && source !== 'website') lines.push('🏷 ' + esc_(source));
  if (sheetUrl) lines.push('', '<a href="' + esc_(sheetUrl) + '">📊 فتح الشيت</a>');
  return lines.join('\n');
}

function emailText_(leadId, lead, source, sheetUrl) {
  return [
    'طلب جديد من الموقع',
    '',
    'رقم الطلب: ' + leadId,
    'الاسم: ' + lead.fullName,
    'الهاتف: ' + lead.phone + '   (WhatsApp: https://wa.me/' + lead.phone.replace(/^\+/, '') + ')',
    'المدينة: ' + lead.city,
    'مزود الإنترنت: ' + (lead.provider || '—'),
    'التاريخ المفضل: ' + (lead.preferredDate || '—'),
    'الوقت المفضل: ' + (lead.preferredTime || '—'),
    'ملاحظات: ' + (lead.notes || '—'),
    'المصدر: ' + source,
    '',
    sheetUrl ? 'الشيت: ' + sheetUrl : ''
  ].join('\n');
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Message your bot once in Telegram, then run this: it finds your chat ID and saves it. */
function findTelegramChatId() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) {
    Logger.log('Add TELEGRAM_BOT_TOKEN in Project Settings → Script properties first.');
    return;
  }
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true });
  var data = JSON.parse(res.getContentText());
  if (!data.ok) {
    Logger.log('Telegram error: ' + (data.description || res.getResponseCode()) + ' — check the bot token.');
    return;
  }
  var chats = {};
  data.result.forEach(function (update) {
    var msg = update.message || update.channel_post || update.my_chat_member;
    if (msg && msg.chat) chats[msg.chat.id] = msg.chat.title || msg.chat.first_name || msg.chat.username || '';
  });
  var ids = Object.keys(chats);
  if (!ids.length) {
    Logger.log('No messages found. Open your bot in Telegram, press Start (or send "hi"), then run this again.');
    return;
  }
  if (ids.length === 1) {
    props.setProperty('TELEGRAM_CHAT_ID', ids[0]);
    Logger.log('Saved TELEGRAM_CHAT_ID = ' + ids[0] + ' (' + chats[ids[0]] + '). Now run testNotification().');
    return;
  }
  Logger.log('Several chats found — copy the right ID into TELEGRAM_CHAT_ID manually:');
  ids.forEach(function (id) { Logger.log('  ' + id + '  ' + chats[id]); });
}

/** Sends a sample notification to every configured channel. Writes nothing to the sheet. */
function testNotification() {
  var props = PropertiesService.getScriptProperties();
  if (!(props.getProperty('TELEGRAM_BOT_TOKEN') && props.getProperty('TELEGRAM_CHAT_ID')) && !props.getProperty('NOTIFY_EMAIL')) {
    Logger.log('No notification channel configured. Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID and/or NOTIFY_EMAIL.');
    return;
  }
  notifyNewLead_('HM-TEST-000000', {
    fullName: 'TEST — تجربة الإشعار',
    phone: '+212600000000',
    city: 'الدار البيضاء',
    provider: PROVIDERS.unknown,
    preferredDate: '',
    preferredTime: TIME_SLOTS.evening,
    notes: 'هادي غير تجربة، ما كاين حتى طلب.'
  }, 'apps-script-test');
  Logger.log('Test notification sent. If nothing arrived, check Executions for errors.');
}

/* ───────────────────────── Setup & admin helpers ───────────────────────── */

/** Run once from the editor. Safe to run again: it only re-applies formatting. */
function setup() {
  setupSheet();
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('WEBHOOK_SECRET')) {
    props.setProperty('WEBHOOK_SECRET', newSecret_());
    Logger.log('WEBHOOK_SECRET created. Copy this value into SHEETS_WEBHOOK_SECRET on your hosting platform:');
    Logger.log(props.getProperty('WEBHOOK_SECRET'));
  } else {
    Logger.log('WEBHOOK_SECRET already exists. Run showWebhookSecret() to display it.');
  }
}

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  var width = CONFIG.HEADERS.length;

  var existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  var hasData = existing.some(function (v) { return v !== ''; });
  if (hasData && existing.join('|') !== CONFIG.HEADERS.join('|')) {
    throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" already has different headers. Rename it or clear row 1 first.');
  }

  sheet.getRange(1, 1, 1, width).setValues([CONFIG.HEADERS]);
  if (sheet.getMaxRows() < CONFIG.MIN_ROWS) sheet.insertRowsAfter(sheet.getMaxRows(), CONFIG.MIN_ROWS - sheet.getMaxRows());
  if (sheet.getMaxColumns() > width) sheet.deleteColumns(width + 1, sheet.getMaxColumns() - width);

  applyFormatting_(sheet);
  return sheet;
}

function applyFormatting_(sheet) {
  var width = CONFIG.HEADERS.length;
  var dataRows = sheet.getMaxRows() - 1;

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#102a56')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  var widths = [150, 140, 180, 140, 160, 180, 120, 170, 300, 80, 220, 170];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  sheet.getRange(2, COL.createdAt, dataRows, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange(2, COL.preferredDate, dataRows, 1).setNumberFormat('@');
  sheet.getRange(2, 9, dataRows, 1).setWrap(true); // Notes

  var statusRange = sheet.getRange(2, COL.status, dataRows, 1);
  statusRange.setDataValidation(statusRule_());

  var rules = CONFIG.STATUSES.map(function (status) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(STATUS_COLORS[status][0])
      .setFontColor(STATUS_COLORS[status][1])
      .setBold(true)
      .setRanges([statusRange])
      .build();
  });
  sheet.setConditionalFormatRules(rules);

  // Filter on the header row so leads can be filtered by Status, City, date…
  var existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.getRange(1, 1, sheet.getMaxRows(), width).createFilter();
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.STATUSES, true)
    .setAllowInvalid(false)
    .setHelpText('Choose: ' + CONFIG.STATUSES.join(', '))
    .build();
}

function newSecret_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function showWebhookSecret() {
  Logger.log(PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || 'Not set — run setup() first.');
}

function rotateWebhookSecret() {
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_SECRET', newSecret_());
  Logger.log('New WEBHOOK_SECRET (update SHEETS_WEBHOOK_SECRET on your host and redeploy):');
  Logger.log(PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET'));
}

/** Inserts one TEST row through doPost. Delete the row afterwards. */
function testWebhook() {
  var payload = {
    secret: PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET'),
    submissionId: Utilities.getUuid(),
    source: 'apps-script-test',
    lead: {
      fullName: 'TEST — امسح هاد السطر',
      phone: '0600000000',
      city: 'Test',
      provider: 'unknown',
      preferredDate: '',
      preferredTime: 'morning',
      notes: '=HYPERLINK("http://example.com") ← should appear as plain text, not a formula',
      consent: true
    }
  };
  var response = doPost({ postData: { contents: JSON.stringify(payload), type: 'application/json' } });
  Logger.log(response.getContent());
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
