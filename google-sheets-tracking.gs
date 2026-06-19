const SHEET_NAME = "tracking";
const SPREADSHEET_ID_PROPERTY = "TRACKING_SPREADSHEET_ID";
const HEADERS = [
  "timestamp",
  "site_id",
  "domain",
  "event_type",
  "path",
  "url",
  "referrer",
  "visitor_id",
  "session_id",
  "country",
  "region",
  "city",
  "language",
  "user_agent",
  "time_on_page_sec",
  "max_scroll",
  "event_label",
  "event_section",
  "event_context",
  "is_outbound",
  "metadata",
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "portfolio-tracking" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const row = body.row || {};
    const sheet = getTrackingSheet_();

    sheet.appendRow(HEADERS.map((header) => row[header] ?? ""));

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getTrackingSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getSpreadsheet_() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  const spreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty(SPREADSHEET_ID_PROPERTY);

  if (!spreadsheetId) {
    throw new Error(
      `Missing script property ${SPREADSHEET_ID_PROPERTY}. ` +
      "Create the script from the Google Sheet or set this property to the Sheet ID."
    );
  }

  return SpreadsheetApp.openById(spreadsheetId);
}
