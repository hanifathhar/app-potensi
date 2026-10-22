const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const kecamatans = await prisma.kecamatan.findMany({
    orderBy: { nm_kecamatan: "asc" }
  });
  console.log(`Total Kecamatan: ${kecamatans.length}`);
  console.log(kecamatans.map(k => ({ kd: k.kd_kecamatan, nm: k.nm_kecamatan })));

  const desas = await prisma.desa.findMany({
    include: { kecamatan: true },
    orderBy: { nm_desa: "asc" }
  });
  console.log(`\nTotal Desa: ${desas.length}`);

  const komoditas = await prisma.komoditas.findMany({
    where: { jenisUsaha: "KOLAM" }
  });
  console.log(`\nKomoditas Kolam/Ikan:`);
  console.log(komoditas.map(k => ({ kd: k.kd_komoditas, nm: k.nm_komoditas })));

  const totalKolam = await prisma.kolam.count();
  console.log(`\nTotal Kolam saat ini: ${totalKolam}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
