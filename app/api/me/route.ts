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

    return NextResponse.json({
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
        kecamatan: pengguna.kecamatan ? { kd_kecamatan: pengguna.kecamatan.kd_kecamatan, nm_kecamatan: pengguna.kecamatan.nm_kecamatan } : null,
        desa: pengguna.desa ? { kd_desa: pengguna.desa.kd_desa, nm_desa: pengguna.desa.nm_desa } : null,
      },
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
