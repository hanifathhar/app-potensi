export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        {
          message: "Password lama dan baru wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    const token =
      req.headers.get("cookie")?.split("token=")[1]?.split(";")[0] ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        {
          message: "Token tidak valid",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.pengguna.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    const cocok = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!cocok) {
      return NextResponse.json(
        {
          message: "Password lama salah",
        },
        {
          status: 400,
        }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.pengguna.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: hashed,
      },
    });

    return NextResponse.json({
      message: "Password berhasil diubah",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        message: error.message || "Terjadi kesalahan server",
      },
      {
        status: 500,
      }
    );
  }
}