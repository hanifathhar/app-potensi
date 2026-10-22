const xlsx = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "..", "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx");
const workbook = xlsx.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n================== SHEET: ${sheetName} ==================`);
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || !r[0]) continue;
    console.log(`[${sheetName}] No: ${r[0]} | Kec: ${r[1]} | Desa: ${r[2]} | Poktan/Nama: ${r[3]} | Ketua: ${r[4]} | Anggota: ${r[5]} | Kolam: ${r[7]} | Luas: ${r[11]} | Tebar: ${r[21]} | Titik: ${r[22]} | SumberDana: ${r[27]}`);
  }
});
