import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [kebun, kolam, ternak, poktan, siklus, pendanaan] = await Promise.all([
    prisma.kebun.count(),
    prisma.kolam.count(),
    prisma.peternakan.count(),
    prisma.kelompokTani.count(),
    prisma.siklusProduksi.count(),
    prisma.pendanaanKebun.count(),
  ]);

  console.log("=== DATA TANI TAPSEL STATS ===");
  console.log("Kebun Pertanian:", kebun);
  console.log("Kolam Perikanan:", kolam);
  console.log("Peternakan:", ternak);
  console.log("Kelompok Tani:", poktan);
  console.log("Siklus Produksi:", siklus);
  console.log("Program Pendanaan:", pendanaan);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
