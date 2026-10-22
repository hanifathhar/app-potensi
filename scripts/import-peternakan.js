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
    .replace(/^kt\.\s+/i, "")
    .replace(/^kelompok\s+tani\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAyamCoord(raw) {
  if (!raw || typeof raw !== "string") return { lat: null, lng: null };
  let str = raw.trim();

  // Fix typo in Row 5: "°22′33.6″N" -> "1°22′33.6″N"
  if (str.startsWith("°")) {
    str = "1" + str;
  }

  // 1. DMS pattern: e.g. 1°28′52″N 99°13′30″E or 1°23'14.8"N 99°16'18.9"E
  const dmsMatch = str.match(
    /([0-9]+)[°⁰˚\^'’\s]+([0-9]+)[′'’\s]+([0-9\.]+)[″"”\s]*N[\s,]*([0-9]+)[°⁰˚\^'’\s]+([0-9]+)[′'’\s]+([0-9\.]+)[″"”\s]*E/i
  );
  if (dmsMatch) {
    const lat = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    const lng = parseFloat(dmsMatch[4]) + parseFloat(dmsMatch[5]) / 60 + parseFloat(dmsMatch[6]) / 3600;
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  // 2. Decimal with N & E: e.g. 1,51612N 99,28764E or 1,6074290N,99,2821200E
  const decNEMatch = str.match(/([0-9]+)[,\.]([0-9]+)\s*N[\s,]*([0-9]+)[,\.]([0-9]+)\s*E/i);
  if (decNEMatch) {
    const lat = parseFloat(decNEMatch[1] + "." + decNEMatch[2]);
    const lng = parseFloat(decNEMatch[3] + "." + decNEMatch[4]);
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  // 3. Comma-separated decimal e.g. 1,57017,9930968,876,3m or 1,50307,99,01356,25,3m,1940
  const commaMatch = str.match(/^([0-9]+)[,\.]([0-9]{4,7})[,\s]+99[,\.]?([0-9]{3,7})/);
  if (commaMatch) {
    const lat = parseFloat(commaMatch[1] + "." + commaMatch[2]);
    const lng = parseFloat("99." + commaMatch[3]);
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  return { lat: null, lng: null };
}

async function ensureKomoditas() {
  await prisma.komoditas.upsert({
    where: { kd_komoditas: "TRN-AYAM" },
    update: { aktif: true },
    create: {
      kd_komoditas: "TRN-AYAM",
      nm_komoditas: "Ayam Broiler / Petelur",
      jenisUsaha: "PETERNAKAN",
      satuanDefault: "Ekor",
      deskripsi: "Peternakan Unggas Ayam Petelur (Layer) dan Pedaging (Broiler)",
      aktif: true,
      urutan: 1,
    },
  });
}

async function main() {
  console.log("=== MEMULAI IMPORT DATA PENERIMA BANTUAN AYAM LAYER 2026 ===");
  await ensureKomoditas();

  const filePath = path.join(__dirname, "..", "Rekap Penerima Bantuan Ternak Ayam Layer (1).xlsx");
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets["Data Penerima"];
  const allRows = xlsx.utils.sheet_to_json(ws, { header: 1 });

  const rows = [];
  for (let i = 5; i < allRows.length; i++) {
    const r = allRows[i];
    if (r && typeof r[0] === "number") {
      rows.push({
        no: r[0],
        sumberDana: String(r[1] || "").trim(),
        jenisSumberDana: String(r[2] || "").trim(),
        kecamatan: String(r[3] || "").trim(),
        desa: String(r[4] || "").trim(),
        poktan: String(r[5] || "").trim(),
        ketua: String(r[6] || "").trim(),
        nik: String(r[7] || "").trim(),
        telp: String(r[8] || "").trim(),
        anggota: parseInt(r[9]) || 0,
        ekor: parseInt(r[10]) || 150,
        koordinat: String(r[11] || "").trim(),
        simluhtan: String(r[12] || "").trim(),
        statusSalur: String(r[13] || "").trim(),
      });
    }
  }

  console.log(`Ditemukan ${rows.length} baris data valid untuk diimpor.`);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany({ include: { kecamatan: true } });

  let peternakanCount = 0;
  let poktanLinkedCount = 0;
  let poktanCreatedCount = 0;
  let pendanaanCount = 0;
  let siklusCount = 0;

  for (const r of rows) {
    const no = r.no;

    // 1. Cocokkan Kecamatan
    const cKec = cleanName(r.kecamatan).toUpperCase();
    const matchedKec = masterKec.find(
      (k) =>
        k.nm_kecamatan.toUpperCase() === cKec ||
        k.nm_kecamatan.replace(/\s+/g, "").toUpperCase() === cKec.replace(/\s+/g, "")
    );

    if (!matchedKec) {
      throw new Error(`Baris ${no}: Kecamatan "${r.kecamatan}" tidak ditemukan!`);
    }

    // 2. Cocokkan Desa
    let cleanDesaName = cleanName(r.desa).toUpperCase();
    let matchedDesa = null;

    // Penyesuaian khusus master desa
    if (matchedKec.kd_kecamatan === "12.03.04" && cleanDesaName.includes("SITAMPA")) {
      // Baris 8: Poktan Naduma Raptama berada di Desa Sialaman, Sipirok
      matchedDesa = masterDesa.find(
        (d) => d.kd_kecamatan === "12.03.04" && d.nm_desa.toUpperCase().includes("SIALAMAN")
      );
    } else if (matchedKec.kd_kecamatan === "12.03.02" && cleanDesaName.includes("HUTABARU")) {
      // Baris 13: Desa Hutabaru Siagian di Batang Toru -> Desa Huta Baru
      matchedDesa = masterDesa.find(
        (d) => d.kd_kecamatan === "12.03.02" && d.nm_desa.toUpperCase().includes("HUTA BARU")
      );
    } else {
      matchedDesa = masterDesa.find((d) => {
        if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
        const dbName = d.nm_desa.toUpperCase().replace(/^KEL\.\s+/i, "").replace(/^DESA\s+/i, "").trim();
        return (
          dbName === cleanDesaName ||
          dbName.replace(/[^A-Z0-9]/g, "") === cleanDesaName.replace(/[^A-Z0-9]/g, "") ||
          dbName.includes(cleanDesaName) ||
          cleanDesaName.includes(dbName)
        );
      });
    }

    if (!matchedDesa) {
      throw new Error(`Baris ${no}: Desa "${r.desa}" di Kecamatan "${matchedKec.nm_kecamatan}" tidak ditemukan!`);
    }

    // 3. Titik Koordinat
    const { lat, lng } = parseAyamCoord(r.koordinat);
    let finalLat = lat;
    let finalLng = lng;

    if (!finalLat || !finalLng) {
      if (matchedDesa.latitude && matchedDesa.longitude) {
        finalLat = Number(matchedDesa.latitude);
        finalLng = Number(matchedDesa.longitude);
      }
    }

    // 4. Kelompok Tani
    const cleanPoktan = cleanName(r.poktan);
    let kdKelompok = null;

    if (cleanPoktan && cleanPoktan !== "-" && cleanPoktan.toLowerCase() !== "undefined") {
      // Cek apakah sudah ada kelompok tani di desa ini
      let existingPoktan = await prisma.kelompokTani.findFirst({
        where: {
          kd_desa: matchedDesa.kd_desa,
          nm_kelompok: {
            equals: cleanPoktan,
            mode: "insensitive",
          },
        },
      });

      if (!existingPoktan) {
        // Cek juga jika ada nama poktan mirip di desa tersebut
        existingPoktan = await prisma.kelompokTani.findFirst({
          where: {
            kd_desa: matchedDesa.kd_desa,
            nm_kelompok: {
              contains: cleanPoktan,
              mode: "insensitive",
            },
          },
        });
      }

      if (existingPoktan) {
        kdKelompok = existingPoktan.kd_kelompok;
        poktanLinkedCount++;
      } else {
        // Buat kelompok tani baru dengan format seragam PKT-2026-NNN
        const count2026 = await prisma.kelompokTani.count({ where: { tahunBerdiri: 2026 } });
        kdKelompok = `PKT-2026-${String(count2026 + 1).padStart(3, "0")}`;

        existingPoktan = await prisma.kelompokTani.create({
          data: {
            kd_kelompok: kdKelompok,
            nm_kelompok: cleanPoktan,
            kd_kecamatan: matchedKec.kd_kecamatan,
            kd_desa: matchedDesa.kd_desa,
            namaKetua: r.ketua || cleanPoktan,
            noTelepon: r.telp && r.telp !== "-" && r.telp !== "undefined" ? r.telp : null,
            jumlahAnggota: r.anggota || 0,
            tahunBerdiri: 2026,
            status: "AKTIF",
            keterangan: `SIMLUHTAN: ${r.simluhtan || "Ya"} | Penerima Bantuan Ternak Ayam Layer TA 2026`,
          },
        });
        poktanCreatedCount++;
      }

      // Tambahkan anggota kelompok jika ada Ketua dan NIK
      if (r.ketua && r.ketua !== "-" && r.nik && r.nik.length >= 10 && r.nik !== "-") {
        const existingAnggota = await prisma.anggotaKelompok.findUnique({
          where: { nik: r.nik },
        });
        if (!existingAnggota) {
          await prisma.anggotaKelompok.create({
            data: {
              kd_kelompok: kdKelompok,
              nik: r.nik,
              nama: r.ketua,
              jabatan: "Ketua",
              noTelepon: r.telp && r.telp !== "-" && r.telp !== "undefined" ? r.telp : null,
              aktif: true,
            },
          });
        }
      }
    }

    // 5. Data Peternakan
    const kdPeternakan = `TRN-2026-${String(no).padStart(3, "0")}`;
    const nmPeternakan = `Peternakan Ayam Layer ${cleanPoktan || r.ketua}`;

    const deskripsiText = `Bantuan Kandang, Ternak Ayam Layer ${r.ekor} Ekor dan Pakan TA 2026. Sumber Dana: ${r.sumberDana} (${r.jenisSumberDana}). SIMLUHTAN: ${r.simluhtan}. Status Salur: ${r.statusSalur}.`;
    const catatanText = `Ketua/Penanggung Jawab: ${r.ketua} (${r.telp !== "-" && r.telp !== "undefined" ? r.telp : "Tanpa No. Kontak"})`;

    await prisma.peternakan.upsert({
      where: { kd_peternakan: kdPeternakan },
      update: {
        nm_peternakan: nmPeternakan,
        kd_desa: matchedDesa.kd_desa,
        kd_kecamatan: matchedKec.kd_kecamatan,
        kd_kelompok: kdKelompok,
        kd_komoditas: "TRN-AYAM",
        namaPemilik: r.ketua || null,
        alamatLokasi: `${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
        latitude: finalLat,
        longitude: finalLng,
        jenisTernak: "Ayam Layer (Petelur)",
        jenisKandang: "Kandang Baterai / Panggung",
        jumlahKandang: 1,
        jumlahTernak: r.ekor,
        satuanTernak: "Ekor",
        kapasitasKandang: r.ekor,
        sistemPemeliharaan: "Intensif",
        sumberPakan: "Pakan Konsentrat / Pabrikan (Bantuan Dinas)",
        kondisiKandang: "Baik / Baru (Bantuan 2026)",
        tahunMulaiUsaha: 2026,
        kondisiLokasi: "Sesuai Tata Ruang Peternakan",
        deskripsi: deskripsiText,
        catatan: catatanText,
        status: "AKTIF",
      },
      create: {
        kd_peternakan: kdPeternakan,
        nm_peternakan: nmPeternakan,
        kd_desa: matchedDesa.kd_desa,
        kd_kecamatan: matchedKec.kd_kecamatan,
        kd_kelompok: kdKelompok,
        kd_komoditas: "TRN-AYAM",
        namaPemilik: r.ketua || null,
        alamatLokasi: `${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
        latitude: finalLat,
        longitude: finalLng,
        jenisTernak: "Ayam Layer (Petelur)",
        jenisKandang: "Kandang Baterai / Panggung",
        jumlahKandang: 1,
        jumlahTernak: r.ekor,
        satuanTernak: "Ekor",
        kapasitasKandang: r.ekor,
        sistemPemeliharaan: "Intensif",
        sumberPakan: "Pakan Konsentrat / Pabrikan (Bantuan Dinas)",
        kondisiKandang: "Baik / Baru (Bantuan 2026)",
        tahunMulaiUsaha: 2026,
        kondisiLokasi: "Sesuai Tata Ruang Peternakan",
        deskripsi: deskripsiText,
        catatan: catatanText,
        status: "AKTIF",
      },
    });
    peternakanCount++;

    // 6. Data Pendanaan Peternakan
    await prisma.pendanaanPeternakan.deleteMany({ where: { kd_peternakan: kdPeternakan } });
    await prisma.pendanaanPeternakan.create({
      data: {
        kd_peternakan: kdPeternakan,
        namaProgram: "Bantuan Kandang, Ayam Layer, dan Pakan TA 2026",
        sumberDana: "APBD_KABUPATEN",
        namaSumberDana: `APBD Kabupaten - ${r.jenisSumberDana}`,
        tahunAnggaran: 2026,
        nomorUsulan: `USUL-TRN-2026-${String(no).padStart(3, "0")}`,
        status: "DICAIRKAN",
        keterangan: `Alokasi 150 Ekor Ayam Layer Petelur, Kandang dan Pakan (${r.statusSalur})`,
        danaDiajukan: 0,
        danaDisetujui: 0,
        danaDicairkan: 0,
      },
    });
    pendanaanCount++;

    // 7. Siklus Produksi
    const kdSiklus = `SIK-TRN-2026-${String(no).padStart(3, "0")}`;
    await prisma.siklusProduksi.deleteMany({ where: { kd_peternakan: kdPeternakan } });
    await prisma.siklusProduksi.create({
      data: {
        kd_siklus: kdSiklus,
        jenisUsaha: "PETERNAKAN",
        namaSiklus: `Siklus Produksi Telur 2026 - ${nmPeternakan}`,
        tahapKegiatan: "Pemeliharaan",
        tanggalMulai: new Date("2026-06-01T00:00:00.000Z"),
        tanggalTargetPanen: new Date("2026-12-31T00:00:00.000Z"),
        estimasiProduksi: 135, // ~90% henday lay rate
        satuanProduksi: "Butir/Hari",
        status: "BERJALAN",
        catatan: `150 Ekor Ayam Layer Petelur, Pakan Bantuan APBD`,
        kd_peternakan: kdPeternakan,
      },
    });
    siklusCount++;

    console.log(
      `[OK] Baris ${no}: ${nmPeternakan.padEnd(42)} -> ${matchedDesa.nm_desa}, ${matchedKec.nm_kecamatan} | Poktan: ${kdKelompok}`
    );
  }

  console.log("\n=== RINGKASAN IMPORT BANTUAN AYAM LAYER ===");
  console.log(`- Data Peternakan diimpor : ${peternakanCount}`);
  console.log(`- Kelompok Tani terhubung : ${poktanLinkedCount}`);
  console.log(`- Kelompok Tani baru dibuat : ${poktanCreatedCount}`);
  console.log(`- Data Pendanaan dibuat   : ${pendanaanCount}`);
  console.log(`- Siklus Produksi dibuat  : ${siklusCount}`);
  console.log("=== PROSES IMPORT SELESAI DENGAN SUKSES ===");
}

main()
  .catch((e) => {
    console.error("Terjadi error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
