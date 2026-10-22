const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== MEMULAI STANDARISASI KD_KELOMPOK ===");

  const allPoktans = await prisma.kelompokTani.findMany({
    orderBy: [
      { tahunBerdiri: "asc" },
      { nm_kelompok: "asc" },
      { createdAt: "asc" },
    ],
  });

  console.log(`Ditemukan ${allPoktans.length} kelompok tani.`);

  const countersPerYear = {};
  const updates = [];

  for (const p of allPoktans) {
    const tahun = p.tahunBerdiri || 2026;
    countersPerYear[tahun] = (countersPerYear[tahun] || 0) + 1;
    const noUrut = countersPerYear[tahun];
    const newKd = `PKT-${tahun}-${String(noUrut).padStart(3, "0")}`;

    updates.push({
      id: p.id,
      oldKd: p.kd_kelompok,
      tempKd: `TEMP-${p.id}`,
      newKd: newKd,
      tahunBerdiri: tahun,
      nm_kelompok: p.nm_kelompok,
    });
  }

  console.log("\nDistribusi Per Tahun Berdiri:");
  for (const [thn, cnt] of Object.entries(countersPerYear)) {
    console.log(`- Tahun ${thn}: ${cnt} kelompok (PKT-${thn}-001 s/d PKT-${thn}-${String(cnt).padStart(3, "0")})`);
  }

  console.log("\nMenjalankan proses pembaruan dalam transaksi database...");

  await prisma.$transaction(
    async (tx) => {
      // Fase 1: Ubah ke temporary key untuk mencegah duplicate key violation saat re-indexing
      console.log("Fase 1: Memberikan temporary key...");
      for (const u of updates) {
        await tx.kelompokTani.update({
          where: { id: u.id },
          data: {
            kd_kelompok: u.tempKd,
            tahunBerdiri: u.tahunBerdiri,
          },
        });
      }

      // Fase 2: Terapkan kode standar baru (PKT-YYYY-NNN)
      console.log("Fase 2: Menerapkan kode standar PKT-[Tahun]-[NoUrut]...");
      for (const u of updates) {
        await tx.kelompokTani.update({
          where: { id: u.id },
          data: {
            kd_kelompok: u.newKd,
          },
        });
      }
    },
    { timeout: 60000 }
  );

  console.log("Transaksi selesai dengan sukses!");

  // Verifikasi hasil
  console.log("\n=== VERIFIKASI HASIL DI DATABASE ===");
  const totalPoktan = await prisma.kelompokTani.count();
  const kebunWithPoktan = await prisma.kebun.count({ where: { kd_kelompok: { not: null } } });
  const kolamWithPoktan = await prisma.kolam.count({ where: { kd_kelompok: { not: null } } });
  const totalAnggota = await prisma.anggotaKelompok.count();


  console.log(`- Total Kelompok Tani: ${totalPoktan}`);
  console.log(`- Kebun terhubung ke Kelompok Tani: ${kebunWithPoktan}`);
  console.log(`- Kolam terhubung ke Kelompok Tani: ${kolamWithPoktan}`);
  console.log(`- Anggota terhubung ke Kelompok Tani: ${anggotaWithPoktan}`);

  // Sampel Kebun
  const sampleKebun = await prisma.kebun.findFirst({
    where: { kd_kelompok: { not: null } },
    include: { kelompokTani: true },
  });
  console.log("\nSampel Kebun terhubung:");
  console.log(`Kebun: ${sampleKebun.kd_kebun} (${sampleKebun.nama}) -> Kelompok: ${sampleKebun.kd_kelompok} (${sampleKebun.kelompokTani?.nm_kelompok})`);

  // Sampel Kolam
  const sampleKolam = await prisma.kolam.findFirst({
    where: { kd_kelompok: { not: null } },
    include: { kelompokTani: true },
  });
  console.log("\nSampel Kolam terhubung:");
  console.log(`Kolam: ${sampleKolam.kd_kolam} (${sampleKolam.nm_kolam}) -> Kelompok: ${sampleKolam.kd_kelompok} (${sampleKolam.kelompokTani?.nm_kelompok})`);

  console.log("\n=== STANDARISASI SELESAI DENGAN SUKSES ===");
}

main()
  .catch((e) => {
    console.error("Terjadi error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
