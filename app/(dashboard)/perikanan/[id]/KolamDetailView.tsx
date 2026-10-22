"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Fish,
  MapPin,
  Users,
  Calendar,
  Layers,
  ArrowLeft,
  Printer,
  ChevronRight,
  Droplets,
  Maximize2,
  FileText,
  ImageOff,
  X,
  Compass,
  DollarSign,
  TrendingUp,
  Camera,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import SingleLocationMap from "@/components/dashboard/SingleLocationMap";
import UnitSiklusProduksi from "@/components/potensi/UnitSiklusProduksi";
import UnitFotoKegiatan from "@/components/potensi/UnitFotoKegiatan";

interface KolamDetailViewProps {
  kolam: {
    id: string;
    kd_kolam: string;
    nm_kolam: string;
    status: string;
    namaPemilik?: string | null;
    alamatLokasi?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    jenisKolam?: string | null;
    luasKolamM2?: number | string | null;
    jumlahKolam?: number | null;
    kedalamanKolamM?: number | string | null;
    sumberAir?: string | null;
    sistemBudidaya?: string | null;
    kapasitasBenih?: number | string | null;
    satuanBenih?: string | null;
    kondisiKolam?: string | null;
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
      kd_kolam?: string | null;
    }[];
  };
}

export default function KolamDetailView({ kolam }: KolamDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "siklus" | "foto">("profil");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [siklusCount, setSiklusCount] = useState<number>(kolam.siklus?.length || 0);
  const [fotoCount, setFotoCount] = useState<number>(kolam.foto?.length || 0);

  const latNum = kolam.latitude ? Number(kolam.latitude) : null;
  const lngNum = kolam.longitude ? Number(kolam.longitude) : null;
  const hasPhotos = kolam.foto && kolam.foto.length > 0;

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
          <Link href="/perikanan" className="hover:text-sky-700 transition">
            Usaha Perikanan
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-none">
            {kolam.nm_kolam}
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
            href="/perikanan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition shadow-2xs"
          >
            <Fish size={14} />
            <span>Tabel Perikanan</span>
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
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-sky-700/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <Fish size={36} className="text-sky-300" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 text-[10px] font-bold tracking-wider uppercase border border-sky-400/30">
                  SEKTOR PERIKANAN BUDIDAYA
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-semibold border border-white/20">
                  {kolam.kd_kolam}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  STATUS: {kolam.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {kolam.nm_kolam}
              </h1>

              <p className="text-sm text-sky-100/90 flex items-center gap-1.5">
                <MapPin size={15} className="text-red-400 shrink-0" />
                <span>
                  Desa {kolam.desa?.nm_desa || "-"}, Kec. {kolam.kecamatan?.nm_kecamatan || "-"}, Kab. Tapanuli Selatan
                </span>
              </p>
            </div>
          </div>

          {/* Quick Info Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[220px]">
            <span className="text-[11px] font-medium text-sky-200 uppercase tracking-wider">
              Komoditas Budidaya
            </span>
            <div className="text-xl font-black text-white mt-0.5">
              {kolam.komoditas?.nm_komoditas || "Ikan Nila"}
            </div>
            <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-sky-200">
              <span>Pengelola:</span>
              <span className="font-bold text-white">
                {kolam.namaPemilik || kolam.kelompokTani?.namaKetua || "-"}
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
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <FileText size={15} />
          <span>Profil & Teknis Kolam</span>
        </button>

        <button
          onClick={() => setActiveTab("siklus")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "siklus"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar size={15} />
          <span>Siklus Produksi & Jadwal Panen</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "siklus" ? "bg-white text-sky-900" : "bg-sky-100 text-sky-800"
            }`}
          >
            {siklusCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("foto")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "foto"
              ? "bg-[#0284c7] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Camera size={15} />
          <span>Foto Kegiatan Usaha</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "foto" ? "bg-white text-sky-900" : "bg-slate-200 text-slate-800"
            }`}
          >
            {fotoCount}
          </span>
        </button>
      </div>

      {/* TAB 1: PROFIL & TEKNIS KOLAM */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          {/* 5 Metrik Ringkasan Utama */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Jumlah Kolam
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                {kolam.jumlahKolam || 1}
                <span className="text-xs font-semibold text-slate-500">Unit</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {kolam.jenisKolam || "Kolam Air Tenang"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Luas Area Kolam
              </span>
              <div className="text-2xl font-black text-sky-700 mt-1 flex items-baseline gap-1">
                {Number(kolam.luasKolamM2 || 0).toLocaleString("id-ID")}
                <span className="text-xs font-semibold text-slate-500">m²</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total bentang kolam</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kapasitas Tebar Benih
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-1">
                {Number(kolam.kapasitasBenih || 0).toLocaleString("id-ID")}
                <span className="text-xs font-semibold text-slate-500">
                  {kolam.satuanBenih || "Ekor"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Potensi populasi bibit</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kelembagaan Pokdakan
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 truncate">
                {kolam.kelompokTani?.nm_kelompok || "Pembudidaya Mandiri"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {kolam.kelompokTani ? `${kolam.kelompokTani.jumlahAnggota || 0} Anggota` : "Non-Kelompok"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sistem Budidaya
              </span>
              <div className="text-sm font-black text-slate-900 mt-1.5 truncate">
                {kolam.sistemBudidaya || "Tradisional"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Air: {kolam.sumberAir || "Mata Air Alami"}
              </p>
            </div>
          </div>

          {/* Grid Layout Detail: 2 Kolom Kiri, 1 Kolom Kanan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Widget: Siklus Produksi & Panen Terkini */}
              <div className="bg-gradient-to-r from-sky-50 via-cyan-50/50 to-white rounded-2xl p-5 border border-sky-200/80 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Siklus Produksi & Jadwal Panen ({siklusCount} Siklus)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Kelola jadwal tebar benih, monitoring pakan & air, perkiraan panen, dan hasil budidaya ikan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("siklus")}
                  className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Kelola Siklus</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Card: Informasi Teknis Budidaya Kolam */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Droplets size={18} className="text-sky-600" />
                    Spesifikasi Teknis Fasilitas Kolam
                  </h3>
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                    {kolam.komoditas?.nm_komoditas || "Perikanan"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Jenis Kolam & Konstruksi</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {kolam.jenisKolam || "Kolam Tanah / Terpal"}
                    </p>
                    <span className="text-[10px] text-slate-400">Kondisi: {kolam.kondisiKolam || "Baik"}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Dimensi & Kedalaman Air</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      Kedalaman: {kolam.kedalamanKolamM ? `${kolam.kedalamanKolamM} Meter` : "1.2 Meter"}
                    </p>
                    <span className="text-[10px] text-slate-400">Total Luas: {Number(kolam.luasKolamM2 || 0).toLocaleString("id-ID")} m²</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Sumber Pasokan Air</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {kolam.sumberAir || "Irigasi / Mata Air Pegunungan"}
                    </p>
                    <span className="text-[10px] text-slate-400">Kualitas: Jernih & Mengalir</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[11px] text-slate-500 font-medium">Sistem & Metode Budidaya</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {kolam.sistemBudidaya || "Semi Intensif"}
                    </p>
                    <span className="text-[10px] text-slate-400">Mulai Usaha: Tahun {kolam.tahunMulaiUsaha || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Card: Kelompok Pembudidaya Ikan */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Users size={18} className="text-emerald-700" />
                    Kelembagaan Kelompok Pembudidaya (Pokdakan)
                  </h3>
                  {kolam.kelompokTani?.kd_kelompok && (
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {kolam.kelompokTani.kd_kelompok}
                    </span>
                  )}
                </div>

                {kolam.kelompokTani ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-800 font-medium">Nama Pokdakan</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {kolam.kelompokTani.nm_kelompok}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tahun Berdiri: {kolam.kelompokTani.tahunBerdiri || "-"}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-800 font-medium">Ketua & Anggota</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">
                          {kolam.kelompokTani.namaKetua || kolam.namaPemilik || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Jumlah Anggota: <strong>{kolam.kelompokTani.jumlahAnggota || 0} Pembudidaya</strong>
                        </p>
                      </div>
                    </div>

                    {kolam.kelompokTani.alamat && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700">
                        <span className="font-bold text-slate-900">Alamat Sekretariat: </span>
                        <span>{kolam.kelompokTani.alamat}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">Usaha Mandiri</p>
                    <p>
                      Unit kolam perikanan ini dikelola secara mandiri oleh{" "}
                      <strong>{kolam.namaPemilik || "Pengelola Mandiri"}</strong>.
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
                  {kolam.deskripsi && (
                    <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 text-sky-950">
                      <span className="font-bold text-sky-900 block mb-1">
                        Deskripsi Unit Usaha Kolam:
                      </span>
                      <p className="leading-relaxed whitespace-pre-line text-slate-800">
                        {kolam.deskripsi}
                      </p>
                    </div>
                  )}

                  {kolam.catatan && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                      <span className="font-bold text-slate-800 block mb-1">Catatan Tambahan:</span>
                      <p className="leading-relaxed">{kolam.catatan}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (1 col wide on desktop) */}
            <div className="space-y-6">
              {/* Card: Dokumentasi Foto Kolam */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Camera size={18} className="text-sky-600" />
                    Foto Dokumentasi ({fotoCount})
                  </h3>
                  <button
                    onClick={() => setActiveTab("foto")}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Galeri & Upload</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>

                {hasPhotos ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => setSelectedImage(kolam.foto![0].url)}
                      className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shadow-2xs"
                    >
                      <img
                        src={kolam.foto![0].url}
                        alt={kolam.nm_kolam}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
                          <Maximize2 size={13} />
                          Perbesar Foto
                        </span>
                      </div>
                    </div>

                    {kolam.foto!.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {kolam.foto!.slice(1, 4).map((f) => (
                          <div
                            key={f.id}
                            onClick={() => setSelectedImage(f.url)}
                            className="relative h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-80 transition"
                          >
                            <img src={f.url} alt="Foto Kolam" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setActiveTab("foto")}
                      className="w-full py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition border border-sky-200 flex items-center justify-center gap-1.5 cursor-pointer"
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
                      Foto fisik kolam, bibit ikan, dan fasilitas belum diunggah.
                    </p>
                    <button
                      onClick={() => setActiveTab("foto")}
                      className="mt-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
                  title={kolam.nm_kolam}
                  subtitle={`${kolam.komoditas?.nm_komoditas || "Perikanan"} • Desa ${kolam.desa?.nm_desa || "-"}`}
                  address={kolam.alamatLokasi || undefined}
                  color="#0284c7"
                  category="KOLAM"
                />

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Alamat Terdaftar:</span>
                      <span>{kolam.alamatLokasi || `Desa ${kolam.desa?.nm_desa || "-"}, Kec. ${kolam.kecamatan?.nm_kecamatan || "-"}`}</span>
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
          jenisUsaha="KOLAM"
          kdUnit={kolam.kd_kolam}
          namaUnit={kolam.nm_kolam}
          komoditasNama={kolam.komoditas?.nm_komoditas}
          initialSiklus={kolam.siklus}
          onSiklusCountChange={setSiklusCount}
        />
      )}

      {/* TAB 3: FOTO & DOKUMENTASI KEGIATAN */}
      {activeTab === "foto" && (
        <UnitFotoKegiatan
          jenisUsaha="KOLAM"
          kdUnit={kolam.kd_kolam}
          namaUnit={kolam.nm_kolam}
          komoditasNama={kolam.komoditas?.nm_komoditas}
          initialFoto={kolam.foto}
          onFotoCountChange={setFotoCount}
        />
      )}

      {/* MODAL LIGHTBOX FOTO DETAIL */}
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
                alt="Dokumentasi Kolam"
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
                <p className="font-bold">{kolam.nm_kolam}</p>
                <p className="text-slate-400 text-[11px]">{kolam.komoditas?.nm_komoditas} • {kolam.alamatLokasi || "-"}</p>
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
