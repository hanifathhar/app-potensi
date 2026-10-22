const xlsx = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function cleanText(str) {
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

function cleanKelompokName(str) {
  if (!str) return "";
  let clean = str.replace(/["']/g, "").replace(/\s+/g, " ").trim();
  // Standardize typo magondang -> Magodang
  if (clean.toLowerCase().includes("simbur magondang")) {
    clean = clean.replace(/magondang/i, "Magodang");
  }
  return clean;
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

function parseAnggota(raw) {
  if (!raw || raw === "-") return 1;
  if (typeof raw === "number") return raw;
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

function parseTahun(raw) {
  if (!raw || raw === "-") return 2026;
  if (typeof raw === "number") return raw;
  const match = String(raw).match(/\d{4}/);
  return match ? parseInt(match[0]) : 2026;
}

async function main() {
  const filePath = path.join(
    __dirname,
    "..",
    "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx"
  );
  const workbook = xlsx.readFile(filePath);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany({
    include: { kecamatan: true },
  });

  console.log("Memulai import data Kelompok Tani dari Excel...");

  // Kumpulkan semua baris
  const allRows = [];
  let kolamIndex = 1;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 7; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;

      const kdKolam = `KLM-2026-${String(kolamIndex).padStart(3, "0")}`;
      kolamIndex++;

      allRows.push({
        sheet: sheetName,
        rowNo: r[0],
        kdKolam: kdKolam,
        kecRaw: String(r[1] || "").trim(),
        desaRaw: String(r[2] || "").trim(),
        namaKelompokRaw: String(r[3] || "").trim(),
        ketuaRaw: String(r[4] || "").trim(),
        anggotaRaw: r[5],
        tahunRaw: r[6],
      });
    }
  }

  console.log(`Total data baris diproses: ${allRows.length}`);

  let poktanCounter = 1;
  const poktanMap = new Map(); // key: kd_desa + '_' + cleanName(nm_kelompok) -> KelompokTani object
  let createdCount = 0;
  let linkedCount = 0;

  for (const item of allRows) {
    // 1. Normalisasi Kecamatan & Desa
    let cleanKec = cleanText(item.kecRaw)
      .replace("ANGKOA", "ANGKOLA")
      .replace("SAYUR MATINGGI", "SAYURMATINGGI");

    let cleanD = cleanText(item.desaRaw);
    if (DESA_ALIASES[cleanD]) {
      cleanD = DESA_ALIASES[cleanD];
    }

    if (cleanD === "SITUMBA JULU") {
      cleanKec = "SIPIROK";
    }

    const matchedKec = masterKec.find((k) => {
      const n = cleanText(k.nm_kecamatan).replace("SAYUR MATINGGI", "SAYURMATINGGI");
      return n === cleanKec;
    });

    if (!matchedKec) {
      console.error(`Kecamatan tidak ditemukan: ${item.kecRaw}`);
      continue;
    }

    let matchedDesa = masterDesa.find((d) => {
      if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
      return cleanText(d.nm_desa) === cleanD;
    });

    if (!matchedDesa) {
      matchedDesa = masterDesa.find((d) => {
        if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
        const n = cleanText(d.nm_desa);
        return n.includes(cleanD) || cleanD.includes(n);
      });
    }

    if (!matchedDesa) {
      console.error(`Desa tidak ditemukan: ${item.desaRaw} di ${matchedKec.nm_kecamatan}`);
      continue;
    }

    // 2. Normalisasi Nama Kelompok & Ketua
    const cleanNmKelompok = cleanKelompokName(item.namaKelompokRaw);
    const ketua = item.ketuaRaw && item.ketuaRaw !== "-" ? item.ketuaRaw : cleanNmKelompok;
    const jumlahAnggota = parseAnggota(item.anggotaRaw);
    const tahunBerdiri = parseTahun(item.tahunRaw);

    const lookupKey = `${matchedDesa.kd_desa}_${cleanNmKelompok.toLowerCase()}`;

    let kelompokTaniRecord = null;

    if (poktanMap.has(lookupKey)) {
      kelompokTaniRecord = poktanMap.get(lookupKey);
      // Update jika info lebih lengkap
      if (jumlahAnggota > kelompokTaniRecord.jumlahAnggota) {
        await prisma.kelompokTani.update({
          where: { kd_kelompok: kelompokTaniRecord.kd_kelompok },
          data: { jumlahAnggota },
        });
      }
    } else {
      // Cek apakah sudah ada di database
      let existingInDb = await prisma.kelompokTani.findFirst({
        where: {
          kd_desa: matchedDesa.kd_desa,
          nm_kelompok: { equals: cleanNmKelompok, mode: "insensitive" },
        },
      });

      if (!existingInDb) {
        const kdKelompok = `PKT-2026-${String(poktanCounter).padStart(3, "0")}`;
        poktanCounter++;

        let jenisKelompok = "Kelompok Pembudidaya Ikan (Pokdakan)";
        if (cleanNmKelompok.toLowerCase().includes("pokmaswas")) {
          jenisKelompok = "Kelompok Masyarakat Pengawas (Pokmaswas)";
        } else if (item.sheet === "APBN") {
          jenisKelompok = "Pembudidaya Ikan Perorangan / Mandiri";
        }

        existingInDb = await prisma.kelompokTani.create({
          data: {
            kd_kelompok: kdKelompok,
            nm_kelompok: cleanNmKelompok,
            kd_kecamatan: matchedKec.kd_kecamatan,
            kd_desa: matchedDesa.kd_desa,
            namaKetua: ketua,
            jumlahAnggota: jumlahAnggota,
            tahunBerdiri: tahunBerdiri,
            alamat: `Desa ${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
            status: "AKTIF",
            keterangan: `${jenisKelompok}. Sumber Data: Excel Penerima Bantuan Bibit Ikan ${item.sheet} Tahun 2026.`,
          },
        });
        createdCount++;
        console.log(
          `[CREATED POKTAN] ${kdKelompok} - ${cleanNmKelompok} (Ketua: ${ketua}, Anggota: ${jumlahAnggota}) -> Desa ${matchedDesa.nm_desa}, Kec ${matchedKec.nm_kecamatan}`
        );
      }

      kelompokTaniRecord = existingInDb;
      poktanMap.set(lookupKey, existingInDb);
    }

    // 3. Hubungkan ke data Kolam terkait
    const updatedKolam = await prisma.kolam.updateMany({
      where: { kd_kolam: item.kdKolam },
      data: { kd_kelompok: kelompokTaniRecord.kd_kelompok },
    });

    if (updatedKolam.count > 0) {
      linkedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Selesai!`);
  console.log(`Total Kelompok Tani baru dibuat : ${createdCount}`);
  console.log(`Total Unique Kelompok Tani      : ${poktanMap.size}`);
  console.log(`Total Unit Kolam terhubung      : ${linkedCount} dari ${allRows.length}`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error("Error import poktan:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
