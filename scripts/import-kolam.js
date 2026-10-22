const xlsx = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function cleanName(str) {
  if (!str) return "";
  return str
    .replace(/^desa\s+/i, "")
    .replace(/^kelurahan\s+/i, "")
    .replace(/^kel\.\s+/i, "")
    .replace(/^ds\.\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const DESA_ALIASES = {
  "PAL ELEVEN": "PALL XI",
  "PALL XI": "PALL XI",
  "PARGARUTAN TOGA": "PARGARUTAN TONGA",
  "AEK GADOL": "AEK NGADOL SITINJAK",
  "PINTU PADANG 1": "PINTU PADANG I",
  "JANJIMANAON": "JANJI MANAON",
  "PASAR PARGARUTAN": "PASAR PARGARUTAN",
};

function parseCoord(raw) {
  if (!raw || typeof raw !== "string") return { lat: null, lng: null };
  const str = raw.trim();
  // Regex format DMS: e.g. 1,18'12.669N 99,19'23.244E
  const dmsMatch = str.match(
    /([0-9]+)[,\.]([0-9]+)['’]([0-9\.]+)"?\s*N\s+([0-9]+)[,\.]([0-9]+)['’]([0-9\.]+)"?\s*E/i
  );
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const lat = latDeg + latMin / 60 + latSec / 3600;

    const lngDeg = parseFloat(dmsMatch[4]);
    const lngMin = parseFloat(dmsMatch[5]);
    const lngSec = parseFloat(dmsMatch[6]);
    const lng = lngDeg + lngMin / 60 + lngSec / 3600;
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  // Regex format Decimal: e.g. 1,2747N 99,1841E or 1.220184N 99.38012E
  const decMatch = str.match(
    /([0-9]+)[,\.]([0-9]+)\s*N\s+([0-9]+)[,\.]([0-9]+)\s*E/i
  );
  if (decMatch) {
    const lat = parseFloat(decMatch[1] + "." + decMatch[2]);
    const lng = parseFloat(decMatch[3] + "." + decMatch[4]);
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  return { lat: null, lng: null };
}

function parseNumber(val) {
  if (val === undefined || val === null || val === "" || val === "-") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, ".").replace(/[^0-9\.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function ensureKomoditas() {
  const koms = [
    { kd_komoditas: "KLM-NILA", nm_komoditas: "Ikan Nila", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 1 },
    { kd_komoditas: "KLM-MAS", nm_komoditas: "Ikan Mas", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 2 },
    { kd_komoditas: "KLM-LELE", nm_komoditas: "Ikan Lele", jenisUsaha: "KOLAM", satuanDefault: "Kg", urutan: 3 },
    { kd_komoditas: "KLM-GURAMI", nm_komoditas: "Ikan Gurami", jenisUsaha: "KOLAM", satuanDefault: "Kg", urutan: 4 },
    { kd_komoditas: "KLM-JURUNG", nm_komoditas: "Ikan Jurung", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 5 },
    { kd_komoditas: "KLM-BAUNG", nm_komoditas: "Ikan Baung", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 6 },
    { kd_komoditas: "KLM-TAWES", nm_komoditas: "Ikan Tawes", jenisUsaha: "KOLAM", satuanDefault: "Ekor/Kg", urutan: 7 },
  ];
  for (const k of koms) {
    await prisma.komoditas.upsert({
      where: { kd_komoditas: k.kd_komoditas },
      update: {},
      create: k,
    });
  }
}

async function main() {
  await ensureKomoditas();

  const filePath = path.join(
    __dirname,
    "..",
    "DAFTAR  NAMA-NAMA  PENERIMA BANTUAN BIBIT IKAN, INDUK IKAN, DAN PAKAN IKAN SUMBER DANA APBD Tahun 2026 (1) (1).xlsx"
  );
  const workbook = xlsx.readFile(filePath);

  const masterKec = await prisma.kecamatan.findMany();
  const masterDesa = await prisma.desa.findMany({
    include: { kecamatan: true },
  });
  const poktans = await prisma.kelompokTani.findMany();

  console.log("Memulai import data kolam dari Excel...");

  let counter = 1;
  let totalImported = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let jenisSumberDana = "APBD_KABUPATEN";
    let programName = "Bantuan Bibit Ikan, Induk Ikan, dan Pakan Ikan APBD 2026";
    if (sheetName === "APBN") {
      jenisSumberDana = "APBN";
      programName = "Bantuan Bibit Ikan dan Pakan Ikan APBN 2026";
    } else if (sheetName === "Bantuan Provinsi") {
      jenisSumberDana = "APBD_PROVINSI";
      programName = "Bantuan Bibit & Induk Ikan Lele serta Pakan APBD Provinsi 2026";
    }

    console.log(`\n--- Memproses Sheet: ${sheetName} ---`);

    for (let i = 7; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;

      const no = r[0];
      const kecRaw = String(r[1] || "").trim();
      const desaRaw = String(r[2] || "").trim();
      const namaKelompokRaw = String(r[3] || "").trim();
      const ketuaRaw = String(r[4] || "").trim();
      const jumlahAnggota = String(r[5] || "").trim();
      const tahunBentuk = parseInt(r[6]) || 2026;

      // Normalisasi Kecamatan & Desa
      let cleanKec = cleanName(kecRaw)
        .replace("ANGKOA", "ANGKOLA")
        .replace("SAYUR MATINGGI", "SAYURMATINGGI");

      let cleanD = cleanName(desaRaw);
      if (DESA_ALIASES[cleanD]) {
        cleanD = DESA_ALIASES[cleanD];
      }

      if (cleanD === "SITUMBA JULU") {
        cleanKec = "SIPIROK";
      }

      const matchedKec = masterKec.find((k) => {
        const n = cleanName(k.nm_kecamatan).replace("SAYUR MATINGGI", "SAYURMATINGGI");
        return n === cleanKec;
      });

      if (!matchedKec) {
        console.error(`Error: Kecamatan tidak cocok untuk sheet ${sheetName} baris ${no}: ${kecRaw}`);
        continue;
      }

      let matchedDesa = masterDesa.find((d) => {
        if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
        return cleanName(d.nm_desa) === cleanD;
      });

      if (!matchedDesa) {
        matchedDesa = masterDesa.find((d) => {
          if (d.kd_kecamatan !== matchedKec.kd_kecamatan) return false;
          const n = cleanName(d.nm_desa);
          return n.includes(cleanD) || cleanD.includes(n);
        });
      }

      if (!matchedDesa) {
        console.error(`Error: Desa tidak cocok untuk sheet ${sheetName} baris ${no}: ${desaRaw} di ${matchedKec.nm_kecamatan}`);
        continue;
      }

      // Kode Kolam
      const kdKolam = `KLM-2026-${String(counter).padStart(3, "0")}`;
      counter++;

      // Data Teknis Kolam & Bantuan Berdasarkan Sheet
      let jumlahKolam = 1;
      let luasKolamM2 = 0;
      let benihMas = 0;
      let benihNila = 0;
      let benihLele = 0;
      let benihGurami = 0;
      let benihJurung = 0;
      let benihBaung = 0;
      let benihTawes = 0;
      let indukLele = 0;
      let kolamBundar = 0;
      let pakan = 0;
      let pakanUnit = "Zak";
      let jumlahTebar = 0;
      let coordRaw = "";
      let tglPenebaran = "";
      let tglMonev = "";
      let ketMonev = "";
      let sumberDanaRaw = "";

      if (sheetName === "APBD") {
        jumlahKolam = parseNumber(r[7]) || parseNumber(r[10]) || 1;
        const luasRaw = String(r[11] || "").trim();
        if (luasRaw.toLowerCase().includes("km")) {
          luasKolamM2 = 1000; // Asumsi perairan umum / lubuk larangan 1 km
        } else {
          luasKolamM2 = parseNumber(r[11]);
        }
        benihMas = parseNumber(r[12]);
        benihNila = parseNumber(r[13]);
        benihLele = parseNumber(r[14]);
        benihGurami = parseNumber(r[15]);
        benihJurung = parseNumber(r[16]);
        benihBaung = parseNumber(r[17]);
        benihTawes = parseNumber(r[18]);
        kolamBundar = parseNumber(r[19]);
        pakan = parseNumber(r[20]);
        jumlahTebar = parseNumber(r[21]);
        coordRaw = String(r[22] || "");
        tglPenebaran = String(r[23] || "").trim();
        tglMonev = String(r[24] || "").trim();
        ketMonev = String(r[26] || "").trim();
        sumberDanaRaw = String(r[27] || "APBD").trim();
      } else if (sheetName === "APBN") {
        jumlahKolam = parseNumber(r[7]) || 1;
        // Luas di APBN dalam satuan Ha
        const luasHa = parseNumber(r[11]);
        luasKolamM2 = luasHa > 0 ? luasHa * 10000 : 0;
        benihMas = parseNumber(r[12]);
        benihNila = parseNumber(r[13]);
        benihLele = parseNumber(r[14]);
        benihGurami = parseNumber(r[15]);
        benihJurung = parseNumber(r[16]);
        benihBaung = parseNumber(r[17]);
        benihTawes = parseNumber(r[18]);
        kolamBundar = parseNumber(r[19]);
        pakan = parseNumber(r[20]);
        jumlahTebar = parseNumber(r[21]);
        coordRaw = String(r[22] || "");
        tglPenebaran = String(r[23] || "").trim();
        tglMonev = String(r[24] || "").trim();
        ketMonev = String(r[26] || "").trim();
        sumberDanaRaw = String(r[27] || "APBN").trim();
      } else if (sheetName === "Bantuan Provinsi") {
        jumlahKolam = parseNumber(r[7]) || parseNumber(r[10]) || 1;
        luasKolamM2 = parseNumber(r[11]);
        benihLele = parseNumber(r[12]);
        indukLele = parseNumber(r[13]);
        const mesinPakan = parseNumber(r[14]);
        pakan = parseNumber(r[15]);
        pakanUnit = "Kg";
        jumlahTebar = parseNumber(r[16]);
        coordRaw = String(r[17] || "");
        tglPenebaran = String(r[18] || "").trim();
        tglMonev = String(r[19] || "").trim();
        ketMonev = String(r[21] || "").trim();
        sumberDanaRaw = String(r[22] || "APBD Provinsi").trim();
      }

      // Tentukan Komoditas Utama (dari bibit terbanyak)
      const benihList = [
        { kd: "KLM-NILA", jml: benihNila },
        { kd: "KLM-MAS", jml: benihMas },
        { kd: "KLM-LELE", jml: benihLele + indukLele },
        { kd: "KLM-GURAMI", jml: benihGurami },
        { kd: "KLM-JURUNG", jml: benihJurung },
        { kd: "KLM-BAUNG", jml: benihBaung },
        { kd: "KLM-TAWES", jml: benihTawes },
      ];
      benihList.sort((a, b) => b.jml - a.jml);
      const kdKomoditas = benihList[0].jml > 0 ? benihList[0].kd : "KLM-NILA";

      // Parse Koordinat
      const { lat, lng } = parseCoord(coordRaw);

      // Jenis Kolam
      let jenisKolam = "Kolam Air Tenang (Tanah/Semen)";
      if (kolamBundar > 0) {
        jenisKolam = "Kolam Bundar Terpal (Bioflok)";
      } else if (namaKelompokRaw.toLowerCase().includes("lubuk larangan") || namaKelompokRaw.toLowerCase().includes("pokmaswas")) {
        jenisKolam = "Lubuk Larangan / Perairan Umum";
      }

      // Rincian Bantuan
      const rincianBantuan = [];
      if (benihNila > 0) rincianBantuan.push(`Benih Ikan Nila: ${benihNila.toLocaleString()} ekor`);
      if (benihMas > 0) rincianBantuan.push(`Benih Ikan Mas: ${benihMas.toLocaleString()} ekor`);
      if (benihLele > 0) rincianBantuan.push(`Benih Ikan Lele: ${benihLele.toLocaleString()} ekor`);
      if (indukLele > 0) rincianBantuan.push(`Induk Ikan Lele: ${indukLele.toLocaleString()} ekor`);
      if (benihGurami > 0) rincianBantuan.push(`Benih Ikan Gurami: ${benihGurami.toLocaleString()} ekor`);
      if (benihJurung > 0) rincianBantuan.push(`Benih Ikan Jurung: ${benihJurung.toLocaleString()} ekor`);
      if (benihBaung > 0) rincianBantuan.push(`Benih Ikan Baung: ${benihBaung.toLocaleString()} ekor`);
      if (benihTawes > 0) rincianBantuan.push(`Benih Ikan Tawes: ${benihTawes.toLocaleString()} ekor`);
      if (pakan > 0) rincianBantuan.push(`Pakan: ${pakan.toLocaleString()} ${pakanUnit}`);
      if (kolamBundar > 0) rincianBantuan.push(`Kolam Bundar: ${kolamBundar} unit`);

      // Deskripsi
      let deskripsi = `Penerima Bantuan ${sumberDanaRaw} Tahun 2026.`;
      if (jumlahAnggota && jumlahAnggota !== "-") {
        deskripsi += ` Jumlah Anggota: ${jumlahAnggota}.`;
      }
      if (rincianBantuan.length > 0) {
        deskripsi += ` Bantuan yang diberikan: ${rincianBantuan.join(", ")}.`;
      }
      if (tglPenebaran) {
        deskripsi += ` Tanggal Penebaran: ${tglPenebaran}.`;
      }
      if (ketMonev) {
        deskripsi += ` Hasil Monitoring & Evaluasi: ${ketMonev}.`;
      }

      const catatan = `Sumber Dana: ${sumberDanaRaw} 2026. Koordinat Lapangan: ${coordRaw.trim() || "-"}. Jadwal Monev: ${tglMonev || "-"}.`;

      // Nama Pemilik
      const namaPemilik = ketuaRaw && ketuaRaw !== "-" ? ketuaRaw : namaKelompokRaw;

      // Cek apakah ada kelompok tani yang cocok di database
      let kdKelompok = null;
      const cleanPoktanName = cleanName(namaKelompokRaw).replace(/^(POKDADAN|POKDAKAN|POKMASWAS)\s+/i, "");
      const matchedPoktan = poktans.find(
        (p) =>
          p.kd_desa === matchedDesa.kd_desa &&
          cleanName(p.nm_kelompok).includes(cleanPoktanName)
      );
      if (matchedPoktan) {
        kdKelompok = matchedPoktan.kd_kelompok;
      }

      // Simpan ke Tabel Kolam
      const createdKolam = await prisma.kolam.upsert({
        where: { kd_kolam: kdKolam },
        update: {
          nm_kolam: namaKelompokRaw,
          status: "AKTIF",
          kd_kecamatan: matchedKec.kd_kecamatan,
          kd_desa: matchedDesa.kd_desa,
          kd_komoditas: kdKomoditas,
          kd_kelompok: kdKelompok,
          namaPemilik: namaPemilik,
          alamatLokasi: `Desa ${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
          latitude: lat,
          longitude: lng,
          jenisKolam: jenisKolam,
          jumlahKolam: jumlahKolam,
          luasKolamM2: luasKolamM2,
          kapasitasBenih: jumlahTebar > 0 ? jumlahTebar : null,
          satuanBenih: "Ekor",
          kondisiKolam: "Baik",
          sistemBudidaya: kolamBundar > 0 ? "Bioflok" : "Tradisional / Semi Intensif",
          tahunMulaiUsaha: tahunBentuk,
          deskripsi: deskripsi,
          catatan: catatan,
        },
        create: {
          kd_kolam: kdKolam,
          nm_kolam: namaKelompokRaw,
          status: "AKTIF",
          kd_kecamatan: matchedKec.kd_kecamatan,
          kd_desa: matchedDesa.kd_desa,
          kd_komoditas: kdKomoditas,
          kd_kelompok: kdKelompok,
          namaPemilik: namaPemilik,
          alamatLokasi: `Desa ${matchedDesa.nm_desa}, Kec. ${matchedKec.nm_kecamatan}`,
          latitude: lat,
          longitude: lng,
          jenisKolam: jenisKolam,
          jumlahKolam: jumlahKolam,
          luasKolamM2: luasKolamM2,
          kapasitasBenih: jumlahTebar > 0 ? jumlahTebar : null,
          satuanBenih: "Ekor",
          kondisiKolam: "Baik",
          sistemBudidaya: kolamBundar > 0 ? "Bioflok" : "Tradisional / Semi Intensif",
          tahunMulaiUsaha: tahunBentuk,
          deskripsi: deskripsi,
          catatan: catatan,
        },
      });

      // Tambahkan data ke PendanaanKolam
      await prisma.pendanaanKolam.create({
        data: {
          kd_kolam: createdKolam.kd_kolam,
          namaProgram: programName,
          sumberDana: jenisSumberDana,
          namaSumberDana: sumberDanaRaw,
          tahunAnggaran: 2026,
          status: "DICAIRKAN",
          danaDisetujui: jumlahTebar > 0 ? jumlahTebar : 0,
          danaDicairkan: jumlahTebar > 0 ? jumlahTebar : 0,
          keterangan: rincianBantuan.join(", ") || `Bantuan ${sumberDanaRaw}`,
        },
      });

      totalImported++;
      console.log(`[OK] (${totalImported}/46) [${kdKolam}] ${namaKelompokRaw} -> Kec: ${matchedKec.nm_kecamatan}, Desa: ${matchedDesa.nm_desa}`);
    }
  }

  console.log(`\nImport selesai! Total ${totalImported} data kolam berhasil dimasukkan ke database.`);
}

main()
  .catch((e) => {
    console.error("Error during import:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
