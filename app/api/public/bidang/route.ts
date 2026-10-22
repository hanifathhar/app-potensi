import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const komoditasList = await prisma.komoditas.findMany({
      where: { aktif: true },
      orderBy: [{ jenisUsaha: "asc" }, { urutan: "asc" }],
    });

    return NextResponse.json({ success: true, data: komoditasList });
  } catch (error: any) {
    console.error("Error fetching komoditas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data komoditas", error: error.message },
      { status: 500 }
    );
  }
}
