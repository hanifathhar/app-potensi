import { PrismaClient, BidangSPM, RolePengguna, StatusPengaduan, JenisDokumen, JenisPeristiwa, TahapVerifikasi } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding data SPM, Wilayah, Posyandu, dan Pengaduan...");

  // 1. SEED WILAYAH KECAMATAN
  const kecamatans = [
    { kd_kecamatan: "12.03.01", nm_kecamatan: "Angkola Barat" },
    { kd_kecamatan: "12.03.02", nm_kecamatan: "Batang Toru" },
    { kd_kecamatan: "12.03.03", nm_kecamatan: "Sipirok" },
    { kd_kecamatan: "12.03.04", nm_kecamatan: "Angkola Timur" },
  ];

  for (const kec of kecamatans) {
    await prisma.kecamatan.upsert({
      where: { kd_kecamatan: kec.kd_kecamatan },
      update: { nm_kecamatan: kec.nm_kecamatan, aktif: true },
      create: { kd_kecamatan: kec.kd_kecamatan, nm_kecamatan: kec.nm_kecamatan, aktif: true },
    });
  }
  console.log("✅ Kecamatan berhasil disematkan.");

  // 2. SEED DESA
  const desas = [
    // Angkola Barat
    { kd_desa: "12.03.01.2001", nm_desa: "Sitinjak", kd_kecamatan: "12.03.01" },
    { kd_desa: "12.03.01.2002", nm_desa: "Sibangkua", kd_kecamatan: "12.03.01" },
    { kd_desa: "12.03.01.2003", nm_desa: "Parsalakan", kd_kecamatan: "12.03.01" },
    // Batang Toru
    { kd_desa: "12.03.02.2001", nm_desa: "Aek Pahu", kd_kecamatan: "12.03.02" },
    { kd_desa: "12.03.02.2002", nm_desa: "Hapesong Baru", kd_kecamatan: "12.03.02" },
    // Sipirok
    { kd_desa: "12.03.03.2001", nm_desa: "Pasar Sipirok", kd_kecamatan: "12.03.03" },
    { kd_desa: "12.03.03.2002", nm_desa: "Baringin", kd_kecamatan: "12.03.03" },
    // Angkola Timur
    { kd_desa: "12.03.04.2001", nm_desa: "Pargarutan", kd_kecamatan: "12.03.04" },
  ];

  for (const d of desas) {
    await prisma.desa.upsert({
      where: { kd_desa: d.kd_desa },
      update: { nm_desa: d.nm_desa, kd_kecamatan: d.kd_kecamatan, aktif: true },
      create: { kd_desa: d.kd_desa, nm_desa: d.nm_desa, kd_kecamatan: d.kd_kecamatan, aktif: true },
    });
  }
  console.log("✅ Desa berhasil disematkan.");

  // 3. SEED POSYANDU
  const posyandus = [
    { nama_posyandu: "Posyandu Mawar I", alamat: "Dusun I, Sitinjak", kd_desa: "12.03.01.2001", kd_kecamatan: "12.03.01" },
    { nama_posyandu: "Posyandu Mawar II", alamat: "Dusun II, Sitinjak", kd_desa: "12.03.01.2001", kd_kecamatan: "12.03.01" },
    { nama_posyandu: "Posyandu Melati Indah", alamat: "Jalan Lintas Sibangkua", kd_desa: "12.03.01.2002", kd_kecamatan: "12.03.01" },
    { nama_posyandu: "Posyandu Cempaka Sehat", alamat: "Balai Desa Parsalakan", kd_desa: "12.03.01.2003", kd_kecamatan: "12.03.01" },
    { nama_posyandu: "Posyandu Kenanga Berseri", alamat: "Jl. Poros Aek Pahu", kd_desa: "12.03.02.2001", kd_kecamatan: "12.03.02" },
    { nama_posyandu: "Posyandu Anggrek Sipirok", alamat: "Kompleks Pasar Sipirok", kd_desa: "12.03.03.2001", kd_kecamatan: "12.03.03" },
  ];

  for (const pos of posyandus) {
    await prisma.posyandu.upsert({
      where: {
        nama_posyandu_kd_desa: {
          nama_posyandu: pos.nama_posyandu,
          kd_desa: pos.kd_desa,
        },
      },
      update: { alamat: pos.alamat, kd_kecamatan: pos.kd_kecamatan, aktif: true },
      create: {
        nama_posyandu: pos.nama_posyandu,
        alamat: pos.alamat,
        kd_desa: pos.kd_desa,
        kd_kecamatan: pos.kd_kecamatan,
        aktif: true,
      },
    });
  }
  console.log("✅ Posyandu berhasil disematkan.");

  // 4. SEED 6 BIDANG SPM & JENIS PENGADUAN
  const masterSPM: {
    kode: BidangSPM;
    nm_bidang: string;
    deskripsi: string;
    jenis: { nama: string; deskripsi: string }[];
  }[] = [
    {
      kode: BidangSPM.KESEHATAN,
      nm_bidang: "Kesehatan (Posyandu & Layanan Dasar)",
      deskripsi: "Pelayanan kesehatan ibu & anak, pemantauan gizi, pencegahan stunting, serta imunisasi di Posyandu.",
      jenis: [
        { nama: "Gizi Kurang & Balita Stunting", deskripsi: "Pelaporan balita berisiko stunting atau kekurangan asupan gizi yang membutuhkan PMT." },
        { nama: "Layanan & Fasilitas Posyandu", deskripsi: "Keluhan terkait timbangan, alat ukur antropometri, dan ketersediaan vitamin/imunisasi." },
        { nama: "Kesehatan Ibu Hamil (Bumil KEK)", deskripsi: "Ibu hamil kurang energi kronis atau tidak terpantau oleh nakes/kader." },
        { nama: "Pelayanan Rujukan Kesehatan", deskripsi: "Kendala akses BPJS PBI atau rujukan kesehatan dari posyandu/puskesmas." },
      ],
    },
    {
      kode: BidangSPM.SOSIAL,
      nm_bidang: "Sosial & Perlindungan Keluarga",
      deskripsi: "Bantuan perlindungan sosial, verifikasi data kemiskinan, lansia terlantar, dan disabilitas.",
      jenis: [
        { nama: "Bantuan Sosial Tidak Tepat Sasaran", deskripsi: "Laporan warga tidak mampu yang belum terdata dalam DTKS/penerima bantuan." },
        { nama: "Lansia & Penyandang Disabilitas Terlantar", deskripsi: "Penanganan lansia tunggal atau disabilitas yang membutuhkan perlindungan sosial." },
        { nama: "Kedaruratan & Bencana Sosial", deskripsi: "Keluarga korban musibah yang membutuhkan bantuan logistik darurat." },
      ],
    },
    {
      kode: BidangSPM.PENDIDIKAN,
      nm_bidang: "Pendidikan",
      deskripsi: "Jaminan hak belajar, anak putus sekolah, bantuan biaya pendidikan dan seragam bagi keluarga pra-sejahtera.",
      jenis: [
        { nama: "Anak Usia Sekolah Putus Sekolah", deskripsi: "Anak usia 7-18 tahun yang tidak dapat melanjutkan sekolah karena keterbatasan biaya." },
        { nama: "Bantuan Perlengkapan Belajar", deskripsi: "Kendala seragam, buku, dan akses bantuan Program Indonesia Pintar (PIP)." },
      ],
    },
    {
      kode: BidangSPM.PEKERJAAN_UMUM,
      nm_bidang: "Pekerjaan Umum & Air Bersih",
      deskripsi: "Penyediaan akses air minum aman, sanitasi jamban sehat, drainase pemukiman, dan jalan desa.",
      jenis: [
        { nama: "Akses Air Minum Tidak Layak/Kering", deskripsi: "Krisis sumber air bersih atau kerusakan instalasi air perpipaan desa." },
        { nama: "Sanitasi & Jamban Tidak Sehat", deskripsi: "Keluarga belum memiliki jamban sehat yang berdampak pada kesehatan lingkungan balita." },
        { nama: "Drainase Tergenang & Akses Jalan Rusak", deskripsi: "Jalan menuju posyandu/fasilitas umum rusak atau saluran air tersumbat." },
      ],
    },
    {
      kode: BidangSPM.PERUMAHAN_RAKYAT,
      nm_bidang: "Perumahan Rakyat (RTLH)",
      deskripsi: "Rehabilitasi rumah tidak layak huni, lantai tanah, atap bocor, dan ventilasi tidak sehat bagi masyarakat miskin.",
      jenis: [
        { nama: "Usulan Bedah Rumah Tidak Layak Huni", deskripsi: "Kondisi rumah membahayakan penghuni balita/lansia dengan konstruksi rapuh." },
        { nama: "Kerusakan Rumah Akibat Bencana", deskripsi: "Rumah warga rusak tertimpa pohon, longsor, atau angin puting beliung." },
      ],
    },
    {
      kode: BidangSPM.TRANTIBUM_LINMAS,
      nm_bidang: "Ketenteraman, Ketertiban Umum & Linmas",
      deskripsi: "Pencegahan gangguan ketenteraman lingkungan warga, kekerasan dalam rumah tangga, dan perlindungan anak.",
      jenis: [
        { nama: "Perlindungan Perempuan dan Anak", deskripsi: "Pengaduan indikasi penelantaran anak atau kekerasan fisik/psikis keluarga." },
        { nama: "Gangguan Keamanan & Ketenteraman Lingkungan", deskripsi: "Gangguan ketertiban umum di lingkungan pemukiman desa." },
      ],
    },
  ];

  for (const b of masterSPM) {
    const bidang = await prisma.bidang.upsert({
      where: { kode: b.kode },
      update: { nm_bidang: b.nm_bidang, deskripsi: b.deskripsi, aktif: true },
      create: { kode: b.kode, nm_bidang: b.nm_bidang, deskripsi: b.deskripsi, aktif: true },
    });

    for (const j of b.jenis) {
      await prisma.jenisPengaduan.upsert({
        where: {
          bidangId_nama: {
            bidangId: bidang.id,
            nama: j.nama,
          },
        },
        update: { deskripsi: j.deskripsi, aktif: true },
        create: {
          bidangId: bidang.id,
          nama: j.nama,
          deskripsi: j.deskripsi,
          aktif: true,
        },
      });
    }
  }
  console.log("✅ 6 Bidang SPM dan Jenis Pengaduan berhasil disematkan.");

  // 5. SEED PENGGUNA DEFAULT
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const usersToCreate = [
    {
      username: "superadmin",
      nama: "Super Administrator SPM",
      role: RolePengguna.SUPERADMIN,
      password: hashedPassword,
    },
    {
      username: "admin_kabupaten",
      nama: "Admin Dinsos/Dinkes Kabupaten",
      role: RolePengguna.ADMIN_KABUPATEN,
      password: hashedPassword,
    },
    {
      username: "admin_angkola_barat",
      nama: "Kasi Kessos Kec. Angkola Barat",
      role: RolePengguna.ADMIN_KECAMATAN,
      kecamatanId: "12.03.01",
      password: hashedPassword,
    },
    {
      username: "kader_sitinjak",
      nama: "Kader Posyandu Desa Sitinjak",
      role: RolePengguna.ADMIN_DESA,
      kecamatanId: "12.03.01",
      desaId: "12.03.01.2001",
      password: hashedPassword,
    },
  ];

  for (const u of usersToCreate) {
    await prisma.pengguna.upsert({
      where: { username: u.username },
      update: { nama: u.nama, role: u.role, aktif: true },
      create: u,
    });
  }
  console.log("✅ Pengguna default berhasil dibuat (password: admin123).");

  // 6. SEED DUMMY PENGADUAN & DOKUMEN UNTUK PENGUJIAN
  const sampleDesa = await prisma.desa.findFirst({ where: { kd_desa: "12.03.01.2001" } });
  const samplePosyandu = await prisma.posyandu.findFirst({ where: { kd_desa: "12.03.01.2001" } });
  const sampleBidangKesehatan = await prisma.bidang.findFirst({ where: { kode: BidangSPM.KESEHATAN } });
  const sampleJenisKesehatan = await prisma.jenisPengaduan.findFirst({ where: { bidangId: sampleBidangKesehatan!.id } });
  const sampleBidangSosial = await prisma.bidang.findFirst({ where: { kode: BidangSPM.SOSIAL } });
  const sampleJenisSosial = await prisma.jenisPengaduan.findFirst({ where: { bidangId: sampleBidangSosial!.id } });

  // Pelapor Dummy 1
  const pelapor1 = await prisma.pelapor.upsert({
    where: { nik: "1203010101900001" },
    update: {
      nama: "Ibu Rahmawati Daulay",
      alamat: "Dusun I Desa Sitinjak, Kec. Angkola Barat",
      noHp: "081263457890",
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
    },
    create: {
      nama: "Ibu Rahmawati Daulay",
      nik: "1203010101900001",
      alamat: "Dusun I Desa Sitinjak, Kec. Angkola Barat",
      noHp: "081263457890",
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
    },
  });

  // Pengaduan Dummy 1 (Menunggu Verifikasi Desa)
  const pengaduan1 = await prisma.pengaduan.upsert({
    where: { nomorPengaduan: "SPM-20261015-0001" },
    update: {},
    create: {
      nomorPengaduan: "SPM-20261015-0001",
      tokenPelacakan: "TRK-7A9B2C",
      pelaporId: pelapor1.id,
      bidangId: sampleBidangKesehatan!.id,
      jenisPengaduan: {
        connect: [{ id: sampleJenisKesehatan!.id }],
      },
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
      posyanduId: samplePosyandu!.id,
      deskripsi: "Balita atas nama Fatih (usia 18 bulan) mengalami penurunan berat badan drastis selama 3 bulan berturut-turut di Posyandu Mawar I. Membutuhkan intervensi makanan pendamping ASI dan pemeriksaan dokter spesialis anak.",
      status: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
      riwayatStatus: {
        create: {
          peristiwa: JenisPeristiwa.PENGADUAN_DIBUAT,
          statusSebelum: null,
          statusSesudah: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
          keterangan: "Pengaduan didaftarkan secara online oleh masyarakat.",
        },
      },
      dokumen: {
        create: [
          {
            jenis: JenisDokumen.KTP,
            namaFile: "ktp-rahmawati.jpg",
            pathFile: "/uploads/ktp-dummy.png",
          },
          {
            jenis: JenisDokumen.KARTU_KELUARGA,
            namaFile: "kk-rahmawati.pdf",
            pathFile: "/uploads/kk-dummy.png",
          },
        ],
      },
    },
  });

  // Pelapor Dummy 2
  const pelapor2 = await prisma.pelapor.upsert({
    where: { nik: "1203010202850002" },
    update: {
      nama: "Bapak Hasan Siregar",
      alamat: "Dusun II, Desa Sitinjak, Kec. Angkola Barat",
      noHp: "085298765432",
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
    },
    create: {
      nama: "Bapak Hasan Siregar",
      nik: "1203010202850002",
      alamat: "Dusun II, Desa Sitinjak, Kec. Angkola Barat",
      noHp: "085298765432",
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
    },
  });

  // Pengaduan Dummy 2 (Sedang Ditindaklanjuti)
  const pengaduan2 = await prisma.pengaduan.upsert({
    where: { nomorPengaduan: "SPM-20261015-0002" },
    update: {},
    create: {
      nomorPengaduan: "SPM-20261015-0002",
      tokenPelacakan: "TRK-9X4F1Z",
      pelaporId: pelapor2.id,
      bidangId: sampleBidangSosial!.id,
      jenisPengaduan: {
        connect: [{ id: sampleJenisSosial!.id }],
      },
      kd_kecamatan: "12.03.01",
      kd_desa: "12.03.01.2001",
      posyanduId: samplePosyandu!.id,
      deskripsi: "Keluarga lansia miskin sebatang kara di Dusun II belum pernah menerima bantuan PKH/Bansos apapun dan membutuhkan peninjauan langsung.",
      status: StatusPengaduan.DITINDAKLANJUTI,
      tanggalDisetujui: new Date(),
      riwayatStatus: {
        create: [
          {
            peristiwa: JenisPeristiwa.PENGADUAN_DIBUAT,
            statusSebelum: null,
            statusSesudah: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
            keterangan: "Pengaduan didaftarkan secara online.",
          },
          {
            peristiwa: JenisPeristiwa.VERIFIKASI,
            statusSebelum: StatusPengaduan.MENUNGGU_VERIFIKASI_DESA,
            statusSesudah: StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN,
            keterangan: "Verifikasi lapangan disetujui oleh Kepala Desa Sitinjak.",
          },
          {
            peristiwa: JenisPeristiwa.STATUS_DIUBAH,
            statusSebelum: StatusPengaduan.MENUNGGU_VERIFIKASI_KECAMATAN,
            statusSesudah: StatusPengaduan.DITINDAKLANJUTI,
            keterangan: "Diteruskan ke Dinas Sosial untuk penjadwalan kunjungan rumah.",
          },
        ],
      },
      verifikasi: {
        create: {
          penggunaId: (await prisma.pengguna.findUnique({ where: { username: "kader_sitinjak" } }))!.id,
          tahap: TahapVerifikasi.DESA,
          keputusan: "DISETUJUI",
          catatan: "Kondisi rumah dan lansia telah dicek oleh kader desa, data valid.",
        },
      },
    },
  });

  console.log("✅ Contoh pengaduan uji coba berhasil dibuat:");
  console.log(`   1. Nomor: ${pengaduan1.nomorPengaduan} | Token: ${pengaduan1.tokenPelacakan}`);
  console.log(`   2. Nomor: ${pengaduan2.nomorPengaduan} | Token: ${pengaduan2.tokenPelacakan}`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
