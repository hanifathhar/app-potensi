import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisSumberDana, StatusPendanaan } from "@prisma/client";
import { getUserFromRequest, getAuthorityFilter, isAuthorizedForTerritory } from "@/lib/auth";

function checkUserSectorPermission(user: any, jenisUnit?: string): { allowed: boolean; message?: string } {
  if (!user) {
    return {
      allowed: false,
      message: "Sesi login tidak valid. Silakan login kembali.",
    };
  }

  const isSuperAdmin = user?.peran === "SUPERADMIN" || user?.peran === "ADMIN_KABUPATEN";
  if (isSuperAdmin) return { allowed: true };

  const isPertanianAdmin = user?.peran === "ADMIN_PERTANIAN" || user?.peran === "PPL_PERTANIAN";
  const isPerikananAdmin = user?.peran === "ADMIN_PERIKANAN" || user?.peran === "PPL_PERIKANAN";
  const isLocalOfficer =
    user?.peran === "ADMIN_KECAMATAN" ||
    user?.peran === "ADMIN_DESA" ||
    user?.peran === "PETUGAS";

  if (!isPertanianAdmin && !isPerikananAdmin && !isLocalOfficer) {
    return {
      allowed: false,
      message: "Akses Ditolak: Anda tidak memiliki wewenang mengelola data pendanaan.",
    };
  }

  if (jenisUnit) {
    if (isPertanianAdmin && jenisUnit === "KOLAM") {
      return {
        allowed: false,
        message: "Akses Ditolak: Admin Dinas Pertanian tidak memiliki izin mengelola data perikanan.",
      };
    }

    if (isPerikananAdmin && jenisUnit !== "KOLAM") {
      return {
        allowed: false,
        message: "Akses Ditolak: Admin Dinas Perikanan hanya memiliki izin mengelola data perikanan.",
      };
    }
  }

  return { allowed: true };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kd_kecamatan = searchParams.get("kd_kecamatan") || "";
    const kd_desa = searchParams.get("kd_desa") || "";
    const sumberDana = searchParams.get("sumberDana") || "";
    const status = searchParams.get("status") || "";
    const tahun = searchParams.get("tahun") || "";
    const kd_unit = searchParams.get("kd_unit") || "";
    const jenisUnit = searchParams.get("jenisUnit") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const user = getUserFromRequest(request);
    const authCheck = checkUserSectorPermission(user, jenisUnit);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.message },
        { status: 403 }
      );
    }

    // Direct unit inquiry (used by Unit Detail Views)
    if (kd_unit) {
      let list: any[] = [];
      if (jenisUnit === "KEBUN") {
        list = await prisma.pendanaanKebun.findMany({
          where: { kd_kebun: kd_unit },
          orderBy: { tahunAnggaran: "desc" },
        });
      } else if (jenisUnit === "KOLAM") {
        list = await prisma.pendanaanKolam.findMany({
          where: { kd_kolam: kd_unit },
          orderBy: { tahunAnggaran: "desc" },
        });
      } else if (jenisUnit === "PETERNAKAN") {
        list = await prisma.pendanaanPeternakan.findMany({
          where: { kd_peternakan: kd_unit },
          orderBy: { tahunAnggaran: "desc" },
        });
      } else {
        const [dk, dl, dp] = await Promise.all([
          prisma.pendanaanKebun.findMany({ where: { kd_kebun: kd_unit }, orderBy: { tahunAnggaran: "desc" } }),
          prisma.pendanaanKolam.findMany({ where: { kd_kolam: kd_unit }, orderBy: { tahunAnggaran: "desc" } }),
          prisma.pendanaanPeternakan.findMany({ where: { kd_peternakan: kd_unit }, orderBy: { tahunAnggaran: "desc" } }),
        ]);
        list = [...dk, ...dl, ...dp];
      }
      return NextResponse.json({ success: true, data: list });
    }


    const isSuperAdmin = user?.peran === "SUPERADMIN" || user?.peran === "ADMIN_KABUPATEN";
    const isPertanianAdmin = user?.peran === "ADMIN_PERTANIAN";
    const isPerikananAdmin = user?.peran === "ADMIN_PERIKANAN";

    const authorityFilter = getAuthorityFilter(user, kd_kecamatan, kd_desa);

    const unitWhere: any = {};
    if (authorityFilter.kd_kecamatan) unitWhere.kd_kecamatan = authorityFilter.kd_kecamatan;
    if (authorityFilter.kd_desa) unitWhere.kd_desa = authorityFilter.kd_desa;
    const hasAuthorityFilter = Object.keys(unitWhere).length > 0;

    const shouldFetchKebun = isSuperAdmin || isPertanianAdmin;
    const shouldFetchKolam = isSuperAdmin || isPerikananAdmin;
    const shouldFetchTernak = isSuperAdmin || isPertanianAdmin;

    const [danaKebun, danaKolam, danaTernak] = await Promise.all([
      shouldFetchKebun
        ? prisma.pendanaanKebun.findMany({
            where: hasAuthorityFilter ? { kebun: unitWhere } : undefined,
            include: { kebun: { include: { desa: true, kecamatan: true } } },
          })
        : Promise.resolve([]),
      shouldFetchKolam
        ? prisma.pendanaanKolam.findMany({
            where: hasAuthorityFilter ? { kolam: unitWhere } : undefined,
            include: { kolam: { include: { desa: true, kecamatan: true } } },
          })
        : Promise.resolve([]),
      shouldFetchTernak
        ? prisma.pendanaanPeternakan.findMany({
            where: hasAuthorityFilter ? { peternakan: unitWhere } : undefined,
            include: { peternakan: { include: { desa: true, kecamatan: true } } },
          })
        : Promise.resolve([]),
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

    // Hitung statistik penerima & nilai uang berdasarkan tahun anggaran (sesuai filter tahun)
    let statsData = combined;
    if (tahun && tahun !== "semua") {
      statsData = combined.filter((c) => c.tahunAnggaran?.toString() === tahun);
    }

    const calcSectorStats = (items: typeof combined) => {
      const jumlahPenerima = items.length;
      const totalUnitUnik = new Set(
        items.map((i: any) => i.kd_kebun || i.kd_kolam || i.kd_peternakan).filter(Boolean)
      ).size;
      const nilaiDicairkan = items.reduce((sum, i: any) => sum + Number(i.danaDicairkan || 0), 0);
      const nilaiDisetujui = items.reduce((sum, i: any) => sum + Number(i.danaDisetujui || 0), 0);
      const nilaiDiajukan = items.reduce((sum, i: any) => sum + Number(i.danaDiajukan || 0), 0);

      return {
        jumlahPenerima,
        totalUnitUnik,
        nilaiDicairkan,
        nilaiDisetujui,
        nilaiDiajukan,
      };
    };

    const stats = {
      tahun: tahun || "semua",
      total: calcSectorStats(statsData),
      pertanian: calcSectorStats(statsData.filter((c) => c.jenisUnit === "KEBUN")),
      perikanan: calcSectorStats(statsData.filter((c) => c.jenisUnit === "KOLAM")),
      peternakan: calcSectorStats(statsData.filter((c) => c.jenisUnit === "PETERNAKAN")),
    };

    if (sumberDana && sumberDana !== "semua") {
      combined = combined.filter((c) => c.sumberDana === sumberDana);
    }
    if (status && status !== "semua") {
      combined = combined.filter((c) => c.status === status);
    }
    if (tahun && tahun !== "semua") {
      combined = combined.filter((c) => c.tahunAnggaran?.toString() === tahun);
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
      stats,
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

    const sectorCheck = checkUserSectorPermission(user, jenisUnit);
    if (!sectorCheck.allowed) {
      return NextResponse.json({ success: false, error: sectorCheck.message }, { status: 403 });
    }

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
      tahunAnggaran: tahunAnggaran ? parseInt(tahunAnggaran) : new Date().getFullYear(),
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

    const sectorCheck = checkUserSectorPermission(user, jenisUnit);
    if (!sectorCheck.allowed) {
      return NextResponse.json({ success: false, error: sectorCheck.message }, { status: 403 });
    }

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
      tahunAnggaran: tahunAnggaran ? parseInt(tahunAnggaran) : new Date().getFullYear(),
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

    const sectorCheck = checkUserSectorPermission(user, jenisUnit);
    if (!sectorCheck.allowed) {
      return NextResponse.json({ success: false, error: sectorCheck.message }, { status: 403 });
    }

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
