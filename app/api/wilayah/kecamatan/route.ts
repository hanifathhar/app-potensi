import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAuthorizedForMasterData } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = { aktif: true };
    if (search) {
      where.OR = [
        { nm_kecamatan: { contains: search, mode: "insensitive" } },
        { kd_kecamatan: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.kecamatan.count({ where }),
      prisma.kecamatan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_kecamatan: "asc" },
        include: {
          _count: {
            select: { desa: true, kebun: true, kolam: true, peternakan: true, kelompokTani: true },
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
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!isAuthorizedForMasterData(user)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master kecamatan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { kd_kecamatan, nm_kecamatan } = body;

    if (!kd_kecamatan || !nm_kecamatan) {
      return NextResponse.json(
        { success: false, error: "Kode dan Nama Kecamatan wajib diisi" },
        { status: 400 }
      );
    }

    const exists = await prisma.kecamatan.findUnique({ where: { kd_kecamatan } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Kecamatan sudah digunakan" },
        { status: 400 }
      );
    }

    const created = await prisma.kecamatan.create({
      data: { kd_kecamatan, nm_kecamatan, aktif: true },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!isAuthorizedForMasterData(user)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master kecamatan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, kd_kecamatan, nm_kecamatan, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kecamatan wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.kecamatan.update({
      where: { id },
      data: {
        kd_kecamatan,
        nm_kecamatan,
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
    if (!isAuthorizedForMasterData(user)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master kecamatan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Kecamatan wajib diisi" }, { status: 400 });
    }

    await prisma.kecamatan.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Kecamatan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
