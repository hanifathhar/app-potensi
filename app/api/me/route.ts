import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    let token = match ? match[1] : req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const pengguna = await prisma.pengguna.findUnique({
      where: { id: String(decoded.id) },
      include: {
        kecamatan: true,
        desa: true,
      },
    });

    if (!pengguna) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const desaList = (pengguna as any).kd_desa_list && (pengguna as any).kd_desa_list.length > 0
      ? (pengguna as any).kd_desa_list
      : pengguna.kd_desa
      ? [pengguna.kd_desa]
      : [];

    const newToken = jwt.sign(
      {
        id: pengguna.id,
        nama: pengguna.nama,
        username: pengguna.username,
        role: pengguna.peran,
        peran: pengguna.peran,
        kd_kecamatan: pengguna.kd_kecamatan,
        kd_desa: pengguna.kd_desa,
        kd_desa_list: desaList,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      user: {
        id: pengguna.id,
        nama: pengguna.nama,
        username: pengguna.username,
        email: pengguna.email,
        peran: pengguna.peran,
        role: pengguna.peran,
        aktif: pengguna.aktif,
        kd_kecamatan: pengguna.kd_kecamatan,
        kd_desa: pengguna.kd_desa,
        kd_desa_list: desaList,
        kecamatan: pengguna.kecamatan ? { kd_kecamatan: pengguna.kecamatan.kd_kecamatan, nm_kecamatan: pengguna.kecamatan.nm_kecamatan } : null,
        desa: pengguna.desa ? { kd_desa: pengguna.desa.kd_desa, nm_desa: pengguna.desa.nm_desa } : null,
      },
      token: newToken,
    });

    response.cookies.set({
      name: "token",
      value: newToken,
      httpOnly: true,
      secure: req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
