const HEADERS = ['Thời gian', 'Họ tên', 'SĐT/Zalo', 'Số người', 'Lời nhắn', 'Bạn sẽ đến chung vui chứ?'];

function doPost(e) {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  else if (!sh.getRange(1, 6).getValue()) sh.getRange(1, 6).setValue(HEADERS[5]); // sheet cũ chưa có cột F
  const d = JSON.parse(e.postData.contents);
  sh.appendRow([new Date(), d.name, d.phone ? "'" + d.phone : '', d.guests, d.note, d.attend]); // attend: "Có" / "Không"
  return ContentService.createTextOutput('ok');
}

// Trang web đọc lời chúc: chỉ trả tên + lời nhắn (30 dòng gần nhất), KHÔNG trả SĐT.
function doGet() {
  const rows = SpreadsheetApp.getActiveSheet().getDataRange().getValues().slice(1);
  const out = rows.filter(r => String(r[4]).trim()).slice(-30).map(r => ({ name: String(r[1]), note: String(r[4]) }));
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
