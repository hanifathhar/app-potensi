const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding comprehensive pendanaan records into real database...");

  const desa = await prisma.desa.findFirst();
  if (!desa) throw new Error("Desa tidak ditemukan");
  const kd_desa = desa.kd_desa;
  const kd_kecamatan = desa.kd_kecamatan;

  // 1. Pastikan komoditas ada
  const komoditasList = [
    { kd: "KBN-PADI", nm: "Padi", sektor: "KEBUN" },
    { kd: "KBN-JAGUNG", nm: "Jagung", sektor: "KEBUN" },
    { kd: "KLM-NILA", nm: "Budidaya Ikan Nila", sektor: "KOLAM" },
    { kd: "KLM-LELE", nm: "Budidaya Ikan Lele", sektor: "KOLAM" },
    { kd: "TRN-SAPI", nm: "Sapi Potong", sektor: "PETERNAKAN" },
    { kd: "TRN-AYAM", nm: "Ayam Layer", sektor: "PETERNAKAN" },
  ];
  for (const k of komoditasList) {
    await prisma.komoditas.upsert({
      where: { kd_komoditas: k.kd },
      update: { nm_komoditas: k.nm },
      create: {
        kd_komoditas: k.kd,
        nm_komoditas: k.nm,
        jenisUsaha: k.sektor,
        aktif: true,
      },
    });
  }

  // 2. Buat Unit Usaha Per Sektor & Sumber Dana (Tahun 2025)
  // --- PERTANIAN ---
  // APBD: 3.5 M (3.500.000.000)
  const kb1 = await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-2025-APBD" },
    update: { nama: "Kelompok Tani Maju Bersama (Padi APBD)" },
    create: {
      kd_kebun: "KBN-2025-APBD",
      nama: "Kelompok Tani Maju Bersama (Padi APBD)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KBN-PADI",
      namaPemilik: "Kelompok Tani Maju Bersama",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKebun.upsert({
    where: { id: "pk-2025-apbd" },
    update: { danaDicairkan: 3500000000, danaDiajukan: 3500000000, namaSumberDana: "APBD" },
    create: {
      id: "pk-2025-apbd",
      kd_kebun: kb1.kd_kebun,
      namaProgram: "Program Bantuan Benih & Alsintan APBD",
      sumberDana: "APBD_KABUPATEN",
      namaSumberDana: "APBD",
      tahunAnggaran: 2025,
      danaDiajukan: 3500000000,
      danaDisetujui: 3500000000,
      danaDicairkan: 3500000000,
      status: "DICAIRKAN",
    },
  });

  // DAK: 2.0 M (2.000.000.000)
  const kb2 = await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-2025-DAK" },
    update: { nama: "Gabungan Kelompok Tani Tapsel Makmur (DAK)" },
    create: {
      kd_kebun: "KBN-2025-DAK",
      nama: "Gabungan Kelompok Tani Tapsel Makmur (DAK)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KBN-PADI",
      namaPemilik: "Gapoktan Tapsel Makmur",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKebun.upsert({
    where: { id: "pk-2025-dak" },
    update: { danaDicairkan: 2000000000, danaDiajukan: 2000000000, namaSumberDana: "DAK" },
    create: {
      id: "pk-2025-dak",
      kd_kebun: kb2.kd_kebun,
      namaProgram: "Bantuan DAK Fisik Pertanian",
      sumberDana: "BANTUAN_PEMERINTAH",
      namaSumberDana: "DAK",
      tahunAnggaran: 2025,
      danaDiajukan: 2000000000,
      danaDisetujui: 2000000000,
      danaDicairkan: 2000000000,
      status: "DICAIRKAN",
    },
  });

  // APBN: 1.2 M (1.200.000.000)
  const kb3 = await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-2025-APBN" },
    update: { nama: "Poktan Sumber Tani Sejahtera (APBN)" },
    create: {
      kd_kebun: "KBN-2025-APBN",
      nama: "Poktan Sumber Tani Sejahtera (APBN)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KBN-JAGUNG",
      namaPemilik: "Poktan Sumber Tani",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKebun.upsert({
    where: { id: "pk-2025-apbn" },
    update: { danaDicairkan: 1200000000, danaDiajukan: 1200000000, namaSumberDana: "APBN" },
    create: {
      id: "pk-2025-apbn",
      kd_kebun: kb3.kd_kebun,
      namaProgram: "Bantuan Pupuk & Saprodi APBN",
      sumberDana: "APBN",
      namaSumberDana: "APBN",
      tahunAnggaran: 2025,
      danaDiajukan: 1200000000,
      danaDisetujui: 1200000000,
      danaDicairkan: 1200000000,
      status: "DICAIRKAN",
    },
  });

  // Dana Desa: 0.8 M (800.000.000)
  const kb4 = await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-2025-DD" },
    update: { nama: "Ketahanan Pangan Desa Batang Toru" },
    create: {
      kd_kebun: "KBN-2025-DD",
      nama: "Ketahanan Pangan Desa Batang Toru",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KBN-PADI",
      namaPemilik: "Desa Batang Toru",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKebun.upsert({
    where: { id: "pk-2025-dd" },
    update: { danaDicairkan: 800000000, danaDiajukan: 800000000, namaSumberDana: "Dana Desa" },
    create: {
      id: "pk-2025-dd",
      kd_kebun: kb4.kd_kebun,
      namaProgram: "Program Ketahanan Pangan Nabati Dana Desa",
      sumberDana: "DANA_DESA",
      namaSumberDana: "Dana Desa",
      tahunAnggaran: 2025,
      danaDiajukan: 800000000,
      danaDisetujui: 800000000,
      danaDicairkan: 800000000,
      status: "DICAIRKAN",
    },
  });

  // --- PERIKANAN ---
  // APBD: 1.2 M (1.200.000.000)
  const kl1 = await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-2025-APBD" },
    update: { nm_kolam: "Pokdakan Sarasi Indah (APBD)" },
    create: {
      kd_kolam: "KLM-2025-APBD",
      nm_kolam: "Pokdakan Sarasi Indah (APBD)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KLM-NILA",
      namaPemilik: "Pokdakan Sarasi Indah",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKolam.upsert({
    where: { id: "pl-2025-apbd" },
    update: { danaDicairkan: 1200000000, danaDiajukan: 1200000000, namaSumberDana: "APBD" },
    create: {
      id: "pl-2025-apbd",
      kd_kolam: kl1.kd_kolam,
      namaProgram: "Bantuan Sarana Budidaya Perikanan APBD",
      sumberDana: "APBD_KABUPATEN",
      namaSumberDana: "APBD",
      tahunAnggaran: 2025,
      danaDiajukan: 1200000000,
      danaDisetujui: 1200000000,
      danaDicairkan: 1200000000,
      status: "DICAIRKAN",
    },
  });

  // DAK: 0.9 M (900.000.000)
  const kl2 = await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-2025-DAK" },
    update: { nm_kolam: "Pokdakan Sumber Rezeki (DAK)" },
    create: {
      kd_kolam: "KLM-2025-DAK",
      nm_kolam: "Pokdakan Sumber Rezeki (DAK)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KLM-NILA",
      namaPemilik: "Pokdakan Sumber Rezeki",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKolam.upsert({
    where: { id: "pl-2025-dak" },
    update: { danaDicairkan: 900000000, danaDiajukan: 900000000, namaSumberDana: "DAK" },
    create: {
      id: "pl-2025-dak",
      kd_kolam: kl2.kd_kolam,
      namaProgram: "Bantuan DAK Budidaya Ikan Tapsel",
      sumberDana: "BANTUAN_PEMERINTAH",
      namaSumberDana: "DAK",
      tahunAnggaran: 2025,
      danaDiajukan: 900000000,
      danaDisetujui: 900000000,
      danaDicairkan: 900000000,
      status: "DICAIRKAN",
    },
  });

  // APBN: 0.5 M (500.000.000)
  const kl3 = await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-2025-APBN" },
    update: { nm_kolam: "Pokdakan Mina Jaya Lestari (APBN)" },
    create: {
      kd_kolam: "KLM-2025-APBN",
      nm_kolam: "Pokdakan Mina Jaya Lestari (APBN)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KLM-LELE",
      namaPemilik: "Pokdakan Mina Jaya",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKolam.upsert({
    where: { id: "pl-2025-apbn" },
    update: { danaDicairkan: 500000000, danaDiajukan: 500000000, namaSumberDana: "APBN" },
    create: {
      id: "pl-2025-apbn",
      kd_kolam: kl3.kd_kolam,
      namaProgram: "Bantuan Bioflok Kementerian Kelautan APBN",
      sumberDana: "APBN",
      namaSumberDana: "APBN",
      tahunAnggaran: 2025,
      danaDiajukan: 500000000,
      danaDisetujui: 500000000,
      danaDicairkan: 500000000,
      status: "DICAIRKAN",
    },
  });

  // Dana Desa: 0.4 M (400.000.000)
  const kl4 = await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-2025-DD" },
    update: { nm_kolam: "Budidaya Kolam Desa Marancar" },
    create: {
      kd_kolam: "KLM-2025-DD",
      nm_kolam: "Budidaya Kolam Desa Marancar",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "KLM-NILA",
      namaPemilik: "BUMDes Marancar",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanKolam.upsert({
    where: { id: "pl-2025-dd" },
    update: { danaDicairkan: 400000000, danaDiajukan: 400000000, namaSumberDana: "Dana Desa" },
    create: {
      id: "pl-2025-dd",
      kd_kolam: kl4.kd_kolam,
      namaProgram: "Program Perikanan Air Tawar Dana Desa",
      sumberDana: "DANA_DESA",
      namaSumberDana: "Dana Desa",
      tahunAnggaran: 2025,
      danaDiajukan: 400000000,
      danaDisetujui: 400000000,
      danaDicairkan: 400000000,
      status: "DICAIRKAN",
    },
  });

  // --- PETERNAKAN ---
  // APBD: 1.0 M (1.000.000.000)
  const pt1 = await prisma.peternakan.upsert({
    where: { kd_peternakan: "TRN-2025-APBD" },
    update: { nm_peternakan: "Kelompok Ternak Harapan Jaya (APBD)" },
    create: {
      kd_peternakan: "TRN-2025-APBD",
      nm_peternakan: "Kelompok Ternak Harapan Jaya (APBD)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "TRN-SAPI",
      namaPemilik: "Kelompok Ternak Harapan Jaya",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanPeternakan.upsert({
    where: { id: "pt-2025-apbd" },
    update: { danaDicairkan: 1000000000, danaDiajukan: 1000000000, namaSumberDana: "APBD" },
    create: {
      id: "pt-2025-apbd",
      kd_peternakan: pt1.kd_peternakan,
      namaProgram: "Bantuan Bibit Sapi & Pakan APBD",
      sumberDana: "APBD_KABUPATEN",
      namaSumberDana: "APBD",
      tahunAnggaran: 2025,
      danaDiajukan: 1000000000,
      danaDisetujui: 1000000000,
      danaDicairkan: 1000000000,
      status: "DICAIRKAN",
    },
  });

  // DAK: 0.6 M (600.000.000)
  const pt2 = await prisma.peternakan.upsert({
    where: { kd_peternakan: "TRN-2025-DAK" },
    update: { nm_peternakan: "Peternakan Unggas Sentosa (DAK)" },
    create: {
      kd_peternakan: "TRN-2025-DAK",
      nm_peternakan: "Peternakan Unggas Sentosa (DAK)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "TRN-AYAM",
      namaPemilik: "Kelompok Unggas Sentosa",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanPeternakan.upsert({
    where: { id: "pt-2025-dak" },
    update: { danaDicairkan: 600000000, danaDiajukan: 600000000, namaSumberDana: "DAK" },
    create: {
      id: "pt-2025-dak",
      kd_peternakan: pt2.kd_peternakan,
      namaProgram: "Bantuan DAK Sarana Kandang Ternak",
      sumberDana: "BANTUAN_PEMERINTAH",
      namaSumberDana: "DAK",
      tahunAnggaran: 2025,
      danaDiajukan: 600000000,
      danaDisetujui: 600000000,
      danaDicairkan: 600000000,
      status: "DICAIRKAN",
    },
  });

  // APBN: 0.3 M (300.000.000)
  const pt3 = await prisma.peternakan.upsert({
    where: { kd_peternakan: "TRN-2025-APBN" },
    update: { nm_peternakan: "Peternakan Rakyat Mandiri (APBN)" },
    create: {
      kd_peternakan: "TRN-2025-APBN",
      nm_peternakan: "Peternakan Rakyat Mandiri (APBN)",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "TRN-SAPI",
      namaPemilik: "Kelompok Rakyat Mandiri",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanPeternakan.upsert({
    where: { id: "pt-2025-apbn" },
    update: { danaDicairkan: 300000000, danaDiajukan: 300000000, namaSumberDana: "APBN" },
    create: {
      id: "pt-2025-apbn",
      kd_peternakan: pt3.kd_peternakan,
      namaProgram: "Program Inseminasi Buatan & Vaksinasi APBN",
      sumberDana: "APBN",
      namaSumberDana: "APBN",
      tahunAnggaran: 2025,
      danaDiajukan: 300000000,
      danaDisetujui: 300000000,
      danaDicairkan: 300000000,
      status: "DICAIRKAN",
    },
  });

  // Dana Desa: 0.5 M (500.000.000)
  const pt4 = await prisma.peternakan.upsert({
    where: { kd_peternakan: "TRN-2025-DD" },
    update: { nm_peternakan: "Kandang Komunal Desa Sipirok" },
    create: {
      kd_peternakan: "TRN-2025-DD",
      nm_peternakan: "Kandang Komunal Desa Sipirok",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_komoditas: "TRN-SAPI",
      namaPemilik: "Desa Sipirok",
      tahunMulaiUsaha: 2025,
    },
  });
  await prisma.pendanaanPeternakan.upsert({
    where: { id: "pt-2025-dd" },
    update: { danaDicairkan: 500000000, danaDiajukan: 500000000, namaSumberDana: "Dana Desa" },
    create: {
      id: "pt-2025-dd",
      kd_peternakan: pt4.kd_peternakan,
      namaProgram: "Program Kandang Komunal Ternak Dana Desa",
      sumberDana: "DANA_DESA",
      namaSumberDana: "Dana Desa",
      tahunAnggaran: 2025,
      danaDiajukan: 500000000,
      danaDisetujui: 500000000,
      danaDicairkan: 500000000,
      status: "DICAIRKAN",
    },
  });

  console.log("Database successfully seeded with comprehensive funding data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
