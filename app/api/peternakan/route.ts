import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusData } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory, canAccessSector } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "peternakan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki akses ke data sektor peternakan." },
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

    // Filter Status Usaha / Peternakan (AKTIF, ISTIRAHAT, GAGAL_PANEN, NON_AKTIF)
    if (status && status !== "semua") {
      if (status === "ISTIRAHAT") {
        where.kondisiKandang = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        where.kondisiKandang = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        where.OR = [
          { status: "NONAKTIF" },
          { kondisiKandang: "Non Aktif" },
        ];
      } else if (status === "AKTIF") {
        where.status = "AKTIF";
        where.NOT = {
          kondisiKandang: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] },
        };
      }
    }

    if (search) {
      where.OR = [
        { nm_peternakan: { contains: search, mode: "insensitive" } },
        { kd_peternakan: { contains: search, mode: "insensitive" } },
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
      totalPeternakan,
      aggregateStats,
      komoditasDistinct,
      statusAktif,
      statusIstirahat,
      statusGagalPanen,
      statusNonAktif,
    ] = await Promise.all([
      prisma.peternakan.count({ where }),
      prisma.peternakan.findMany({
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
      prisma.peternakan.count({ where: statsWhere }),
      prisma.peternakan.aggregate({
        where: statsWhere,
        _sum: { jumlahTernak: true, jumlahKandang: true },
      }),
      prisma.peternakan.groupBy({ by: ["kd_komoditas"], where: statsWhere, _count: true }),
      prisma.peternakan.count({
        where: {
          ...statsWhere,
          status: "AKTIF",
          NOT: { kondisiKandang: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] } },
        },
      }),
      prisma.peternakan.count({
        where: { ...statsWhere, kondisiKandang: "Istirahat" },
      }),
      prisma.peternakan.count({
        where: { ...statsWhere, kondisiKandang: "Gagal Panen" },
      }),
      prisma.peternakan.count({
        where: {
          ...statsWhere,
          OR: [{ status: "NONAKTIF" }, { kondisiKandang: "Non Aktif" }],
        },
      }),
    ]);

    // Format data with normalized statusUsaha
    const formattedData = data.map((item) => {
      let statusUsaha = "AKTIF";
      if (item.kondisiKandang === "Istirahat") statusUsaha = "ISTIRAHAT";
      else if (item.kondisiKandang === "Gagal Panen") statusUsaha = "GAGAL_PANEN";
      else if (item.status === "NONAKTIF" || item.kondisiKandang === "Non Aktif") statusUsaha = "NON_AKTIF";
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
        totalPeternakan,
        totalPopulasi: aggregateStats._sum.jumlahTernak || 0,
        totalKandang: aggregateStats._sum.jumlahKandang || 0,
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
    if (user && !canAccessSector(user, "peternakan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki akses ke data sektor peternakan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      kd_peternakan,
      nm_peternakan,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      jenisTernak,
      jenisKandang,
      jumlahKandang,
      jumlahTernak,
      satuanTernak,
      sistemPemeliharaan,
      sumberPakan,
      deskripsi,
      kondisiKandang,
      status,
      fotoUrl,
    } = body;

    if (!kd_peternakan || !nm_peternakan || !kd_desa || !kd_kecamatan || !kd_komoditas) {
      return NextResponse.json(
        { success: false, error: "Kode Peternakan, Nama, Wilayah, dan Komoditas wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAuthorizedForTerritory(user, kd_kecamatan, kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menambah data di luar wilayah tugas Anda." },
        { status: 403 }
      );
    }

    const exists = await prisma.peternakan.findUnique({ where: { kd_peternakan } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Peternakan sudah digunakan" },
        { status: 400 }
      );
    }

    // Normalisasi status usaha
    let dbStatus: StatusData = "AKTIF";
    let dbKondisiKandang = kondisiKandang || "Baik";
    if (status === "ISTIRAHAT") {
      dbStatus = "AKTIF";
      dbKondisiKandang = "Istirahat";
    } else if (status === "GAGAL_PANEN") {
      dbStatus = "AKTIF";
      dbKondisiKandang = "Gagal Panen";
    } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
      dbStatus = "NONAKTIF";
      dbKondisiKandang = "Non Aktif";
    } else if (status === "AKTIF") {
      dbStatus = "AKTIF";
      if (["Istirahat", "Gagal Panen", "Non Aktif"].includes(dbKondisiKandang)) {
        dbKondisiKandang = "Baik";
      }
    } else if (status) {
      dbStatus = status as StatusData;
    }

    const created = await prisma.peternakan.create({
      data: {
        kd_peternakan,
        nm_peternakan,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        jenisTernak,
        jenisKandang,
        jumlahKandang: jumlahKandang ? parseInt(jumlahKandang) : 1,
        jumlahTernak: jumlahTernak ? parseInt(jumlahTernak) : 0,
        satuanTernak: satuanTernak || "Ekor",
        sistemPemeliharaan,
        sumberPakan,
        deskripsi,
        kondisiKandang: dbKondisiKandang,
        status: dbStatus,
        foto: fotoUrl
          ? {
              create: {
                url: fotoUrl,
                judul: "Foto Kegiatan / Ternak",
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
    if (user && !canAccessSector(user, "peternakan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki akses ke data sektor peternakan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      id,
      kd_peternakan,
      nm_peternakan,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      jenisTernak,
      jenisKandang,
      jumlahKandang,
      jumlahTernak,
      satuanTernak,
      sistemPemeliharaan,
      sumberPakan,
      deskripsi,
      kondisiKandang,
      status,
      fotoUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Peternakan wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.peternakan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data peternakan tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    // Normalisasi status usaha jika status dikirimkan
    let dbStatus: StatusData | undefined = undefined;
    let dbKondisiKandang = kondisiKandang;
    if (status !== undefined) {
      if (status === "ISTIRAHAT") {
        dbStatus = "AKTIF";
        dbKondisiKandang = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        dbStatus = "AKTIF";
        dbKondisiKandang = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        dbStatus = "NONAKTIF";
        dbKondisiKandang = "Non Aktif";
      } else if (status === "AKTIF") {
        dbStatus = "AKTIF";
        if (dbKondisiKandang === "Istirahat" || dbKondisiKandang === "Gagal Panen" || dbKondisiKandang === "Non Aktif") {
          dbKondisiKandang = "Baik";
        }
      } else {
        dbStatus = status as StatusData;
      }
    }

    const updated = await prisma.peternakan.update({
      where: { id },
      data: {
        kd_peternakan,
        nm_peternakan,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        jenisTernak,
        jenisKandang,
        jumlahKandang: jumlahKandang ? parseInt(jumlahKandang) : 1,
        jumlahTernak: jumlahTernak !== undefined ? parseInt(jumlahTernak) : 0,
        satuanTernak: satuanTernak || "Ekor",
        sistemPemeliharaan,
        sumberPakan,
        deskripsi,
        kondisiKandang: dbKondisiKandang !== undefined ? dbKondisiKandang : undefined,
        status: dbStatus !== undefined ? dbStatus : undefined,
      },
    });

    if (fotoUrl) {
      const existingFoto = await prisma.fotoPeternakan.findFirst({ where: { kd_peternakan } });
      if (existingFoto) {
        await prisma.fotoPeternakan.update({
          where: { id: existingFoto.id },
          data: { url: fotoUrl },
        });
      } else {
        await prisma.fotoPeternakan.create({
          data: {
            kd_peternakan,
            url: fotoUrl,
            judul: "Foto Kegiatan / Ternak",
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
    if (user && !canAccessSector(user, "peternakan")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki akses ke data sektor peternakan." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Peternakan wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.peternakan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data peternakan tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    await prisma.peternakan.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Data Peternakan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
