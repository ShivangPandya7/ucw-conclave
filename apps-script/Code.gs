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

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
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

    const sheet = getSheet_();

    // force the Phone column to plain text — otherwise Sheets tries to parse
    // a value starting with "+" (e.g. "+91 98123 45678") as a formula/number
    // and shows #ERROR! instead of the actual phone number
    sheet.getRange('C:C').setNumberFormat('@');

    // simple de-dupe: same email already applied (only the header row exists
    // before the first submission, so skip the check rather than requesting
    // a 0-row range, which Apps Script rejects)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingEmails = sheet.getRange(2, 4, lastRow - 1, 1).getValues().flat();
      if (existingEmails.some((v) => String(v).toLowerCase() === data.email.toLowerCase())) {
        return jsonOut_({ result: 'success', note: 'duplicate — already recorded' });
      }
    }

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

    return jsonOut_({ result: 'success' });
  } catch (err) {
    return jsonOut_({ result: 'error', error: String(err) });
  }
}

function doGet() {
  return jsonOut_({ status: 'ok', message: 'UCW Conclave registration endpoint is live' });
}
