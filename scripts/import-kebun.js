const xlsx = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function cleanName(str) {
  if (!str) return "";
  return String(str)
    .replace(/^desa\s+/i, "")
    .replace(/^kelurahan\s+/i, "")
    .replace(/^kel\.\s+/i, "")
    .replace(/^ds\.\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Mapping alias nama desa berdasarkan master kecamatan
const DESA_ALIASES = {
  // Scoped aliases: `${cleanKec}:${cleanDesa}` -> `master cleanDesa`
  "SIPIROK:HUTARAJA": "BARINGIN", // Di Sipirok: Dusun Hutaraja di bawah Kelurahan Baringin
  "SIPIROK:AEK LATONG": "MARSADA", // Di Sipirok: Aek Latong di bawah Desa Marsada
  "SIPIROK:SIHABORGOAN": "PANAUNGAN", // Di Sipirok: Penggabungan eks Desa Sihaborgoan ke Desa Panaungan
  "SAIPAR DOLOK HOLE:SIMANOSOR JULU": "SIDAPDAP SIMANOSOR", // Di SDH: Penggabungan eks Desa Simanosor Julu ke Desa Sidapdap Simanosor
  "ANGKOLA TIMUR:TABUSIRA KEL TINGGARAS": "BATANG TURA SIRUMAMBE", // Di Angkola Timur: Lingkungan Tabusira/Tinggaras di Kel. Batang Tura Sirumambe

  // Global / Unambiguous aliases
  "SARAGODUNG": "SAROGODUNG",
  "SOMANGGAL PARMONANGAN": "SAMONGGAL PARMONANGAN",
  "SIPANGE SIUJAM": "SIPANGE SIUNJAM",
  "SIMARORKIS SISOMA": "SIMATORKIS SISOMA",
  "SIMATORKIS": "SIMATORKIS SISOMA",
  "RONCINTAN": "NATAMBANG RONCITAN",
  "SAPAGIMBAR": "PASAR SIPAGIMBAR",
  "TIDOAN LAUT": "TINDOAN LAUT",
  "SITABO-TABO DESA PARAU SORAT": "PARAU SORAT SITABO TABO",
  "SITABO TABO DESA PARAU SORAT": "PARAU SORAT SITABO TABO",
  "PARAU SORAT SITABO-TABO": "PARAU SORAT SITABO TABO",
  "SAMURAN": "SUMURAN",
};

function parseNumber(val) {
  if (val === undefined || val === null || val === "" || val === "-") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, ".").replace(/[^0-9\.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseCoordSingle(val) {
  if (val === undefined || val === null) return null;
  let str = String(val).trim();
  if (!str) return null;

  str = str.replace(/^(Lat|Long|Lintang|Bujur)\s*[:=]?\s*/i, "").trim();

  // Try DMS: e.g. 1°16'56" or 99°21'13"
  const dmsMatch = str.match(/([0-9]{1,3})[°⁰˚\^'’\s]+([0-9]{1,2})['’\s]+([0-9\.]+)/);
  if (dmsMatch) {
    const deg = parseFloat(dmsMatch[1]);
    const min = parseFloat(dmsMatch[2]);
    const sec = parseFloat(dmsMatch[3]);
    let res = deg + min / 60 + sec / 3600;
    if (res > 0) return Number(res.toFixed(7));
  }

  // Try DM: e.g. 1°16.56'
  const dmMatch = str.match(/([0-9]{1,3})[°⁰˚\^'’\s]+([0-9\.]+)/);
  if (dmMatch) {
    const deg = parseFloat(dmMatch[1]);
    const min = parseFloat(dmMatch[2]);
    if (deg > 0 && deg < 150 && min < 60) {
      let res = deg + min / 60;
      return Number(res.toFixed(7));
    }
  }

  // Try Decimal: e.g. 1.20922 or 1,20922 or 99.37115
  const decMatch = str.match(/([0-9]{1,3})[,\.]([0-9]{3,8})/);
  if (decMatch) {
    const num = parseFloat(decMatch[1] + "." + decMatch[2]);
    if (num > 0) return Number(num.toFixed(7));
  }

  return null;
}

function getJadwalDate(jadwal) {
  if (!jadwal) return new Date("2026-06-01T00:00:00.000Z");
  const j = String(jadwal).toLowerCase().trim();
  if (j.includes("mei")) return new Date("2026-05-01T00:00:00.000Z");
  if (j.includes("juni")) return new Date("2026-06-01T00:00:00.000Z");
  if (j.includes("juli")) return new Date("2026-07-01T00:00:00.000Z");
  if (j.includes("okt")) return new Date("2026-10-01T00:00:00.000Z");
  if (j.includes("nov")) return new Date("2026-11-01T00:00:00.000Z");
  return new Date("2026-06-01T00:00:00.000Z");
}

function mapSumberDanaEnum(sumberDana) {
  const s = String(sumberDana || "").toUpperCase();
  if (s.includes("KABUPATEN")) return "APBD_KABUPATEN";
  if (s.includes("PROVINSI")) return "APBD_PROVINSI";
  if (s.includes("APBN")) return "APBN";
  if (s.includes("KUR") || s.includes("BANK")) return "KUR";
  return "BANTUAN_PEMERINTAH";
}

async function ensureKomoditas() {
  await prisma.komoditas.upsert({
    where: { kd_komoditas: "KBN-JAGUNG" },
    update: { aktif: true },
    create: {
      kd_komoditas: "KBN-JAGUNG",
      nm_komoditas: "Jagung",
      jenisUsaha: "KEBUN",
      satuanDefault: "Kg",
      deskripsi: "Komoditas Jagung Pipil / Hibrida",
      aktif: true,
      urutan: 1,
    },
  });
}

async function main() {
  console.log("=== MEMULAI IMPORT DATA KEGIATAN BANTUAN JAGUNG 2026 ===");
  await ensureKomoditas();

  const filePath = path.join(__dirname, "..", "Rekap Kegiatan Bantuan_Jagung_Tapsel_2026.xlsx");
  const workbook = xlsx.readFile(filePath);

  const sheet = workbook.Sheets["Data Penerima"];
  if (!sheet) {
    throw new Error("Sheet 'Data Penerima' tidak ditemukan dalam file Excel!");
  }

  const allRows = xlsx.utils.sheet_to_json(sheet);
  const rows = allRows.filter((r) => typeof r["No"] === "number");

  console.log(`Ditemukan ${rows.length} baris data penerima yang valid (No 1 - ${rows.length}).`);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany({ include: { kecamatan: true } });

  let successCount = 0;
  let poktanCreatedCount = 0;
  let pendanaanCount = 0;
  let siklusCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const no = r["No"];
    const sumberDanaRaw = String(r["Sumber Dana"] || "").trim();
    const jenisSumberDanaRaw = String(r["Jenis Sumber Dana"] || "").trim();
    const kecRaw = String(r["Kecamatan"] || "").trim();
    const desaRaw = String(r["Desa/Kelurahan"] || "").trim();
    const poktanRaw = String(r["Poktan/Brigade Pangan"] || "").trim();
    const ketuaRaw = String(r["Nama Ketua"] || "").trim();
    const nikRaw = String(r["NIK"] || "").trim();
    const telpRaw = String(r["No Telp/HP"] || "").trim();
    const jlhAnggota = parseNumber(r["Jlh Anggota (Org)"]) || 1;
    const luasLahanHa = parseNumber(r["Luas Lahan (Ha)"]);
    const volumeBenihKg = parseNumber(r["Volume Benih (Kg)"]);
    const varietasRaw = String(r["Varietas yang diusulkan"] || "").trim();
    const jadwalTanamRaw = String(r["Jadwal Tanam"] || "").trim();
    const simluhtanRaw = String(r["Terdaftar di SIMLUHTAN (Ya/Tidak)"] || "").trim();
    const statusSalurRaw = String(r["Status (Salur/Belum Salur)"] || "").trim();

    // 1. Cocokkan Kecamatan
    const cKec = cleanName(kecRaw);
    const matchedKec = masterKec.find(
      (k) =>
        cleanName(k.nm_kecamatan) === cKec ||
        cleanName(k.nm_kecamatan).replace(/\s+/g, "") === cKec.replace(/\s+/g, "")
    );

    if (!matchedKec) {
      console.error(`Baris ${no}: Kecamatan "${kecRaw}" tidak cocok dengan master data!`);
      continue;
    }

    // 2. Cocokkan Desa
    let cDesa = cleanName(desaRaw);
    const scopedKey = `${cKec}:${cDesa}`;
    if (DESA_ALIASES[scopedKey]) {
      cDesa = DESA_ALIASES[scopedKey];
    } else if (DESA_ALIASES[cDesa]) {
      cDesa = DESA_ALIASES[cDesa];
    }

    let matchedDesa = masterDesa.find((d) => {
      if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
      return cleanName(d.nm_desa) === cDesa;
    });

    if (!matchedDesa) {
      matchedDesa = masterDesa.find((d) => {
        if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
        const cleanDbDesa = cleanName(d.nm_desa);
        return (
          cleanDbDesa.replace(/[^A-Z0-9]/g, "") === cDesa.replace(/[^A-Z0-9]/g, "") ||
          cleanDbDesa.includes(cDesa) ||
          cDesa.includes(cleanDbDesa)
        );
      });
    }

    if (!matchedDesa) {
      console.error(`Baris ${no}: Desa "${desaRaw}" di Kec "${matchedKec.nm_kecamatan}" tidak cocok dengan master data!`);
      continue;
    }

    // 3. Tangani Koordinat
    let parsedLat = parseCoordSingle(r["Titik Koordinat Lintang"]);
    let parsedLng = parseCoordSingle(r["Titik Koordinat Bujur"]);

    // Tukar jika lintang dan bujur terbalik
    if (parsedLat && parsedLng && parsedLat > 50 && parsedLng < 10) {
      const tmp = parsedLat;
      parsedLat = parsedLng;
      parsedLng = tmp;
    }

    let finalLat = null;
    let finalLng = null;

    if (
      parsedLat &&
      parsedLng &&
      parsedLat >= 0.5 &&
      parsedLat <= 2.5 &&
      parsedLng >= 98.0 &&
      parsedLng <= 100.5
    ) {
      finalLat = parsedLat;
      finalLng = parsedLng;
    } else {
      // Fallback ke koordinat desa master dengan jitter kecil (+- 20-50m) agar titik tidak tumpang tindih mutlak
      if (matchedDesa.latitude && matchedDesa.longitude) {
        const baseLat = Number(matchedDesa.latitude);
        const baseLng = Number(matchedDesa.longitude);
        const jitterLat = ((no % 17) - 8) * 0.00035;
        const jitterLng = ((no % 13) - 6) * 0.00035;
        finalLat = Number((baseLat + jitterLat).toFixed(7));
        finalLng = Number((baseLng + jitterLng).toFixed(7));
      }
    }

    // 4. Kelompok Tani (jika ada nama kelompok)
    let kdKelompok = null;
    const isPoktanValid =
      poktanRaw &&
      poktanRaw.toLowerCase() !== "undefined" &&
      poktanRaw !== "-" &&
      poktanRaw !== "";

    if (isPoktanValid) {
      const cleanPoktanName = poktanRaw.trim();

      // Cari atau buat kelompok tani
      let existingPoktan = await prisma.kelompokTani.findFirst({
        where: {
          kd_desa: matchedDesa.kd_desa,
          nm_kelompok: { equals: cleanPoktanName, mode: "insensitive" },
        },
      });

      if (!existingPoktan) {
        const count2026 = await prisma.kelompokTani.count({ where: { tahunBerdiri: 2026 } });
        kdKelompok = `PKT-2026-${String(count2026 + 1).padStart(3, "0")}`;

        existingPoktan = await prisma.kelompokTani.create({
          data: {
            kd_kelompok: kdKelompok,
            nm_kelompok: cleanPoktanName,
            kd_kecamatan: matchedKec.kd_kecamatan,
            kd_desa: matchedDesa.kd_desa,
            namaKetua: ketuaRaw || `Ketua ${cleanPoktanName}`,
            noTelepon: telpRaw || null,
            jumlahAnggota: jlhAnggota || 0,
            tahunBerdiri: 2026,
            status: "AKTIF",
            keterangan: `SIMLUHTAN: ${simluhtanRaw || "Ya"} | Terdaftar Kegiatan Bantuan Jagung 2026`,
          },
        });
        poktanCreatedCount++;
      } else {
        kdKelompok = existingPoktan.kd_kelompok;
      }


      // Upsert Anggota Kelompok untuk Ketua jika ada NIK atau Ketua
      if (ketuaRaw && ketuaRaw !== "-") {
        const nikClean = nikRaw && nikRaw !== "-" && nikRaw.length >= 10 ? nikRaw.trim() : null;
        if (nikClean) {
          const existingAnggota = await prisma.anggotaKelompok.findUnique({
            where: { nik: nikClean },
          });
          if (!existingAnggota) {
            await prisma.anggotaKelompok.create({
              data: {
                kd_kelompok: kdKelompok,
                nik: nikClean,
                nama: ketuaRaw,
                jabatan: "Ketua",
                noTelepon: telpRaw || null,
                aktif: true,
              },
            });
          }
        }
      }
    }

    // 5. Nama Kebun
    const namaKebun = isPoktanValid
      ? `Kebun Jagung Poktan ${poktanRaw}`
      : `Kebun Jagung ${ketuaRaw || "Mandiri"}`;

    const kdBangun = `KBN-2026-${String(no).padStart(3, "0")}`;

    // Deskripsi & Catatan
    const deskripsiText = `Bantuan Benih Jagung ${volumeBenihKg} Kg (${varietasRaw || "Hibrida"}). Sumber Dana: ${sumberDanaRaw} (${jenisSumberDanaRaw || "-"}). SIMLUHTAN: ${simluhtanRaw || "-"}. Status Salur: ${statusSalurRaw || "-"}.`;
    const catatanText = `Jadwal Tanam: ${jadwalTanamRaw || "-"} 2026 | Ketua/Penerima: ${ketuaRaw || "-"} (${telpRaw || "-"})`;

    // 6. Upsert Data Kebun
    const kebun = await prisma.kebun.upsert({
      where: { kd_kebun: kdBangun },
      update: {
        nama: namaKebun,
        kd_desa: matchedDesa.kd_desa,
        kd_kecamatan: matchedKec.kd_kecamatan,
        kd_kelompok: kdKelompok,
        kd_komoditas: "KBN-JAGUNG",
        namaPemilik: ketuaRaw || null,
        alamatLokasi: `${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
        latitude: finalLat,
        longitude: finalLng,
        jenisTanaman: varietasRaw ? `Jagung (${varietasRaw})` : "Jagung Hibrida",
        luasLahanHa: luasLahanHa > 0 ? luasLahanHa : null,
        jarakTanam: "70 x 20 cm",
        tahunTanam: 2026,
        sistemTanam: "Monokultur",
        kondisiTanaman: "Baik",
        statusLahan: "Milik Petani / Kelompok",
        tahunMulaiUsaha: 2026,
        kondisiLokasi: "Lahan Kering / Sawah Tadah Hujan",
        deskripsi: deskripsiText,
        catatan: catatanText,
        status: "AKTIF",
      },
      create: {
        kd_kebun: kdBangun,
        nama: namaKebun,
        kd_desa: matchedDesa.kd_desa,
        kd_kecamatan: matchedKec.kd_kecamatan,
        kd_kelompok: kdKelompok,
        kd_komoditas: "KBN-JAGUNG",
        namaPemilik: ketuaRaw || null,
        alamatLokasi: `${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
        latitude: finalLat,
        longitude: finalLng,
        jenisTanaman: varietasRaw ? `Jagung (${varietasRaw})` : "Jagung Hibrida",
        luasLahanHa: luasLahanHa > 0 ? luasLahanHa : null,
        jarakTanam: "70 x 20 cm",
        tahunTanam: 2026,
        sistemTanam: "Monokultur",
        kondisiTanaman: "Baik",
        statusLahan: "Milik Petani / Kelompok",
        tahunMulaiUsaha: 2026,
        kondisiLokasi: "Lahan Kering / Sawah Tadah Hujan",
        deskripsi: deskripsiText,
        catatan: catatanText,
        status: "AKTIF",
      },
    });

    // 7. Pendanaan Kebun
    const sumberDanaEnum = mapSumberDanaEnum(sumberDanaRaw);
    const isSalur = statusSalurRaw.toLowerCase().includes("salur");

    // Hapus pendanaan lama untuk kebun ini bila ada, lalu buat baru agar tidak duplikat
    await prisma.pendanaanKebun.deleteMany({ where: { kd_kebun: kdBangun } });
    await prisma.pendanaanKebun.create({
      data: {
        kd_kebun: kdBangun,
        namaProgram: "Bantuan Benih Jagung Tapanuli Selatan TA 2026",
        sumberDana: sumberDanaEnum,
        namaSumberDana: `${sumberDanaRaw}${jenisSumberDanaRaw ? " - " + jenisSumberDanaRaw : ""}`,
        tahunAnggaran: 2026,
        nomorUsulan: `USUL-JAGUNG-2026-${String(no).padStart(3, "0")}`,
        status: isSalur ? "DICAIRKAN" : "DISETUJUI",
        keterangan: `Volume Benih: ${volumeBenihKg} Kg, Varietas: ${varietasRaw || "-"}, Jadwal: ${jadwalTanamRaw || "-"}`,
        danaDiajukan: 0,
        danaDisetujui: 0,
        danaDicairkan: 0,
      },
    });
    pendanaanCount++;

    // 8. Siklus Produksi
    const tglMulai = getJadwalDate(jadwalTanamRaw);
    const tglTargetPanen = new Date(tglMulai.getTime() + 110 * 24 * 60 * 60 * 1000); // 110 hari masa tanam jagung
    const kdSiklus = `SIK-KBN-2026-${String(no).padStart(3, "0")}`;
    const estimasiProduksiTon = luasLahanHa > 0 ? Number((luasLahanHa * 6).toFixed(2)) : null; // 6 ton/Ha

    await prisma.siklusProduksi.deleteMany({ where: { kd_kebun: kdBangun } });
    await prisma.siklusProduksi.create({
      data: {
        kd_siklus: kdSiklus,
        jenisUsaha: "KEBUN",
        namaSiklus: `Musim Tanam Jagung 2026 - ${namaKebun}`,
        tahapKegiatan: isSalur ? "Tanam" : "Perencanaan",
        tanggalMulai: tglMulai,
        tanggalTargetPanen: tglTargetPanen,
        estimasiProduksi: estimasiProduksiTon,
        satuanProduksi: "ton",
        status: isSalur ? "BERJALAN" : "PERENCANAAN",
        catatan: `Varietas: ${varietasRaw || "-"}, Jadwal: ${jadwalTanamRaw || "-"}, Sumber: ${sumberDanaRaw}`,
        kd_kebun: kdBangun,
      },
    });
    siklusCount++;

    successCount++;

    if (no % 25 === 0 || no === rows.length) {
      console.log(`Progres: ${no}/${rows.length} data kebun berhasil diimpor...`);
    }
  }

  console.log("\n=== RINGKASAN IMPORT DATA KEBUN ===");
  console.log(`- Total data Excel diproses: ${rows.length}`);
  console.log(`- Berhasil dimasukkan ke tabel Kebun: ${successCount}`);
  console.log(`- Kelompok Tani baru ditambahkan: ${poktanCreatedCount}`);
  console.log(`- Data Pendanaan Kebun dibuat: ${pendanaanCount}`);
  console.log(`- Siklus Produksi dibuat: ${siklusCount}`);
  console.log("=== PROSES IMPORT SELESAI DENGAN SUKSES ===");
}

main()
  .catch((e) => {
    console.error("Terjadi error saat import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
