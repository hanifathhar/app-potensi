export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma, PeranPengguna } from "@prisma/client";

const API_KEY = process.env.API_KEY || "";

function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== API_KEY) {
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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID user tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nama, username, password, level, kd_kecamatan, kd_desa } = body;

    if (!nama || !username) {
      return NextResponse.json(
        { error: "Nama dan username wajib diisi" },
        { status: 400 }
      );
    }

    const dataToUpdate: Prisma.PenggunaUpdateInput = {
      nama,
      username,
    };

    if (level) {
      dataToUpdate.peran = level as PeranPengguna;
    }

    if (kd_kecamatan) {
      dataToUpdate.kecamatan = { connect: { kd_kecamatan } };
    }

    if (kd_desa) {
      dataToUpdate.desa = { connect: { kd_desa } };
    }

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.passwordHash = hashedPassword;
    }

    const updatedUser = await prisma.pengguna.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;

    const { id } = await context.params;

    await prisma.pengguna.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
