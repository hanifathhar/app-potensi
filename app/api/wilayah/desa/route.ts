import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan);

    const where: any = { aktif: true, ...authorityFilter };
    if (search) {
      where.OR = [
        { nm_desa: { contains: search, mode: "insensitive" } },
        { kd_desa: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.desa.count({ where }),
      prisma.desa.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ kd_kecamatan: "asc" }, { nm_desa: "asc" }],
        include: {
          kecamatan: true,
          _count: {
            select: { kebun: true, kolam: true, peternakan: true, kelompokTani: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      currentUser: user,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { kd_desa, nm_desa, kd_kecamatan, alamat, latitude, longitude } = body;

    if (!kd_desa || !nm_desa || !kd_kecamatan) {
      return NextResponse.json(
        { success: false, error: "Kode Desa, Nama Desa, dan Kecamatan wajib diisi" },
        { status: 400 }
      );
    }

    if (!isAuthorizedForTerritory(user, kd_kecamatan)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menambah desa di kecamatan ini." },
        { status: 403 }
      );
    }

    const exists = await prisma.desa.findUnique({ where: { kd_desa } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Desa sudah digunakan" },
        { status: 400 }
      );
    }

    const created = await prisma.desa.create({
      data: {
        kd_desa,
        nm_desa,
        kd_kecamatan,
        alamat,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        aktif: true,
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
    const { id, kd_desa, nm_desa, kd_kecamatan, alamat, latitude, longitude, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Desa wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.desa.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data desa tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data desa di kecamatan ini." },
        { status: 403 }
      );
    }

    const updated = await prisma.desa.update({
      where: { id },
      data: {
        kd_desa,
        nm_desa,
        kd_kecamatan,
        alamat,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        aktif: aktif !== undefined ? aktif : true,
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
      return NextResponse.json({ success: false, error: "ID Desa wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.desa.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Data desa tidak ditemukan" }, { status: 404 });
    }

    if (!isAuthorizedForTerritory(user, existing.kd_kecamatan)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data desa di kecamatan ini." },
        { status: 403 }
      );
    }

    await prisma.desa.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Desa berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
