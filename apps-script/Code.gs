/**
 * UpperCrust Wealth Conclave — registration backend.
 * Bind this script to a Google Sheet (Extensions > Apps Script), deploy as a
 * Web App, and paste the deployment URL into ENDPOINT_URL in register.html.
 * See SETUP.md for step-by-step instructions.
 */

const SHEET_NAME = 'Registrations';
const HEADERS = [
  'Timestamp', 'Full Name', 'Phone', 'Email', 'Capital Priority',
  'Capital Focus', 'Capital Scale', 'Evening Intent', 'Status', 'Source', 'IP/User-Agent'
];

// One-time setup: creates the sheet + header row and formats the Phone column
// as plain text. Run this once from the editor (select setupSheet > Run).
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  // plain text for the whole Phone column so "+" numbers never become formulas
  sheet.getRange('C:C').setNumberFormat('@');
  return sheet;
}

function getSheet_() {
  // fast path on every submission: just look the sheet up
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || setupSheet();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ result: 'error', error: 'No data received' });
    }
    const data = JSON.parse(e.postData.contents);

    // honeypot / basic bot check happens client-side; re-validate required fields here
    const required = ['fullName', 'phone', 'email', 'capitalPriority', 'capitalLocation', 'capitalScale', 'eveningIntent'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return jsonOut_({ result: 'error', error: 'Missing field: ' + field });
      }
    }
    if (!isValidEmail_(data.email)) {
      return jsonOut_({ result: 'error', error: 'Invalid email' });
    }

    // Serialise concurrent submissions: only one request at a time may check
    // for duplicates and write its row, so simultaneous registrations queue up
    // instead of overwriting each other or slipping past the duplicate check.
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      // too many people at once — tell the page to retry shortly
      return jsonOut_({ result: 'busy' });
    }
    try {
      const sheet = getSheet_();

      // simple de-dupe: same email already applied. This also makes a client
      // retry after a timeout harmless.
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const target = data.email.toLowerCase();
        const existingEmails = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
        for (let i = 0; i < existingEmails.length; i++) {
          if (String(existingEmails[i][0]).toLowerCase() === target) {
            return jsonOut_({ result: 'success', note: 'duplicate — already recorded' });
          }
        }
      }

      // one write call (Phone column is already plain text from setupSheet)
      sheet.appendRow([
        new Date(),
        data.fullName || '',
        data.phone || '',
        data.email || '',
        data.capitalPriority || '',
        data.capitalLocation || '',
        data.capitalScale || '',
        data.eveningIntent || '',
        'Pending Review',
        data.source || '',
        ''
      ]);
      // commit before releasing the lock so the next request sees this row
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return jsonOut_({ result: 'success' });
  } catch (err) {
    return jsonOut_({ result: 'error', error: String(err) });
  }
}

function doGet() {
  return jsonOut_({ status: 'ok', message: 'UCW Conclave registration endpoint is live' });
}
