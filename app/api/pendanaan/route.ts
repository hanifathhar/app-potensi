import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisSumberDana, StatusPendanaan } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const sumberDana = searchParams.get("sumberDana") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const unitWhere: any = {};
    if (authorityFilter.kd_kecamatan) unitWhere.kd_kecamatan = authorityFilter.kd_kecamatan;
    if (authorityFilter.kd_desa) unitWhere.kd_desa = authorityFilter.kd_desa;
    const hasAuthorityFilter = Object.keys(unitWhere).length > 0;

    const [danaKebun, danaKolam, danaTernak] = await Promise.all([
      prisma.pendanaanKebun.findMany({
        where: hasAuthorityFilter ? { kebun: unitWhere } : undefined,
        include: { kebun: { include: { desa: true, kecamatan: true } } },
      }),
      prisma.pendanaanKolam.findMany({
        where: hasAuthorityFilter ? { kolam: unitWhere } : undefined,
        include: { kolam: { include: { desa: true, kecamatan: true } } },
      }),
      prisma.pendanaanPeternakan.findMany({
        where: hasAuthorityFilter ? { peternakan: unitWhere } : undefined,
        include: { peternakan: { include: { desa: true, kecamatan: true } } },
      }),
    ]);

    let combined = [
      ...danaKebun.map((d) => ({
        ...d,
        jenisUnit: "KEBUN",
        unitName: d.kebun?.nama,
        kd_kecamatan: d.kebun?.kd_kecamatan,
        kd_desa: d.kebun?.kd_desa,
        lokasi: `Desa ${d.kebun?.desa?.nm_desa || "-"}, Kec. ${d.kebun?.kecamatan?.nm_kecamatan || "-"}`,
      })),
      ...danaKolam.map((d) => ({
        ...d,
        jenisUnit: "KOLAM",
        unitName: d.kolam?.nm_kolam,
        kd_kecamatan: d.kolam?.kd_kecamatan,
        kd_desa: d.kolam?.kd_desa,
        lokasi: `Desa ${d.kolam?.desa?.nm_desa || "-"}, Kec. ${d.kolam?.kecamatan?.nm_kecamatan || "-"}`,
      })),
      ...danaTernak.map((d) => ({
        ...d,
        jenisUnit: "PETERNAKAN",
        unitName: d.peternakan?.nm_peternakan,
        kd_kecamatan: d.peternakan?.kd_kecamatan,
        kd_desa: d.peternakan?.kd_desa,
        lokasi: `Desa ${d.peternakan?.desa?.nm_desa || "-"}, Kec. ${d.peternakan?.kecamatan?.nm_kecamatan || "-"}`,
      })),
    ];

    if (sumberDana && sumberDana !== "semua") {
      combined = combined.filter((c) => c.sumberDana === sumberDana);
    }
    if (status && status !== "semua") {
      combined = combined.filter((c) => c.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (c) =>
          c.namaProgram?.toLowerCase().includes(q) ||
          c.unitName?.toLowerCase().includes(q) ||
          c.nomorUsulan?.toLowerCase().includes(q)
      );
    }

    const total = combined.length;
    const paginated = combined.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
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
      jenisUnit,
      kd_unit,
      namaProgram,
      sumberDana,
      namaSumberDana,
      tahunAnggaran,
      nomorUsulan,
      danaDiajukan,
      danaDisetujui,
      danaDicairkan,
      status,
      keterangan,
    } = body;

    if (!namaProgram || !sumberDana || !danaDiajukan || !kd_unit) {
      return NextResponse.json(
        { success: false, error: "Program, Sumber Dana, Pagu Diajukan, dan Unit Penerima wajib diisi" },
        { status: 400 }
      );
    }

    // Territory check
    if (user && user.peran !== "SUPERADMIN" && user.peran !== "ADMIN_KABUPATEN") {
      let unitKec: string | undefined;
      let unitDesa: string | undefined;
      if (jenisUnit === "KEBUN") {
        const u = await prisma.kebun.findUnique({ where: { kd_kebun: kd_unit } });
        unitKec = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      } else if (jenisUnit === "KOLAM") {
        const u = await prisma.kolam.findUnique({ where: { kd_kolam: kd_unit } });
        unitKec = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      } else {
        const u = await prisma.peternakan.findUnique({ where: { kd_peternakan: kd_unit } });
        unitKec = u?.kd_kecamatan;
        unitDesa = u?.kd_desa;
      }

      if (unitKec && !isAuthorizedForTerritory(user, unitKec, unitDesa)) {
        return NextResponse.json(
          { success: false, error: "Akses Ditolak: Unit penerima bantuan berada di luar wilayah otoritas Anda." },
          { status: 403 }
        );
      }
    }

    let created: any = null;
    const commonData = {
      namaProgram,
      sumberDana: sumberDana as JenisSumberDana,
      namaSumberDana,
      tahunAnggaran: tahunAnggaran ? parseInt(tahunAnggaran) : 2025,
      nomorUsulan,
      danaDiajukan: parseFloat(danaDiajukan),
      danaDisetujui: danaDisetujui ? parseFloat(danaDisetujui) : parseFloat(danaDiajukan),
      danaDicairkan: danaDicairkan ? parseFloat(danaDicairkan) : 0,
      status: (status as StatusPendanaan) || "RENCANA",
      keterangan,
    };

    if (jenisUnit === "KEBUN") {
      created = await prisma.pendanaanKebun.create({
        data: { ...commonData, kd_kebun: kd_unit },
      });
    } else if (jenisUnit === "KOLAM") {
      created = await prisma.pendanaanKolam.create({
        data: { ...commonData, kd_kolam: kd_unit },
      });
    } else {
      created = await prisma.pendanaanPeternakan.create({
        data: { ...commonData, kd_peternakan: kd_unit },
      });
    }

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
      jenisUnit,
      namaProgram,
      sumberDana,
      namaSumberDana,
      tahunAnggaran,
      nomorUsulan,
      danaDiajukan,
      danaDisetujui,
      danaDicairkan,
      status,
      keterangan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Pendanaan wajib diisi" }, { status: 400 });
    }

    // Check existing
    let existingKec: string | undefined;
    let existingDesa: string | undefined;
    if (jenisUnit === "KEBUN") {
      const p = await prisma.pendanaanKebun.findUnique({ where: { id }, include: { kebun: true } });
      existingKec = p?.kebun?.kd_kecamatan;
      existingDesa = p?.kebun?.kd_desa;
    } else if (jenisUnit === "KOLAM") {
      const p = await prisma.pendanaanKolam.findUnique({ where: { id }, include: { kolam: true } });
      existingKec = p?.kolam?.kd_kecamatan;
      existingDesa = p?.kolam?.kd_desa;
    } else {
      const p = await prisma.pendanaanPeternakan.findUnique({ where: { id }, include: { peternakan: true } });
      existingKec = p?.peternakan?.kd_kecamatan;
      existingDesa = p?.peternakan?.kd_desa;
    }

    if (existingKec && !isAuthorizedForTerritory(user, existingKec, existingDesa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas mengubah data di wilayah ini." },
        { status: 403 }
      );
    }

    const commonUpdate = {
      namaProgram,
      sumberDana: sumberDana as JenisSumberDana,
      namaSumberDana,
      tahunAnggaran: tahunAnggaran ? parseInt(tahunAnggaran) : 2025,
      nomorUsulan,
      danaDiajukan: danaDiajukan !== undefined ? parseFloat(danaDiajukan) : undefined,
      danaDisetujui: danaDisetujui !== undefined ? parseFloat(danaDisetujui) : undefined,
      danaDicairkan: danaDicairkan !== undefined ? parseFloat(danaDicairkan) : undefined,
      status: status as StatusPendanaan,
      keterangan,
    };

    let updated: any = null;
    if (jenisUnit === "KEBUN") {
      updated = await prisma.pendanaanKebun.update({ where: { id }, data: commonUpdate });
    } else if (jenisUnit === "KOLAM") {
      updated = await prisma.pendanaanKolam.update({ where: { id }, data: commonUpdate });
    } else {
      updated = await prisma.pendanaanPeternakan.update({ where: { id }, data: commonUpdate });
    }

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
    const jenisUnit = searchParams.get("jenisUnit") || "KEBUN";

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Pendanaan wajib diisi" }, { status: 400 });
    }

    let existingKec: string | undefined;
    let existingDesa: string | undefined;
    if (jenisUnit === "KEBUN") {
      const p = await prisma.pendanaanKebun.findUnique({ where: { id }, include: { kebun: true } });
      existingKec = p?.kebun?.kd_kecamatan;
      existingDesa = p?.kebun?.kd_desa;
    } else if (jenisUnit === "KOLAM") {
      const p = await prisma.pendanaanKolam.findUnique({ where: { id }, include: { kolam: true } });
      existingKec = p?.kolam?.kd_kecamatan;
      existingDesa = p?.kolam?.kd_desa;
    } else {
      const p = await prisma.pendanaanPeternakan.findUnique({ where: { id }, include: { peternakan: true } });
      existingKec = p?.peternakan?.kd_kecamatan;
      existingDesa = p?.peternakan?.kd_desa;
    }

    if (existingKec && !isAuthorizedForTerritory(user, existingKec, existingDesa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas menghapus data di wilayah ini." },
        { status: 403 }
      );
    }

    if (jenisUnit === "KEBUN") {
      await prisma.pendanaanKebun.delete({ where: { id } });
    } else if (jenisUnit === "KOLAM") {
      await prisma.pendanaanKolam.delete({ where: { id } });
    } else {
      await prisma.pendanaanPeternakan.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "Data Pendanaan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
