import Link from "next/link";
import { Settings, Sprout, Users, ArrowRight, ShieldCheck, Database } from "lucide-react";

export default function PengaturanHubPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pusat Pengaturan Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pilih sub-menu untuk mengelola master data komoditas atau manajemen pengguna & hak akses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Card 1: Master Komoditas */}
        <Link
          href="/pengaturan/komoditas"
          className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all hover:border-emerald-500 flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Sprout size={30} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
              Master Komoditas Unggulan
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Kelola katalog seluruh komoditas unggulan pertanian, perikanan, dan peternakan di Kabupaten Tapanuli Selatan beserta spesifikasi satuan default dan urutannya.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Buka Master Komoditas</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Manajemen Pengguna */}
        <Link
          href="/pengaturan/pengguna"
          className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all hover:border-emerald-500 flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Users size={30} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-700 transition">
              Manajemen Pengguna & Hak Akses (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Kelola akun Admin Kabupaten, Admin Kecamatan, Admin PPL / Penyuluh, dan Operator Kelompok Tani dengan pembatasan hak akses berbasis wilayah otoritas.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Buka Manajemen Pengguna</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
