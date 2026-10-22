const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const res = await fetch('https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/12/wilayah_boundaries_kel_12.03.sql');
  const txt = await res.text();
  const matches = [...txt.matchAll(/\('([^']+)',\s*'([^']+)',\s*([0-9.-]+),\s*([0-9.-]+)/g)];
  
  const mapSql = new Map();
  matches.forEach(m => {
    mapSql.set(m[1], { nama: m[2], lat: parseFloat(m[3]), lng: parseFloat(m[4]) });
  });

  const desas = await prisma.desa.findMany({
    include: { kecamatan: true }
  });
  let matched = 0;
  let missing = [];

  for (const d of desas) {
    if (mapSql.has(d.kd_desa)) {
      matched++;
    } else {
      missing.push(d);
    }
  }

  console.log('Total desa in DB:', desas.length);
  console.log('Total in SQL:', mapSql.size);
  console.log('Exact kd_desa matched:', matched);
  if (missing.length > 0) {
    console.log('Missing in SQL:', missing.map(m => `${m.kd_desa} - ${m.nm_desa}`));
  } else {
    console.log('SUCCESS! 100% of desas matched by kd_desa!');
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
