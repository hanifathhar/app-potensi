const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding pendanaan data into PostgreSQL database...");

  // 1. Dapatkan Desa dan Kecamatan contoh yang valid
  const desa = await prisma.desa.findFirst();
  if (!desa) {
    throw new Error("Tidak ada data desa di database!");
  }
  const kd_desa = desa.kd_desa;
  const kd_kecamatan = desa.kd_kecamatan;

  // 2. Pastikan Komoditas Padi ada
  await prisma.komoditas.upsert({
    where: { kd_komoditas: "KBN-PADI" },
    update: {},
    create: {
      kd_komoditas: "KBN-PADI",
      nm_komoditas: "Padi",
      jenisUsaha: "KEBUN",
      satuanDefault: "Ton",
      aktif: true,
      urutan: 0,
    },
  });

  // 3. Kelompok Tani / Pokdakan / Kelompok Ternak
  const kelompokData = [
    { kd: "PKT-DANA-001", nm: "Kelompok Tani Maju Bersama", ketua: "M. Siregar" },
    { kd: "PKT-DANA-002", nm: "Pokdakan Sumber Rezeki", ketua: "H. Harahap" },
    { kd: "PKT-DANA-003", nm: "Kelompok Ternak Harapan Jaya", ketua: "A. Pasaribu" },
    { kd: "PKT-DANA-004", nm: "Poktan Sinar Tani", ketua: "B. Ritonga" },
    { kd: "PKT-DANA-005", nm: "Pokdakan Lestari", ketua: "R. Pane" },
  ];

  for (const k of kelompokData) {
    await prisma.kelompokTani.upsert({
      where: { kd_kelompok: k.kd, kd_desa_nm_kelompok: { kd_desa, nm_kelompok: k.nm } },
      update: { nm_kelompok: k.nm, namaKetua: k.ketua },
      create: {
        kd_kelompok: k.kd,
        nm_kelompok: k.nm,
        kd_kecamatan,
        kd_desa,
        namaKetua: k.ketua,
        status: "AKTIF",
      },
    });
  }

  // 4. Buat / Pastikan Unit Usaha
  // Unit 1: Kebun Padi (Kelompok Tani Maju Bersama)
  await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-DANA-001" },
    update: {
      nama: "Kelompok Tani Maju Bersama",
      kd_kelompok: "PKT-DANA-001",
      kd_komoditas: "KBN-PADI",
      jenisTanaman: "Padi",
    },
    create: {
      kd_kebun: "KBN-DANA-001",
      nama: "Kelompok Tani Maju Bersama",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_kelompok: "PKT-DANA-001",
      kd_komoditas: "KBN-PADI",
      namaPemilik: "Kelompok Tani Maju Bersama",
      jenisTanaman: "Padi",
      tahunMulaiUsaha: 2025,
    },
  });

  // Unit 2: Kolam Nila (Pokdakan Sumber Rezeki)
  await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-DANA-001" },
    update: {
      nm_kolam: "Pokdakan Sumber Rezeki",
      kd_kelompok: "PKT-DANA-002",
      kd_komoditas: "KLM-NILA",
      sistemBudidaya: "Budidaya Ikan Nila",
    },
    create: {
      kd_kolam: "KLM-DANA-001",
      nm_kolam: "Pokdakan Sumber Rezeki",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_kelompok: "PKT-DANA-002",
      kd_komoditas: "KLM-NILA",
      namaPemilik: "Pokdakan Sumber Rezeki",
      sistemBudidaya: "Budidaya Ikan Nila",
      tahunMulaiUsaha: 2025,
    },
  });

  // Unit 3: Peternakan Sapi (Kelompok Ternak Harapan Jaya)
  await prisma.peternakan.upsert({
    where: { kd_peternakan: "TRN-DANA-001" },
    update: {
      nm_peternakan: "Kelompok Ternak Harapan Jaya",
      kd_kelompok: "PKT-DANA-003",
      kd_komoditas: "TRN-SAPI",
      jenisTernak: "Sapi Potong",
    },
    create: {
      kd_peternakan: "TRN-DANA-001",
      nm_peternakan: "Kelompok Ternak Harapan Jaya",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_kelompok: "PKT-DANA-003",
      kd_komoditas: "TRN-SAPI",
      namaPemilik: "Kelompok Ternak Harapan Jaya",
      jenisTernak: "Sapi Potong",
      tahunMulaiUsaha: 2025,
    },
  });

  // Unit 4: Kebun Jagung (Poktan Sinar Tani)
  await prisma.kebun.upsert({
    where: { kd_kebun: "KBN-DANA-002" },
    update: {
      nama: "Poktan Sinar Tani",
      kd_kelompok: "PKT-DANA-004",
      kd_komoditas: "KBN-JAGUNG",
      jenisTanaman: "Jagung",
    },
    create: {
      kd_kebun: "KBN-DANA-002",
      nama: "Poktan Sinar Tani",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_kelompok: "PKT-DANA-004",
      kd_komoditas: "KBN-JAGUNG",
      namaPemilik: "Poktan Sinar Tani",
      jenisTanaman: "Jagung",
      tahunMulaiUsaha: 2024,
    },
  });

  // Unit 5: Kolam Lele (Pokdakan Lestari)
  await prisma.kolam.upsert({
    where: { kd_kolam: "KLM-DANA-002" },
    update: {
      nm_kolam: "Pokdakan Lestari",
      kd_kelompok: "PKT-DANA-005",
      kd_komoditas: "KLM-LELE",
      sistemBudidaya: "Lele",
    },
    create: {
      kd_kolam: "KLM-DANA-002",
      nm_kolam: "Pokdakan Lestari",
      status: "AKTIF",
      kd_desa,
      kd_kecamatan,
      kd_kelompok: "PKT-DANA-005",
      kd_komoditas: "KLM-LELE",
      namaPemilik: "Pokdakan Lestari",
      sistemBudidaya: "Lele",
      tahunMulaiUsaha: 2024,
    },
  });

  // 5. Masukkan Data Pendanaan ke Tabel Pendanaan DB
  // Record 1: Kelompok Tani Maju Bersama | Pertanian | Padi | 2025 | APBD | Rp 150.000.000
  const existingPk1 = await prisma.pendanaanKebun.findFirst({
    where: { kd_kebun: "KBN-DANA-001" },
  });
  if (!existingPk1) {
    await prisma.pendanaanKebun.create({
      data: {
        kd_kebun: "KBN-DANA-001",
        namaProgram: "Bantuan Sarana & Prasarana Tani Padi",
        sumberDana: "APBD_KABUPATEN",
        namaSumberDana: "APBD",
        tahunAnggaran: 2025,
        danaDiajukan: 150000000,
        danaDisetujui: 150000000,
        danaDicairkan: 150000000,
        status: "DICAIRKAN",
      },
    });
  }

  // Record 2: Pokdakan Sumber Rezeki | Perikanan | Budidaya Ikan Nila | 2025 | DAK | Rp 100.000.000
  const existingPl1 = await prisma.pendanaanKolam.findFirst({
    where: { kd_kolam: "KLM-DANA-001" },
  });
  if (!existingPl1) {
    await prisma.pendanaanKolam.create({
      data: {
        kd_kolam: "KLM-DANA-001",
        namaProgram: "Bantuan Budidaya Ikan Nila DAK",
        sumberDana: "BANTUAN_PEMERINTAH",
        namaSumberDana: "DAK",
        tahunAnggaran: 2025,
        danaDiajukan: 100000000,
        danaDisetujui: 100000000,
        danaDicairkan: 100000000,
        status: "DICAIRKAN",
      },
    });
  }

  // Record 3: Kelompok Ternak Harapan Jaya | Peternakan | Sapi Potong | 2025 | Dana Desa | Rp 75.000.000
  const existingPt1 = await prisma.pendanaanPeternakan.findFirst({
    where: { kd_peternakan: "TRN-DANA-001" },
  });
  if (!existingPt1) {
    await prisma.pendanaanPeternakan.create({
      data: {
        kd_peternakan: "TRN-DANA-001",
        namaProgram: "Program Ketahanan Pangan Ternak Sapi Dana Desa",
        sumberDana: "DANA_DESA",
        namaSumberDana: "Dana Desa",
        tahunAnggaran: 2025,
        danaDiajukan: 75000000,
        danaDisetujui: 75000000,
        danaDicairkan: 75000000,
        status: "DICAIRKAN",
      },
    });
  }

  // Record 4: Poktan Sinar Tani | Pertanian | Jagung | 2024 | APBD | Rp 120.000.000
  const existingPk2 = await prisma.pendanaanKebun.findFirst({
    where: { kd_kebun: "KBN-DANA-002" },
  });
  if (!existingPk2) {
    await prisma.pendanaanKebun.create({
      data: {
        kd_kebun: "KBN-DANA-002",
        namaProgram: "Bantuan Benih & Saprodi Jagung APBD",
        sumberDana: "APBD_KABUPATEN",
        namaSumberDana: "APBD",
        tahunAnggaran: 2024,
        danaDiajukan: 120000000,
        danaDisetujui: 120000000,
        danaDicairkan: 120000000,
        status: "DICAIRKAN",
      },
    });
  }

  // Record 5: Pokdakan Lestari | Perikanan | Lele | 2024 | DAK | Rp 90.000.000
  const existingPl2 = await prisma.pendanaanKolam.findFirst({
    where: { kd_kolam: "KLM-DANA-002" },
  });
  if (!existingPl2) {
    await prisma.pendanaanKolam.create({
      data: {
        kd_kolam: "KLM-DANA-002",
        namaProgram: "Bantuan Bibit & Kolam Terpal Lele DAK",
        sumberDana: "BANTUAN_PEMERINTAH",
        namaSumberDana: "DAK",
        tahunAnggaran: 2024,
        danaDiajukan: 90000000,
        danaDisetujui: 90000000,
        danaDicairkan: 90000000,
        status: "DICAIRKAN",
      },
    });
  }

  console.log("Successfully seeded pendanaan records into real database!");
}

main()
  .catch((err) => {
    console.error("Error seeding pendanaan:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
