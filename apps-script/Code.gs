/**
 * UpperCrust Wealth Conclave — registration backend.
 * Bind this script to a Google Sheet (Extensions > Apps Script), deploy as a
 * Web App, and paste the deployment URL into ENDPOINT_URL in register.html.
 * See SETUP.md for step-by-step instructions.
 */

const SHEET_NAME = 'Registrations';
const HEADERS = [
  'Timestamp', 'Full Name', 'Email', 'Phone', 'Organization', 'Designation',
  'City', 'Referred By', 'Notes', 'Guest Category', 'Status', 'Source', 'IP/User-Agent'
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
    const required = ['fullName', 'email', 'phone', 'organization', 'designation', 'city'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return jsonOut_({ result: 'error', error: 'Missing field: ' + field });
      }
    }
    if (!isValidEmail_(data.email)) {
      return jsonOut_({ result: 'error', error: 'Invalid email' });
    }

    const sheet = getSheet_();

    // simple de-dupe: same email already applied
    const existingEmails = sheet.getRange(2, 3, Math.max(sheet.getLastRow() - 1, 0), 1).getValues().flat();
    if (existingEmails.some((v) => String(v).toLowerCase() === data.email.toLowerCase())) {
      return jsonOut_({ result: 'success', note: 'duplicate — already recorded' });
    }

    sheet.appendRow([
      new Date(),
      data.fullName || '',
      data.email || '',
      data.phone || '',
      data.organization || '',
      data.designation || '',
      data.city || '',
      data.referredBy || '',
      data.notes || '',
      data.guestCategory || 'Prospective Guest',
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
