import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusData } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const status = searchParams.get("status") || "";
    const dateFilter = searchParams.get("dateFilter") || "semua";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const where: any = { ...authorityFilter };
    if (status && status !== "semua") {
      where.status = status as StatusData;
    }
    if (search) {
      where.OR = [
        { nm_kelompok: { contains: search, mode: "insensitive" } },
        { kd_kelompok: { contains: search, mode: "insensitive" } },
        { namaKetua: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date calculations for "tgl input" (createdAt)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    if (dateFilter === "today") {
      where.createdAt = { gte: startOfToday };
    } else if (dateFilter === "7days") {
      where.createdAt = { gte: startOf7Days };
    } else if (dateFilter === "month" || dateFilter === "30days") {
      where.createdAt = { gte: startOfMonth };
    } else if (dateFilter === "custom" || startDate || endDate) {
      const createdAtFilter: any = {};
      if (startDate) {
        createdAtFilter.gte = new Date(`${startDate}T00:00:00`);
      }
      if (endDate) {
        createdAtFilter.lte = new Date(`${endDate}T23:59:59.999`);
      }
      if (Object.keys(createdAtFilter).length > 0) {
        where.createdAt = createdAtFilter;
      }
    }

    // Stats territory filter
    const statsWhere: any = { ...authorityFilter };

    const [
      total,
      data,
      totalPoktan,
      baruHariIni,
      baru7Hari,
      baruBulanIni,
      totalAktif,
    ] = await Promise.all([
      prisma.kelompokTani.count({ where }),
      prisma.kelompokTani.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          kecamatan: true,
          desa: true,
          _count: {
            select: { kebun: true, kolam: true, peternakan: true, anggota: true },
          },
        },
      }),
      prisma.kelompokTani.count({ where: statsWhere }),
      prisma.kelompokTani.count({
        where: { ...statsWhere, createdAt: { gte: startOfToday } },
      }),
      prisma.kelompokTani.count({
        where: { ...statsWhere, createdAt: { gte: startOf7Days } },
      }),
      prisma.kelompokTani.count({
        where: { ...statsWhere, createdAt: { gte: startOfMonth } },
      }),
      prisma.kelompokTani.count({
        where: { ...statsWhere, status: "AKTIF" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      currentUser: user,
      stats: {
        total: totalPoktan,
        baruHariIni,
        baru7Hari,
        baruBulanIni,
        totalAktif,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const {
      kd_kelompok,
      nm_kelompok,
      kd_kecamatan,
      kd_desa,
      namaKetua,
      noTelepon,
      alamat,
      jumlahAnggota,
      tahunBerdiri,
      status,
      keterangan,
    } = body;

    if (!kd_kelompok || !nm_kelompok || !kd_kecamatan || !kd_desa || !namaKetua) {
      return NextResponse.json(
        { success: false, error: "Kode, Nama Poktan, Wilayah, dan Nama Ketua wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAuthorizedForTerritory(user, kd_kecamatan, kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menambah data di luar wilayah tugas Anda." },
        { status: 403 }
      );
    }

    const exists = await prisma.kelompokTani.findUnique({ where: { kd_kelompok } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Kelompok Tani sudah digunakan" },
        { status: 400 }
      );
    }

    const created = await prisma.kelompokTani.create({
      data: {
        kd_kelompok,
        nm_kelompok,
        kd_kecamatan,
        kd_desa,
        namaKetua,
        noTelepon,
        alamat,
        jumlahAnggota: jumlahAnggota ? parseInt(jumlahAnggota) : 0,
        tahunBerdiri: tahunBerdiri ? parseInt(tahunBerdiri) : null,
        status: (status as StatusData) || "AKTIF",
        keterangan,
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
    const body = await request.json();
    const {
      id,
      kd_kelompok,
      nm_kelompok,
      kd_kecamatan,
      kd_desa,
      namaKetua,
      noTelepon,
      alamat,
      jumlahAnggota,
      tahunBerdiri,
      status,
      keterangan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kelompok Tani wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kelompokTani.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Kelompok Tani tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    const updated = await prisma.kelompokTani.update({
      where: { id },
      data: {
        kd_kelompok,
        nm_kelompok,
        kd_kecamatan,
        kd_desa,
        namaKetua,
        noTelepon,
        alamat,
        jumlahAnggota: jumlahAnggota !== undefined ? parseInt(jumlahAnggota) : undefined,
        tahunBerdiri: tahunBerdiri ? parseInt(tahunBerdiri) : null,
        status: status as StatusData,
        keterangan,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kelompok Tani wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kelompokTani.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Kelompok Tani tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan, existing.kd_desa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    await prisma.kelompokTani.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Kelompok Tani berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
