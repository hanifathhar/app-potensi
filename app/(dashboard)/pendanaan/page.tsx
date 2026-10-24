import { prisma } from "@/lib/prisma";
import PendanaanClientView from "./PendanaanClientView";

export default async function PendanaanPage() {
  const [kebuns, kolams, ternaks] = await Promise.all([
    prisma.kebun.findMany({
      include: { desa: true, kecamatan: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kolam.findMany({
      include: { desa: true, kecamatan: true },
      orderBy: { nm_kolam: "asc" },
    }),
    prisma.peternakan.findMany({
      include: { desa: true, kecamatan: true },
      orderBy: { nm_peternakan: "asc" },
    }),
  ]);

  const allUnits = [
    ...kebuns.map((k) => ({
      id: k.id,
      kode: k.kd_kebun,
      nama: k.nama,
      jenis: "KEBUN" as const,
      kd_kecamatan: k.kd_kecamatan,
      kd_desa: k.kd_desa,
      nm_kecamatan: k.kecamatan?.nm_kecamatan || "",
      nm_desa: k.desa?.nm_desa || "",
      lokasi: `Kec. ${k.kecamatan?.nm_kecamatan || "-"}, Desa ${k.desa?.nm_desa || "-"}`,
    })),
    ...kolams.map((k) => ({
      id: k.id,
      kode: k.kd_kolam,
      nama: k.nm_kolam,
      jenis: "KOLAM" as const,
      kd_kecamatan: k.kd_kecamatan,
      kd_desa: k.kd_desa,
      nm_kecamatan: k.kecamatan?.nm_kecamatan || "",
      nm_desa: k.desa?.nm_desa || "",
      lokasi: `Kec. ${k.kecamatan?.nm_kecamatan || "-"}, Desa ${k.desa?.nm_desa || "-"}`,
    })),
    ...ternaks.map((t) => ({
      id: t.id,
      kode: t.kd_peternakan,
      nama: t.nm_peternakan,
      jenis: "PETERNAKAN" as const,
      kd_kecamatan: t.kd_kecamatan,
      kd_desa: t.kd_desa,
      nm_kecamatan: t.kecamatan?.nm_kecamatan || "",
      nm_desa: t.desa?.nm_desa || "",
      lokasi: `Kec. ${t.kecamatan?.nm_kecamatan || "-"}, Desa ${t.desa?.nm_desa || "-"}`,
    })),
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengelolaan Pendanaan & Bantuan Usaha
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking alokasi program KUR, APBN, APBD Provinsi, APBD Tapsel, Dana Desa, dan Swadaya
          </p>
        </div>

      </div>

      <PendanaanClientView initialUnits={allUnits} />
    </div>
  );
}
