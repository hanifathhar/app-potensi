const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai Seeding Data TANI TAPSEL...');

  // 1. Bersihkan data lama jika ada
  await prisma.siklusProduksi.deleteMany();
  await prisma.pendanaanKebun.deleteMany();
  await prisma.pendanaanKolam.deleteMany();
  await prisma.pendanaanPeternakan.deleteMany();
  await prisma.fotoKebun.deleteMany();
  await prisma.fotoKolam.deleteMany();
  await prisma.fotoPeternakan.deleteMany();
  await prisma.kebun.deleteMany();
  await prisma.kolam.deleteMany();
  await prisma.peternakan.deleteMany();
  await prisma.anggotaKelompok.deleteMany();
  await prisma.kelompokTani.deleteMany();
  await prisma.komoditas.deleteMany();
  await prisma.pengguna.deleteMany();
  await prisma.desa.deleteMany();
  await prisma.kecamatan.deleteMany();

  // 2. Data 15 Kecamatan di Kabupaten Tapanuli Selatan
  const dataKecamatan = [
    { kd_kecamatan: "1205", nm_kecamatan: "Sipirok" },
    { kd_kecamatan: "1203", nm_kecamatan: "Angkola Barat" },
    { kd_kecamatan: "1207", nm_kecamatan: "Angkola Timur" },
    { kd_kecamatan: "1210", nm_kecamatan: "Angkola Selatan" },
    { kd_kecamatan: "1214", nm_kecamatan: "Angkola Sangkunur" },
    { kd_kecamatan: "1204", nm_kecamatan: "Batang Toru" },
    { kd_kecamatan: "1212", nm_kecamatan: "Muara Batang Toru" },
    { kd_kecamatan: "1208", nm_kecamatan: "Marancar" },
    { kd_kecamatan: "1202", nm_kecamatan: "Sayur Matinggi" },
    { kd_kecamatan: "1206", nm_kecamatan: "Saipar Dolok Hole" },
    { kd_kecamatan: "1211", nm_kecamatan: "Aek Bilah" },
    { kd_kecamatan: "1209", nm_kecamatan: "Arse" },
    { kd_kecamatan: "1213", nm_kecamatan: "Tano Tombangan Angkola" },
    { kd_kecamatan: "1201", nm_kecamatan: "Batang Angkola" },
    { kd_kecamatan: "1215", nm_kecamatan: "Angkola Muara Tais" },
  ];

  for (const kec of dataKecamatan) {
    await prisma.kecamatan.create({ data: kec });
  }
  console.log(`✅ 15 Kecamatan Tapsel berhasil dibuat`);

  // 3. Data Desa Perwakilan dengan koordinat GPS realistis di Tapsel
  const dataDesa = [
    // Angkola Selatan (1210)
    { kd_desa: "1210001", nm_desa: "Sipange", kd_kecamatan: "1210", latitude: 1.3421, longitude: 99.2145 },
    { kd_desa: "1210002", nm_desa: "Simarpinggan", kd_kecamatan: "1210", latitude: 1.3120, longitude: 99.2450 },
    // Sipirok (1205)
    { kd_desa: "1205001", nm_desa: "Pagarbatu", kd_kecamatan: "1205", latitude: 1.6052, longitude: 99.2814 },
    { kd_desa: "1205002", nm_desa: "Pasar Sipirok", kd_kecamatan: "1205", latitude: 1.6120, longitude: 99.2780 },
    // Angkola Sangkunur (1214)
    { kd_desa: "1214001", nm_desa: "Siandang", kd_kecamatan: "1214", latitude: 1.4820, longitude: 98.9812 },
    { kd_desa: "1214002", nm_desa: "Simataniari", kd_kecamatan: "1214", latitude: 1.4650, longitude: 98.9950 },
    // Sayur Matinggi (1202)
    { kd_desa: "1202001", nm_desa: "Aek Batu", kd_kecamatan: "1202", latitude: 1.2850, longitude: 99.4210 },
    { kd_desa: "1202002", nm_desa: "Aek Libung", kd_kecamatan: "1202", latitude: 1.3021, longitude: 99.4121 },
    // Angkola Timur (1207)
    { kd_desa: "1207001", nm_desa: "Pargarutan", kd_kecamatan: "1207", latitude: 1.4350, longitude: 99.3120 },
    { kd_desa: "1207002", nm_desa: "Pargarutan Jae", kd_kecamatan: "1207", latitude: 1.4420, longitude: 99.3250 },
    // Arse (1209)
    { kd_desa: "1209001", nm_desa: "Arse Nauli", kd_kecamatan: "1209", latitude: 1.6820, longitude: 99.3520 },
    // Marancar (1208)
    { kd_desa: "1208001", nm_desa: "Pasar Sempurna", kd_kecamatan: "1208", latitude: 1.5420, longitude: 99.1850 },
    // Muara Batang Toru (1212)
    { kd_desa: "1212001", nm_desa: "Hurlang Muara Nauli", kd_kecamatan: "1212", latitude: 1.3950, longitude: 98.9210 },
    // Batang Toru (1204)
    { kd_desa: "1204001", nm_desa: "Aek Pahu", kd_kecamatan: "1204", latitude: 1.5120, longitude: 99.0450 },
    // Angkola Barat (1203)
    { kd_desa: "1203001", nm_desa: "Sitinjak", kd_kecamatan: "1203", latitude: 1.3850, longitude: 99.1950 },
  ];

  for (const d of dataDesa) {
    await prisma.desa.create({ data: d });
  }
  console.log(`✅ ${dataDesa.length} Desa sampel berhasil dibuat`);

  // 4. Pengguna & Hak Akses
  const defaultPassword = await bcrypt.hash("password123", 10);
  const users = [
    {
      nama: "Admin Kabupaten Dinas Pertanian",
      username: "admin",
      email: "admin.pertanian@tapselkab.go.id",
      passwordHash: defaultPassword,
      peran: "ADMIN_KABUPATEN",
      aktif: true,
    },
    {
      nama: "Superadministrator Sistem",
      username: "superadmin",
      email: "superadmin@tapselkab.go.id",
      passwordHash: defaultPassword,
      peran: "SUPERADMIN",
      aktif: true,
    },
    {
      nama: "Koordinator BPP Sipirok",
      username: "admin_sipirok",
      email: "bpp.sipirok@tapselkab.go.id",
      passwordHash: defaultPassword,
      peran: "ADMIN_KECAMATAN",
      kd_kecamatan: "1205",
      aktif: true,
    },
    {
      nama: "Petugas Lapangan Penyuluh",
      username: "petugas",
      email: "ppl.lapangan@tapselkab.go.id",
      passwordHash: defaultPassword,
      peran: "PETUGAS",
      kd_kecamatan: "1210",
      kd_desa: "1210001",
      aktif: true,
    },
    {
      nama: "Ketua Kelompok Tani Harapan Maju",
      username: "poktan_maju",
      email: "poktan.maju@gmail.com",
      passwordHash: defaultPassword,
      peran: "KELOMPOK_TANI",
      kd_kecamatan: "1210",
      kd_desa: "1210001",
      aktif: true,
    },
  ];

  for (const u of users) {
    await prisma.pengguna.create({ data: u });
  }
  console.log(`✅ ${users.length} Akun Pengguna Role-Based dibuat`);

  // 5. Komoditas Unggulan Tapsel
  const komoditasList = [
    // KEBUN
    { kd_komoditas: "KBN-JAGUNG", nm_komoditas: "Jagung Hibrida", jenisUsaha: "KEBUN", satuanDefault: "Kg", urutan: 1 },
    { kd_komoditas: "KBN-KOPI", nm_komoditas: "Kopi Arabika Sipirok", jenisUsaha: "KEBUN", satuanDefault: "Kg", urutan: 2 },
    { kd_komoditas: "KBN-PADI", nm_komoditas: "Padi Sawah", jenisUsaha: "KEBUN", satuanDefault: "Ton", urutan: 3 },
    { kd_komoditas: "KBN-SALAK", nm_komoditas: "Salak Sibakkua", jenisUsaha: "KEBUN", satuanDefault: "Kg", urutan: 4 },
    { kd_komoditas: "KBN-KARET", nm_komoditas: "Karet Alam", jenisUsaha: "KEBUN", satuanDefault: "Kg", urutan: 5 },
    { kd_komoditas: "KBN-SAWIT", nm_komoditas: "Kelapa Sawit", jenisUsaha: "KEBUN", satuanDefault: "Ton", urutan: 6 },
    // KOLAM
    { kd_komoditas: "KLM-NILA", nm_komoditas: "Ikan Nila", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 1 },
    { kd_komoditas: "KLM-MAS", nm_komoditas: "Ikan Mas", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 2 },
    { kd_komoditas: "KLM-LELE", nm_komoditas: "Ikan Lele", jenisUsaha: "KOLAM", satuanDefault: "Kg", urutan: 3 },
    { kd_komoditas: "KLM-GURAMI", nm_komoditas: "Ikan Gurami", jenisUsaha: "KOLAM", satuanDefault: "Kg", urutan: 4 },
    // PETERNAKAN
    { kd_komoditas: "TRN-SAPI", nm_komoditas: "Sapi Potong", jenisUsaha: "PETERNAKAN", satuanDefault: "Ekor", urutan: 1 },
    { kd_komoditas: "TRN-KERBAU", nm_komoditas: "Kerbau Lumpur", jenisUsaha: "PETERNAKAN", satuanDefault: "Ekor", urutan: 2 },
    { kd_komoditas: "TRN-KAMBING", nm_komoditas: "Kambing / Domba", jenisUsaha: "PETERNAKAN", satuanDefault: "Ekor", urutan: 3 },
    { kd_komoditas: "TRN-AYAM", nm_komoditas: "Ayam Broiler / Petelur", jenisUsaha: "PETERNAKAN", satuanDefault: "Ekor", urutan: 4 },
  ];

  for (const k of komoditasList) {
    await prisma.komoditas.create({ data: k });
  }
  console.log(`✅ ${komoditasList.length} Komoditas Pertanian, Perikanan, Peternakan dibuat`);

  // 6. Kelompok Tani
  const poktanList = [
    {
      kd_kelompok: "PKT-1210-001",
      nm_kelompok: "Poktan Harapan Maju",
      kd_kecamatan: "1210",
      kd_desa: "1210001",
      namaKetua: "H. Syamsir Siregar",
      noTelepon: "081263451122",
      alamat: "Desa Sipange, Angkola Selatan",
      jumlahAnggota: 28,
      tahunBerdiri: 2018,
      status: "AKTIF",
    },
    {
      kd_kelompok: "PKT-1205-001",
      nm_kelompok: "Poktan Kopi Sipirok Lestari",
      kd_kecamatan: "1205",
      kd_desa: "1205001",
      namaKetua: "Maradoli Harahap",
      noTelepon: "081375224499",
      alamat: "Desa Pagarbatu, Sipirok",
      jumlahAnggota: 35,
      tahunBerdiri: 2015,
      status: "AKTIF",
    },
    {
      kd_kelompok: "PKT-1214-001",
      nm_kelompok: "Poktan Mina Danau Siais",
      kd_kecamatan: "1214",
      kd_desa: "1214001",
      namaKetua: "Baharuddin Pulungan",
      noTelepon: "085270119933",
      alamat: "Desa Siandang, Angkola Sangkunur",
      jumlahAnggota: 22,
      tahunBerdiri: 2020,
      status: "AKTIF",
    },
    {
      kd_kelompok: "PKT-1202-001",
      nm_kelompok: "Poktan Lembu Barokah",
      kd_kecamatan: "1202",
      kd_desa: "1202001",
      namaKetua: "Zulkifli Nasution",
      noTelepon: "082166443311",
      alamat: "Desa Aek Batu, Sayur Matinggi",
      jumlahAnggota: 19,
      tahunBerdiri: 2019,
      status: "AKTIF",
    },
    {
      kd_kelompok: "PKT-1207-001",
      nm_kelompok: "Poktan Tani Sejahtera Pargarutan",
      kd_kecamatan: "1207",
      kd_desa: "1207001",
      namaKetua: "Amiruddin Pane",
      noTelepon: "081299887766",
      alamat: "Desa Pargarutan, Angkola Timur",
      jumlahAnggota: 25,
      tahunBerdiri: 2017,
      status: "AKTIF",
    },
  ];

  for (const pkt of poktanList) {
    await prisma.kelompokTani.create({ data: pkt });
  }
  console.log(`✅ ${poktanList.length} Kelompok Tani dibuat`);

  // 7. Data Kebun / Usaha Pertanian
  const kebun1 = await prisma.kebun.create({
    data: {
      kd_kebun: "KBN-1210-001",
      nama: "Kebun Jagung Poktan Harapan Maju",
      status: "AKTIF",
      kd_desa: "1210001",
      kd_kecamatan: "1210",
      kd_kelompok: "PKT-1210-001",
      kd_komoditas: "KBN-JAGUNG",
      namaPemilik: "Syamsir Siregar",
      alamatLokasi: "Desa Sipange, Kec. Angkola Selatan",
      latitude: 1.3421,
      longitude: 99.2145,
      luasLahanHa: 1.5,
      tahunTanam: 2024,
      sistemTanam: "Monokultur Jajar Legowo",
      kondisiTanaman: "Sangat Baik (Menjelang Panen)",
      statusLahan: "Milik Sendiri",
      deskripsi: "Kebun jagung hibrida binaan Dinas Pertanian Kab. Tapsel",
    },
  });

  const kebun2 = await prisma.kebun.create({
    data: {
      kd_kebun: "KBN-1205-001",
      nama: "Kebun Kopi Arabika Pagarbatu",
      status: "AKTIF",
      kd_desa: "1205001",
      kd_kecamatan: "1205",
      kd_kelompok: "PKT-1205-001",
      kd_komoditas: "KBN-KOPI",
      namaPemilik: "Maradoli Harahap",
      alamatLokasi: "Lereng Tor Sibohi, Desa Pagarbatu, Sipirok",
      latitude: 1.6052,
      longitude: 99.2814,
      luasLahanHa: 3.2,
      jumlahPohon: 4200,
      tahunTanam: 2021,
      sistemTanam: "Agroforestri Naungan Gamal",
      kondisiTanaman: "Produktif",
      statusLahan: "Tanah Ulayat / Milik Warga",
      deskripsi: "Kopi Arabika specialty Sipirok cita rasa khas rempah fruity",
    },
  });

  // 8. Data Kolam / Usaha Perikanan
  const kolam1 = await prisma.kolam.create({
    data: {
      kd_kolam: "KLM-1214-001",
      nm_kolam: "Kolam Ikan Nila Siandang",
      status: "AKTIF",
      kd_desa: "1214001",
      kd_kecamatan: "1214",
      kd_kelompok: "PKT-1214-001",
      kd_komoditas: "KLM-NILA",
      namaPemilik: "Baharuddin Pulungan",
      alamatLokasi: "Dusun Danau Siais, Desa Siandang",
      latitude: 1.4820,
      longitude: 98.9812,
      jenisKolam: "Kolam Tanah Aliran Air Deras",
      luasKolamM2: 1200,
      jumlahKolam: 4,
      kedalamanKolamM: 1.2,
      sumberAir: "Aliran Danau Siais",
      sistemBudidaya: "Semi Intensif",
      kapasitasBenih: 15000,
      satuanBenih: "Ekor",
      kondisiKolam: "Baik",
      deskripsi: "Budidaya Ikan Nila Hitam & Merah dengan sirkulasi alami",
    },
  });

  const kolam2 = await prisma.kolam.create({
    data: {
      kd_kolam: "KLM-1202-001",
      nm_kolam: "Kolam Ikan Mas & Nila Aek Libung",
      status: "AKTIF",
      kd_desa: "1202002",
      kd_kecamatan: "1202",
      kd_komoditas: "KLM-MAS",
      namaPemilik: "H. Ridwan Ritonga",
      alamatLokasi: "Desa Aek Libung, Kec. Sayur Matinggi",
      latitude: 1.3021,
      longitude: 99.4121,
      jenisKolam: "Kolam Beton & Terpal",
      luasKolamM2: 850,
      jumlahKolam: 6,
      kedalamanKolamM: 1.5,
      sumberAir: "Mata Air Pegunungan Tor Lubuk Raya",
      sistemBudidaya: "Bioflok & Alir",
      kapasitasBenih: 10000,
      satuanBenih: "Ekor",
      kondisiKolam: "Sangat Baik",
    },
  });

  // 9. Data Peternakan
  const ternak1 = await prisma.peternakan.create({
    data: {
      kd_peternakan: "TRN-1202-001",
      nm_peternakan: "Peternakan Sapi Lembu Barokah",
      status: "AKTIF",
      kd_desa: "1202001",
      kd_kecamatan: "1202",
      kd_kelompok: "PKT-1202-001",
      kd_komoditas: "TRN-SAPI",
      namaPemilik: "Zulkifli Nasution",
      alamatLokasi: "Desa Aek Batu, Kec. Sayur Matinggi",
      latitude: 1.2850,
      longitude: 99.4210,
      jenisTernak: "Sapi Simental & Limosin",
      jenisKandang: "Kandang Koloni Terbuka Beratap Seng",
      jumlahKandang: 3,
      jumlahTernak: 45,
      satuanTernak: "Ekor",
      kapasitasKandang: 60,
      sistemPemeliharaan: "Intensif Penggemukan (Feedlot)",
      sumberPakan: "Rumput Gajah, Konsentrat & Silase Jagung",
      kondisiKandang: "Bersih dan Bersertifikat Bebas PMK",
      deskripsi: "Sentra penggemukan sapi potong Idul Adha & konsumsi harian",
    },
  });

  const ternak2 = await prisma.peternakan.create({
    data: {
      kd_peternakan: "TRN-1207-001",
      nm_peternakan: "Kandang Domba & Kambing Pargarutan",
      status: "AKTIF",
      kd_desa: "1207001",
      kd_kecamatan: "1207",
      kd_kelompok: "PKT-1207-001",
      kd_komoditas: "TRN-KAMBING",
      namaPemilik: "Amiruddin Pane",
      alamatLokasi: "Desa Pargarutan, Angkola Timur",
      latitude: 1.4350,
      longitude: 99.3120,
      jenisTernak: "Kambing Peranakan Etawa & Domba Garut",
      jenisKandang: "Panggung Kayu/Bambu",
      jumlahKandang: 2,
      jumlahTernak: 68,
      satuanTernak: "Ekor",
      kapasitasKandang: 80,
      sistemPemeliharaan: "Semi Intensif",
      sumberPakan: "Rambatan Hijauan & Ampas Tahu",
      kondisiKandang: "Baik",
    },
  });

  // 10. Siklus Produksi (Sesuai dengan Tabel Mockup)
  const siklusData = [
    {
      kd_siklus: "SKL-2025-001",
      jenisUsaha: "KEBUN",
      namaSiklus: "Panen Jagung Hibrida Musim 1",
      tahapKegiatan: "Panen",
      tanggalMulai: new Date("2025-01-15"),
      tanggalTargetPanen: new Date("2025-04-12"),
      estimasiProduksi: 4200,
      satuanProduksi: "Kg",
      status: "BERJALAN",
      kd_kebun: kebun1.kd_kebun,
      catatan: "Sesuai tabel mockup: Jagung | Desa Sipange | Panen | 12 Apr 2025 | Berjalan",
    },
    {
      kd_siklus: "SKL-2025-002",
      jenisUsaha: "KEBUN",
      namaSiklus: "Penanaman Bibit Kopi Arabika Baru",
      tahapKegiatan: "Tanam",
      tanggalMulai: new Date("2025-04-20"),
      tanggalTargetPanen: new Date("2027-08-15"),
      estimasiProduksi: 1800,
      satuanProduksi: "Kg Green Bean",
      status: "PERENCANAAN",
      kd_kebun: kebun2.kd_kebun,
      catatan: "Sesuai tabel mockup: Kopi | Desa Pagarbatu | Tanam | 20 Apr 2025 | Terjadwal",
    },
    {
      kd_siklus: "SKL-2025-003",
      jenisUsaha: "KOLAM",
      namaSiklus: "Tebar Benih Ikan Nila Periode II",
      tahapKegiatan: "Tebar Benih",
      tanggalMulai: new Date("2025-04-25"),
      tanggalTargetPanen: new Date("2025-08-25"),
      estimasiProduksi: 3500,
      satuanProduksi: "Kg",
      status: "PERENCANAAN",
      kd_kolam: kolam1.kd_kolam,
      catatan: "Sesuai tabel mockup: Ikan Nila | Desa Siandang | Tebar Benih | 25 Apr 2025 | Terjadwal",
    },
    {
      kd_siklus: "SKL-2025-004",
      jenisUsaha: "PETERNAKAN",
      namaSiklus: "Pemeriksaan Kesehatan Berkala & Vaksinasi Sapi",
      tahapKegiatan: "Pemeriksaan",
      tanggalMulai: new Date("2025-04-28"),
      tanggalTargetPanen: new Date("2025-06-10"),
      estimasiProduksi: 45,
      satuanProduksi: "Ekor Siap Jual",
      status: "BERJALAN",
      kd_peternakan: ternak1.kd_peternakan,
      catatan: "Sesuai tabel mockup: Sapi | Desa Aek Batu | Pemeriksaan | 28 Apr 2025 | Berjalan",
    },
  ];

  for (const s of siklusData) {
    await prisma.siklusProduksi.create({ data: s });
  }
  console.log(`✅ ${siklusData.length} Siklus Produksi & Panen dibuat`);

  // 11. Pendanaan & Bantuan (Sesuai Tabel Mockup)
  await prisma.pendanaanKebun.create({
    data: {
      kd_kebun: kebun1.kd_kebun,
      namaProgram: "Program Pertanian Maju",
      sumberDana: "APBD_KABUPATEN",
      namaSumberDana: "Dinas Pertanian Tapanuli Selatan",
      tahunAnggaran: 2025,
      nomorUsulan: "DPA/PERT/2025/082",
      danaDiajukan: 2500000000,
      danaDisetujui: 2500000000,
      danaDicairkan: 1750000000, // 70%
      status: "DICAIRKAN",
      keterangan: "Bantuan alsintan traktor roda 2, benih jagung hibrida, dan pupuk subsidi",
    },
  });

  await prisma.pendanaanKolam.create({
    data: {
      kd_kolam: kolam1.kd_kolam,
      namaProgram: "Bantuan Kolam Ikan",
      sumberDana: "APBD_PROVINSI",
      namaSumberDana: "Dinas Kelautan dan Perikanan Prov. Sumut",
      tahunAnggaran: 2025,
      nomorUsulan: "BANT/DKP/2025/11",
      danaDiajukan: 1200000000,
      danaDisetujui: 1200000000,
      danaDicairkan: 540000000, // 45%
      status: "DISETUJUI",
      keterangan: "Pengadaan indukan nila unggul dan perbaikan tanggul kolam Danau Siais",
    },
  });

  await prisma.pendanaanPeternakan.create({
    data: {
      kd_peternakan: ternak1.kd_peternakan,
      namaProgram: "Program Peternakan",
      sumberDana: "APBN",
      namaSumberDana: "Kementerian Pertanian Ditjen Peternakan",
      tahunAnggaran: 2025,
      nomorUsulan: "PROP/DITJEN-PKH/2025/03",
      danaDiajukan: 1800000000,
      danaDisetujui: 1800000000,
      danaDicairkan: 1080000000, // 60%
      status: "DISETUJUI",
      keterangan: "Sentra integrasi sapi-sawit dan pengembangan hijauan pakan ternak",
    },
  });

  await prisma.pendanaanKebun.create({
    data: {
      kd_kebun: kebun2.kd_kebun,
      namaProgram: "Dana Desa Ketahanan Pangan",
      sumberDana: "DANA_DESA",
      namaSumberDana: "APBDes Pagarbatu",
      tahunAnggaran: 2025,
      nomorUsulan: "DESA/PGB/KETAPANG/01",
      danaDiajukan: 500000000,
      danaDisetujui: 500000000,
      danaDicairkan: 400000000, // 80%
      status: "DICAIRKAN",
      keterangan: "Pemberdayaan petani kopi lokal dan sarana penjemuran solar dryer",
    },
  });
  console.log(`✅ 4 Program Pendanaan & Bantuan dibuat`);

  // 12. Foto Kegiatan Lapangan
  await prisma.fotoKebun.create({
    data: {
      kd_kebun: kebun1.kd_kebun,
      jenisFoto: "TANAMAN",
      judul: "Hamparan Kebun Jagung Siap Panen",
      url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
      namaFile: "kebun_jagung_sipange.jpg",
      keterangan: "Dokumentasi kebun jagung Poktan Harapan Maju di Desa Sipange",
      utama: true,
    },
  });

  await prisma.fotoKebun.create({
    data: {
      kd_kebun: kebun2.kd_kebun,
      jenisFoto: "LOKASI",
      judul: "Kegiatan Kelompok Tani di Desa Pargarutan",
      url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
      namaFile: "poktan_pargarutan.jpg",
      keterangan: "Dokumentasi kegiatan kelompok tani di Desa Pargarutan",
      utama: true,
    },
  });

  await prisma.fotoKolam.create({
    data: {
      kd_kolam: kolam2.kd_kolam,
      jenisFoto: "KOLAM",
      judul: "Kolam Ikan Aek Libung",
      url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
      namaFile: "kolam_aek_libung.jpg",
      keterangan: "Kolam Ikan Desa Aek Libung - Kec. Sayur Matinggi (1.3021°N, 99.4121°E)",
      utama: true,
    },
  });

  await prisma.fotoPeternakan.create({
    data: {
      kd_peternakan: ternak1.kd_peternakan,
      jenisFoto: "TERNAK",
      judul: "Kandang Sapi Lembu Barokah Aek Batu",
      url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80",
      namaFile: "kandang_sapi_aek_batu.jpg",
      keterangan: "Pemberian pakan konsentrat sapi potong di Desa Aek Batu",
      utama: true,
    },
  });
  console.log(`✅ Foto-foto dokumentasi kegiatan lapangan berhasil dibuat`);

  console.log('🎉 SEEDING SELESAI DENGAN SUKSES!');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
