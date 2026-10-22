import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisUsaha } from "@prisma/client";
import { getUserFromRequest, isAuthorizedForMasterData } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const jenisUsaha = searchParams.get("jenisUsaha") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nm_komoditas: { contains: search, mode: "insensitive" } },
        { kd_komoditas: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }
    if (jenisUsaha && jenisUsaha !== "semua") {
      where.jenisUsaha = jenisUsaha as JenisUsaha;
    }

    const [total, data] = await Promise.all([
      prisma.komoditas.count({ where }),
      prisma.komoditas.findMany({
        where,
        orderBy: [{ jenisUsaha: "asc" }, { urutan: "asc" }, { nm_komoditas: "asc" }],
        skip,
        take: limit,
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
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master komoditas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { kd_komoditas, nm_komoditas, jenisUsaha, satuanDefault, urutan, deskripsi } = body;

    if (!nm_komoditas || !jenisUsaha) {
      return NextResponse.json(
        { success: false, error: "Nama Komoditas dan Sektor Jenis Usaha wajib diisi" },
        { status: 400 }
      );
    }

    const generatedKode =
      kd_komoditas && kd_komoditas.trim().length > 0
        ? kd_komoditas.trim()
        : `KMD-${jenisUsaha.substring(0, 3)}-${Date.now().toString().slice(-4)}`;

    const created = await prisma.komoditas.create({
      data: {
        kd_komoditas: generatedKode,
        nm_komoditas,
        jenisUsaha: jenisUsaha as JenisUsaha,
        satuanDefault: satuanDefault || "Kg",
        urutan: urutan ? parseInt(urutan) : 0,
        deskripsi: deskripsi || null,
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
    if (!isAuthorizedForMasterData(user)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master komoditas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, kd_komoditas, nm_komoditas, jenisUsaha, satuanDefault, urutan, deskripsi, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Komoditas wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.komoditas.update({
      where: { id },
      data: {
        kd_komoditas,
        nm_komoditas,
        jenisUsaha: jenisUsaha as JenisUsaha,
        satuanDefault: satuanDefault || "Kg",
        urutan: urutan ? parseInt(urutan) : 0,
        deskripsi: deskripsi || null,
        aktif: aktif !== undefined ? Boolean(aktif) : true,
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
        { success: false, error: "Akses Ditolak: Hanya Superadmin dan Admin Kabupaten yang dapat mengelola data master komoditas." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Komoditas wajib diisi" }, { status: 400 });
    }

    await prisma.komoditas.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Komoditas berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
