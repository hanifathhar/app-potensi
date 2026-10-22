const xlsx = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "..", "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx");
  const workbook = xlsx.readFile(filePath);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany();

  console.log("=== CHECK EACH SHEET ===");

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Header is row 3 and 4 (0-indexed)
    // Data rows start from row 7
    let validRows = 0;
    const kecSet = new Set();
    const desaSet = new Set();

    for (let i = 7; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const no = r[0];
      const kec = r[1];
      const desa = r[2];
      const nama = r[3];
      if (no && (kec || desa || nama)) {
        validRows++;
        if (kec) kecSet.add(String(kec).trim());
        if (desa) desaSet.add(String(desa).trim());
      }
    }
    console.log(`Sheet [${sheetName}]: ${validRows} baris data valid.`);
    console.log(`  Kecamatan (${kecSet.size}):`, Array.from(kecSet));
    console.log(`  Sample Desa (first 10 of ${desaSet.size}):`, Array.from(desaSet).slice(0, 10));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
