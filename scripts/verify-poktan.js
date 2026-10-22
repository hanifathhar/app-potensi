const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const poktanCount = await prisma.kelompokTani.count();
  const kolamCount = await prisma.kolam.count();
  const linkedKolamCount = await prisma.kolam.count({ where: { kd_kelompok: { not: null } } });

  console.log('Total Kelompok Tani in DB:', poktanCount);
  console.log('Total Kolam in DB:', kolamCount);
  console.log('Total Kolam with kd_kelompok linked:', linkedKolamCount);

  const multiKolam = await prisma.kelompokTani.findMany({
    where: {
      kolam: { some: {} }
    },
    include: {
      kecamatan: true,
      desa: true,
      kolam: { select: { kd_kolam: true, nm_kolam: true } }
    }
  });

  const multiple = multiKolam.filter(p => p.kolam.length > 1);
  console.log('\nKelompok Tani yang menerima multi-bantuan (APBD & Provinsi):');
  multiple.forEach(m => {
    console.log(`- [${m.kd_kelompok}] ${m.nm_kelompok} (${m.desa.nm_desa}): ${m.kolam.length} kolam -> ${m.kolam.map(k => k.kd_kolam).join(', ')}`);
  });

  console.log('\nContoh 5 data Kelompok Tani pertama:');
  multiKolam.slice(0, 5).forEach(p => {
    console.log({
      kd: p.kd_kelompok,
      nama: p.nm_kelompok,
      ketua: p.namaKetua,
      anggota: p.jumlahAnggota,
      tahun: p.tahunBerdiri,
      kec: p.kecamatan.nm_kecamatan,
      desa: p.desa.nm_desa,
      kolamCount: p.kolam.length
    });
  });
}

verify().finally(() => prisma.$disconnect());
