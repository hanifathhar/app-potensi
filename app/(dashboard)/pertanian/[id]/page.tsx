import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PertanianDetailView from "./PertanianDetailView";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Detail Usaha Pertanian & Kebun - Potensi Tapsel",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PertanianDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Search by either CUID id or kd_kebun (e.g. KBN-2026-239)
  const kebun = await prisma.kebun.findFirst({
    where: {
      OR: [
        { id: id },
        { kd_kebun: id },
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

  if (!kebun) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Data Pertanian Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Unit usaha pertanian/kebun dengan identifikasi <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">{id}</code> tidak ditemukan atau telah dihapus dari sistem basis data.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Ke Dashboard
          </Link>
          <Link
            href="/pertanian"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition"
          >
            Lihat Tabel Pertanian
          </Link>
        </div>
      </div>
    );
  }

  // Serialize Prisma Decimal and Date objects cleanly for Client Component
  const serializedKebun = JSON.parse(JSON.stringify(kebun));

  return (
    <div className="p-4 sm:p-6 lg:p-7">
      <PertanianDetailView kebun={serializedKebun} />
    </div>
  );
}
