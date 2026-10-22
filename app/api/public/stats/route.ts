import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [kecamatan, desa, kelompokTani, kebun, kolam, peternakan, komoditas] = await Promise.all([
      prisma.kecamatan.count({ where: { aktif: true } }),
      prisma.desa.count({ where: { aktif: true } }),
      prisma.kelompokTani.count(),
      prisma.kebun.count(),
      prisma.kolam.count(),
      prisma.peternakan.count(),
      prisma.komoditas.count({ where: { aktif: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kecamatan,
        desa,
        kelompokTani,
        kebun,
        kolam,
        peternakan,
        komoditas,
      },
    });
  } catch (error: any) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data statistik", error: error.message },
      { status: 500 }
    );
  }
}
