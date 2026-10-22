const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Pengguna count:', await prisma.pengguna.count());
  console.log('Kecamatan count:', await prisma.kecamatan.count());
  console.log('Desa count:', await prisma.desa.count());
  console.log('KelompokTani count:', await prisma.kelompokTani.count());
  console.log('Komoditas count:', await prisma.komoditas.count());
  console.log('Kebun count:', await prisma.kebun.count());
  console.log('Kolam count:', await prisma.kolam.count());
  console.log('Peternakan count:', await prisma.peternakan.count());
  console.log('Siklus count:', await prisma.siklusProduksi.count());
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
