const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function updateDesaCoordinates() {
  console.log('Fetching official coordinates data...');
  const res = await fetch('https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/12/wilayah_boundaries_kel_12.03.sql');
  const txt = await res.text();
  
  // Format regex: ('kode', 'nama', lat, lng,
  const matches = [...txt.matchAll(/\('([^']+)',\s*'([^']+)',\s*([0-9.-]+),\s*([0-9.-]+)/g)];
  console.log(`Parsed ${matches.length} coordinates from official dataset.`);

  const coordsMap = new Map();
  const backupData = [];

  for (const m of matches) {
    const kode = m[1].trim();
    const nama = m[2].trim();
    // Round to 7 decimal places for Prisma Decimal(10, 7)
    const lat = Number(parseFloat(m[3]).toFixed(7));
    const lng = Number(parseFloat(m[4]).toFixed(7));

    coordsMap.set(kode, { nama, lat, lng });
    backupData.push({ kode, nama, lat, lng });
  }

  // Save local JSON backup
  const backupDir = path.join(__dirname, '../data');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, 'koordinat_desa_tapsel.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`Saved local JSON backup to: ${backupFile}`);

  // Fetch all desas from DB
  const desas = await prisma.desa.findMany({
    select: { id: true, kd_desa: true, nm_desa: true }
  });
  console.log(`Found ${desas.length} desa in database.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const d of desas) {
    const coord = coordsMap.get(d.kd_desa);
    if (coord) {
      await prisma.desa.update({
        where: { id: d.id },
        data: {
          latitude: coord.lat,
          longitude: coord.lng
        }
      });
      updatedCount++;
    } else {
      console.warn(`[SKIP] No coordinate found for: ${d.kd_desa} - ${d.nm_desa}`);
      skippedCount++;
    }
  }

  console.log('============================================');
  console.log(`Successfully updated: ${updatedCount} desa`);
  console.log(`Skipped: ${skippedCount} desa`);
  console.log('============================================');

  // Verify
  const verifiedCount = await prisma.desa.count({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    }
  });
  console.log(`Verification: ${verifiedCount} of ${desas.length} desa now have valid coordinates.`);
}

updateDesaCoordinates()
  .catch(err => {
    console.error('Error updating coordinates:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
