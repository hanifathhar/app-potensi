const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  console.log("=== HASIL STANDARISASI KD_KELOMPOK ===");

  const totalPoktan = await prisma.kelompokTani.count();
  const kebunWithPoktan = await prisma.kebun.count({ where: { kd_kelompok: { not: null } } });
  const kolamWithPoktan = await prisma.kolam.count({ where: { kd_kelompok: { not: null } } });
  const totalAnggota = await prisma.anggotaKelompok.count();

  console.log(`- Total Kelompok Tani: ${totalPoktan}`);
  console.log(`- Kebun terhubung ke Kelompok Tani: ${kebunWithPoktan}`);
  console.log(`- Kolam terhubung ke Kelompok Tani: ${kolamWithPoktan}`);
  console.log(`- Anggota terhubung ke Kelompok Tani: ${totalAnggota}`);

  // Cek apakah ada format yang tidak sesuai regex ^PKT-\d{4}-\d{3}$
  const allPoktans = await prisma.kelompokTani.findMany({
    orderBy: { kd_kelompok: "asc" },
  });

  const invalidCodes = allPoktans.filter((p) => !/^PKT-\d{4}-\d{3}$/.test(p.kd_kelompok));
  console.log(`- Kode tidak berformat PKT-YYYY-NNN: ${invalidCodes.length}`);

  // Ringkasan per tahun
  const summaryYear = {};
  for (const p of allPoktans) {
    const yr = p.kd_kelompok.split("-")[1];
    summaryYear[yr] = (summaryYear[yr] || 0) + 1;
  }
  console.log("\nRekap Kelompok Tani per Tahun:");
  for (const [yr, cnt] of Object.entries(summaryYear)) {
    console.log(`  Tahun ${yr}: ${cnt} kelompok (PKT-${yr}-001 s/d PKT-${yr}-${String(cnt).padStart(3, "0")})`);
  }

  // Sampel Kebun terhubung
  console.log("\n--- Sampel Relasi di Tabel Kebun ---");
  const sampleKebuns = await prisma.kebun.findMany({
    where: { kd_kelompok: { not: null } },
    take: 5,
    include: { kelompokTani: true },
  });
  for (const k of sampleKebuns) {
    console.log(`${k.kd_kebun} (${k.nama.padEnd(30)}) -> kd_kelompok: ${k.kd_kelompok} (${k.kelompokTani?.nm_kelompok})`);
  }

  // Sampel Kolam terhubung
  console.log("\n--- Sampel Relasi di Tabel Kolam ---");
  const sampleKolams = await prisma.kolam.findMany({
    where: { kd_kelompok: { not: null } },
    take: 5,
    include: { kelompokTani: true },
  });
  for (const kl of sampleKolams) {
    console.log(`${kl.kd_kolam} (${kl.nm_kolam.padEnd(30)}) -> kd_kelompok: ${kl.kd_kelompok} (${kl.kelompokTani?.nm_kelompok})`);
  }

  // Sampel Anggota terhubung
  console.log("\n--- Sampel Relasi di Tabel Anggota Kelompok ---");
  const sampleAnggotas = await prisma.anggotaKelompok.findMany({
    take: 5,
    include: { kelompokTani: true },
  });
  for (const a of sampleAnggotas) {
    console.log(`${a.nama.padEnd(25)} (${a.jabatan || "-"}) -> kd_kelompok: ${a.kd_kelompok} (${a.kelompokTani?.nm_kelompok})`);
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
