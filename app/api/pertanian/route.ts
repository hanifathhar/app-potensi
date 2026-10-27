import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusData } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory, canAccessSector } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (user && !canAccessSector(user, "pertanian")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Perikanan hanya dapat mengakses data perikanan." },
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

    // Filter Status Usaha / Lahan (AKTIF, ISTIRAHAT, GAGAL_PANEN, NON_AKTIF)
    if (status && status !== "semua") {
      if (status === "ISTIRAHAT") {
        where.kondisiTanaman = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        where.kondisiTanaman = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        where.OR = [
          { status: "NONAKTIF" },
          { kondisiTanaman: "Non Aktif" },
        ];
      } else if (status === "AKTIF") {
        where.status = "AKTIF";
        where.NOT = {
          kondisiTanaman: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] },
        };
      }
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { kd_kebun: { contains: search, mode: "insensitive" } },
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
      totalKebun,
      totalLuasAggregate,
      komoditasDistinct,
      statusAktif,
      statusIstirahat,
      statusGagalPanen,
      statusNonAktif,
    ] = await Promise.all([
      prisma.kebun.count({ where }),
      prisma.kebun.findMany({
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
      prisma.kebun.count({ where: statsWhere }),
      prisma.kebun.aggregate({ where: statsWhere, _sum: { luasLahanHa: true } }),
      prisma.kebun.groupBy({ by: ["kd_komoditas"], where: statsWhere, _count: true }),
      prisma.kebun.count({
        where: {
          ...statsWhere,
          status: "AKTIF",
          NOT: { kondisiTanaman: { in: ["Istirahat", "Gagal Panen", "Non Aktif"] } },
        },
      }),
      prisma.kebun.count({
        where: { ...statsWhere, kondisiTanaman: "Istirahat" },
      }),
      prisma.kebun.count({
        where: { ...statsWhere, kondisiTanaman: "Gagal Panen" },
      }),
      prisma.kebun.count({
        where: {
          ...statsWhere,
          OR: [{ status: "NONAKTIF" }, { kondisiTanaman: "Non Aktif" }],
        },
      }),
    ]);

    // Format data with normalized statusUsaha
    const formattedData = data.map((item) => {
      let statusUsaha = "AKTIF";
      if (item.kondisiTanaman === "Istirahat") statusUsaha = "ISTIRAHAT";
      else if (item.kondisiTanaman === "Gagal Panen") statusUsaha = "GAGAL_PANEN";
      else if (item.status === "NONAKTIF" || item.kondisiTanaman === "Non Aktif") statusUsaha = "NON_AKTIF";
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
        totalKebun,
        totalLuasHa: Number(totalLuasAggregate._sum.luasLahanHa || 0),
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
    if (user && !canAccessSector(user, "pertanian")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Perikanan hanya dapat mengakses data perikanan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      kd_kebun,
      nama,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      luasLahanHa,
      tahunTanam,
      sistemTanam,
      kondisiTanaman,
      statusLahan,
      deskripsi,
      status,
      fotoUrl,
      batasLahan,
      warnaPolygon,
    } = body;

    if (!kd_kebun || !nama || !kd_desa || !kd_kecamatan || !kd_komoditas) {
      return NextResponse.json(
        { success: false, error: "Kode Kebun, Nama, Wilayah, dan Komoditas wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAuthorizedForTerritory(user, kd_kecamatan, kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menambah data di luar wilayah tugas Anda." },
        { status: 403 }
      );
    }

    const exists = await prisma.kebun.findUnique({ where: { kd_kebun } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Kebun sudah digunakan" },
        { status: 400 }
      );
    }

    let dbStatus: StatusData = "AKTIF";
    let dbKondisiTanaman = kondisiTanaman || "Baik";
    if (status === "ISTIRAHAT") {
      dbStatus = "AKTIF";
      dbKondisiTanaman = "Istirahat";
    } else if (status === "GAGAL_PANEN") {
      dbStatus = "AKTIF";
      dbKondisiTanaman = "Gagal Panen";
    } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
      dbStatus = "NONAKTIF";
      dbKondisiTanaman = "Non Aktif";
    } else if (status === "AKTIF") {
      dbStatus = "AKTIF";
      if (!kondisiTanaman || kondisiTanaman === "Istirahat" || kondisiTanaman === "Gagal Panen" || kondisiTanaman === "Non Aktif") {
        dbKondisiTanaman = "Baik";
      }
    }

    const created = await prisma.kebun.create({
      data: {
        kd_kebun,
        nama,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        luasLahanHa: luasLahanHa ? parseFloat(luasLahanHa) : null,
        tahunTanam: tahunTanam ? parseInt(tahunTanam) : null,
        sistemTanam,
        kondisiTanaman: dbKondisiTanaman,
        statusLahan,
        deskripsi,
        status: dbStatus,
        batasLahan: batasLahan ? (typeof batasLahan === "string" ? JSON.parse(batasLahan) : batasLahan) : null,
        warnaPolygon: warnaPolygon || null,
        foto: fotoUrl
          ? {
              create: {
                url: fotoUrl,
                judul: "Foto Kegiatan / Lahan",
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
    if (user && !canAccessSector(user, "pertanian")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Perikanan hanya dapat mengakses data perikanan." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      id,
      kd_kebun,
      nama,
      kd_desa,
      kd_kecamatan,
      kd_kelompok,
      kd_komoditas,
      namaPemilik,
      alamatLokasi,
      latitude,
      longitude,
      luasLahanHa,
      tahunTanam,
      sistemTanam,
      kondisiTanaman,
      statusLahan,
      deskripsi,
      status,
      fotoUrl,
      batasLahan,
      warnaPolygon,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kebun wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kebun.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data kebun tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    let dbStatus: StatusData | undefined = undefined;
    let dbKondisiTanaman = kondisiTanaman;
    if (status) {
      if (status === "ISTIRAHAT") {
        dbStatus = "AKTIF";
        dbKondisiTanaman = "Istirahat";
      } else if (status === "GAGAL_PANEN") {
        dbStatus = "AKTIF";
        dbKondisiTanaman = "Gagal Panen";
      } else if (status === "NON_AKTIF" || status === "NONAKTIF") {
        dbStatus = "NONAKTIF";
        dbKondisiTanaman = "Non Aktif";
      } else if (status === "AKTIF") {
        dbStatus = "AKTIF";
        if (!kondisiTanaman || kondisiTanaman === "Istirahat" || kondisiTanaman === "Gagal Panen" || kondisiTanaman === "Non Aktif") {
          dbKondisiTanaman = "Baik";
        }
      }
    }

    const updateData: any = {
      kd_kebun,
      nama,
      namaPemilik,
      alamatLokasi,
      latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
      longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
      luasLahanHa: luasLahanHa !== undefined ? (luasLahanHa ? parseFloat(luasLahanHa) : null) : undefined,
      tahunTanam: tahunTanam ? parseInt(tahunTanam) : null,
      sistemTanam,
      kondisiTanaman: dbKondisiTanaman !== undefined ? dbKondisiTanaman : undefined,
      statusLahan,
      deskripsi,
      status: dbStatus,
      batasLahan: batasLahan !== undefined ? (batasLahan && typeof batasLahan === "string" ? JSON.parse(batasLahan) : batasLahan) : undefined,
      warnaPolygon: warnaPolygon !== undefined ? (warnaPolygon || null) : undefined,
    };

    if (kd_desa) {
      updateData.desa = { connect: { kd_desa } };
    }
    if (kd_kecamatan) {
      updateData.kecamatan = { connect: { kd_kecamatan } };
    }
    if (kd_komoditas) {
      updateData.komoditas = { connect: { kd_komoditas } };
    }
    if (kd_kelompok) {
      updateData.kelompokTani = { connect: { kd_kelompok } };
    } else if (existing.kd_kelompok) {
      updateData.kelompokTani = { disconnect: true };
    }

    const updated = await prisma.kebun.update({
      where: { id },
      data: updateData,
    });

    if (fotoUrl) {
      const existingFoto = await prisma.fotoKebun.findFirst({ where: { kd_kebun } });
      if (existingFoto) {
        await prisma.fotoKebun.update({
          where: { id: existingFoto.id },
          data: { url: fotoUrl },
        });
      } else {
        await prisma.fotoKebun.create({
          data: {
            kd_kebun,
            url: fotoUrl,
            judul: "Foto Kegiatan / Lahan",
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
    if (user && !canAccessSector(user, "pertanian")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Admin Dinas Perikanan hanya dapat mengakses data perikanan." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kebun wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kebun.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data kebun tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    await prisma.kebun.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Data Kebun berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
