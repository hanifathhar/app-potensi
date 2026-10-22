export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PeranPengguna } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function POST(req: Request) {
  try {
    const { nama, username, password, level, kd_kecamatan, kd_desa } = await req.json();

    if (!nama || !username || !password) {
      return NextResponse.json(
        { error: "Nama, username, dan password wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.pengguna.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.pengguna.create({
      data: {
        nama,
        username,
        passwordHash: hashedPassword,
        peran: (level as PeranPengguna) || PeranPengguna.PETUGAS,
        kd_kecamatan: kd_kecamatan || null,
        kd_desa: kd_desa || null,
        aktif: true,
      },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        nama: newUser.nama,
        username: newUser.username,
        role: newUser.peran,
        peran: newUser.peran,
        kd_kecamatan: newUser.kd_kecamatan,
        kd_desa: newUser.kd_desa,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      message: "Registrasi berhasil",
      user: {
        id: newUser.id,
        nama: newUser.nama,
        username: newUser.username,
        peran: newUser.peran,
        role: newUser.peran,
        kd_kecamatan: newUser.kd_kecamatan,
        kd_desa: newUser.kd_desa,
      },
    });

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
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server", detail: error.message },
      { status: 500 }
    );
  }
}
