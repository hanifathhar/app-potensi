import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisUsaha, StatusSiklus } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const kd_kebun = searchParams.get("kd_kebun") || "";
    const kd_kolam = searchParams.get("kd_kolam") || "";
    const kd_peternakan = searchParams.get("kd_peternakan") || "";
    const jenisUsaha = searchParams.get("jenisUsaha") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const where: any = {};
    if (kd_kebun) {
      where.kd_kebun = kd_kebun;
    } else if (kd_kolam) {
      where.kd_kolam = kd_kolam;
    } else if (kd_peternakan) {
      where.kd_peternakan = kd_peternakan;
    } else {
      if (authorityFilter.kd_kecamatan) {
        if (authorityFilter.kd_desa) {
          where.OR = [
            { kebun: { kd_kecamatan: authorityFilter.kd_kecamatan, kd_desa: authorityFilter.kd_desa } },
            { kolam: { kd_kecamatan: authorityFilter.kd_kecamatan, kd_desa: authorityFilter.kd_desa } },
            { peternakan: { kd_kecamatan: authorityFilter.kd_kecamatan, kd_desa: authorityFilter.kd_desa } },
          ];
        } else {
          where.OR = [
            { kebun: { kd_kecamatan: authorityFilter.kd_kecamatan } },
            { kolam: { kd_kecamatan: authorityFilter.kd_kecamatan } },
            { peternakan: { kd_kecamatan: authorityFilter.kd_kecamatan } },
          ];
        }
      } else if (authorityFilter.kd_desa) {
        where.OR = [
          { kebun: { kd_desa: authorityFilter.kd_desa } },
          { kolam: { kd_desa: authorityFilter.kd_desa } },
          { peternakan: { kd_desa: authorityFilter.kd_desa } },
        ];
      }
    }

    if (jenisUsaha && jenisUsaha !== "semua") where.jenisUsaha = jenisUsaha as JenisUsaha;
    if (status && status !== "semua") where.status = status as StatusSiklus;

    if (search) {
      const searchCondition = [
        { namaSiklus: { contains: search, mode: "insensitive" } },
        { kd_siklus: { contains: search, mode: "insensitive" } },
        { tahapKegiatan: { contains: search, mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const [total, data] = await Promise.all([
      prisma.siklusProduksi.count({ where }),
      prisma.siklusProduksi.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalMulai: "desc" },
        include: {
          kebun: { include: { desa: true, kecamatan: true, komoditas: true } },
          kolam: { include: { desa: true, kecamatan: true, komoditas: true } },
          peternakan: { include: { desa: true, kecamatan: true, komoditas: true } },
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
      kd_siklus,
      jenisUsaha,
      namaSiklus,
      tahapKegiatan,
      tanggalMulai,
      tanggalTargetPanen,
      estimasiProduksi,
      satuanProduksi,
      status,
      kd_kebun,
      kd_kolam,
      kd_peternakan,
      catatan,
    } = body;

    if (!kd_siklus || !namaSiklus || !tahapKegiatan || !tanggalMulai) {
      return NextResponse.json(
        { success: false, error: "Kode, Nama Siklus, Kegiatan, dan Tanggal Mulai wajib diisi" },
        { status: 400 }
      );
    }

    // Verify authority on target unit
    if (user && user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN") {
      let unitKecamatan: string | undefined;
      let unitDesa: string | undefined;
      if (kd_kebun) {
        const u = await prisma.kebun.findUnique({ where: { kd_kebun } });
        unitKecamatan = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      } else if (kd_kolam) {
        const u = await prisma.kolam.findUnique({ where: { kd_kolam } });
        unitKecamatan = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      } else if (kd_peternakan) {
        const u = await prisma.peternakan.findUnique({ where: { kd_peternakan } });
        unitKecamatan = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      }

      if (unitKecamatan && !isAuthorizedForTerritory(user, unitKecamatan, unitDesa)) {
        return NextResponse.json(
          { success: false, error: "Akses Ditolak: Unit usaha berada di luar wilayah otoritas Anda." },
          { status: 403 }
        );
      }
    }

    const exists = await prisma.siklusProduksi.findUnique({ where: { kd_siklus } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Kode Siklus sudah digunakan" },
        { status: 400 }
      );
    }

    const created = await prisma.siklusProduksi.create({
      data: {
        kd_siklus,
        jenisUsaha: (jenisUsaha as JenisUsaha) || "KEBUN",
        namaSiklus,
        tahapKegiatan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalTargetPanen: tanggalTargetPanen ? new Date(tanggalTargetPanen) : null,
        estimasiProduksi: estimasiProduksi ? parseFloat(estimasiProduksi) : null,
        satuanProduksi: satuanProduksi || "Kg",
        status: (status as StatusSiklus) || "BERJALAN",
        kd_kebun: kd_kebun || null,
        kd_kolam: kd_kolam || null,
        kd_peternakan: kd_peternakan || null,
        catatan,
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
      kd_siklus,
      jenisUsaha,
      namaSiklus,
      tahapKegiatan,
      tanggalMulai,
      tanggalTargetPanen,
      estimasiProduksi,
      satuanProduksi,
      status,
      kd_kebun,
      kd_kolam,
      kd_peternakan,
      catatan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Siklus wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.siklusProduksi.findUnique({
      where: { id },
      include: { kebun: true, kolam: true, peternakan: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Data siklus tidak ditemukan" }, { status: 404 });
    }

    const targetKec = existing.kebun?.kd_kecamatan || existing.kolam?.kd_kecamatan || existing.peternakan?.kd_kecamatan;
    const targetDesa = existing.kebun?.kd_desa || existing.kolam?.kd_desa || existing.peternakan?.kd_desa;
    if (targetKec && !isAuthorizedForTerritory(user, targetKec, targetDesa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    const updated = await prisma.siklusProduksi.update({
      where: { id },
      data: {
        kd_siklus,
        jenisUsaha: jenisUsaha as JenisUsaha,
        namaSiklus,
        tahapKegiatan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalTargetPanen: tanggalTargetPanen ? new Date(tanggalTargetPanen) : null,
        estimasiProduksi: estimasiProduksi !== undefined ? (estimasiProduksi ? parseFloat(estimasiProduksi) : null) : undefined,
        satuanProduksi,
        status: status as StatusSiklus,
        kd_kebun: kd_kebun || null,
        kd_kolam: kd_kolam || null,
        kd_peternakan: kd_peternakan || null,
        catatan,
      },
    });

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
      return NextResponse.json({ success: false, error: "ID Siklus wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.siklusProduksi.findUnique({
      where: { id },
      include: { kebun: true, kolam: true, peternakan: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Data siklus tidak ditemukan" }, { status: 404 });
    }

    const targetKec = existing.kebun?.kd_kecamatan || existing.kolam?.kd_kecamatan || existing.peternakan?.kd_kecamatan;
    const targetDesa = existing.kebun?.kd_desa || existing.kolam?.kd_desa || existing.peternakan?.kd_desa;
    if (targetKec && !isAuthorizedForTerritory(user, targetKec, targetDesa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    await prisma.siklusProduksi.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Siklus produksi berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
