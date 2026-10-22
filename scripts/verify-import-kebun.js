const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  const count = await prisma.kebun.count();
  console.log("Total Kebun in DB:", count);

  const sumLuas = await prisma.kebun.aggregate({
    _sum: { luasLahanHa: true },
  });
  console.log("Total Luas Lahan Kebun in DB (Ha):", Number(sumLuas._sum.luasLahanHa).toFixed(4));

  const totalPendanaan = await prisma.pendanaanKebun.count();
  console.log("Total Pendanaan Kebun:", totalPendanaan);

  const totalSiklus = await prisma.siklusProduksi.count({ where: { jenisUsaha: "KEBUN" } });
  console.log("Total Siklus Produksi Kebun:", totalSiklus);

  const totalPoktan = await prisma.kelompokTani.count();
  console.log("Total Kelompok Tani in DB:", totalPoktan);

  const sample = await prisma.kebun.findFirst({
    where: { kd_kebun: "KBN-2026-001" },
    include: {
      kecamatan: true,
      desa: true,
      kelompokTani: true,
      komoditas: true,
      pendanaan: true,
      siklus: true,
    },
  });
  console.log("\n--- Sample Kebun KBN-2026-001 ---");
  console.log(JSON.stringify(sample, null, 2));

  const sampleKUR = await prisma.kebun.findFirst({
    where: { kd_kebun: "KBN-2026-300" },
    include: {
      kecamatan: true,
      desa: true,
      kelompokTani: true,
      komoditas: true,
      pendanaan: true,
      siklus: true,
    },
  });
  console.log("\n--- Sample Kebun KBN-2026-300 (KUR) ---");
  console.log(JSON.stringify(sampleKUR, null, 2));

  // Breakdown per Kecamatan
  const byKec = await prisma.kebun.groupBy({
    by: ["kd_kecamatan"],
    _count: { id: true },
    _sum: { luasLahanHa: true },
  });

  const kecs = await prisma.kecamatan.findMany();
  console.log("\n--- Rekap Kebun Jagung per Kecamatan ---");
  for (const b of byKec) {
    const k = kecs.find((item) => item.kd_kecamatan === b.kd_kecamatan);
    console.log(
      `${(k ? k.nm_kecamatan : b.kd_kecamatan).padEnd(25)} : ${String(b._count.id).padStart(3)} titik kebun | Luas: ${Number(b._sum.luasLahanHa).toFixed(2)} Ha`
    );
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
