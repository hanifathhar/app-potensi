const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectData() {
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

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  console.log('--- SAMPLE 10 MATCHES ---');
  for (let i = 0; i < 10; i++) {
    const d = desas[i];
    const s = mapSql.get(d.kd_desa);
    console.log(`[${d.kd_desa}] DB: "${d.nm_desa}" (${d.kecamatan?.nm_kecamatan}) <--> SQL: "${s.nama}" | lat: ${s.lat}, lng: ${s.lng}`);
  }

  for (const d of desas) {
    const s = mapSql.get(d.kd_desa);
    if (s.lat < minLat) minLat = s.lat;
    if (s.lat > maxLat) maxLat = s.lat;
    if (s.lng < minLng) minLng = s.lng;
    if (s.lng > maxLng) maxLng = s.lng;
  }

  console.log('--- BOUNDING BOX ---');
  console.log(`Latitude range: ${minLat} to ${maxLat}`);
  console.log(`Longitude range: ${minLng} to ${maxLng}`);
}

inspectData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
