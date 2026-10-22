const xlsx = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function cleanName(str) {
  if (!str) return "";
  return str
    .replace(/^desa\s+/i, "")
    .replace(/^kelurahan\s+/i, "")
    .replace(/^kel\.\s+/i, "")
    .replace(/^ds\.\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const DESA_ALIASES = {
  "PAL ELEVEN": "PALL XI",
  "PALL XI": "PALL XI",
  "PARGARUTAN TOGA": "PARGARUTAN TONGA",
  "AEK GADOL": "AEK NGADOL SITINJAK",
  "PINTU PADANG 1": "PINTU PADANG I",
  "JANJIMANAON": "JANJI MANAON",
  "PASAR PARGARUTAN": "PASAR PARGARUTAN",
};

async function main() {
  const filePath = path.join(__dirname, "..", "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx");
  const workbook = xlsx.readFile(filePath);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany({
    include: { kecamatan: true }
  });

  console.log("Checking matching across all sheets:\n");

  const allRows = [];
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 7; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0 || !r[0]) continue;
      allRows.push({
        sheet: sheetName,
        no: r[0],
        kecRaw: String(r[1] || "").trim(),
        desaRaw: String(r[2] || "").trim(),
        nama: r[3],
        ketua: r[4]
      });
    }
  });

  console.log(`Total rows collected: ${allRows.length}`);

  let unmatchedKecCount = 0;
  let unmatchedDesaCount = 0;

  for (const item of allRows) {
    let cleanKec = cleanName(item.kecRaw)
      .replace("ANGKOA", "ANGKOLA")
      .replace("SAYUR MATINGGI", "SAYURMATINGGI");

    let cleanDesa = cleanName(item.desaRaw);
    if (DESA_ALIASES[cleanDesa]) {
      cleanDesa = DESA_ALIASES[cleanDesa];
    }

    // Khusus Situmba Julu: di master ada di SIPIROK
    if (cleanDesa === "SITUMBA JULU") {
      cleanKec = "SIPIROK";
    }

    let matchedKec = masterKec.find(k => {
      const n = cleanName(k.nm_kecamatan).replace("SAYUR MATINGGI", "SAYURMATINGGI");
      return n === cleanKec;
    });

    if (!matchedKec) {
      console.log(`[UNMATCHED KEC] Sheet: ${item.sheet} | Row: ${item.no} | KecRaw: "${item.kecRaw}"`);
      unmatchedKecCount++;
      continue;
    }

    // Cari desa di bawah kecamatan yang cocok
    let matchedDesa = masterDesa.find(d => {
      if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
      const n = cleanName(d.nm_desa);
      return n === cleanDesa;
    });

    // Fallback fuzzy jika belum cocok
    if (!matchedDesa) {
      matchedDesa = masterDesa.find(d => {
        if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
        const n = cleanName(d.nm_desa);
        return n.includes(cleanDesa) || cleanDesa.includes(n);
      });
    }

    if (!matchedDesa) {
      console.log(`[UNMATCHED DESA] Sheet: ${item.sheet} | Row: ${item.no} | Kec: ${matchedKec.nm_kecamatan} | DesaRaw: "${item.desaRaw}" -> Clean: "${cleanDesa}"`);
      unmatchedDesaCount++;
    } else {
      // console.log(`[MATCH OK] ${item.sheet} #${item.no}: Kec=${matchedKec.nm_kecamatan}, Desa=${matchedDesa.nm_desa} (${matchedDesa.kd_desa})`);
    }
  }

  console.log(`\nUnmatched Kec: ${unmatchedKecCount}, Unmatched Desa: ${unmatchedDesaCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
