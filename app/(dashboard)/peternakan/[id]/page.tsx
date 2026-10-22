import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PeternakanDetailView from "./PeternakanDetailView";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Detail Usaha Peternakan - Potensi Tapsel",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PeternakanDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Search by either CUID id or kd_peternakan (e.g. TRN-2026-001)
  const ternak = await prisma.peternakan.findFirst({
    where: {
      OR: [
        { id: id },
        { kd_peternakan: id },
      ],
    },
    include: {
      kecamatan: true,
      desa: true,
      komoditas: true,
      kelompokTani: true,
      foto: true,
      pendanaan: true,
      siklus: true,
    },
  });

  if (!ternak) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Data Peternakan Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Unit usaha peternakan dengan identifikasi <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">{id}</code> tidak ditemukan atau telah dihapus dari sistem basis data.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Ke Dashboard
          </Link>
          <Link
            href="/peternakan"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition"
          >
            Lihat Tabel Peternakan
          </Link>
        </div>
      </div>
    );
  }

  // Serialize Prisma Decimal and Date objects cleanly for Client Component
  const serializedTernak = JSON.parse(JSON.stringify(ternak));

  return (
    <div className="p-4 sm:p-6 lg:p-7">
      <PeternakanDetailView ternak={serializedTernak} />
    </div>
  );
}
