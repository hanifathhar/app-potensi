const xlsx = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "..", "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx");
const workbook = xlsx.readFile(filePath);

console.log("Sheet Names:", workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== SHEET: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total Rows: ${rows.length}`);
  console.log("First 10 rows:");
  rows.slice(0, 10).forEach((r, idx) => {
    console.log(`Row ${idx}:`, JSON.stringify(r));
  });
});
