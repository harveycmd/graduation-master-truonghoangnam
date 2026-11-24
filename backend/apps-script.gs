function doPost(e) {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getLastRow() === 0) sh.appendRow(['Thời gian', 'Họ tên', 'SĐT/Zalo', 'Số người', 'Lời nhắn']);
  const d = JSON.parse(e.postData.contents);
  sh.appendRow([new Date(), d.name, "'" + d.phone, d.guests, d.note]);
  return ContentService.createTextOutput('ok');
}

// Trang web đọc lời chúc: chỉ trả tên + lời nhắn (30 dòng gần nhất), KHÔNG trả SĐT.
function doGet() {
  const rows = SpreadsheetApp.getActiveSheet().getDataRange().getValues().slice(1);
  const out = rows.filter(r => String(r[4]).trim()).slice(-30).map(r => ({ name: String(r[1]), note: String(r[4]) }));
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
