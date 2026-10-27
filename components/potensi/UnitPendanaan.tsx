"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Layers,
  Building2,
  Calendar,
  FileText,
  Search,
  HandCoins,
  TrendingUp,
  Info,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface PendanaanData {
  id: string;
  namaProgram?: string | null;
  sumberDana: string;
  namaSumberDana?: string | null;
  tahunAnggaran?: number | null;
  nomorUsulan?: string | null;
  tanggalPengajuan?: string | null;
  tanggalPersetujuan?: string | null;
  tanggalPencairan?: string | null;
  danaDiajukan: number | string;
  danaDisetujui?: number | string | null;
  danaDicairkan?: number | string | null;
  status: string;
  keterangan?: string | null;
  dokumenUrl?: string | null;
  kd_kebun?: string | null;
  kd_kolam?: string | null;
  kd_peternakan?: string | null;
}

interface UnitPendanaanProps {
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kdUnit: string;
  namaUnit: string;
  komoditasNama?: string;
  initialPendanaan?: PendanaanData[];
  onPendanaanCountChange?: (count: number) => void;
}

const SUMBER_DANA_OPTIONS = [
  { value: "APBN", label: "APBN (Pemerintah Pusat)" },
  { value: "APBD_PROVINSI", label: "APBD Provinsi" },
  { value: "APBD_KABUPATEN", label: "APBD Kabupaten (Tapsel)" },
  { value: "DANA_DESA", label: "Dana Desa (APBDes)" },
  { value: "BANTUAN_PEMERINTAH", label: "Bantuan Hibah Pemerintah" },
  { value: "KUR", label: "Kredit Usaha Rakyat (KUR)" },
  { value: "PERBANKAN", label: "Pinjaman Komersial Perbankan" },
  { value: "CSR", label: "CSR / Swasta" },
  { value: "SWADAYA", label: "Swadaya Petani / Kelompok" },
  { value: "LAINNYA", label: "Lainnya" },
];

const STATUS_PENDANAAN_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  DICAIRKAN: {
    label: "Sudah Dicairkan",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  SELESAI: {
    label: "Selesai Direalisasikan",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
  },
  DISETUJUI: {
    label: "Disetujui (Menunggu Salur)",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  DIAJUKAN: {
    label: "Dalam Proses Usulan",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  RENCANA: {
    label: "Rencana Usulan",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  DITOLAK: {
    label: "Tidak Disetujui",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

function formatRupiah(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val));
}

export default function UnitPendanaan({
  jenisUsaha,
  kdUnit,
  namaUnit,
  komoditasNama,
  initialPendanaan = [],
}: UnitPendanaanProps) {
  const [filterSumber, setFilterSumber] = useState<string>("semua");
  const [filterTahun, setFilterTahun] = useState<string>("semua");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const pendanaanList = initialPendanaan;

  // Hitung Agregat Bantuan
  const totalDanaCair = pendanaanList.reduce(
    (acc, curr) => acc + (Number(curr.danaDicairkan) || 0),
    0
  );
  const totalDanaDisetujui = pendanaanList.reduce(
    (acc, curr) => acc + (Number(curr.danaDisetujui || curr.danaDiajukan) || 0),
    0
  );
  const totalProgram = pendanaanList.length;

  // Daftar tahun unik untuk filter
  const availableYears = Array.from(
    new Set(pendanaanList.map((p) => p.tahunAnggaran).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number));

  // Filter Data
  const filteredList = pendanaanList.filter((item) => {
    if (filterSumber !== "semua" && item.sumberDana !== filterSumber) return false;
    if (filterTahun !== "semua" && item.tahunAnggaran?.toString() !== filterTahun) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchProg = item.namaProgram?.toLowerCase().includes(q);
      const matchSumber = item.namaSumberDana?.toLowerCase().includes(q);
      const matchKet = item.keterangan?.toLowerCase().includes(q);
      const matchNomor = item.nomorUsulan?.toLowerCase().includes(q);
      if (!matchProg && !matchSumber && !matchKet && !matchNomor) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner Informasi: Read-Only Mode */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-emerald-950">
        <Info size={17} className="text-emerald-700 shrink-0" />
        <p className="leading-relaxed">
          Halaman detail ini menampilkan <strong>arsip riwayat penerimaan bantuan & pendanaan</strong> unit usaha ini. Penginputan, verifikasi, dan penyaluran bantuan dikelola terpusat di <strong>Menu Pendanaan</strong>.
        </p>
      </div>

      {/* Kartu Ringkasan Bantuan & Pendanaan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Dana Dicairkan */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
              <HandCoins size={15} className="text-emerald-300" />
              Total Dana Dicairkan
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
              Realisasi
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-white mt-1">
            {formatRupiah(totalDanaCair)}
          </div>
          <p className="text-[11px] text-emerald-200/80 mt-2">
            Dana riil bantuan yang telah cair untuk unit usaha ini.
          </p>
        </div>

        {/* Total Program Bantuan */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Layers size={15} className="text-blue-600" />
              Program Bantuan Diterima
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {totalProgram} Kegiatan
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {totalProgram} <span className="text-sm font-semibold text-slate-400">Catatan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Akumulasi bantuan modal, sarana produksi, bibit, atau pembiayaan KUR.
          </p>
        </div>

        {/* Pagu Usulan / Disetujui */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-amber-600" />
              Pagu Bantuan Disetujui
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Pagu
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {formatRupiah(totalDanaDisetujui)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Pagu alokasi anggaran yang tercantum dalam usulan / SK.
          </p>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian (Read-Only) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Input Search */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kegiatan / sumber dana..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Filter Sumber Dana */}
          <select
            value={filterSumber}
            onChange={(e) => setFilterSumber(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 bg-white"
          >
            <option value="semua">Semua Sumber Dana</option>
            {SUMBER_DANA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filter Tahun */}
          {availableYears.length > 0 && (
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          )}

          {(filterSumber !== "semua" || filterTahun !== "semua" || searchTerm) && (
            <button
              onClick={() => {
                setFilterSumber("semua");
                setFilterTahun("semua");
                setSearchTerm("");
              }}
              className="text-xs text-red-600 font-bold hover:underline px-2 py-1 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Menampilkan {filteredList.length} dari {totalProgram} catatan
        </div>
      </div>

      {/* Daftar Kartu Riwayat Pendanaan */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <HandCoins size={28} />
          </div>
          <h4 className="font-bold text-sm text-slate-800">
            Belum Ada Catatan Bantuan & Pendanaan
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Unit usaha <strong>{namaUnit}</strong> belum memiliki data penerimaan bantuan, kredit usaha (KUR), atau alokasi pendanaan pemerintah yang tercatat di sistem.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const statusCfg =
              STATUS_PENDANAAN_CONFIG[item.status] || STATUS_PENDANAAN_CONFIG.RENCANA;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-4"
              >
                {/* Header Card Pendanaan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase border border-emerald-200">
                        TAHUN {item.tahunAnggaran || "-"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        {item.sumberDana?.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <h4 className="font-black text-base text-slate-900 mt-1">
                      {item.namaProgram || "Program Bantuan Usaha"}
                    </h4>

                    {item.namaSumberDana && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400" />
                        <span>Penyalur / Sumber: <strong>{item.namaSumberDana}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Nilai yang Dicairkan (Highlight Utama) */}
                  <div className="text-left sm:text-right bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60 sm:min-w-[200px]">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Nilai Dicairkan
                    </span>
                    <div className="text-xl font-black text-emerald-900">
                      {formatRupiah(item.danaDicairkan)}
                    </div>
                    {item.danaDiajukan && Number(item.danaDiajukan) > 0 && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Pagu Diajukan: {formatRupiah(item.danaDiajukan)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {item.nomorUsulan && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Nomor SK / Usulan:
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {item.nomorUsulan}
                      </span>
                    </div>
                  )}

                  {item.tanggalPencairan && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Tanggal Pencairan:
                      </span>
                      <span className="font-bold text-slate-700">
                        {new Date(item.tanggalPencairan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {item.danaDisetujui && Number(item.danaDisetujui) > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-medium">
                        Pagu Disetujui:
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatRupiah(item.danaDisetujui)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Keterangan & Deskripsi Bantuan */}
                {item.keterangan && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      Catatan / Realisasi Kegiatan:
                    </span>
                    <p className="whitespace-pre-line">{item.keterangan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
