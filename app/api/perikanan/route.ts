import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusData } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory, canAccessSector } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "perikanan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Pertanian tidak memiliki akses ke data perikanan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const kd_komoditas = searchParams.get("kd_komoditas") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const where: any = { ...authorityFilter };
    if (kd_komoditas && kd_komoditas !== "semua") where.kd_komoditas = kd_komoditas;

    // Filter Status Usaha / Kolam (AKTIF, ISTIRAHAT, GAGAL_PANEN, NON_AKTIF)
    if (status && status !== "semua") {
      if (status === "ISTIRAHAT") {
        where.kondisiKolam = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        where.kondisiKolam = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        where.OR = [
          { status: "NONAKTIF" },
          { kondisiKolam: "Non Aktif" },
        ];
      } else if (status === "AKTIF") {
        where.status = "AKTIF";
        where.NOT = {
          kondisiKolam: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] },
        };
      }
    }

    if (search) {
      where.OR = [
        { nm_kolam: { contains: search, mode: "insensitive" } },
        { kd_kolam: { contains: search, mode: "insensitive" } },
        { namaPemilik: { contains: search, mode: "insensitive" } },
      ];
    }

    // Stats territory filter
    const statsWhere: any = { ...authorityFilter };
    if (kd_kecamatan && kd_kecamatan !== "semua") statsWhere.kd_kecamatan = kd_kecamatan;
    if (kd_desa && kd_desa !== "semua") statsWhere.kd_desa = kd_desa;

    const [
      total,
      data,
      totalKolam,
      aggregateStats,
      komoditasDistinct,
      statusAktif,
      statusIstirahat,
      statusGagalPanen,
      statusNonAktif,
    ] = await Promise.all([
      prisma.kolam.count({ where }),
      prisma.kolam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          kecamatan: true,
          desa: true,
          komoditas: true,
          kelompokTani: true,
          foto: true,
        },
      }),
      prisma.kolam.count({ where: statsWhere }),
      prisma.kolam.aggregate({
        where: statsWhere,
        _sum: { luasKolamM2: true, jumlahKolam: true },
      }),
      prisma.kolam.groupBy({ by: ["kd_komoditas"], where: statsWhere, _count: true }),
      prisma.kolam.count({
        where: {
          ...statsWhere,
          status: "AKTIF",
          NOT: { kondisiKolam: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] } },
        },
      }),
      prisma.kolam.count({
        where: { ...statsWhere, kondisiKolam: "Istirahat" },
      }),
      prisma.kolam.count({
        where: { ...statsWhere, kondisiKolam: "Gagal Panen" },
      }),
      prisma.kolam.count({
        where: {
          ...statsWhere,
          OR: [{ status: "NONAKTIF" }, { kondisiKolam: "Non Aktif" }],
        },
      }),
    ]);

    // Format data with normalized statusUsaha
    const formattedData = data.map((item) => {
      let statusUsaha = "AKTIF";
      if (item.kondisiKolam === "Istirahat") statusUsaha = "ISTIRAHAT";
      else if (item.kondisiKolam === "Gagal Panen") statusUsaha = "GAGAL_PANEN";
      else if (item.status === "NONAKTIF" || item.kondisiKolam === "Non Aktif") statusUsaha = "NON_AKTIF";
      else if (item.status === "AKTIF") statusUsaha = "AKTIF";
      return {
        ...item,
        statusUsaha,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      currentUser: user,
      stats: {
        totalKolam,
        totalLuasM2: Number(aggregateStats._sum.luasKolamM2 || 0),
        totalPetak: aggregateStats._sum.jumlahKolam || 0,
        totalKomoditas: komoditasDistinct.length,
        statusAktif,
        statusIstirahat,
        statusGagalPanen,
        statusNonAktif,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "perikanan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Pertanian tidak memiliki izin mengakses data perikanan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      kd_kolam,
      nm_kolam,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      jenisKolam,
      luasKolamM2,
      jumlahKolam,
      sumberAir,
      sistemBudidaya,
      kapasitasBenih,
      deskripsi,
      kondisiKolam,
      status,
      fotoUrl,
    } = body;

    if (!kd_kolam || !nm_kolam || !kd_desa || !kd_kecamatan || !kd_komoditas) {
      return NextResponse.json(
        { success: false, error: "Kode Kolam, Nama, Wilayah, dan Komoditas wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAuthorizedForTerritory(user, kd_kecamatan, kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menambah data di luar wilayah tugas Anda." },
        { status: 403 }
      );
    }

    const exists = await prisma.kolam.findUnique({ where: { kd_kolam } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Kolam sudah digunakan" },
        { status: 400 }
      );
    }

    // Normalisasi status usaha
    let dbStatus: StatusData = "AKTIF";
    let dbKondisiKolam = kondisiKolam || "Baik";
    if (status === "ISTIRAHAT") {
      dbStatus = "AKTIF";
      dbKondisiKolam = "Istirahat";
    } else if (status === "GAGAL_PANEN") {
      dbStatus = "AKTIF";
      dbKondisiKolam = "Gagal Panen";
    } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
      dbStatus = "NONAKTIF";
      dbKondisiKolam = "Non Aktif";
    } else if (status === "AKTIF") {
      dbStatus = "AKTIF";
      if (["Istirahat", "Gagal Panen", "Non Aktif"].includes(dbKondisiKolam)) {
        dbKondisiKolam = "Baik";
      }
    } else if (status) {
      dbStatus = status as StatusData;
    }

    const created = await prisma.kolam.create({
      data: {
        kd_kolam,
        nm_kolam,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        jenisKolam,
        luasKolamM2: luasKolamM2 ? parseFloat(luasKolamM2) : null,
        jumlahKolam: jumlahKolam ? parseInt(jumlahKolam) : 1,
        sumberAir,
        sistemBudidaya,
        kapasitasBenih: kapasitasBenih ? parseFloat(kapasitasBenih) : null,
        deskripsi,
        kondisiKolam: dbKondisiKolam,
        status: dbStatus,
        foto: fotoUrl
          ? {
              create: {
                url: fotoUrl,
                judul: "Foto Kegiatan / Kolam",
                jenisFoto: "LOKASI",
                utama: true,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "perikanan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Pertanian tidak memiliki izin mengakses data perikanan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      id,
      kd_kolam,
      nm_kolam,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      jenisKolam,
      luasKolamM2,
      jumlahKolam,
      sumberAir,
      sistemBudidaya,
      kapasitasBenih,
      deskripsi,
      kondisiKolam,
      status,
      fotoUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kolam wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kolam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data kolam tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    // Normalisasi status usaha jika status dikirimkan
    let dbStatus: StatusData | undefined = undefined;
    let dbKondisiKolam = kondisiKolam;
    if (status !== undefined) {
      if (status === "ISTIRAHAT") {
        dbStatus = "AKTIF";
        dbKondisiKolam = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        dbStatus = "AKTIF";
        dbKondisiKolam = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        dbStatus = "NONAKTIF";
        dbKondisiKolam = "Non Aktif";
      } else if (status === "AKTIF") {
        dbStatus = "AKTIF";
        if (dbKondisiKolam === "Istirahat" || dbKondisiKolam === "Gagal Panen" || dbKondisiKolam === "Non Aktif") {
          dbKondisiKolam = "Baik";
        }
      } else {
        dbStatus = status as StatusData;
      }
    }

    const updated = await prisma.kolam.update({
      where: { id },
      data: {
        kd_kolam,
        nm_kolam,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        jenisKolam,
        luasKolamM2: luasKolamM2 !== undefined ? (luasKolamM2 ? parseFloat(luasKolamM2) : null) : undefined,
        jumlahKolam: jumlahKolam ? parseInt(jumlahKolam) : 1,
        sumberAir,
        sistemBudidaya,
        kapasitasBenih: kapasitasBenih !== undefined ? (kapasitasBenih ? parseFloat(kapasitasBenih) : null) : undefined,
        deskripsi,
        kondisiKolam: dbKondisiKolam !== undefined ? dbKondisiKolam : undefined,
        status: dbStatus !== undefined ? dbStatus : undefined,
      },
    });

    if (fotoUrl) {
      const existingFoto = await prisma.fotoKolam.findFirst({ where: { kd_kolam } });
      if (existingFoto) {
        await prisma.fotoKolam.update({
          where: { id: existingFoto.id },
          data: { url: fotoUrl },
        });
      } else {
        await prisma.fotoKolam.create({
          data: {
            kd_kolam,
            url: fotoUrl,
            judul: "Foto Kegiatan / Kolam",
            jenisFoto: "LOKASI",
            utama: true,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "perikanan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Pertanian tidak memiliki izin mengakses data perikanan." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kolam wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kolam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data kolam tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    await prisma.kolam.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Data Kolam berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
