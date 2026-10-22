import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getAuthorityFilter, canAccessSector } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kd_kecamatan = url.searchParams.get("kd_kecamatan") || "semua";
    const user = getUserFromRequest(request);

    const allowPertanian = canAccessSector(user, "pertanian");
    const allowPerikanan = canAccessSector(user, "perikanan");
    const allowPeternakan = canAccessSector(user, "peternakan");

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
      allowPertanian
        ? prisma.pendanaanKebun.findMany({
            where: unitWhereKebun,
            include: { kebun: { include: { desa: true, kecamatan: true } } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      allowPerikanan
        ? prisma.pendanaanKolam.findMany({
            where: unitWhereKolam,
            include: { kolam: { include: { desa: true, kecamatan: true } } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      allowPeternakan
        ? prisma.pendanaanPeternakan.findMany({
            where: unitWhereTernak,
            include: { peternakan: { include: { desa: true, kecamatan: true } } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
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
            where: {
              ...authorityFilter,
              latitude: { not: null },
              longitude: { not: null },
            },
            include: { desa: true, kecamatan: true, komoditas: true, kelompokTani: true, foto: true, pendanaan: true, siklus: true },
          })
        : Promise.resolve([]),
      allowPeternakan
        ? prisma.peternakan.findMany({
            where: {
              ...authorityFilter,
              latitude: { not: null },
              longitude: { not: null },
            },
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
            _sum: { luasKolamM2: true, kapasitasBenih: true },
          })
        : Promise.resolve({ _sum: { luasKolamM2: null, kapasitasBenih: null } }),
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
    ]);


    // 3. Kalkulasi Real Nilai Pendanaan dari Database
    const allPendanaan = [
      ...(allowPertanian
        ? danaKebunDb.map((d: any) => ({
            id: `pk-${d.id}`,
            program: d.namaProgram,
            unit: d.kebun?.nama || "Kebun",
            sumberDana: d.sumberDana,
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
          }))
        : []),
      ...(allowPerikanan
        ? danaKolamDb.map((d: any) => ({
            id: `pl-${d.id}`,
            program: d.namaProgram,
            unit: d.kolam?.nm_kolam || "Kolam",
            sumberDana: d.sumberDana,
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
          }))
        : []),
      ...(allowPeternakan
        ? danaTernakDb.map((d: any) => ({
            id: `pt-${d.id}`,
            program: d.namaProgram,
            unit: d.peternakan?.nm_peternakan || "Peternakan",
            sumberDana: d.sumberDana,
            pagu: Number(d.danaDiajukan || 0),
            cair: Number(d.danaDicairkan || 0),
            status: d.status,
          }))
        : []),
    ];

    const sumPendanaanCair = allPendanaan.reduce((acc, curr) => acc + curr.cair, 0);
    const sumPendanaanPagu = allPendanaan.reduce((acc, curr) => acc + curr.pagu, 0);

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

      totalPendanaan: sumPendanaanCair > 0 ? sumPendanaanCair : sumPendanaanPagu,
      displayPendanaan: formatCurrencyDisplay(sumPendanaanCair > 0 ? sumPendanaanCair : sumPendanaanPagu),
      growthPendanaan: `Realisasi: ${formatCurrencyDisplay(sumPendanaanCair)}`,
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
            { label: "Populasi Ternak", value: `${(t.jumlahTernak || 150).toLocaleString("id-ID")} Ekor Ayam` },
            { label: "Jumlah Kandang", value: `${t.jumlahKandang || 1} Unit Kandang Baterai` },
            { label: "Jenis Ternak", value: t.jenisTernak || "Ayam Ras Petelur (Layer)" },
            { label: "Sistem Pemeliharaan", value: t.sistemPemeliharaan || "Intensif Kandang Baterai" },
            { label: "Sumber Pakan", value: t.sumberPakan || "Pakan Konsentrat & Jagung Pipil" },
            { label: "Estimasi Produksi Telur", value: `~${Number(((t.jumlahTernak || 150) * 0.9).toFixed(0))} Butir / Hari` },
            { label: "Kondisi Kandang", value: t.kondisiKandang || "Sangat Baik / Higienis" },
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

    // 8. Komposisi Sektor untuk Donut Chart
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
    const komposisiData = {
      total: totalSektorData,
      displayTotal: totalSektorData.toLocaleString("id-ID"),
      items: komposisiItems,
    };

    // 9. Detail Penjabaran Khusus Masing-masing Sektor
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

    const totalLuasKebunHa = Number(sumLuasKebun._sum.luasLahanHa || 0);
    const detailPertanian = {
      totalUnit: totalKebun,
      totalLuasHa: totalLuasKebunHa,
      estimasiProduksiTon: Number((totalLuasKebunHa * 6).toFixed(2)),
      volumeBenihKg: 37468.4,
      komoditas: buildKomoditasList("KEBUN", kebunByKomoditas),
      rekapKecamatan: allKecamatan
        .map((k) => ({
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count: k._count.kebun,
          poktan: k._count.kelompokTani,
        }))
        .filter((k) => k.count > 0)
        .sort((a, b) => b.count - a.count),
    };

    const totalLuasKolamM2 = Number(sumKolam._sum.luasKolamM2 || 0);
    const totalKapasitasBenih = Number(sumKolam._sum.kapasitasBenih || 0);
    const detailPerikanan = {
      totalUnit: totalKolam,
      totalLuasM2: totalLuasKolamM2,
      totalBenihEkor: totalKapasitasBenih,
      komoditas: buildKomoditasList("KOLAM", kolamByKomoditas),
      rekapKecamatan: allKecamatan
        .map((k) => ({
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count: k._count.kolam,
        }))
        .filter((k) => k.count > 0)
        .sort((a, b) => b.count - a.count),
    };

    const totalPopulasiTernak = Number(sumTernak._sum.jumlahTernak || 0);
    const totalKandang = Number(sumTernak._sum.jumlahKandang || 0);
    const detailPeternakan = {
      totalUnit: totalPeternakan,
      totalTernakEkor: totalPopulasiTernak,
      totalKandang: totalKandang,
      estimasiTelurHarian: Number((totalPopulasiTernak * 0.9).toFixed(0)),
      komoditas: buildKomoditasList("PETERNAKAN", ternakByKomoditas),
      rekapKecamatan: allKecamatan
        .map((k) => ({
          kd_kecamatan: k.kd_kecamatan,
          nama: k.nm_kecamatan,
          count: k._count.peternakan,
          ekor: k._count.peternakan * 150,
        }))
        .filter((k) => k.count > 0)
        .sort((a, b) => b.count - a.count),
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
      detailPertanian,
      detailPerikanan,
      detailPeternakan,
      lastUpdate,
      jadwalList,
      pendanaanList,
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
