const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.desa.count();
  const withCoords = await prisma.desa.count({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    }
  });
  const sample = await prisma.desa.findMany({
    take: 5,
    include: { kecamatan: true }
  });
  console.log('Total desa:', total);
  console.log('Desa with coords:', withCoords);
  console.log('Sample:', JSON.stringify(sample, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
