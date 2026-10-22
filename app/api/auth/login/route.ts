export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";
const API_KEY = process.env.API_KEY || "programming-123";

function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (API_KEY && apiKey && apiKey !== API_KEY) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized - Invalid API Key",
      },
      {
        status: 401,
      }
    );
  }

  return null;
}

export async function POST(req: Request) {
  const unauthorized = validateApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const pengguna = await prisma.pengguna.findFirst({
      where: { username },
      include: {
        kecamatan: true,
        desa: true,
      },
    });

    if (!pengguna) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 404 });
    }

    if (!pengguna.aktif) {
      return NextResponse.json({ error: "Akun Anda tidak aktif" }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, pengguna.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: pengguna.id,
        nama: pengguna.nama,
        username: pengguna.username,
        role: pengguna.peran,
        peran: pengguna.peran,
        kd_kecamatan: pengguna.kd_kecamatan,
        kd_desa: pengguna.kd_desa,
        kd_desa_list: (pengguna as any).kd_desa_list || [],
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userPayload = {
      id: pengguna.id,
      nama: pengguna.nama,
      username: pengguna.username,
      peran: pengguna.peran,
      role: pengguna.peran,
      kd_kecamatan: pengguna.kd_kecamatan,
      kd_desa: pengguna.kd_desa,
      kd_desa_list: (pengguna as any).kd_desa_list || [],
      kecamatan: pengguna.kecamatan,
      desa: pengguna.desa,
    };

    const response = NextResponse.json({
      message: "Login berhasil",
      user: userPayload,
      token,
    });

    // Simpan token di cookie
    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://");
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
