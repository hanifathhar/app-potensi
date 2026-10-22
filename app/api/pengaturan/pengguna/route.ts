import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PeranPengguna } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Admin Kabupaten yang dapat melihat manajemen pengguna." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const peran = searchParams.get("peran") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (peran && peran !== "semua") {
      where.peran = peran as PeranPengguna;
    }
    if (kd_kecamatan && kd_kecamatan !== "semua") {
      where.kd_kecamatan = kd_kecamatan;
    }
    if (kd_desa && kd_desa !== "semua") {
      where.kd_desa = kd_desa;
    }

    const [total, data] = await Promise.all([
      prisma.pengguna.count({ where }),
      prisma.pengguna.findMany({
        where,
        include: {
          kecamatan: true,
          desa: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Omit sensitive hash from response
    const sanitized = data.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
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
    if (!user || (user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Admin Kabupaten yang dapat menambah akun pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nama, username, email, password, peran, kd_kecamatan, kd_desa, aktif } = body;

    if (!nama || !username || !password || !peran) {
      return NextResponse.json(
        { success: false, error: "Nama, Username, Password, dan Peran wajib diisi" },
        { status: 400 }
      );
    }

    // Check duplicate username
    const existing = await prisma.pengguna.findFirst({
      where: { username },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username sudah terdaftar, silakan gunakan username lain" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.pengguna.create({
      data: {
        nama,
        username,
        email: email && email.trim().length > 0 ? email.trim() : null,
        passwordHash,
        peran: peran as PeranPengguna,
        kd_kecamatan: kd_kecamatan && kd_kecamatan.trim().length > 0 ? kd_kecamatan.trim() : null,
        kd_desa: kd_desa && kd_desa.trim().length > 0 ? kd_desa.trim() : null,
        aktif: aktif !== undefined ? Boolean(aktif) : true,
      },
    });

    const { passwordHash: _, ...rest } = created;
    return NextResponse.json({ success: true, data: rest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Admin Kabupaten yang dapat mengedit akun pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, nama, username, email, password, peran, kd_kecamatan, kd_desa, aktif } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Pengguna wajib diisi" }, { status: 400 });
    }

    const updateData: any = {
      nama,
      username,
      email: email && email.trim().length > 0 ? email.trim() : null,
      peran: peran as PeranPengguna,
      kd_kecamatan: kd_kecamatan && kd_kecamatan.trim().length > 0 ? kd_kecamatan.trim() : null,
      kd_desa: kd_desa && kd_desa.trim().length > 0 ? kd_desa.trim() : null,
      aktif: aktif !== undefined ? Boolean(aktif) : true,
    };

    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.pengguna.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash: _, ...rest } = updated;
    return NextResponse.json({ success: true, data: rest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN")) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Hanya Admin Kabupaten yang dapat menghapus akun pengguna." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Pengguna wajib diisi" }, { status: 400 });
    }

    // Prevent deleting superadmin if last admin
    const target = await prisma.pengguna.findUnique({ where: { id } });
    if (target?.username === "admin") {
      return NextResponse.json(
        { success: false, error: "Akun Super Admin utama tidak boleh dihapus demi keamanan sistem" },
        { status: 400 }
      );
    }

    await prisma.pengguna.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
