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
    const kd_komoditas = searchParams.get("kd_komoditas") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const where: any = { ...authorityFilter };
    if (kd_komoditas && kd_komoditas !== "semua") where.kd_komoditas = kd_komoditas;
    if (status && status !== "semua") where.status = status as StatusData;

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { kd_kebun: { contains: search, mode: "insensitive" } },
        { namaPemilik: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
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
        kondisiTanaman,
        statusLahan,
        deskripsi,
        status: (status as StatusData) || "AKTIF",
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

    const updated = await prisma.kebun.update({
      where: { id },
      data: {
        kd_kebun,
        nama,
        kd_desa,
        kd_kecamatan,
        kd_kelompok: kd_kelompok || null,
        kd_komoditas,
        namaPemilik,
        alamatLokasi,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        luasLahanHa: luasLahanHa !== undefined ? (luasLahanHa ? parseFloat(luasLahanHa) : null) : undefined,
        tahunTanam: tahunTanam ? parseInt(tahunTanam) : null,
        sistemTanam,
        kondisiTanaman,
        statusLahan,
        deskripsi,
        status: status as StatusData,
      },
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
