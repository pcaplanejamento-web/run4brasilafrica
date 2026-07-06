/**
 * Run4BrasilAfrica — Backend (Google Apps Script Web App)
 *
 * Stores the whole site content as one JSON blob in cell A1 of a Google Sheet
 * (created automatically on first use, named "Run4BrasilAfrica — Conteúdo").
 *
 * Endpoints:
 *   GET  /exec            -> { ok, content }        (content is null until first save)
 *   POST /exec {content}  -> { ok }                 (saves the full snapshot)
 *   POST /exec {action:"reset"} -> { ok, content:null }
 *
 * Writes require a token that must match the Script Property SHARED_TOKEN.
 *
 * SETUP (see apps-script/README.md):
 *   1. Project Settings > Script Properties: add SHARED_TOKEN = <a long random string>.
 *   2. Deploy > New deployment > Web app:
 *        Execute as: Me
 *        Who has access: Anyone
 *   3. Copy the /exec URL and the token into the Next app's .env.local:
 *        GAS_WEB_APP_URL=<url>
 *        GAS_SHARED_TOKEN=<same token>
 */

var CONTENT_CELL = 'A1';
var SHEET_TITLE = 'Run4BrasilAfrica — Conteúdo';

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function _token() {
  return PropertiesService.getScriptProperties().getProperty('SHARED_TOKEN') || '';
}

function _sheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = null;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SHEET_TITLE);
    props.setProperty('SHEET_ID', ss.getId());
  }
  return ss.getSheets()[0];
}

function _read() {
  var value = _sheet().getRange(CONTENT_CELL).getValue();
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function _write(obj) {
  _sheet().getRange(CONTENT_CELL).setValue(obj ? JSON.stringify(obj) : '');
}

function doGet() {
  try {
    return _json({ ok: true, content: _read() });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (!_token() || body.token !== _token()) {
      return _json({ ok: false, error: 'unauthorized' });
    }

    if (body.action === 'reset') {
      _write(null);
      return _json({ ok: true, content: null });
    }

    if (!body.content) {
      return _json({ ok: false, error: 'no content' });
    }

    _write(body.content);
    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
