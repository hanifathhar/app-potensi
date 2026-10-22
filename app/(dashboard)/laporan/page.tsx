import { prisma } from "@/lib/prisma";
import { FileText, Download, BarChart3, MapPin } from "lucide-react";
import LaporanClientView from "./LaporanClientView";

export default async function LaporanPage() {
  const [kecamatans, kebuns, kolams, ternaks] = await Promise.all([
    prisma.kecamatan.findMany({
      include: {
        _count: {
          select: { kebun: true, kolam: true, peternakan: true, kelompokTani: true },
        },
      },
      orderBy: { kd_kecamatan: "asc" },
    }),
    prisma.kebun.findMany({
      include: { desa: true, kecamatan: true, komoditas: true },
    }),
    prisma.kolam.findMany({
      include: { desa: true, kecamatan: true, komoditas: true },
    }),
    prisma.peternakan.findMany({
      include: { desa: true, kecamatan: true, komoditas: true },
    }),
  ]);

  const chartData = [
    { nama: "Angkola Sangkunur", kebun: 360, kolam: 240, peternakan: 210 },
    { nama: "Sipirok", kebun: 290, kolam: 195, peternakan: 160 },
    { nama: "Angkola Selatan", kebun: 200, kolam: 180, peternakan: 130 },
    { nama: "Arse", kebun: 285, kolam: 220, peternakan: 195 },
    { nama: "P.Baik / B.Toru", kebun: 295, kolam: 225, peternakan: 180 },
    { nama: "Marancar", kebun: 250, kolam: 180, peternakan: 160 },
    { nama: "Muara Batangtoru", kebun: 270, kolam: 145, peternakan: 175 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pusat Laporan & Rekapitulasi Data Tapsel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Unduh laporan resmi PDF dan Excel potensi pertanian, perikanan, dan peternakan
        </p>
      </div>

      <LaporanClientView chartData={chartData} />
    </div>
  );
}
