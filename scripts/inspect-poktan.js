const xlsx = require('xlsx');
const path = require('path');
const filePath = path.join('DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx');
const wb = xlsx.readFile(filePath);

function cleanKelompok(str) {
  return str.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
}

function parseAnggota(raw) {
  if (!raw || raw === '-') return 1;
  if (typeof raw === 'number') return raw;
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

function parseTahun(raw) {
  if (!raw || raw === '-') return 2026;
  if (typeof raw === 'number') return raw;
  const match = String(raw).match(/\d{4}/);
  return match ? parseInt(match[0]) : 2026;
}

const map = new Map();

wb.SheetNames.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const clean = cleanKelompok(String(r[3] || ''));
    const desa = String(r[2] || '').trim();
    const kec = String(r[1] || '').trim();
    const ketuaRaw = String(r[4] || '').trim();
    const ketua = (ketuaRaw && ketuaRaw !== '-') ? ketuaRaw : clean;
    const anggota = parseAnggota(r[5]);
    const tahun = parseTahun(r[6]);
    const key = `${kec}_${desa}_${clean.toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, {
        kec,
        desa,
        nm_kelompok: clean,
        namaKetua: ketua,
        jumlahAnggota: anggota,
        tahunBerdiri: tahun,
        sheets: [sheetName],
        rows: [`${sheetName} #${r[0]}`]
      });
    } else {
      const existing = map.get(key);
      existing.sheets.push(sheetName);
      existing.rows.push(`${sheetName} #${r[0]}`);
      // Jika sebelumnya belum punya tahun/anggota lengkap, perbarui
      if (anggota > existing.jumlahAnggota) existing.jumlahAnggota = anggota;
      if (existing.namaKetua === existing.nm_kelompok && ketua !== clean) existing.namaKetua = ketua;
    }
  }
});

console.log('Total unique kelompok tani:', map.size);
let idx = 1;
for (const [key, val] of map.entries()) {
  console.log(`${idx++}. [${val.nm_kelompok}] | Ketua: ${val.namaKetua} | Anggota: ${val.jumlahAnggota} | Thn: ${val.tahunBerdiri} | Kec: ${val.kec} | Desa: ${val.desa} | Sources: ${val.rows.join(', ')}`);
}
