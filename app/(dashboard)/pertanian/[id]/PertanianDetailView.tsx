"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sprout,
  MapPin,
  Users,
  Layers,
  ArrowLeft,
  Printer,
  ChevronRight,
  Maximize2,
  FileText,
  ImageOff,
  X,
  Compass,
  DollarSign,
  TrendingUp,
  Calendar,
  Camera,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import SingleLocationMap from "@/components/dashboard/SingleLocationMap";
import UnitSiklusProduksi from "@/components/potensi/UnitSiklusProduksi";
import UnitFotoKegiatan from "@/components/potensi/UnitFotoKegiatan";

interface PertanianDetailViewProps {
  kebun: {
    id: string;
    kd_kebun: string;
    nama: string;
    status: string;
    namaPemilik?: string | null;
    alamatLokasi?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    jenisTanaman?: string | null;
    luasLahanHa?: number | string | null;
    jumlahPohon?: number | null;
    jarakTanam?: string | null;
    tahunTanam?: number | null;
    sistemTanam?: string | null;
    kondisiTanaman?: string | null;
    statusLahan?: string | null;
    tahunMulaiUsaha?: number | null;
    deskripsi?: string | null;
    catatan?: string | null;
    createdAt?: string;
    updatedAt?: string;
    kecamatan?: { kd_kecamatan: string; nm_kecamatan: string } | null;
    desa?: { kd_desa: string; nm_desa: string } | null;
    komoditas?: { kd_komoditas: string; nm_komoditas: string } | null;
    kelompokTani?: {
      kd_kelompok: string;
      nm_kelompok: string;
      namaKetua?: string | null;
      noTelepon?: string | null;
      alamat?: string | null;
      jumlahAnggota?: number | null;
      tahunBerdiri?: number | null;
      keterangan?: string | null;
      status?: string | null;
    } | null;
    foto?: {
      id: string;
      url: string;
      judul?: string | null;
      keterangan?: string | null;
      jenisFoto?: string | null;
      tanggalFoto?: string | null;
      utama?: boolean;
    }[];
    pendanaan?: {
      id: string;
      namaProgram?: string | null;
      sumberDana: string;
      tahunAnggaran?: number | null;
      danaDiajukan: number | string;
      danaDicairkan?: number | string | null;
      status: string;
      keterangan?: string | null;
    }[];
    siklus?: {
      id: string;
      kd_siklus: string;
      namaSiklus: string;
      tahapKegiatan: string;
      tanggalMulai: string;
      tanggalTargetPanen?: string | null;
      tanggalRealisasiPanen?: string | null;
      estimasiProduksi?: number | string | null;
      realisasiProduksi?: number | string | null;
      satuanProduksi?: string | null;
      status: string;
      catatan?: string | null;
      kd_kebun?: string | null;
    }[];
  };
}

export default function PertanianDetailView({ kebun }: PertanianDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "siklus" | "foto">("profil");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [siklusCount, setSiklusCount] = useState<number>(kebun.siklus?.length || 0);
  const [fotoCount, setFotoCount] = useState<number>(kebun.foto?.length || 0);

  const latNum = kebun.latitude ? Number(kebun.latitude) : null;
  const lngNum = kebun.longitude ? Number(kebun.longitude) : null;
  const hasPhotos = kebun.foto && kebun.foto.length > 0;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-emerald-700 transition">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link href="/pertanian" className="hover:text-emerald-700 transition">
            Usaha Pertanian
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-none">
            {kebun.nama}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Peta Dashboard</span>
          </Link>
          <Link
            href="/pertanian"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
          >
            <Sprout size={14} />
            <span>Tabel Pertanian</span>
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak Profil</span>
          </button>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <Sprout size={36} className="text-emerald-300" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold tracking-wider uppercase border border-emerald-400/30">
                  SEKTOR PERTANIAN & KEBUN
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-semibold border border-white/20">
                  {kebun.kd_kebun}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  STATUS: {kebun.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {kebun.nama}
              </h1>

              <p className="text-sm text-emerald-100/90 flex items-center gap-1.5">
                <MapPin size={15} className="text-red-400 shrink-0" />
                <span>
                  Desa {kebun.desa?.nm_desa || "-"}, Kec. {kebun.kecamatan?.nm_kecamatan || "-"}, Kab. Tapanuli Selatan
                </span>
              </p>
            </div>
          </div>

          {/* Quick Info Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[220px]">
            <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">
              Komoditas Tanaman
            </span>
            <div className="text-xl font-black text-white mt-0.5">
              {kebun.komoditas?.nm_komoditas || "Komoditas Pertanian"}
            </div>
            <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200">
              <span>Pengelola:</span>
              <span className="font-bold text-white">
                {kebun.namaPemilik || kebun.kelompokTani?.namaKetua || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("profil")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "profil"
              ? "bg-[#16a34a] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <FileText size={15} />
          <span>Profil & Teknis Lahan</span>
        </button>

        <button
          onClick={() => setActiveTab("siklus")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "siklus"
              ? "bg-[#16a34a] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar size={15} />
          <span>Siklus Produksi & Jadwal Panen</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "siklus" ? "bg-white text-emerald-900" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {siklusCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("foto")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "foto"
              ? "bg-[#16a34a] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Camera size={15} />
          <span>Foto Kegiatan Usaha</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "foto" ? "bg-white text-emerald-900" : "bg-slate-200 text-slate-800"
            }`}
          >
            {fotoCount}
          </span>
        </button>
      </div>

      {/* TAB 1: PROFIL & TEKNIS LAHAN */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          {/* 5 Metrik Ringkasan Utama */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Luas Lahan Kebun
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-1">
                {kebun.luasLahanHa || 0}
                <span className="text-xs font-semibold text-slate-500">Ha</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Luas areal tanam</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Populasi Tanaman
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                {Number(kebun.jumlahPohon || 0).toLocaleString("id-ID")}
                <span className="text-xs font-semibold text-slate-500">Batang</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {kebun.jenisTanaman || kebun.komoditas?.nm_komoditas}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sistem Tanam
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 truncate">
                {kebun.sistemTanam || "Monokultur"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Jarak: {kebun.jarakTanam || "-"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kondisi Tanaman
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 truncate">
                {kebun.kondisiTanaman || "Baik / Produktif"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tahun Tanam: {kebun.tahunTanam || "-"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kelembagaan Tani
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 truncate">
                {kebun.kelompokTani?.nm_kelompok || "Petani Mandiri"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {kebun.kelompokTani ? `${kebun.kelompokTani.jumlahAnggota || 0} Anggota` : "Non-Poktan"}
              </p>
            </div>
          </div>

          {/* Grid Layout Detail: 2 Kolom Kiri, 1 Kolom Kanan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Widget: Siklus Produksi & Panen Terkini */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Siklus Produksi & Jadwal Panen ({siklusCount} Siklus)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Kelola jadwal tanam, tahapan kegiatan budidaya, target panen, dan realisasi hasil produksi.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("siklus")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Kelola Siklus</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Card: Informasi Teknis Budidaya Kebun */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Sprout size={18} className="text-emerald-700" />
                    Spesifikasi Teknis & Agronomi Kebun
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {kebun.komoditas?.nm_komoditas || "Pertanian"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Jenis / Varietas Tanaman</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {kebun.jenisTanaman || kebun.komoditas?.nm_komoditas || "-"}
                    </p>
                    <span className="text-[10px] text-slate-400">Kondisi: {kebun.kondisiTanaman || "Baik"}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Luas Areal & Kepemilikan Lahan</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {kebun.luasLahanHa || 0} Hektar
                    </p>
                    <span className="text-[10px] text-slate-400">Status Lahan: {kebun.statusLahan || "Milik Sendiri"}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Kerapatan & Jumlah Pohon</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {Number(kebun.jumlahPohon || 0).toLocaleString("id-ID")} Batang
                    </p>
                    <span className="text-[10px] text-slate-400">Jarak Tanam: {kebun.jarakTanam || "Standar Budidaya"}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Tahun Tanam & Usaha</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      Tahun Tanam: {kebun.tahunTanam || "-"}
                    </p>
                    <span className="text-[10px] text-slate-400">Mulai Usaha: {kebun.tahunMulaiUsaha || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Card: Kelompok Tani */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Users size={18} className="text-emerald-700" />
                    Kelembagaan Kelompok Tani (Poktan)
                  </h3>
                  {kebun.kelompokTani?.kd_kelompok && (
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {kebun.kelompokTani.kd_kelompok}
                    </span>
                  )}
                </div>

                {kebun.kelompokTani ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-800 font-medium">Nama Kelompok Tani</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {kebun.kelompokTani.nm_kelompok}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tahun Berdiri: {kebun.kelompokTani.tahunBerdiri || "-"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-800 font-medium">Ketua & Anggota Tani</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {kebun.kelompokTani.namaKetua || kebun.namaPemilik || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Jumlah Anggota: <strong>{kebun.kelompokTani.jumlahAnggota || 0} Petani</strong>
                        </p>
                      </div>
                    </div>

                    {kebun.kelompokTani.alamat && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700">
                        <span className="font-bold text-slate-900">Alamat Sekretariat: </span>
                        <span>{kebun.kelompokTani.alamat}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">Usaha Mandiri</p>
                    <p>
                      Unit kebun ini dikelola secara mandiri oleh{" "}
                      <strong>{kebun.namaPemilik || "Pengelola Mandiri"}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Card: Keterangan & Catatan */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-amber-600" />
                  Keterangan & Catatan Lapangan
                </h3>

                <div className="space-y-3 text-xs">
                  {kebun.deskripsi && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-950">
                      <span className="font-bold text-emerald-900 block mb-1">
                        Deskripsi Unit Kebun:
                      </span>
                      <p className="leading-relaxed whitespace-pre-line text-slate-800">
                        {kebun.deskripsi}
                      </p>
                    </div>
                  )}

                  {kebun.catatan && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                      <span className="font-bold text-slate-800 block mb-1">Catatan Tambahan:</span>
                      <p className="leading-relaxed">{kebun.catatan}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (1 col wide on desktop) */}
            <div className="space-y-6">
              {/* Card: Foto Dokumentasi Lapangan */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Camera size={18} className="text-emerald-700" />
                    Foto Dokumentasi ({fotoCount})
                  </h3>
                  <button
                    onClick={() => setActiveTab("foto")}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Galeri & Upload</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>

                {hasPhotos ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => setSelectedImage(kebun.foto![0].url)}
                      className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shadow-2xs"
                    >
                      <img
                        src={kebun.foto![0].url}
                        alt={kebun.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
                          <Maximize2 size={13} />
                          Perbesar Foto
                        </span>
                      </div>
                    </div>

                    {kebun.foto!.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {kebun.foto!.slice(1, 4).map((f) => (
                          <div
                            key={f.id}
                            onClick={() => setSelectedImage(f.url)}
                            className="relative h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-80 transition"
                          >
                            <img src={f.url} alt="Foto Kebun" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setActiveTab("foto")}
                      className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload Foto Baru / Lihat Semua</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-44 w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-4 text-center gap-1.5">
                    <ImageOff size={32} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-600">
                      Belum Ada Foto Dokumentasi
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Foto fisik tanaman dan lahan kebun belum diunggah.
                    </p>
                    <button
                      onClick={() => setActiveTab("foto")}
                      className="mt-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>Upload Foto Kegiatan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card: Peta Geospasial */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Compass size={18} className="text-emerald-600" />
                  Peta Lokasi Geospasial
                </h3>

                <SingleLocationMap
                  lat={latNum}
                  lng={lngNum}
                  title={kebun.nama}
                  subtitle={`${kebun.komoditas?.nm_komoditas || "Pertanian"} • Desa ${kebun.desa?.nm_desa || "-"}`}
                  address={kebun.alamatLokasi || undefined}
                  color="#16a34a"
                  category="KEBUN"
                />

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Alamat Lokasi:</span>
                      <span>{kebun.alamatLokasi || `Desa ${kebun.desa?.nm_desa || "-"}, Kec. ${kebun.kecamatan?.nm_kecamatan || "-"}`}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Latitude</span>
                      <span className="font-mono font-bold text-slate-800">
                        {latNum ? latNum.toFixed(6) : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Longitude</span>
                      <span className="font-mono font-bold text-slate-800">
                        {lngNum ? lngNum.toFixed(6) : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIKLUS PRODUKSI & JADWAL PANEN */}
      {activeTab === "siklus" && (
        <UnitSiklusProduksi
          jenisUsaha="KEBUN"
          kdUnit={kebun.kd_kebun}
          namaUnit={kebun.nama}
          komoditasNama={kebun.komoditas?.nm_komoditas}
          initialSiklus={kebun.siklus}
          onSiklusCountChange={setSiklusCount}
        />
      )}

      {/* TAB 3: FOTO & DOKUMENTASI KEGIATAN */}
      {activeTab === "foto" && (
        <UnitFotoKegiatan
          jenisUsaha="KEBUN"
          kdUnit={kebun.kd_kebun}
          namaUnit={kebun.nama}
          komoditasNama={kebun.komoditas?.nm_komoditas}
          initialFoto={kebun.foto}
          onFotoCountChange={setFotoCount}
        />
      )}

      {/* MODAL LIGHTBOX FOTO RINGKASAN */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-black rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in-95"
          >
            <div className="relative max-h-[80vh] flex items-center justify-center bg-black">
              <img
                src={selectedImage}
                alt="Dokumentasi Kebun"
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
              <div>
                <p className="font-bold">{kebun.nama}</p>
                <p className="text-slate-400 text-[11px]">{kebun.komoditas?.nm_komoditas} • {kebun.alamatLokasi || "-"}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
