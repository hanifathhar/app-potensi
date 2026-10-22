const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  console.log("=== VERIFIKASI DATA PETERNAKAN DI DATABASE ===");

  const totalPeternakan = await prisma.peternakan.count();
  console.log(`Total Peternakan: ${totalPeternakan}`);

  const totalTernak = await prisma.peternakan.aggregate({
    _sum: { jumlahTernak: true },
  });
  console.log(`Total Populasi Ayam Layer: ${totalTernak._sum.jumlahTernak} Ekor`);

  const list = await prisma.peternakan.findMany({
    orderBy: { kd_peternakan: "asc" },
    include: {
      kecamatan: true,
      desa: true,
      kelompokTani: true,
      komoditas: true,
      pendanaan: true,
      siklus: true,
    },
  });

  console.log("\nDaftar Data Peternakan yang Berhasil Masuk:");
  for (const item of list) {
    console.log(
      `${item.kd_peternakan} | ${item.nm_peternakan.padEnd(42)} | ${item.desa.nm_desa.padEnd(22)}, ${item.kecamatan.nm_kecamatan.padEnd(18)} | Poktan: ${item.kd_kelompok} (${item.kelompokTani?.nm_kelompok}) | Lat/Lng: ${item.latitude}, ${item.longitude}`
    );
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
