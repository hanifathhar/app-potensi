import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JenisFoto } from "@prisma/client";
import { getUserFromRequest, isAuthorizedForTerritory } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jenisUsaha = searchParams.get("jenisUsaha")?.toUpperCase();
    const kd_unit = searchParams.get("kd_unit");

    if (!jenisUsaha || !kd_unit) {
      return NextResponse.json(
        { success: false, error: "Parameter jenisUsaha dan kd_unit diperlukan" },
        { status: 400 }
      );
    }

    let data: any[] = [];
    if (jenisUsaha === "KEBUN") {
      data = await prisma.fotoKebun.findMany({
        where: { kd_kebun: kd_unit },
        orderBy: [{ utama: "desc" }, { createdAt: "desc" }],
      });
    } else if (jenisUsaha === "KOLAM") {
      data = await prisma.fotoKolam.findMany({
        where: { kd_kolam: kd_unit },
        orderBy: [{ utama: "desc" }, { createdAt: "desc" }],
      });
    } else if (jenisUsaha === "PETERNAKAN") {
      data = await prisma.fotoPeternakan.findMany({
        where: { kd_peternakan: kd_unit },
        orderBy: [{ utama: "desc" }, { createdAt: "desc" }],
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const {
      jenisUsaha,
      kd_unit,
      url,
      judul,
      keterangan,
      jenisFoto = "LOKASI",
      tanggalFoto,
      utama = false,
    } = body;

    if (!jenisUsaha || !kd_unit || !url) {
      return NextResponse.json(
        { success: false, error: "jenisUsaha, kd_unit, dan url foto wajib diisi" },
        { status: 400 }
      );
    }

    // Territory authorization check
    let unitKec: string | undefined;
    let unitDesa: string | undefined;

    if (jenisUsaha === "KEBUN") {
      const u = await prisma.kebun.findUnique({ where: { kd_kebun: kd_unit } });
      unitKec = u?.kd_kecamatan;
      unitDesa = u?.kd_desa;
    } else if (jenisUsaha === "KOLAM") {
      const u = await prisma.kolam.findUnique({ where: { kd_kolam: kd_unit } });
      unitKec = u?.kd_kecamatan;
      unitDesa = u?.kd_desa;
    } else if (jenisUsaha === "PETERNAKAN") {
      const u = await prisma.peternakan.findUnique({ where: { kd_peternakan: kd_unit } });
      unitKec = u?.kd_kecamatan;
      unitDesa = u?.kd_desa;
    }

    if (unitKec && !isAuthorizedForTerritory(user, unitKec, unitDesa)) {
      return NextResponse.json(
        { success: false, error: "Akses Ditolak: Anda tidak memiliki otoritas pada unit usaha ini." },
        { status: 403 }
      );
    }

    const validJenisFoto = (Object.values(JenisFoto).includes(jenisFoto as JenisFoto)
      ? jenisFoto
      : "LOKASI") as JenisFoto;

    let created: any;
    if (jenisUsaha === "KEBUN") {
      if (utama) {
        await prisma.fotoKebun.updateMany({
          where: { kd_kebun: kd_unit },
          data: { utama: false },
        });
      }
      created = await prisma.fotoKebun.create({
        data: {
          kd_kebun: kd_unit,
          url,
          judul: judul || "Foto Kegiatan Kebun",
          keterangan: keterangan || null,
          jenisFoto: validJenisFoto,
          tanggalFoto: tanggalFoto ? new Date(tanggalFoto) : new Date(),
          utama: Boolean(utama),
        },
      });
    } else if (jenisUsaha === "KOLAM") {
      if (utama) {
        await prisma.fotoKolam.updateMany({
          where: { kd_kolam: kd_unit },
          data: { utama: false },
        });
      }
      created = await prisma.fotoKolam.create({
        data: {
          kd_kolam: kd_unit,
          url,
          judul: judul || "Foto Kegiatan Kolam",
          keterangan: keterangan || null,
          jenisFoto: validJenisFoto,
          tanggalFoto: tanggalFoto ? new Date(tanggalFoto) : new Date(),
          utama: Boolean(utama),
        },
      });
    } else if (jenisUsaha === "PETERNAKAN") {
      if (utama) {
        await prisma.fotoPeternakan.updateMany({
          where: { kd_peternakan: kd_unit },
          data: { utama: false },
        });
      }
      created = await prisma.fotoPeternakan.create({
        data: {
          kd_peternakan: kd_unit,
          url,
          judul: judul || "Foto Kegiatan Peternakan",
          keterangan: keterangan || null,
          jenisFoto: validJenisFoto,
          tanggalFoto: tanggalFoto ? new Date(tanggalFoto) : new Date(),
          utama: Boolean(utama),
        },
      });
    } else {
      return NextResponse.json({ success: false, error: "jenisUsaha tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Foto create error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const { id, jenisUsaha, kd_unit, utama, judul, keterangan, jenisFoto, tanggalFoto } = body;

    if (!id || !jenisUsaha) {
      return NextResponse.json(
        { success: false, error: "id dan jenisUsaha wajib diisi" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (judul !== undefined) updateData.judul = judul;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (jenisFoto !== undefined) updateData.jenisFoto = jenisFoto as JenisFoto;
    if (tanggalFoto !== undefined) updateData.tanggalFoto = tanggalFoto ? new Date(tanggalFoto) : null;
    if (utama !== undefined) updateData.utama = Boolean(utama);

    let updated: any;
    if (jenisUsaha === "KEBUN") {
      if (utama && kd_unit) {
        await prisma.fotoKebun.updateMany({
          where: { kd_kebun: kd_unit },
          data: { utama: false },
        });
      }
      updated = await prisma.fotoKebun.update({
        where: { id },
        data: updateData,
      });
    } else if (jenisUsaha === "KOLAM") {
      if (utama && kd_unit) {
        await prisma.fotoKolam.updateMany({
          where: { kd_kolam: kd_unit },
          data: { utama: false },
        });
      }
      updated = await prisma.fotoKolam.update({
        where: { id },
        data: updateData,
      });
    } else if (jenisUsaha === "PETERNAKAN") {
      if (utama && kd_unit) {
        await prisma.fotoPeternakan.updateMany({
          where: { kd_peternakan: kd_unit },
          data: { utama: false },
        });
      }
      updated = await prisma.fotoPeternakan.update({
        where: { id },
        data: updateData,
      });
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
    const jenisUsaha = searchParams.get("jenisUsaha")?.toUpperCase();

    if (!id || !jenisUsaha) {
      return NextResponse.json(
        { success: false, error: "id dan jenisUsaha diperlukan" },
        { status: 400 }
      );
    }

    if (jenisUsaha === "KEBUN") {
      await prisma.fotoKebun.delete({ where: { id } });
    } else if (jenisUsaha === "KOLAM") {
      await prisma.fotoKolam.delete({ where: { id } });
    } else if (jenisUsaha === "PETERNAKAN") {
      await prisma.fotoPeternakan.delete({ where: { id } });
    } else {
      return NextResponse.json({ success: false, error: "jenisUsaha tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Foto berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
