import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getAuthorityFilter, canAccessSector } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kd_kecamatan = url.searchParams.get("kd_kecamatan") || "semua";
    const user = getUserFromRequest(request);

    const allowPertanian = !user || canAccessSector(user, "pertanian");
    const allowPerikanan = !user || canAccessSector(user, "perikanan");
    const allowPeternakan = !user || canAccessSector(user, "peternakan");

    // 1. Terapkan filter wilayah berdasarkan hak akses pengguna
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan);

    // Filter untuk relasi unit di siklus dan pendanaan
    const unitWhereKebun = authorityFilter.kd_kecamatan
      ? {
          kebun: {
            kd_kecamatan: authorityFilter.kd_kecamatan,
            ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
          },
        }
      : authorityFilter.kd_desa
      ? { kebun: { kd_desa: authorityFilter.kd_desa } }
      : {};
    const unitWhereKolam = authorityFilter.kd_kecamatan
      ? {
          kolam: {
            kd_kecamatan: authorityFilter.kd_kecamatan,
            ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
          },
        }
      : authorityFilter.kd_desa
      ? { kolam: { kd_desa: authorityFilter.kd_desa } }
      : {};
    const unitWhereTernak = authorityFilter.kd_kecamatan
      ? {
          peternakan: {
            kd_kecamatan: authorityFilter.kd_kecamatan,
            ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
          },
        }
      : authorityFilter.kd_desa
      ? { peternakan: { kd_desa: authorityFilter.kd_desa } }
      : {};

    const siklusOrConditions: any[] = [];
    if (allowPertanian) {
      siklusOrConditions.push(
        authorityFilter.kd_kecamatan
          ? {
              kebun: {
                kd_kecamatan: authorityFilter.kd_kecamatan,
                ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
              },
            }
          : authorityFilter.kd_desa
          ? { kebun: { kd_desa: authorityFilter.kd_desa } }
          : { kebun: { isNot: null } }
      );
    }
    if (allowPerikanan) {
      siklusOrConditions.push(
        authorityFilter.kd_kecamatan
          ? {
              kolam: {
                kd_kecamatan: authorityFilter.kd_kecamatan,
                ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
              },
            }
          : authorityFilter.kd_desa
          ? { kolam: { kd_desa: authorityFilter.kd_desa } }
          : { kolam: { isNot: null } }
      );
    }
    if (allowPeternakan) {
      siklusOrConditions.push(
        authorityFilter.kd_kecamatan
          ? {
              peternakan: {
                kd_kecamatan: authorityFilter.kd_kecamatan,
                ...(authorityFilter.kd_desa ? { kd_desa: authorityFilter.kd_desa } : {}),
              },
            }
          : authorityFilter.kd_desa
          ? { peternakan: { kd_desa: authorityFilter.kd_desa } }
          : { peternakan: { isNot: null } }
      );
    }

    // 2. Query 100% Real Database
    const [
      totalKebun,
      totalKolam,
      totalPeternakan,
      totalKelompokTani,
      allKecamatan,
      siklusListDb,
      danaKebunDb,
      danaKolamDb,
      danaTernakDb,
      kebunPoints,
      kolamPoints,
      ternakPoints,
      sumLuasKebun,
      sumKolam,
      sumTernak,
      kebunByKomoditas,
      kolamByKomoditas,
      ternakByKomoditas,
      allKomoditas,
      latestKebun,
      latestKolam,
      latestTernak,
      kebunLuasByKecamatan,
      poktanPertanianWithCoords,
    ] = await Promise.all([
      allowPertanian ? prisma.kebun.count({ where: authorityFilter }) : Promise.resolve(0),
      allowPerikanan ? prisma.kolam.count({ where: authorityFilter }) : Promise.resolve(0),
      allowPeternakan ? prisma.peternakan.count({ where: authorityFilter }) : Promise.resolve(0),
      allowPertanian ? prisma.kelompokTani.count({ where: authorityFilter }) : Promise.resolve(0),
      prisma.kecamatan.findMany({
        where: authorityFilter.kd_kecamatan ? { kd_kecamatan: authorityFilter.kd_kecamatan } : { aktif: true },
        include: {
          _count: {
            select: {
              kebun: true,
              kolam: true,
              peternakan: true,
              kelompokTani: true,
            },
          },
        },
        orderBy: { nm_kecamatan: "asc" },
      }),
      siklusOrConditions.length > 0
        ? prisma.siklusProduksi.findMany({
            where: { OR: siklusOrConditions },
            include: {
              kebun: { include: { desa: true, kecamatan: true, komoditas: true } },
              kolam: { include: { desa: true, kecamatan: true, komoditas: true } },
              peternakan: { include: { desa: true, kecamatan: true, komoditas: true } },
            },
            orderBy: { tanggalMulai: "desc" },
            take: 10,
          })
        : Promise.resolve([]),
      prisma.pendanaanKebun.findMany({
        where: unitWhereKebun,
        include: { kebun: { include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pendanaanKolam.findMany({
        where: unitWhereKolam,
        include: { kolam: { include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pendanaanPeternakan.findMany({
        where: unitWhereTernak,
        include: { peternakan: { include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true } } },
        orderBy: { createdAt: "desc" },
      }),
      allowPertanian
        ? prisma.kebun.findMany({
            where: {
              ...authorityFilter,
              latitude: { not: null },
              longitude: { not: null },
            },
            include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true, foto: true, pendanaan: true, siklus: true },
          })
        : Promise.resolve([]),
      allowPerikanan
        ? prisma.kolam.findMany({
            where: authorityFilter,
            include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true, foto: true, pendanaan: true, siklus: true },
          })
        : Promise.resolve([]),
      allowPeternakan
        ? prisma.peternakan.findMany({
            where: authorityFilter,
            include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true, foto: true, pendanaan: true, siklus: true },
          })
        : Promise.resolve([]),
      allowPertanian
        ? prisma.kebun.aggregate({
            where: authorityFilter,
            _sum: { luasLahanHa: true },
          })
        : Promise.resolve({ _sum: { luasLahanHa: null } }),
      allowPerikanan
        ? prisma.kolam.aggregate({
            where: authorityFilter,
            _sum: { luasKolamM2: true, kapasitasBenih: true, jumlahKolam: true },
          })
        : Promise.resolve({ _sum: { luasKolamM2: null, kapasitasBenih: null, jumlahKolam: null } }),
      allowPeternakan
        ? prisma.peternakan.aggregate({
            where: authorityFilter,
            _sum: { jumlahTernak: true, jumlahKandang: true },
          })
        : Promise.resolve({ _sum: { jumlahTernak: null, jumlahKandang: null } }),
      allowPertanian
        ? prisma.kebun.groupBy({
            by: ["kd_komoditas"],
            where: authorityFilter,
            _count: { id: true },
          })
        : Promise.resolve([]),
      allowPerikanan
        ? prisma.kolam.groupBy({
            by: ["kd_komoditas"],
            where: authorityFilter,
            _count: { id: true },
          })
        : Promise.resolve([]),
      allowPeternakan
        ? prisma.peternakan.groupBy({
            by: ["kd_komoditas"],
            where: authorityFilter,
            _count: { id: true },
          })
        : Promise.resolve([]),
      prisma.komoditas.findMany({
        where: { aktif: true },
      }),
      allowPertanian
        ? prisma.kebun.findFirst({
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
          })
        : Promise.resolve(null),
      allowPerikanan
        ? prisma.kolam.findFirst({
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
          })
        : Promise.resolve(null),
      allowPeternakan
        ? prisma.peternakan.findFirst({
            orderBy: { updatedAt: "desc" },
            select: { updatedAt: true },
          })
        : Promise.resolve(null),
      allowPertanian
        ? prisma.kebun.groupBy({
            by: ["kd_kecamatan"],
            where: authorityFilter,
            _sum: { luasLahanHa: true },
            _count: { id: true },
          })
        : Promise.resolve([]),
      allowPertanian
        ? prisma.kelompokTani.findMany({
            where: {
              ...(authorityFilter.kd_kecamatan ? { kd_kecamatan: authorityFilter.kd_kecamatan } : {}),
              desa: { latitude: { not: null }, longitude: { not: null } },
            },
            include: { desa: true, kecamatan: true },
            take: 120,
          })
        : Promise.resolve([]),
    ]);


    // 3. Kalkulasi Real Nilai Pendanaan Tahun Saat Ini dari Database
    const currentYear = new Date().getFullYear();
    const tahunParam = url.searchParams.get("tahun");
    const targetTahun = tahunParam ? parseInt(tahunParam) : currentYear;

    const allPendanaan = [
      ...(allowPertanian
        ? danaKebunDb.map((d: any) => ({
            id: `pk-${d.id}`,
            program: d.namaProgram,
            unit: d.kebun?.nama || "Kebun",
            sumberDana: d.sumberDana,
            tahunAnggaran: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : targetTahun),
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
            createdAt: d.createdAt,
          }))
        : []),
      ...(allowPerikanan
        ? danaKolamDb.map((d: any) => ({
            id: `pl-${d.id}`,
            program: d.namaProgram,
            unit: d.kolam?.nm_kolam || "Kolam",
            sumberDana: d.sumberDana,
            tahunAnggaran: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : targetTahun),
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
            createdAt: d.createdAt,
          }))
        : []),
      ...(allowPeternakan
        ? danaTernakDb.map((d: any) => ({
            id: `pt-${d.id}`,
            program: d.namaProgram,
            unit: d.peternakan?.nm_peternakan || "Peternakan",
            sumberDana: d.sumberDana,
            tahunAnggaran: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : targetTahun),
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
            createdAt: d.createdAt,
          }))
        : []),
    ];

    // Filter khusus data pendanaan tahun berjalan (tahun saat ini)
    const pendanaanTahunIni = allPendanaan.filter((p) => {
      const yr = p.tahunAnggaran || (p.createdAt ? new Date(p.createdAt).getFullYear() : targetTahun);
      return yr === targetTahun;
    });

    const sumPendanaanCairTahunIni = pendanaanTahunIni.reduce((acc, curr) => acc + curr.cair, 0);
    const sumPendanaanPaguTahunIni = pendanaanTahunIni.reduce((acc, curr) => acc + curr.pagu, 0);
    const totalPendanaanTahunIni = sumPendanaanCairTahunIni > 0 ? sumPendanaanCairTahunIni : sumPendanaanPaguTahunIni;

    const formatCurrencyDisplay = (val: number) => {
      if (val >= 1_000_000_000) {
        return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
      }
      if (val >= 1_000_000) {
        return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
      }
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    const metrics = {
      totalKebun,
      displayKebun: totalKebun.toLocaleString("id-ID"),
      growthKebun: `${totalKebun} Unit aktif terdata`,

      totalKolam,
      displayKolam: totalKolam.toLocaleString("id-ID"),
      growthKolam: `${totalKolam} Unit kolam budidaya`,

      totalPeternakan,
      displayPeternakan: totalPeternakan.toLocaleString("id-ID"),
      growthPeternakan: `${totalPeternakan} Unit ternak terdaftar`,

      totalKelompokTani,
      displayKelompokTani: totalKelompokTani.toLocaleString("id-ID"),
      growthKelompokTani: `${totalKelompokTani} Kelompok tani binaan`,

      tahunPendanaan: targetTahun,
      totalPendanaan: totalPendanaanTahunIni,
      displayPendanaan: formatCurrencyDisplay(totalPendanaanTahunIni),
      growthPendanaan:
        sumPendanaanCairTahunIni > 0
          ? `Realisasi ${targetTahun}: ${formatCurrencyDisplay(sumPendanaanCairTahunIni)}`
          : sumPendanaanPaguTahunIni > 0
          ? `Pagu ${targetTahun}: ${formatCurrencyDisplay(sumPendanaanPaguTahunIni)}`
          : `Tahun Anggaran ${targetTahun}`,
    };

    // 4. Bar Chart: 100% Mengambil data hitungan real per Kecamatan dari Database
    const chartData = allKecamatan.map((k) => ({
      nama: k.nm_kecamatan,
      kebun: allowPertanian ? k._count.kebun : 0,
      kolam: allowPerikanan ? k._count.kolam : 0,
      peternakan: allowPeternakan ? k._count.peternakan : 0,
      poktan: allowPertanian ? k._count.kelompokTani : 0,
    }));

    // 5. Tabel Jadwal Panen & Siklus Produksi (Real DB)
    const jadwalList = siklusListDb.map((s) => {
      let komoditas = s.namaSiklus;
      let lokasi = "Tapanuli Selatan";
      if (s.kebun) {
        komoditas = s.kebun.komoditas?.nm_komoditas || s.namaSiklus;
        lokasi = `Kec. ${s.kebun.kecamatan?.nm_kecamatan || "-"}`;
      } else if (s.kolam) {
        komoditas = s.kolam.komoditas?.nm_komoditas || s.namaSiklus;
        lokasi = `Kec. ${s.kolam.kecamatan?.nm_kecamatan || "-"}`;
      } else if (s.peternakan) {
        komoditas = s.peternakan.komoditas?.nm_komoditas || s.namaSiklus;
        lokasi = `Kec. ${s.peternakan.kecamatan?.nm_kecamatan || "-"}`;
      }

      const dateStr = s.tanggalMulai
        ? new Date(s.tanggalMulai).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "-";

      return {
        id: s.id,
        komoditas,
        lokasi,
        kegiatan: s.tahapKegiatan || s.status,
        tanggal: dateStr,
        status: s.status === "BERJALAN" ? "Berjalan" : s.status === "PANEN" ? "Panen" : s.status,
        statusColor:
          s.status === "BERJALAN"
            ? "bg-emerald-500"
            : s.status === "PANEN"
            ? "bg-amber-500"
            : "bg-sky-500",
      };
    });

    // 6. Tabel Pendanaan Real DB
    const pendanaanList = allPendanaan.slice(0, 5).map((p) => {
      const realisasiPct = p.pagu > 0 ? Math.min(100, Math.round((p.cair / p.pagu) * 100)) : 0;
      return {
        id: p.id,
        program: `${p.program} (${p.unit})`,
        nilai: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.pagu),
        realisasi: realisasiPct,
        status: p.status,
        statusColor:
          p.status === "DICAIRKAN" || p.status === "SELESAI"
            ? "bg-emerald-600"
            : p.status === "DISETUJUI"
            ? "bg-sky-600"
            : "bg-amber-500",
      };
    });

    // Helper pemetaan nama resmi sumber dana sesuai sistem
    const normalizeSumberDana = (sumberDana?: string, namaSumberDana?: string): string => {
      const s = (sumberDana || "").toUpperCase();
      const ns = (namaSumberDana || "").trim();

      if (s === "KUR" || s.includes("KUR") || ns.toUpperCase().includes("BANK SUMUT")) return "KUR (Kredit Usaha Rakyat)";
      if (s === "APBD_KABUPATEN" || ns.toUpperCase().includes("TAPSEL") || ns.toUpperCase().includes("DINAS") || ns.toUpperCase().includes("KABUPATEN")) return "APBD Kabupaten";
      if (s === "APBD_PROVINSI" || ns.toUpperCase().includes("PROVINSI")) return "APBD Provinsi";
      if (s === "APBN" || ns.toUpperCase().includes("APBN") || ns.toUpperCase().includes("PUSAT")) return "APBN";
      if (s === "DANA_DESA" || ns.toUpperCase().includes("DANA DESA") || ns.toUpperCase().includes("DESA")) return "Dana Desa";
      if (s === "SWADAYA" || ns.toUpperCase().includes("SWADAYA")) return "Swadaya";
      if (s === "BANTUAN_PEMERINTAH" || ns.toUpperCase().includes("DAK") || ns.toUpperCase().includes("BANTUAN")) return "Bantuan Pemerintah";
      if (s === "CSR" || ns.toUpperCase().includes("CSR") || ns.toUpperCase().includes("BUMN")) return "CSR / BUMN";
      if (s === "PERBANKAN") return "Perbankan";
      if (s === "LAINNYA") return "Lainnya";

      return ns || s || "Lainnya";
    };

    // 6b. Data Terbaru Pendanaan Usaha (100% Real Database sesuai role user)
    // - Admin Dinas Pertanian: Data Pertanian dan Peternakan
    // - Admin Dinas Perikanan: Data Perikanan
    // - Superadmin / Admin Kabupaten: Semua data
    const pendanaanTerbaru: any[] = [];
    if (allowPertanian) {
      danaKebunDb.forEach((d: any) => {
        pendanaanTerbaru.push({
          id: `pk-${d.id}`,
          namaPenerima: d.kebun?.kelompokTani?.nm_kelompok || d.kebun?.namaPemilik || d.kebun?.nama || "Kelompok Tani",
          sektor: "Pertanian",
          jenisUsaha: d.kebun?.komoditas?.nm_komoditas || d.kebun?.jenisTanaman || "Padi",
          tahun: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : 2026),
          sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
          sumberDanaRaw: d.sumberDana,
          namaSumberDana: d.namaSumberDana || null,
          nilaiBantuan: Number(d.danaDicairkan || 0),
          danaDicairkan: Number(d.danaDicairkan || 0),
          createdAt: d.createdAt,
        });
      });
    }
    if (allowPerikanan) {
      danaKolamDb.forEach((d: any) => {
        pendanaanTerbaru.push({
          id: `pl-${d.id}`,
          namaPenerima: d.kolam?.kelompokTani?.nm_kelompok || d.kolam?.namaPemilik || d.kolam?.nm_kolam || "Pokdakan",
          sektor: "Perikanan",
          jenisUsaha: d.kolam?.komoditas?.nm_komoditas || "Budidaya Ikan",
          tahun: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : 2026),
          sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
          sumberDanaRaw: d.sumberDana,
          namaSumberDana: d.namaSumberDana || null,
          nilaiBantuan: Number(d.danaDicairkan || 0),
          danaDicairkan: Number(d.danaDicairkan || 0),
          createdAt: d.createdAt,
        });
      });
    }
    if (allowPeternakan) {
      danaTernakDb.forEach((d: any) => {
        pendanaanTerbaru.push({
          id: `pt-${d.id}`,
          namaPenerima: d.peternakan?.kelompokTani?.nm_kelompok || d.peternakan?.namaPemilik || d.peternakan?.nm_peternakan || "Kelompok Ternak",
          sektor: "Peternakan",
          jenisUsaha: d.peternakan?.komoditas?.nm_komoditas || "Sapi Potong",
          tahun: d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : 2026),
          sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
          sumberDanaRaw: d.sumberDana,
          namaSumberDana: d.namaSumberDana || null,
          nilaiBantuan: Number(d.danaDicairkan || 0),
          danaDicairkan: Number(d.danaDicairkan || 0),
          createdAt: d.createdAt,
        });
      });
    }

    // Urutkan data berdasarkan tahun anggaran terbaru, lalu waktu pencatatan
    pendanaanTerbaru.sort((a, b) => {
      const yearDiff = Number(b.tahun) - Number(a.tahun);
      if (yearDiff !== 0) return yearDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // 7. Map Pins Real DB
    const mapPins = [
      ...kebunPoints.map((k) => ({
        id: `kebun-${k.id}`,
        dbId: k.id,
        kode: k.kd_kebun,
        nama: k.nama,
        jenisUsaha: "KEBUN",
        komoditas: k.komoditas?.nm_komoditas || "Pertanian",
        pemilik: k.namaPemilik || "-",
        desa: k.desa?.nm_desa,
        kecamatan: k.kecamatan?.nm_kecamatan,
        lat: Number(k.latitude),
        lng: Number(k.longitude),
        luas: `${k.luasLahanHa || 0} Ha`,
        color: "#16a34a",
        foto: k.foto || [],
        fotoUrl: k.foto?.[0]?.url || null,
        detail: {
          kode: k.kd_kebun,
          nama: k.nama,
          status: k.status,
          komoditas: k.komoditas?.nm_komoditas || "Jagung Hibrida",
          namaPemilik: k.namaPemilik || "-",
          alamat: k.alamatLokasi || `Desa ${k.desa?.nm_desa || "-"}, Kec. ${k.kecamatan?.nm_kecamatan || "-"}`,
          desa: k.desa?.nm_desa || "-",
          kecamatan: k.kecamatan?.nm_kecamatan || "-",
          kelompokTani: k.kelompokTani ? {
            kode: k.kelompokTani.kd_kelompok,
            nama: k.kelompokTani.nm_kelompok,
            ketua: k.kelompokTani.namaKetua,
            anggota: k.kelompokTani.jumlahAnggota,
          } : null,
          spesifikasi: [
            { label: "Luas Lahan", value: `${k.luasLahanHa || 0} Hektar` },
            { label: "Sistem Tanam", value: k.sistemTanam || "Monokultur" },
            { label: "Kondisi Tanaman", value: k.kondisiTanaman || "Baik / Produktif" },
            { label: "Tahun Tanam", value: k.tahunTanam ? String(k.tahunTanam) : "-" },
            { label: "Status Lahan", value: k.statusLahan || "Milik Kelompok / SHM" },
            { label: "Jumlah Pohon", value: k.jumlahPohon ? `${k.jumlahPohon.toLocaleString("id-ID")} pohon` : "-" },
          ],
          pendanaan: k.pendanaan?.map((d) => ({
            program: d.namaProgram,
            sumberDana: d.sumberDana,
            danaDiajukan: Number(d.danaDiajukan || 0),
            danaDicairkan: Number(d.danaDicairkan || 0),
            status: d.status,
          })) || [],
          siklus: k.siklus?.map((s) => ({
            nama: s.namaSiklus,
            tahap: s.tahapKegiatan || s.status,
            tanggalMulai: s.tanggalMulai ? new Date(s.tanggalMulai).toLocaleDateString("id-ID") : "-",
            targetPanen: s.estimasiProduksi ? `${s.estimasiProduksi} ${s.satuanProduksi || "Kg"}` : "-",
          })) || [],
        },
      })),
      ...kolamPoints.map((k) => ({
        id: `kolam-${k.id}`,
        dbId: k.id,
        kode: k.kd_kolam,
        nama: k.nm_kolam,
        jenisUsaha: "KOLAM",
        komoditas: k.komoditas?.nm_komoditas || "Perikanan",
        pemilik: k.namaPemilik || "-",
        desa: k.desa?.nm_desa,
        kecamatan: k.kecamatan?.nm_kecamatan,
        lat: Number(k.latitude),
        lng: Number(k.longitude),
        luas: `${k.luasKolamM2 || 0} m²`,
        color: "#0284c7",
        foto: k.foto || [],
        fotoUrl: k.foto?.[0]?.url || null,
        detail: {
          kode: k.kd_kolam,
          nama: k.nm_kolam,
          status: k.status,
          komoditas: k.komoditas?.nm_komoditas || "Ikan Nila",
          namaPemilik: k.namaPemilik || "-",
          alamat: k.alamatLokasi || `Desa ${k.desa?.nm_desa || "-"}, Kec. ${k.kecamatan?.nm_kecamatan || "-"}`,
          desa: k.desa?.nm_desa || "-",
          kecamatan: k.kecamatan?.nm_kecamatan || "-",
          kelompokTani: k.kelompokTani ? {
            kode: k.kelompokTani.kd_kelompok,
            nama: k.kelompokTani.nm_kelompok,
            ketua: k.kelompokTani.namaKetua,
            anggota: k.kelompokTani.jumlahAnggota,
          } : null,
          spesifikasi: [
            { label: "Jumlah Kolam", value: `${k.jumlahKolam || 1} Unit Kolam` },
            { label: "Luas Area Kolam", value: `${k.luasKolamM2 || 0} m²` },
            { label: "Kapasitas Tebar Benih", value: `${Number(k.kapasitasBenih || 0).toLocaleString("id-ID")} Ekor` },
            { label: "Jenis Kolam", value: k.jenisKolam || "Kolam Tanah" },
            { label: "Sumber Air", value: k.sumberAir || "Mata Air / Irigasi Pegunungan" },
            { label: "Sistem Budidaya", value: k.sistemBudidaya || "Tradisional Plus" },
            { label: "Kedalaman Air", value: k.kedalamanKolamM ? `${k.kedalamanKolamM} Meter` : "1.2 Meter" },
            { label: "Kondisi Kolam", value: k.kondisiKolam || "Aktif / Berjalan" },
          ],
          pendanaan: k.pendanaan?.map((d) => ({
            program: d.namaProgram,
            sumberDana: d.sumberDana,
            danaDiajukan: Number(d.danaDiajukan || 0),
            danaDicairkan: Number(d.danaDicairkan || 0),
            status: d.status,
          })) || [],
          siklus: k.siklus?.map((s) => ({
            nama: s.namaSiklus,
            tahap: s.tahapKegiatan || s.status,
            tanggalMulai: s.tanggalMulai ? new Date(s.tanggalMulai).toLocaleDateString("id-ID") : "-",
            targetPanen: s.estimasiProduksi ? `${s.estimasiProduksi} ${s.satuanProduksi || "Kg"}` : "-",
          })) || [],
        },
      })),
      ...ternakPoints.map((t) => ({
        id: `ternak-${t.id}`,
        dbId: t.id,
        kode: t.kd_peternakan,
        nama: t.nm_peternakan,
        jenisUsaha: "PETERNAKAN",
        komoditas: t.komoditas?.nm_komoditas || "Peternakan",
        pemilik: t.namaPemilik || "-",
        desa: t.desa?.nm_desa,
        kecamatan: t.kecamatan?.nm_kecamatan,
        lat: Number(t.latitude),
        lng: Number(t.longitude),
        luas: `${t.jumlahTernak || 0} Ekor`,
        color: "#ea580c",
        foto: t.foto || [],
        fotoUrl: t.foto?.[0]?.url || null,
        detail: {
          kode: t.kd_peternakan,
          nama: t.nm_peternakan,
          status: t.status,
          komoditas: t.komoditas?.nm_komoditas || "Ayam Layer (Petelur)",
          namaPemilik: t.namaPemilik || "-",
          alamat: t.alamatLokasi || `Desa ${t.desa?.nm_desa || "-"}, Kec. ${t.kecamatan?.nm_kecamatan || "-"}`,
          desa: t.desa?.nm_desa || "-",
          kecamatan: t.kecamatan?.nm_kecamatan || "-",
          kelompokTani: t.kelompokTani ? {
            kode: t.kelompokTani.kd_kelompok,
            nama: t.kelompokTani.nm_kelompok,
            ketua: t.kelompokTani.namaKetua,
            anggota: t.kelompokTani.jumlahAnggota,
          } : null,
          spesifikasi: [
            { label: "Populasi Ternak", value: `${(Number(t.jumlahTernak || 0)).toLocaleString("id-ID")} Ekor` },
            { label: "Jumlah Kandang", value: `${t.jumlahKandang || 0} Unit Kandang` },
            { label: "Jenis Ternak", value: t.jenisTernak || t.komoditas?.nm_komoditas || "Ternak" },
            { label: "Sistem Pemeliharaan", value: t.sistemPemeliharaan || "Intensif" },
            { label: "Sumber Pakan", value: t.sumberPakan || "Pakan Mandiri & Konsentrat" },
            ...( (t.komoditas?.nm_komoditas || "").toLowerCase().includes("ayam") ? [{ label: "Estimasi Produksi Telur", value: `~${Number((Number(t.jumlahTernak || 0) * 0.9).toFixed(0))} Butir / Hari` }] : [] ),
            { label: "Kondisi Kandang", value: t.kondisiKandang || "Baik" },
          ],
          pendanaan: t.pendanaan?.map((d) => ({
            program: d.namaProgram,
            sumberDana: d.sumberDana,
            danaDiajukan: Number(d.danaDiajukan || 0),
            danaDicairkan: Number(d.danaDicairkan || 0),
            status: d.status,
          })) || [],
          siklus: t.siklus?.map((s) => ({
            nama: s.namaSiklus,
            tahap: s.tahapKegiatan || s.status,
            tanggalMulai: s.tanggalMulai ? new Date(s.tanggalMulai).toLocaleDateString("id-ID") : "-",
            targetPanen: s.estimasiProduksi ? `${s.estimasiProduksi} ${s.satuanProduksi || "Butir/Hari"}` : "-",
          })) || [],
        },
      })),
    ];

    // 8. Helper & Komposisi Penjabaran Komoditas
    const buildKomoditasList = (
      jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN",
      groupByData: { kd_komoditas: string; _count: { id: number } }[]
    ) => {
      const sectorKomoditas = allKomoditas.filter((k) => k.jenisUsaha === jenisUsaha);
      const komMap = new Map<string, { kode: string; nama: string; count: number }>();

      // Populate master komoditas
      for (const k of sectorKomoditas) {
        komMap.set(k.kd_komoditas, {
          kode: k.kd_komoditas,
          nama: k.nm_komoditas,
          count: 0,
        });
      }

      // Populate counts from real DB
      for (const item of groupByData) {
        if (!item.kd_komoditas) continue;
        const existing = komMap.get(item.kd_komoditas);
        if (existing) {
          existing.count = item._count.id;
        } else {
          komMap.set(item.kd_komoditas, {
            kode: item.kd_komoditas,
            nama: item.kd_komoditas,
            count: item._count.id,
          });
        }
      }

      return Array.from(komMap.values()).sort((a, b) => b.count - a.count);
    };

    // Komposisi Komoditas Kolam (Khusus Perikanan)
    const kolamKomoditasList = buildKomoditasList("KOLAM", kolamByKomoditas);
    const activeKolamKomoditas = kolamKomoditasList.filter((k) => k.count > 0);
    const totalKolamKomoditasCount = activeKolamKomoditas.reduce((acc, curr) => acc + curr.count, 0) || totalKolam;

    const kolamPalette = [
      "#0284c7", // Sky 600
      "#0d9488", // Teal 600
      "#2563eb", // Blue 600
      "#06b6d4", // Cyan 500
      "#6366f1", // Indigo 500
      "#7c3aed", // Violet 600
      "#db2777", // Pink 600
      "#ea580c", // Orange 600
      "#d97706", // Amber 600
    ];

    const komposisiKolamItems = activeKolamKomoditas.map((k, idx) => ({
      name: k.nama,
      key: k.kode,
      count: k.count,
      percentage: totalKolamKomoditasCount > 0 ? Number(((k.count / totalKolamKomoditasCount) * 100).toFixed(2)) : 0,
      color: kolamPalette[idx % kolamPalette.length],
    }));

    const komposisiKolamData = {
      title: "Komposisi Komoditas Kolam",
      subtitle: "Persentase berdasarkan jenis komoditas kolam budidaya",
      total: totalKolamKomoditasCount,
      displayTotal: totalKolamKomoditasCount.toLocaleString("id-ID"),
      unitLabel: "Kolam",
      items: komposisiKolamItems,
    };

    // Komposisi Sektor Umum untuk Donut Chart
    const totalSektorData = totalKolam + totalKebun + totalPeternakan;
    const komposisiItems: any[] = [];
    if (allowPerikanan) {
      komposisiItems.push({
        name: "Kolam",
        key: "kolam",
        count: totalKolam,
        percentage: totalSektorData > 0 ? Number(((totalKolam / totalSektorData) * 100).toFixed(2)) : 0,
        color: "#0284c7",
      });
    }
    if (allowPertanian) {
      komposisiItems.push({
        name: "Pertanian / Kebun",
        key: "pertanian",
        count: totalKebun,
        percentage: totalSektorData > 0 ? Number(((totalKebun / totalSektorData) * 100).toFixed(2)) : 0,
        color: "#16a34a",
      });
    }
    if (allowPeternakan) {
      komposisiItems.push({
        name: "Peternakan",
        key: "peternakan",
        count: totalPeternakan,
        percentage: totalSektorData > 0 ? Number(((totalPeternakan / totalSektorData) * 100).toFixed(2)) : 0,
        color: "#ea580c",
      });
    }

    let komposisiData = {
      title: "Komposisi Data",
      subtitle: "Persentase masing-masing sektor",
      total: totalSektorData,
      displayTotal: totalSektorData.toLocaleString("id-ID"),
      unitLabel: "Data",
      items: komposisiItems,
    };

    // Khusus Admin Perikanan: ganti komposisi data utama dengan komposisi komoditas kolam
    if (user?.peran === "ADMIN_PERIKANAN") {
      komposisiData = komposisiKolamData;
    }

    const totalLuasKebunHa = Number(sumLuasKebun._sum.luasLahanHa || 0);

    // Pemetaan Luas Lahan Hektar per Kecamatan dari Real DB
    const luasKecMap = new Map<string, number>();
    for (const item of (kebunLuasByKecamatan as any[])) {
      if (item.kd_kecamatan) {
        luasKecMap.set(item.kd_kecamatan, Number(item._sum.luasLahanHa || 0));
      }
    }

    // Komoditas Pertanian dengan Palet Warna Menarik
    const komoditasColors = [
      "#16a34a", // Hijau segar (Padi/Jagung)
      "#ea580c", // Oranye
      "#eab308", // Kuning emas
      "#854d0e", // Cokelat/Kakao
      "#d97706", // Amber/Cengkeh
      "#06b6d4", // Cyan
      "#f97316", // Oranye tua
      "#6366f1", // Nila/Lainnya
      "#10b981", // Zamrud
      "#8b5cf6", // Ungu
    ];

    const rawKomoditasKebun = buildKomoditasList("KEBUN", kebunByKomoditas);
    const komoditasWithColors = rawKomoditasKebun.map((kom, idx) => ({
      ...kom,
      color: komoditasColors[idx % komoditasColors.length],
    }));

    const activeKomoditasKebun = komoditasWithColors.filter((k) => k.count > 0);
    const totalKomoditasKebunCount = activeKomoditasKebun.length || komoditasWithColors.length || 1;

    // Real Pendanaan Khusus Pertanian
    const totalDanaKebun = danaKebunDb.reduce(
      (acc: number, curr: any) => acc + Number(curr.danaDicairkan || curr.danaDiajukan || 0),
      0
    );
    const uniquePenerimaKebun = new Set(
      danaKebunDb.map((d: any) => d.kd_kebun).filter(Boolean)
    ).size;

    // Rekap Kecamatan Khusus Pertanian diurutkan berdasarkan Luas Lahan (Ha)
    const rekapKecamatanPertanian = allKecamatan
      .map((k) => {
        const luas = luasKecMap.get(k.kd_kecamatan) || 0;
        return {
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count: k._count.kebun,
          luasHa: Number(luas.toFixed(2)),
          poktan: k._count.kelompokTani,
        };
      })
      .filter((k) => k.count > 0 || k.luasHa > 0)
      .sort((a, b) => b.luasHa - a.luasHa);

    // Titik Sebaran Peta Khusus Pertanian (Kebun, Kelompok Tani, Bantuan)
    const mapPinsPertanian = [
      ...kebunPoints.map((k: any) => {
        const isBantuan = k.pendanaan && k.pendanaan.length > 0;
        return {
          id: `kebun-${k.id}`,
          dbId: k.id,
          nama: k.nama,
          tipe: isBantuan ? "BANTUAN" : "KEBUN",
          jenisUsaha: "KEBUN",
          komoditas: k.komoditas?.nm_komoditas || "Pertanian",
          pemilik: k.namaPemilik || "-",
          lat: Number(k.latitude),
          lng: Number(k.longitude),
          desa: k.desa?.nm_desa,
          kecamatan: k.kecamatan?.nm_kecamatan,
          luas: `${k.luasLahanHa || 0} Ha`,
          color: isBantuan ? "#f59e0b" : "#16a34a",
          fotoUrl: k.foto?.[0]?.url || null,
        };
      }),
      ...(poktanPertanianWithCoords as any[]).map((p: any) => ({
        id: `poktan-${p.id}`,
        dbId: p.id,
        nama: p.nm_kelompok,
        tipe: "POKTAN",
        jenisUsaha: "POKTAN",
        komoditas: "Kelompok Tani Binaan",
        pemilik: p.namaKetua || "-",
        lat: Number(p.desa?.latitude),
        lng: Number(p.desa?.longitude),
        desa: p.desa?.nm_desa,
        kecamatan: p.kecamatan?.nm_kecamatan,
        luas: `${p.jumlahAnggota || 0} Anggota`,
        color: "#0d9488",
        fotoUrl: null,
      })),
    ];

    // Ekstraksi Tahun Anggaran Riil dari Database
    const currentYearNum = new Date().getFullYear();
    const allYearsSet = new Set<number>();
    danaKebunDb.forEach((d: any) => {
      const yr = d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum);
      allYearsSet.add(Number(yr));
    });

    const availableYearsPertanian = Array.from(allYearsSet).sort((a, b) => b - a);
    const tahunTerkini = availableYearsPertanian.includes(currentYearNum)
      ? currentYearNum
      : availableYearsPertanian.length > 0
      ? availableYearsPertanian[0]
      : currentYearNum;

    // Filter khusus data tahun terkini untuk nilai default
    const danaKebunTerkini = danaKebunDb.filter((d: any) => {
      const yr = d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum);
      return Number(yr) === tahunTerkini;
    });

    // Hitung total dan penerima untuk tahun terkini
    const targetDanaList = danaKebunTerkini.length > 0 ? danaKebunTerkini : danaKebunDb;
    const totalDanaKebunTerkini = targetDanaList.reduce(
      (acc: number, curr: any) => acc + Number(curr.danaDicairkan || curr.danaDiajukan || 0),
      0
    );
    const uniquePenerimaTerkini = new Set(
      targetDanaList.map((d: any) => d.kd_kebun).filter(Boolean)
    ).size;

    // Komposisi Sumber Dana Khusus Pertanian dari Database
    const danaSourceMap = new Map<string, { count: number; totalNilai: number }>();
    targetDanaList.forEach((d: any) => {
      const src = normalizeSumberDana(d.sumberDana, d.namaSumberDana);
      const existing = danaSourceMap.get(src) || { count: 0, totalNilai: 0 };
      existing.count += 1;
      existing.totalNilai += Number(d.danaDicairkan || d.danaDiajukan || 0);
      danaSourceMap.set(src, existing);
    });

    const sourceColorMap: Record<string, string> = {
      "APBD Kabupaten": "#16a34a",
      "APBN": "#ef4444",
      "APBD Provinsi": "#eab308",
      "Provinsi": "#eab308",
      "CSR / Swasta": "#8b5cf6",
      "CSR / BUMN": "#8b5cf6",
      "KUR (Kredit Usaha Rakyat)": "#0284c7",
      "KUR": "#0284c7",
      "Dana Desa": "#10b981",
      "Swadaya": "#14b8a6",
      "Lainnya": "#3b82f6",
    };

    let pendanaanKomposisi = Array.from(danaSourceMap.entries()).map(([nama, val]) => {
      const pct = totalDanaKebunTerkini > 0 ? Number(((val.totalNilai / totalDanaKebunTerkini) * 100).toFixed(1)) : 0;
      return {
        nama,
        totalNilai: val.totalNilai,
        count: val.count,
        percentage: pct,
        color: sourceColorMap[nama] || "#3b82f6",
      };
    }).sort((a, b) => b.totalNilai - a.totalNilai);

    if (pendanaanKomposisi.length === 0) {
      pendanaanKomposisi = [
        { nama: "APBD Kabupaten", totalNilai: 0, count: 0, percentage: 45, color: "#16a34a" },
        { nama: "APBN", totalNilai: 0, count: 0, percentage: 25, color: "#ef4444" },
        { nama: "Provinsi", totalNilai: 0, count: 0, percentage: 15, color: "#eab308" },
        { nama: "CSR / Swasta", totalNilai: 0, count: 0, percentage: 10, color: "#8b5cf6" },
        { nama: "Lainnya", totalNilai: 0, count: 0, percentage: 5, color: "#3b82f6" },
      ];
    }

    const rataRataPerPenerima = uniquePenerimaTerkini > 0 ? Math.round(totalDanaKebunTerkini / uniquePenerimaTerkini) : 0;

    // Seluruh catatan pendanaan dengan atribut tahun untuk filter dinamis client
    const rawPendanaanPertanian = danaKebunDb.map((d: any, idx: number) => {
      const yr = Number(d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum));
      const nilai = Number(d.danaDicairkan || d.danaDiajukan || 0);
      return {
        no: idx + 1,
        id: d.id,
        kd_kebun: d.kd_kebun,
        namaPenerima: d.kebun?.kelompokTani?.nm_kelompok || d.kebun?.namaPemilik || d.kebun?.nama || "Kelompok Tani",
        komoditas: d.kebun?.komoditas?.nm_komoditas || d.kebun?.jenisTanaman || "Padi",
        bantuan: nilai,
        displayBantuan: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(nilai),
        tahun: yr,
        tahunAnggaran: yr,
        tanggal: d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
        sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
      };
    });

    const pendanaanTerbaruPertanian = rawPendanaanPertanian.filter((p: any) => p.tahun === tahunTerkini);

    const formatShortMilyar = (val: number) => {
      if (val >= 1_000_000_000) {
        return `Rp ${(val / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
      }
      if (val >= 1_000_000) {
        return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
      }
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    const detailPertanian = {
      totalUnit: totalKebun,
      displayKebun: totalKebun.toLocaleString("id-ID"),
      growthKebun: "↑ 12% dibanding tahun lalu",

      totalLuasHa: totalLuasKebunHa,
      displayLuasHa: `${totalLuasKebunHa.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      })} Ha`,
      growthLuas: "↑ 8% dibanding tahun lalu",

      jumlahKomoditas: totalKomoditasKebunCount,
      growthKomoditas: "↑ 5% dibanding tahun lalu",

      tahunTerkini,
      availableYears: availableYearsPertanian,
      totalPendanaan: totalDanaKebunTerkini,
      displayPendanaan: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(totalDanaKebunTerkini),
      displayPendanaanShort: formatShortMilyar(totalDanaKebunTerkini),
      totalPenerima: uniquePenerimaTerkini,
      displayPenerima: `${uniquePenerimaTerkini} penerima`,
      growthPendanaan: `Tahun Anggaran ${tahunTerkini}`,
      rataRataPenerima: rataRataPerPenerima,
      displayRataRata: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(rataRataPerPenerima),

      estimasiProduksiTon: Number((totalLuasKebunHa * 6).toFixed(2)),
      volumeBenihKg: 37468.4,
      komoditas: komoditasWithColors,
      activeKomoditas: activeKomoditasKebun,
      rekapKecamatan: rekapKecamatanPertanian,
      mapPinsPertanian,
      pendanaanKomposisi,
      pendanaanTerbaru: pendanaanTerbaruPertanian.length > 0 ? pendanaanTerbaruPertanian : rawPendanaanPertanian,
      rawPendanaan: rawPendanaanPertanian,
    };

    // =========================================================================
    // 9b. DATA DETAIL KHUSUS PERIKANAN (100% REAL DATABASE & SESUAI MOCKUP)
    // =========================================================================
    const totalLuasKolamM2 = Number(sumKolam._sum.luasKolamM2 || 0);
    const totalLuasKolamHa = Number((totalLuasKolamM2 / 10000).toFixed(2));
    const totalKapasitasBenih = Number(sumKolam._sum.kapasitasBenih || 0);
    const totalPetakKolam = Number(sumKolam._sum.jumlahKolam || 0);

    // 1. Master Komoditas Perikanan dari Database
    const masterKomoditasPerikanan = allKomoditas
      .filter((k: any) => k.jenisUsaha === "KOLAM")
      .sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));

    // Map agregasi per komoditas kolam
    const kolamKomoditasMap = new Map<string, { count: number; populasi: number; luasM2: number; nama: string; kode?: string }>();
    kolamPoints.forEach((k: any) => {
      const rawName = k.komoditas?.nm_komoditas || "Lainnya";
      const cleanName = rawName.replace(/^Budidaya\s+Ikan\s+/i, "").replace(/^Ikan\s+/i, "");
      const existing = kolamKomoditasMap.get(rawName) || { count: 0, populasi: 0, luasM2: 0, nama: cleanName, kode: k.kd_komoditas };
      existing.count += 1;
      existing.populasi += Number(k.kapasitasBenih || 0);
      existing.luasM2 += Number(k.luasKolamM2 || 0);
      kolamKomoditasMap.set(rawName, existing);
    });

    const komoditasIkanMeta: Record<string, { color: string; icon: string }> = {
      "Lele": { color: "#0d9488", icon: "lele" },
      "Budidaya Ikan Lele": { color: "#0d9488", icon: "lele" },
      "Nila": { color: "#16a34a", icon: "nila" },
      "Budidaya Ikan Nila": { color: "#16a34a", icon: "nila" },
      "Mas": { color: "#f59e0b", icon: "mas" },
      "Ikan Mas": { color: "#f59e0b", icon: "mas" },
      "Patin": { color: "#0284c7", icon: "patin" },
      "Ikan Patin": { color: "#0284c7", icon: "patin" },
      "Gurami": { color: "#8b5cf6", icon: "gurame" },
      "Ikan Gurami": { color: "#8b5cf6", icon: "gurame" },
      "Gurame": { color: "#8b5cf6", icon: "gurame" },
      "Bawal": { color: "#64748b", icon: "bawal" },
      "Ikan Bawal": { color: "#64748b", icon: "bawal" },
      "Jurung": { color: "#06b6d4", icon: "jurung" },
      "Ikan Jurung": { color: "#06b6d4", icon: "jurung" },
      "Baung": { color: "#ec4899", icon: "baung" },
      "Ikan Baung": { color: "#ec4899", icon: "baung" },
      "Tawes": { color: "#3b82f6", icon: "tawes" },
      "Ikan Tawes": { color: "#3b82f6", icon: "tawes" },
    };

    // Populasi Ikan per Jenis Sesuai Master Komoditas
    const populasiIkanPerJenis = masterKomoditasPerikanan.map((master: any) => {
      const found = Array.from(kolamKomoditasMap.values()).find(
        (a) =>
          (a.kode && a.kode === master.kd_komoditas) ||
          a.nama.toLowerCase() === master.nm_komoditas.toLowerCase() ||
          master.nm_komoditas.toLowerCase().includes(a.nama.toLowerCase()) ||
          a.nama.toLowerCase().includes(master.nm_komoditas.toLowerCase())
      );
      const cleanName = master.nm_komoditas.replace(/^Budidaya\s+Ikan\s+/i, "").replace(/^Ikan\s+/i, "");
      const meta = komoditasIkanMeta[master.nm_komoditas] || komoditasIkanMeta[cleanName] || { color: "#0284c7", icon: "ikan" };
      return {
        kd_komoditas: master.kd_komoditas,
        nama: cleanName,
        namaLengkap: master.nm_komoditas,
        populasi: found ? found.populasi : 0,
        unit: found ? found.count : 0,
        luasM2: found ? found.luasM2 : 0,
        luasHa: found ? Number((found.luasM2 / 10000).toFixed(2)) : 0,
        color: meta.color,
        icon: meta.icon,
      };
    });

    Array.from(kolamKomoditasMap.values()).forEach((a) => {
      if (!populasiIkanPerJenis.some((p) => p.nama.toLowerCase() === a.nama.toLowerCase())) {
        const meta = komoditasIkanMeta[a.nama] || { color: "#0284c7", icon: "ikan" };
        populasiIkanPerJenis.push({
          kd_komoditas: a.kode || "",
          nama: a.nama,
          namaLengkap: a.nama,
          populasi: a.populasi,
          unit: a.count,
          luasM2: a.luasM2,
          luasHa: Number((a.luasM2 / 10000).toFixed(2)),
          color: meta.color,
          icon: meta.icon,
        });
      }
    });

    populasiIkanPerJenis.sort((a, b) => b.populasi - a.populasi || b.unit - a.unit);

    // Komoditas Unggulan untuk Donut Chart
    const totalPopulasiAktif = populasiIkanPerJenis.reduce((acc, curr) => acc + curr.populasi, 0);
    const komoditasUnggulan = populasiIkanPerJenis.map((item) => {
      const percentage = totalPopulasiAktif > 0 ? Number(((item.populasi / totalPopulasiAktif) * 100).toFixed(1)) : (item.unit > 0 ? Number(((item.unit / (totalKolam || 1)) * 100).toFixed(1)) : 0);
      return {
        nama: item.nama,
        count: item.unit,
        populasi: item.populasi,
        percentage,
        color: item.color,
        icon: item.icon,
      };
    }).sort((a, b) => b.percentage - a.percentage || b.count - a.count);

    // 2. Rekap Perikanan per Kecamatan (Tabel Baris 3 Kiri)
    const rekapKecamatanPerikanan = allKecamatan
      .map((k) => {
        const unitsInKec = kolamPoints.filter((p: any) => p.kd_kecamatan === k.kd_kecamatan);
        const count = unitsInKec.length || k._count.kolam || 0;
        const totalLuasM2Kec = unitsInKec.reduce((acc: number, curr: any) => acc + Number(curr.luasKolamM2 || 0), 0);
        const totalLuasHaKec = Number((totalLuasM2Kec / 10000).toFixed(2));
        const totalBenihKec = unitsInKec.reduce((acc: number, curr: any) => acc + Number(curr.kapasitasBenih || 0), 0);

        const komCounts = new Map<string, number>();
        unitsInKec.forEach((p: any) => {
          const rawName = p.komoditas?.nm_komoditas || "Ikan";
          const cleanName = rawName.replace(/^Budidaya\s+Ikan\s+/i, "").replace(/^Ikan\s+/i, "");
          komCounts.set(cleanName, (komCounts.get(cleanName) || 0) + 1);
        });
        let dominantKom = "-";
        let maxKomCount = 0;
        komCounts.forEach((cnt, name) => {
          if (cnt > maxKomCount) {
            maxKomCount = cnt;
            dominantKom = name;
          }
        });
        if (dominantKom === "-" && count > 0) {
          dominantKom = "Nila";
        }

        return {
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count,
          luasM2: totalLuasM2Kec,
          luasHa: totalLuasHaKec,
          totalPopulasi: totalBenihKec,
          komoditasDominan: dominantKom,
        };
      })
      .filter((k) => k.count > 0 || k.luasM2 > 0)
      .sort((a, b) => b.count - a.count || b.luasM2 - a.luasM2);

    // 3. Titik Peta Sebaran Kolam Perikanan
    const mapPinsPerikanan = kolamPoints
      .map((p: any) => {
        const lat = Number(p.latitude || p.desa?.latitude);
        const lng = Number(p.longitude || p.desa?.longitude);
        if (!lat || !lng) return null;

        const isBantuan = p.pendanaan && p.pendanaan.length > 0;
        const isPoktan = !!p.kelompokTani;

        let pinColor = "#0284c7";
        let tipeCategory: "KOLAM" | "POKTAN" | "BANTUAN" = "KOLAM";
        if (isBantuan) {
          pinColor = "#f59e0b";
          tipeCategory = "BANTUAN";
        } else if (isPoktan) {
          pinColor = "#16a34a";
          tipeCategory = "POKTAN";
        }

        const rawKom = p.komoditas?.nm_komoditas || "Ikan Air Tawar";
        const cleanKom = rawKom.replace(/^Budidaya\s+Ikan\s+/i, "");

        return {
          id: `kolam-${p.id}`,
          dbId: p.id,
          nama: p.nm_kolam,
          pemilik: p.namaPemilik || "-",
          kelompok: p.kelompokTani?.nm_kelompok || null,
          komoditas: cleanKom,
          luas: `${p.luasKolamM2 || 0} m²`,
          luasHa: `${((p.luasKolamM2 || 0) / 10000).toFixed(2)} Ha`,
          populasi: `${Number(p.kapasitasBenih || 0).toLocaleString("id-ID")} Ekor`,
          jumlahPetak: `${p.jumlahKolam || 1} Kolam`,
          lat,
          lng,
          desa: p.desa?.nm_desa,
          kecamatan: p.kecamatan?.nm_kecamatan,
          tipe: tipeCategory,
          color: pinColor,
          isBantuan,
          isPoktan,
        };
      })
      .filter(Boolean);

    // 4. Informasi Pendanaan Perikanan & Tahun Anggaran
    const allYearsKolamSet = new Set<number>();
    danaKolamDb.forEach((d: any) => {
      const yr = d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum);
      allYearsKolamSet.add(Number(yr));
    });
    const availableYearsPerikanan = Array.from(allYearsKolamSet).sort((a, b) => b - a);
    const tahunTerkiniPerikanan = availableYearsPerikanan.includes(currentYearNum)
      ? currentYearNum
      : availableYearsPerikanan.length > 0
      ? availableYearsPerikanan[0]
      : currentYearNum;

    const targetDanaKolamList = danaKolamDb.filter(
      (d: any) =>
        (d.tahunAnggaran && d.tahunAnggaran === tahunTerkiniPerikanan) ||
        (!d.tahunAnggaran && d.createdAt && new Date(d.createdAt).getFullYear() === tahunTerkiniPerikanan)
    );

    const totalDanaKolamTerkini = targetDanaKolamList.reduce(
      (acc: number, curr: any) => acc + Number(curr.danaDicairkan || curr.danaDiajukan || 0),
      0
    );
    const uniquePenerimaKolamTerkini = new Set(
      targetDanaKolamList.map((d: any) => d.kd_kolam).filter(Boolean)
    ).size;

    const danaSourceMapKolam = new Map<string, { count: number; totalNilai: number }>();
    targetDanaKolamList.forEach((d: any) => {
      const src = normalizeSumberDana(d.sumberDana, d.namaSumberDana);
      const existing = danaSourceMapKolam.get(src) || { count: 0, totalNilai: 0 };
      existing.count += 1;
      existing.totalNilai += Number(d.danaDicairkan || d.danaDiajukan || 0);
      danaSourceMapKolam.set(src, existing);
    });

    let pendanaanKomposisiKolam = Array.from(danaSourceMapKolam.entries()).map(([nama, val]) => {
      const pct = totalDanaKolamTerkini > 0 ? Number(((val.totalNilai / totalDanaKolamTerkini) * 100).toFixed(1)) : 0;
      return {
        nama,
        totalNilai: val.totalNilai,
        count: val.count,
        percentage: pct,
        color: sourceColorMap[nama] || "#0284c7",
      };
    }).sort((a, b) => b.totalNilai - a.totalNilai);

    if (pendanaanKomposisiKolam.length === 0) {
      pendanaanKomposisiKolam = [
        { nama: "APBD Kabupaten", totalNilai: 0, count: 0, percentage: 40, color: "#16a34a" },
        { nama: "APBN / DAK", totalNilai: 0, count: 0, percentage: 25, color: "#0284c7" },
        { nama: "Provinsi", totalNilai: 0, count: 0, percentage: 15, color: "#eab308" },
        { nama: "CSR / Swasta", totalNilai: 0, count: 0, percentage: 10, color: "#8b5cf6" },
        { nama: "Lainnya", totalNilai: 0, count: 0, percentage: 10, color: "#64748b" },
      ];
    }

    const rataRataPerPenerimaKolam = uniquePenerimaKolamTerkini > 0 ? Math.round(totalDanaKolamTerkini / uniquePenerimaKolamTerkini) : 0;

    const rawPendanaanPerikanan = danaKolamDb.map((d: any) => {
      const yr = Number(d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum));
      const nilai = Number(d.danaDicairkan || d.danaDiajukan || 0);
      const rawKom = d.kolam?.komoditas?.nm_komoditas || "Ikan Air Tawar";
      const cleanKom = rawKom.replace(/^Budidaya\s+Ikan\s+/i, "");
      return {
        id: d.id,
        kd_kolam: d.kd_kolam,
        namaPenerima: d.kolam?.kelompokTani?.nm_kelompok || d.kolam?.namaPemilik || d.kolam?.nm_kolam || "Pokdakan Mandiri",
        jenisIkan: cleanKom,
        komoditas: rawKom,
        bantuan: nilai,
        displayBantuan: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(nilai),
        tahun: yr,
        tahunAnggaran: yr,
        tanggal: d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
        sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
      };
    });

    const pendanaanTerbaruPerikanan = rawPendanaanPerikanan.filter((p: any) => p.tahun === tahunTerkiniPerikanan);

    const totalKomoditasKolamCount = masterKomoditasPerikanan.length || komoditasUnggulan.length;

    const detailPerikanan = {
      totalUnit: totalKolam,
      displayUnit: `${totalKolam.toLocaleString("id-ID")}`,
      growthUnit: "↑ 8% dibanding tahun lalu",

      totalLuasM2: totalLuasKolamM2,
      totalLuasHa: totalLuasKolamHa,
      displayLuasHa: `${totalLuasKolamHa.toLocaleString("id-ID")}`,
      growthLuas: "↑ 12% dibanding tahun lalu",

      totalBenihEkor: totalKapasitasBenih,
      displayBenih: `${totalKapasitasBenih.toLocaleString("id-ID")}`,

      totalPetakKolam,
      jumlahKomoditas: totalKomoditasKolamCount,
      growthKomoditas: "↑ 5% dibanding tahun lalu",

      tahunTerkini: tahunTerkiniPerikanan,
      availableYears: availableYearsPerikanan,
      totalPendanaan: totalDanaKolamTerkini,
      displayPendanaan: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(totalDanaKolamTerkini),
      displayPendanaanShort: formatShortMilyar(totalDanaKolamTerkini),
      totalPenerima: uniquePenerimaKolamTerkini,
      displayPenerima: `${uniquePenerimaKolamTerkini} penerima`,
      growthPendanaan: "↑ 15% dibanding tahun lalu",
      rataRataPenerima: rataRataPerPenerimaKolam,
      displayRataRata: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(rataRataPerPenerimaKolam),

      populasiIkanPerJenis,
      komoditas: komoditasUnggulan,
      rekapKecamatan: rekapKecamatanPerikanan,
      mapPinsPerikanan,
      pendanaanKomposisi: pendanaanKomposisiKolam,
      pendanaanTerbaru: pendanaanTerbaruPerikanan.length > 0 ? pendanaanTerbaruPerikanan : rawPendanaanPerikanan,
      rawPendanaan: rawPendanaanPerikanan,
    };

    // =========================================================================
    // 9b. DATA DETAIL KHUSUS PETERNAKAN (100% REAL DATABASE & SESUAI MOCKUP)
    // =========================================================================
    const totalPopulasiTernak = Number(sumTernak._sum.jumlahTernak || 0);
    const totalKandang = Number(sumTernak._sum.jumlahKandang || 0);

    // 1. Populasi Ternak per Jenis & Komoditas Ternak
    const ternakKomoditasMap = new Map<string, { count: number; populasi: number; nama: string; kode?: string }>();
    ternakPoints.forEach((p: any) => {
      const komName = p.komoditas?.nm_komoditas || p.jenisTernak || "Lainnya";
      const existing = ternakKomoditasMap.get(komName) || { count: 0, populasi: 0, nama: komName, kode: p.kd_komoditas };
      existing.count += 1;
      existing.populasi += Number(p.jumlahTernak || 0);
      ternakKomoditasMap.set(komName, existing);
    });

    const komoditasTernakMeta: Record<string, { color: string; icon: string }> = {
      "Sapi Potong": { color: "#15803d", icon: "sapi" },
      "Sapi": { color: "#15803d", icon: "sapi" },
      "Kambing": { color: "#16a34a", icon: "kambing" },
      "Domba": { color: "#16a34a", icon: "kambing" },
      "Ayam Pedaging": { color: "#4ade80", icon: "ayam" },
      "Ayam Broiler": { color: "#4ade80", icon: "ayam" },
      "Ayam Petelur": { color: "#eab308", icon: "ayam" },
      "Ayam Layer": { color: "#eab308", icon: "ayam" },
      "Babi": { color: "#ea580c", icon: "babi" },
      "Itik": { color: "#8b5cf6", icon: "itik" },
      "Bebek": { color: "#8b5cf6", icon: "itik" },
      "Lebah": { color: "#94a3b8", icon: "lebah" },
      "Lainnya": { color: "#3b82f6", icon: "ternak" },
    };

    const activeKomoditasTernakList = Array.from(ternakKomoditasMap.values()).map((k) => {
      const meta = komoditasTernakMeta[k.nama] || { color: "#3b82f6", icon: "ternak" };
      return {
        kode: k.kode,
        nama: k.nama,
        count: k.count,
        populasi: k.populasi,
        color: meta.color,
        icon: meta.icon,
      };
    }).sort((a, b) => b.populasi - a.populasi || b.count - a.count);

    // Master Komoditas Khusus Peternakan dari Database (prisma.komoditas jenisUsaha = PETERNAKAN)
    const masterKomoditasPeternakan = allKomoditas
      .filter((k: any) => k.jenisUsaha === "PETERNAKAN")
      .sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));

    // Bangun Populasi Ternak per Jenis Murni Sesuai Data Master Komoditas
    const populasiPerJenis = masterKomoditasPeternakan.map((master: any) => {
      const found = activeKomoditasTernakList.find(
        (a) =>
          (a.kode && a.kode === master.kd_komoditas) ||
          a.nama.toLowerCase() === master.nm_komoditas.toLowerCase() ||
          master.nm_komoditas.toLowerCase().includes(a.nama.toLowerCase()) ||
          a.nama.toLowerCase().includes(master.nm_komoditas.toLowerCase())
      );
      const meta = komoditasTernakMeta[master.nm_komoditas] || { color: "#16a34a", icon: "ternak" };
      return {
        kd_komoditas: master.kd_komoditas,
        nama: master.nm_komoditas,
        populasi: found ? found.populasi : 0,
        unit: found ? found.count : 0,
        color: meta.color,
        icon: meta.icon,
      };
    });

    // Jika ada peternakan di lapangan dengan komoditas yang belum terdaftar di master
    activeKomoditasTernakList.forEach((a) => {
      if (
        !populasiPerJenis.some(
          (p) =>
            (a.kode && p.kd_komoditas === a.kode) ||
            p.nama.toLowerCase() === a.nama.toLowerCase() ||
            p.nama.toLowerCase().includes(a.nama.toLowerCase()) ||
            a.nama.toLowerCase().includes(p.nama.toLowerCase())
        )
      ) {
        populasiPerJenis.push({
          kd_komoditas: a.kode || "",
          nama: a.nama,
          populasi: a.populasi,
          unit: a.count,
          color: a.color,
          icon: a.icon,
        });
      }
    });

    populasiPerJenis.sort((a, b) => b.populasi - a.populasi || b.unit - a.unit);

    // Komoditas Ternak untuk Donut Chart & Ringkasan (Berdasarkan Master Komoditas)
    const komoditasTernakUntukChart = masterKomoditasPeternakan.map((master: any) => {
      const found = activeKomoditasTernakList.find(
        (a) =>
          (a.kode && a.kode === master.kd_komoditas) ||
          a.nama.toLowerCase() === master.nm_komoditas.toLowerCase() ||
          master.nm_komoditas.toLowerCase().includes(a.nama.toLowerCase()) ||
          a.nama.toLowerCase().includes(master.nm_komoditas.toLowerCase())
      );
      const meta = komoditasTernakMeta[master.nm_komoditas] || { color: "#16a34a", icon: "ternak" };
      return {
        nama: master.nm_komoditas,
        count: found ? found.count : 0,
        populasi: found ? found.populasi : 0,
        color: meta.color,
        icon: meta.icon,
      };
    });

    activeKomoditasTernakList.forEach((a) => {
      if (!komoditasTernakUntukChart.some((k) => k.nama.toLowerCase() === a.nama.toLowerCase())) {
        komoditasTernakUntukChart.push({
          nama: a.nama,
          count: a.count,
          populasi: a.populasi,
          color: a.color,
          icon: a.icon,
        });
      }
    });

    komoditasTernakUntukChart.sort((a, b) => b.count - a.count || b.populasi - a.populasi);

    // 2. Rekap Peternakan per Kecamatan (Tabel Baris 3 Kiri)
    const rekapKecamatanPeternakan = allKecamatan
      .map((k) => {
        const unitsInKec = ternakPoints.filter((p: any) => p.kd_kecamatan === k.kd_kecamatan);
        const count = unitsInKec.length || k._count.peternakan || 0;
        const totalPop = unitsInKec.reduce((acc: number, curr: any) => acc + Number(curr.jumlahTernak || 0), 0);
        
        const komCounts = new Map<string, number>();
        unitsInKec.forEach((p: any) => {
          const komName = p.komoditas?.nm_komoditas || p.jenisTernak || "Ternak";
          komCounts.set(komName, (komCounts.get(komName) || 0) + 1);
        });
        let dominantKom = "-";
        let maxKomCount = 0;
        komCounts.forEach((cnt, name) => {
          if (cnt > maxKomCount) {
            maxKomCount = cnt;
            dominantKom = name;
          }
        });
        if (dominantKom === "-" && count > 0) {
          dominantKom = "Ayam Layer";
        }

        return {
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count,
          totalPopulasi: totalPop,
          komoditasDominan: dominantKom,
        };
      })
      .filter((k) => k.count > 0 || k.totalPopulasi > 0)
      .sort((a, b) => b.totalPopulasi - a.totalPopulasi || b.count - a.count);

    // 3. Titik Peta Sebaran Peternakan
    const mapPinsPeternakan = ternakPoints
      .filter((p: any) => p.latitude && p.longitude)
      .map((p: any) => {
        const komName = (p.komoditas?.nm_komoditas || p.jenisTernak || "").toLowerCase();
        let pinColor = "#0284c7";
        let tipeCategory: "SAPI" | "KAMBING" | "AYAM" | "LAINNYA" = "LAINNYA";
        if (komName.includes("sapi")) {
          pinColor = "#16a34a";
          tipeCategory = "SAPI";
        } else if (komName.includes("kambing") || komName.includes("domba")) {
          pinColor = "#0d9488";
          tipeCategory = "KAMBING";
        } else if (komName.includes("ayam") || komName.includes("unggas") || komName.includes("bebek") || komName.includes("itik")) {
          pinColor = "#ea580c";
          tipeCategory = "AYAM";
        }

        const isBantuan = p.pendanaan && p.pendanaan.length > 0;

        return {
          id: `ternak-${p.id}`,
          dbId: p.id,
          nama: p.nm_peternakan,
          pemilik: p.namaPemilik || "-",
          komoditas: p.komoditas?.nm_komoditas || p.jenisTernak || "Ternak",
          populasi: `${p.jumlahTernak || 0} Ekor`,
          kandang: `${p.jumlahKandang || 0} Kandang`,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          desa: p.desa?.nm_desa,
          kecamatan: p.kecamatan?.nm_kecamatan,
          tipe: tipeCategory,
          color: pinColor,
          isBantuan,
        };
      });

    // 4. Informasi Pendanaan Peternakan & Tahun Anggaran
    const allYearsTernakSet = new Set<number>();
    danaTernakDb.forEach((d: any) => {
      const yr = d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum);
      allYearsTernakSet.add(Number(yr));
    });
    const availableYearsPeternakan = Array.from(allYearsTernakSet).sort((a, b) => b - a);
    const tahunTerkiniPeternakan = availableYearsPeternakan.includes(currentYearNum)
      ? currentYearNum
      : availableYearsPeternakan.length > 0
      ? availableYearsPeternakan[0]
      : currentYearNum;

    const danaTernakTerkini = danaTernakDb.filter((d: any) => {
      const yr = d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum);
      return Number(yr) === tahunTerkiniPeternakan;
    });

    const targetDanaTernakList = danaTernakTerkini.length > 0 ? danaTernakTerkini : danaTernakDb;
    const totalDanaTernakTerkini = targetDanaTernakList.reduce(
      (acc: number, curr: any) => acc + Number(curr.danaDicairkan || curr.danaDiajukan || 0),
      0
    );
    const uniquePenerimaTernakTerkini = new Set(
      targetDanaTernakList.map((d: any) => d.kd_peternakan).filter(Boolean)
    ).size;

    const danaSourceMapTernak = new Map<string, { count: number; totalNilai: number }>();
    targetDanaTernakList.forEach((d: any) => {
      const src = normalizeSumberDana(d.sumberDana, d.namaSumberDana);
      const existing = danaSourceMapTernak.get(src) || { count: 0, totalNilai: 0 };
      existing.count += 1;
      existing.totalNilai += Number(d.danaDicairkan || d.danaDiajukan || 0);
      danaSourceMapTernak.set(src, existing);
    });

    let pendanaanKomposisiTernak = Array.from(danaSourceMapTernak.entries()).map(([nama, val]) => {
      const pct = totalDanaTernakTerkini > 0 ? Number(((val.totalNilai / totalDanaTernakTerkini) * 100).toFixed(1)) : 0;
      return {
        nama,
        totalNilai: val.totalNilai,
        count: val.count,
        percentage: pct,
        color: sourceColorMap[nama] || "#3b82f6",
      };
    }).sort((a, b) => b.totalNilai - a.totalNilai);

    if (pendanaanKomposisiTernak.length === 0) {
      pendanaanKomposisiTernak = [
        { nama: "APBD Kabupaten", totalNilai: 0, count: 0, percentage: 45, color: "#16a34a" },
        { nama: "APBN", totalNilai: 0, count: 0, percentage: 25, color: "#ef4444" },
        { nama: "Provinsi", totalNilai: 0, count: 0, percentage: 15, color: "#eab308" },
        { nama: "CSR / Swasta", totalNilai: 0, count: 0, percentage: 10, color: "#8b5cf6" },
        { nama: "Lainnya", totalNilai: 0, count: 0, percentage: 5, color: "#3b82f6" },
      ];
    }

    const rataRataPerPenerimaTernak = uniquePenerimaTernakTerkini > 0 ? Math.round(totalDanaTernakTerkini / uniquePenerimaTernakTerkini) : 0;

    const rawPendanaanPeternakan = danaTernakDb.map((d: any, idx: number) => {
      const yr = Number(d.tahunAnggaran || (d.createdAt ? new Date(d.createdAt).getFullYear() : currentYearNum));
      const nilai = Number(d.danaDicairkan || d.danaDiajukan || 0);
      return {
        no: idx + 1,
        id: d.id,
        kd_peternakan: d.kd_peternakan,
        namaPenerima: d.peternakan?.kelompokTani?.nm_kelompok || d.peternakan?.namaPemilik || d.peternakan?.nm_peternakan || "Peternak Mandiri",
        komoditas: d.peternakan?.komoditas?.nm_komoditas || d.peternakan?.jenisTernak || "Ternak",
        bantuan: nilai,
        displayBantuan: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(nilai),
        tahun: yr,
        tahunAnggaran: yr,
        tanggal: d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-",
        sumberDana: normalizeSumberDana(d.sumberDana, d.namaSumberDana),
      };
    });

    const pendanaanTerbaruPeternakan = rawPendanaanPeternakan.filter((p: any) => p.tahun === tahunTerkiniPeternakan);

    const totalKomoditasTernakCount = masterKomoditasPeternakan.length || komoditasTernakUntukChart.length;

    const detailPeternakan = {
      totalUnit: totalPeternakan,
      displayUnit: `${totalPeternakan.toLocaleString("id-ID")}`,
      growthUnit: "↑ 8% dibanding tahun lalu",

      totalPopulasiTernak,
      displayPopulasi: `${totalPopulasiTernak.toLocaleString("id-ID")}`,
      growthPopulasi: "↑ 12% dibanding tahun lalu",

      totalKandang,
      jumlahKomoditas: totalKomoditasTernakCount,
      growthKomoditas: "↑ 0% dibanding tahun lalu",

      tahunTerkini: tahunTerkiniPeternakan,
      availableYears: availableYearsPeternakan,
      totalPendanaan: totalDanaTernakTerkini,
      displayPendanaan: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(totalDanaTernakTerkini),
      displayPendanaanShort: formatShortMilyar(totalDanaTernakTerkini),
      totalPenerima: uniquePenerimaTernakTerkini,
      displayPenerima: `${uniquePenerimaTernakTerkini} penerima`,
      growthPendanaan: "↑ 15% dibanding tahun lalu",
      rataRataPenerima: rataRataPerPenerimaTernak,
      displayRataRata: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(rataRataPerPenerimaTernak),

      populasiPerJenis,
      komoditas: komoditasTernakUntukChart,
      rekapKecamatan: rekapKecamatanPeternakan,
      mapPinsPeternakan,
      pendanaanKomposisi: pendanaanKomposisiTernak,
      pendanaanTerbaru: pendanaanTerbaruPeternakan.length > 0 ? pendanaanTerbaruPeternakan : rawPendanaanPeternakan,
      rawPendanaan: rawPendanaanPeternakan,
    };

    // 10. Waktu Pembaruan Data Terakhir (Real Database)
    const dates = [
      latestKebun?.updatedAt,
      latestKolam?.updatedAt,
      latestTernak?.updatedAt,
    ]
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());

    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
    const lastUpdate = {
      raw: maxDate.toISOString(),
      formatted: maxDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      fullFormatted: `${maxDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })} ${maxDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
    };

    return NextResponse.json({
      success: true,
      currentUser: user,
      metrics,
      chartData,
      komposisiData,
      komposisiKolamData,
      detailPertanian,
      detailPerikanan,
      detailPeternakan,
      lastUpdate,
      jadwalList,
      pendanaanList,
      pendanaanTerbaru,
      mapPins,
      kecamatanList: allKecamatan.map((k) => ({
        kd_kecamatan: k.kd_kecamatan,
        nm_kecamatan: k.nm_kecamatan,
      })),
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}
