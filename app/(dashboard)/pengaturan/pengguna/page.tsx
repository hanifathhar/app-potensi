import { prisma } from "@/lib/prisma";
import PenggunaClientView from "./PenggunaClientView";
import { Users, ShieldCheck } from "lucide-react";

export default async function ManajemenPenggunaPage() {
  const [kecamatans, desas] = await Promise.all([
    prisma.kecamatan.findMany({
      select: { kd_kecamatan: true, nm_kecamatan: true },
      orderBy: { nm_kecamatan: "asc" },
    }),
    prisma.desa.findMany({
      select: { kd_desa: true, nm_desa: true, kd_kecamatan: true },
      orderBy: { nm_desa: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-emerald-600" size={26} />
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan akun pengguna dan pembagian otoritas wilayah (Role-Based Access Control)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck size={14} /> Keamanan RBAC Aktif
          </span>
        </div>
      </div>

      <PenggunaClientView kecamatans={kecamatans} desas={desas} />
    </div>
  );
}
