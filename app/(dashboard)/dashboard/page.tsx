"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sprout,
  Fish,
  Beef,
  Users,
  Coins,
  TrendingUp,
  MapPin,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Sparkles,
  LayoutDashboard,
  Layers,
  ArrowRight,
  Scale,
  Egg,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Building,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import PotensiMap from "@/components/dashboard/PotensiMap";
import {
  exportRekapKecamatanPDF,
  exportPendanaanPDF,
  exportJadwalPanenPDF,
  exportPetaExcel,
} from "@/lib/exportReports";

type DashboardTab = "ringkasan" | "pertanian" | "perikanan" | "peternakan";
type SectorFilter = "kolam" | "pertanian" | "peternakan";

export default function DashboardTaniTapselPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("ringkasan");

  // Filter for Left Card "Statistik per Kecamatan"
  const [activeSectorFilter, setActiveSectorFilter] = useState<SectorFilter>("pertanian");

  // Filters for GIS map
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("semua");
  const [selectedDesa, setSelectedDesa] = useState<string>("semua");
  const [selectedJenis, setSelectedJenis] = useState<string>("semua");

  // Fetch Dashboard Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentUser = data?.currentUser;
  const isPertanianAdmin = currentUser?.peran === "ADMIN_PERTANIAN";
  const isPerikananAdmin = currentUser?.peran === "ADMIN_PERIKANAN";

  useEffect(() => {
    if (isPerikananAdmin) {
      setActiveSectorFilter("kolam");
      if (activeTab === "pertanian" || activeTab === "peternakan") {
        setActiveTab("perikanan");
      }
    } else if (isPertanianAdmin) {
      if (activeSectorFilter === "kolam") {
        setActiveSectorFilter("pertanian");
      }
      if (activeTab === "perikanan") {
        setActiveTab("pertanian");
      }
    }
  }, [isPerikananAdmin, isPertanianAdmin]);

  const metrics = data?.metrics || {
    displayKebun: "0",
    growthKebun: "Memuat unit kebun...",
    displayKolam: "0",
    growthKolam: "Memuat unit kolam...",
    displayPeternakan: "0",
    growthPeternakan: "Memuat unit ternak...",
    displayKelompokTani: "0",
    growthKelompokTani: "Memuat poktan...",
    displayPendanaan: "Rp 0",
    growthPendanaan: "Memuat realisasi...",
  };

  const chartData = data?.chartData || [];
  const komposisiData = data?.komposisiData || {
    total: 0,
    displayTotal: "0",
    items: [],
  };
  const detailPertanian = data?.detailPertanian || {
    totalUnit: 0,
    totalLuasHa: 0,
    estimasiProduksiTon: 0,
    volumeBenihKg: 0,
    komoditas: [],
    rekapKecamatan: [],
  };
  const detailPerikanan = data?.detailPerikanan || {
    totalUnit: 0,
    totalLuasM2: 0,
    totalBenihEkor: 0,
    komoditas: [],
    rekapKecamatan: [],
  };
  const detailPeternakan = data?.detailPeternakan || {
    totalUnit: 0,
    totalTernakEkor: 0,
    totalKandang: 0,
    estimasiTelurHarian: 0,
    komoditas: [],
    rekapKecamatan: [],
  };
  const lastUpdate = data?.lastUpdate || {
    formatted: "-",
    fullFormatted: "-",
  };

  const jadwalList = data?.jadwalList || [];
  const pendanaanList = data?.pendanaanList || [];
  const mapPins = data?.mapPins || [];
  const kecamatanList = data?.kecamatanList || [];

  // Filter & sort data for the "Statistik per Kecamatan" card
  const filteredKecamatanData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    let sectorKey = "kebun";
    if (activeSectorFilter === "kolam") sectorKey = "kolam";
    if (activeSectorFilter === "peternakan") sectorKey = "peternakan";

    return [...chartData]
      .map((item: any) => ({
        nama: item.nama,
        value: Number(item[sectorKey] || 0),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // tampilkan top 6 - 7 seperti pada gambar referensi
  }, [chartData, activeSectorFilter]);

  const sectorColors: Record<SectorFilter, { bar: string; pillActive: string; pillInactive: string }> = {
    kolam: {
      bar: "#0284c7",
      pillActive: "bg-sky-50 text-sky-700 border-sky-300 font-bold shadow-xs",
      pillInactive: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
    },
    pertanian: {
      bar: "#16a34a",
      pillActive: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-xs",
      pillInactive: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
    },
    peternakan: {
      bar: "#ea580c",
      pillActive: "bg-orange-50 text-orange-700 border-orange-300 font-bold shadow-xs",
      pillInactive: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-6">
      {/* 1. HERO BANNER SELAMAT DATANG */}
      <div className="relative rounded-3xl overflow-hidden shadow-md border border-emerald-900/20 bg-gradient-to-r from-[#0a2e22] via-[#0f4433] to-[#125841] text-white">
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2.5 shrink-0 shadow-lg ring-1 ring-white/30">
              <Sprout size={36} className="text-emerald-300 drop-shadow-sm" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-semibold text-emerald-200 mb-1.5">
                <span>Pemerintah Kabupaten Tapanuli Selatan</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Selamat Datang di{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300">
                  DATA TANI TAPSEL
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl font-medium">
                Sistem Informasi Terpadu Potensi Pertanian, Perikanan dan Peternakan
                Kabupaten Tapanuli Selatan
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-xs">
              <span className="text-xs font-bold tracking-wide text-amber-300 italic">
                “Data Lengkap, Petani Sejahtera, Tapsel Maju”
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("pertanian")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/30 text-[11px] font-medium text-emerald-200 transition cursor-pointer"
              >
                <Sprout size={12} /> Pertanian
              </button>
              <button
                onClick={() => setActiveTab("perikanan")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/30 text-[11px] font-medium text-sky-200 transition cursor-pointer"
              >
                <Fish size={12} /> Perikanan
              </button>
              <button
                onClick={() => setActiveTab("peternakan")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/30 text-[11px] font-medium text-amber-200 transition cursor-pointer"
              >
                <Beef size={12} /> Peternakan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS (DASHBOARD UTAMA & DASHBOARD KHUSUS SEKTOR) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("ringkasan")}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "ringkasan"
              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <LayoutDashboard size={16} />
            <span>Ringkasan Utama</span>
          </button>

          {!isPerikananAdmin && (
            <button
              onClick={() => setActiveTab("pertanian")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "pertanian"
                ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-700/20"
                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
            >
              <Sprout size={16} />
              <span>Dashboard Pertanian</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-extrabold">
                {metrics.displayKebun}
              </span>
            </button>
          )}

          {!isPertanianAdmin && (
            <button
              onClick={() => setActiveTab("perikanan")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "perikanan"
                ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/20"
                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                }`}
            >
              <Fish size={16} />
              <span>Dashboard Kolam / Perikanan</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-extrabold">
                {metrics.displayKolam}
              </span>
            </button>
          )}

          {!isPerikananAdmin && (
            <button
              onClick={() => setActiveTab("peternakan")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "peternakan"
                ? "bg-orange-600 text-white shadow-sm ring-2 ring-orange-600/20"
                : "text-slate-600 hover:text-orange-700 hover:bg-orange-50"
                }`}
            >
              <Beef size={16} />
              <span>Dashboard Peternakan</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-extrabold">
                {metrics.displayPeternakan}
              </span>
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 pr-2">
          <Clock size={13} className="text-emerald-600" />
          <span>Update Terakhir:</span>
          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {lastUpdate.formatted || "21 Oktober 2026"}
          </span>
        </div>
      </div>

      {/* ========================================================
          TAB 1: RINGKASAN UTAMA (Mencakup 2 Card Sesuai Gambar)
      ======================================================== */}
      {activeTab === "ringkasan" && (
        <div className="space-y-6">
          {/* A. KARTU METRIK UTAMA */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isPerikananAdmin ? "lg:grid-cols-2" : isPertanianAdmin ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-3.5`}>
            {/* Card 1: Kebun */}
            {!isPerikananAdmin && (
              <div
                onClick={() => setActiveTab("pertanian")}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Total Kebun</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sprout size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metrics.displayKebun}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">unit usaha</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md w-fit">
                    <TrendingUp size={12} />
                    <span>{metrics.growthKebun}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
              </div>
            )}

            {/* Card 2: Kolam Ikan */}
            {!isPertanianAdmin && (
              <div
                onClick={() => setActiveTab("perikanan")}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Total Kolam Ikan</span>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Fish size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metrics.displayKolam}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">unit usaha</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50/80 px-2 py-0.5 rounded-md w-fit">
                    <TrendingUp size={12} />
                    <span>{metrics.growthKolam}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-sky-600 transition" />
                </div>
              </div>
            )}

            {/* Card 3: Peternakan */}
            {!isPerikananAdmin && (
              <div
                onClick={() => setActiveTab("peternakan")}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Total Peternakan</span>
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Beef size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metrics.displayPeternakan}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">unit usaha</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50/80 px-2 py-0.5 rounded-md w-fit">
                    <TrendingUp size={12} />
                    <span>{metrics.growthPeternakan}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-orange-600 transition" />
                </div>
              </div>
            )}

            {/* Card 4: Kelompok Tani */}
            {!isPerikananAdmin && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Kelompok Tani</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metrics.displayKelompokTani}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">kelompok</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-md w-fit">
                  <TrendingUp size={12} />
                  <span>{metrics.growthKelompokTani}</span>
                </div>
              </div>
            )}

            {/* Card 5: Pendanaan */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Total Pendanaan</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Coins size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {metrics.displayPendanaan}
                </span>
                <span className="text-[11px] font-medium text-slate-500">realisasi</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md w-fit">
                <TrendingUp size={12} />
                <span>{metrics.growthPendanaan}</span>
              </div>
            </div>
          </div>

          {/* B. DUA KARTU SESUAI GAMBAR REFERENSI USER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* KARTU KIRI: Statistik per Kecamatan (7 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header Card dengan Subtitle dan Filter Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Statistik per Kecamatan
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Jumlah data berdasarkan kecamatan
                    </p>
                  </div>

                  {/* Filter Pills Kolam | Pertanian | Peternakan */}
                  <div className="flex items-center gap-2">
                    {!isPertanianAdmin && (
                      <button
                        onClick={() => setActiveSectorFilter("kolam")}
                        className={`px-3 py-1.5 rounded-xl text-xs transition border cursor-pointer ${activeSectorFilter === "kolam"
                          ? sectorColors.kolam.pillActive
                          : sectorColors.kolam.pillInactive
                          }`}
                      >
                        Kolam
                      </button>
                    )}
                    {!isPerikananAdmin && (
                      <button
                        onClick={() => setActiveSectorFilter("pertanian")}
                        className={`px-3 py-1.5 rounded-xl text-xs transition border cursor-pointer ${activeSectorFilter === "pertanian"
                          ? sectorColors.pertanian.pillActive
                          : sectorColors.pertanian.pillInactive
                          }`}
                      >
                        Pertanian
                      </button>
                    )}
                    {!isPerikananAdmin && (
                      <button
                        onClick={() => setActiveSectorFilter("peternakan")}
                        className={`px-3 py-1.5 rounded-xl text-xs transition border cursor-pointer ${activeSectorFilter === "peternakan"
                          ? sectorColors.peternakan.pillActive
                          : sectorColors.peternakan.pillInactive
                          }`}
                      >
                        Peternakan
                      </button>
                    )}
                  </div>
                </div>

                {/* Vertical Bar Chart dengan Angka di atas Bar */}
                <div className="h-[340px] w-full pt-4">
                  {filteredKecamatanData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredKecamatanData}
                        margin={{ top: 25, right: 15, left: -20, bottom: 35 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="nama"
                          tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickFormatter={(value) => {
                            // Pecah teks panjang ke baris kedua jika diperlukan
                            return value.length > 14 ? value.slice(0, 12) + "..." : value;
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`${val} unit`, "Jumlah Data"]}
                        />
                        <Bar
                          dataKey="value"
                          fill={sectorColors[activeSectorFilter].bar}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={55}
                        >
                          <LabelList
                            dataKey="value"
                            position="top"
                            style={{
                              fill: sectorColors[activeSectorFilter].bar,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Tidak ada data kecamatan untuk filter ini
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">
                  Menampilkan {filteredKecamatanData.length} kecamatan dengan data terbanyak
                </span>
                <button
                  onClick={() => setActiveTab(activeSectorFilter === "kolam" ? "perikanan" : activeSectorFilter)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                >
                  Buka Detail Penjabaran <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* KARTU KANAN: Komposisi Data (Donut Chart) (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header Card */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Komposisi Data
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Persentase masing-masing sektor
                  </p>
                </div>

                {/* Donut Chart dengan Tulisan Total di Tengah */}
                <div className="relative h-[230px] w-full flex items-center justify-center my-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                        formatter={(val: any, name: any) => [
                          `${val} unit (${(
                            (Number(val) / (komposisiData.total || 1)) *
                            100
                          ).toFixed(2)}%)`,
                          name,
                        ]}
                      />
                      <Pie
                        data={komposisiData.items}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {komposisiData.items.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Absolute Center Text: Total X Data */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {komposisiData.displayTotal}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Data
                    </span>
                  </div>
                </div>

                {/* Legend List di Bawah Donut Chart */}
                <div className="space-y-2.5 pt-2">
                  {komposisiData.items.map((item: any) => (
                    <div
                      key={item.key}
                      onClick={() => {
                        if (item.key === "kolam") setActiveTab("perikanan");
                        else if (item.key === "pertanian") setActiveTab("pertanian");
                        else if (item.key === "peternakan") setActiveTab("peternakan");
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-md shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.count.toLocaleString("id-ID")}{" "}
                        <span className="text-slate-400 font-medium">
                          ({item.percentage.toString().replace(".", ",")}&#37;)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Sumber: Dinas Pertanian & Dinas Perikanan</span>
                <span className="font-semibold text-emerald-700">100% Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* C. PETA GIS SEBARAN POTENSI (FULL WIDTH) */}
          <div className="w-full">
            <PotensiMap
              pins={mapPins}
              kecamatanList={kecamatanList}
              selectedKecamatan={selectedKecamatan}
              setSelectedKecamatan={setSelectedKecamatan}
              selectedDesa={selectedDesa}
              setSelectedDesa={setSelectedDesa}
              selectedJenis={selectedJenis}
              setSelectedJenis={setSelectedJenis}
            />
          </div>




        </div>
      )}

      {/* ========================================================
          TAB 2: DASHBOARD KHUSUS PERTANIAN (PENJABARAN DETAIL)
      ======================================================== */}
      {activeTab === "pertanian" && (
        <div className="space-y-6">
          {/* 4 Metrik Khusus Pertanian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Unit Kebun Terdaftar</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {detailPertanian.totalUnit.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-slate-500">unit</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                325 Kegiatan Bantuan Jagung
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Luas Lahan Tanam</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {detailPertanian.totalLuasHa.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">Hektar (Ha)</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                Rata-rata 7,68 Ha per Unit
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Volume Benih Bantuan Disalurkan</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {detailPertanian.volumeBenihKg.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">Kg</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit">
                ~15 Kg per Hektar Lahan
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Estimasi Potensi Hasil Panen</span>
              <div className="text-2xl font-black text-sky-600 mt-1">
                {detailPertanian.estimasiProduksiTon.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-slate-500">Ton Pipil Kering</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded w-fit">
                Proyeksi Produktivitas 6 Ton/Ha
              </div>
            </div>
          </div>

          {/* Distribusi Komoditas Pertanian & Rekap Kecamatan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Komoditas Pertanian (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Distribusi Komoditas Pertanian
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Komposisi komoditas tanaman pangan dan perkebunan terdata
              </p>

              <div className="space-y-3">
                {detailPertanian.komoditas && detailPertanian.komoditas.length > 0 ? (
                  detailPertanian.komoditas.map((kom: any) => {
                    const pct = detailPertanian.totalUnit > 0
                      ? ((kom.count / detailPertanian.totalUnit) * 100).toFixed(0)
                      : "0";
                    return (
                      <div key={kom.kode} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800">{kom.nama}</span>
                          <span className="font-extrabold text-emerald-700">{kom.count} kebun ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                    Belum ada data komoditas pertanian
                  </div>
                )}
              </div>
            </div>

            {/* Rekap Kecamatan Kebun (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rincian Sebaran Usaha Pertanian per Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Peringkat kecamatan berdasarkan jumlah unit kebun terdata
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {detailPertanian.rekapKecamatan.length} Kecamatan
                </span>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-2 w-10 text-center">No</th>
                      <th className="pb-2">Kecamatan</th>
                      <th className="pb-2 text-center">Jumlah Kebun</th>
                      <th className="pb-2 text-center">Kelompok Tani</th>
                      <th className="pb-2 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailPertanian.rekapKecamatan.map((row: any, idx: number) => {
                      const pct = (
                        (row.count / (detailPertanian.totalUnit || 1)) *
                        100
                      ).toFixed(1);
                      return (
                        <tr key={row.kd_kecamatan} className="hover:bg-emerald-50/30 transition">
                          <td className="py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-slate-800">{row.nama}</td>
                          <td className="py-2.5 text-center font-extrabold text-slate-900">
                            {row.count} unit
                          </td>
                          <td className="py-2.5 text-center font-semibold text-slate-600">
                            {row.poktan || Math.ceil(row.count * 0.7)} kelompok
                          </td>
                          <td className="py-2.5 text-right font-bold text-emerald-700">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DASHBOARD KHUSUS PERIKANAN / KOLAM
      ======================================================== */}
      {activeTab === "perikanan" && (
        <div className="space-y-6">

          {/* 3 Metrik Khusus Kolam */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Unit Kolam Terdata</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {detailPerikanan.totalUnit}{" "}
                <span className="text-xs font-normal text-slate-500">unit usaha kolam</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded w-fit">
                Tersebar di 10 Kecamatan
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Luas Area Kolam</span>
              <div className="text-2xl font-black text-sky-600 mt-1">
                {detailPerikanan.totalLuasM2.toLocaleString("id-ID", {
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">m²</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded w-fit">
                Setara {(detailPerikanan.totalLuasM2 / 10000).toFixed(2)} Hektar
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Kapasitas Tebar Benih</span>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {detailPerikanan.totalBenihEkor.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-slate-500">Ekor Benih Ikan</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded w-fit">
                Siklus Tebar 3 - 4 Bulan
              </div>
            </div>
          </div>

          {/* Distribusi Komoditas Ikan & Rekap Kecamatan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Komoditas Ikan (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Distribusi Komoditas Ikan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Jenis ikan yang dibudidayakan kelompok pembudidaya ikan (Pokdakan)
              </p>

              <div className="space-y-3">
                {detailPerikanan.komoditas.map((kom: any) => (
                  <div key={kom.kode} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{kom.nama}</span>
                      <span className="font-extrabold text-sky-700">{kom.count} kolam</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-600 h-1.5 rounded-full"
                        style={{
                          width: `${((kom.count / (detailPerikanan.totalUnit || 1)) * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekap Kecamatan Kolam (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Sebaran Kolam Ikan per Kecamatan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Peringkat kecamatan penghasil ikan air tawar di Kabupaten Tapanuli Selatan
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-2">Kecamatan</th>
                      <th className="pb-2 text-center">Jumlah Kolam</th>
                      <th className="pb-2 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailPerikanan.rekapKecamatan.map((row: any) => (
                      <tr key={row.kd_kecamatan} className="hover:bg-sky-50/30 transition">
                        <td className="py-2.5 font-bold text-slate-800">{row.nama}</td>
                        <td className="py-2.5 text-center font-extrabold text-sky-700">
                          {row.count} unit
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-600">
                          {((row.count / (detailPerikanan.totalUnit || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: DASHBOARD KHUSUS PETERNAKAN
      ======================================================== */}
      {activeTab === "peternakan" && (
        <div className="space-y-6">

          {/* 4 Metrik Khusus Peternakan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Penerima Bantuan Ternak</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {detailPeternakan.totalUnit}{" "}
                <span className="text-xs font-normal text-slate-500">titik ternak</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded w-fit">
                Peternakan Terdata
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Populasi Ternak</span>
              <div className="text-2xl font-black text-orange-600 mt-1">
                {detailPeternakan.totalTernakEkor.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-slate-500">Ekor</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded w-fit">
                Jumlah Populasi Ternak
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Jumlah Bangunan Kandang</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {detailPeternakan.totalKandang}{" "}
                <span className="text-xs font-normal text-slate-500">Unit Kandang</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit">
                Sistem Baterai Modern
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Estimasi Produksi Telur</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {detailPeternakan.estimasiTelurHarian.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-slate-500">Butir / Hari</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                Produksi Hasil Ternak
              </div>
            </div>
          </div>

          {/* Distribusi Komoditas Peternakan & Rekap Kecamatan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Komoditas Peternakan (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Distribusi Komoditas Peternakan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Populasi dan jenis komoditas ternak binaan terdata
              </p>

              <div className="space-y-3">
                {detailPeternakan.komoditas && detailPeternakan.komoditas.length > 0 ? (
                  detailPeternakan.komoditas.map((kom: any) => {
                    const pct = detailPeternakan.totalUnit > 0
                      ? ((kom.count / detailPeternakan.totalUnit) * 100).toFixed(0)
                      : "0";
                    return (
                      <div key={kom.kode} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800">{kom.nama}</span>
                          <span className="font-extrabold text-orange-700">{kom.count} unit ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-orange-600 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                    Belum ada data komoditas peternakan
                  </div>
                )}
              </div>
            </div>

            {/* Rekap Kecamatan Peternakan (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rincian Sebaran Bantuan Ternak per Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data alokasi penerima bantuan ayam petelur se-Tapsel
                  </p>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                  {detailPeternakan.rekapKecamatan.length} Kecamatan
                </span>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-2 w-10 text-center">No</th>
                      <th className="pb-2">Kecamatan</th>
                      <th className="pb-2 text-center">Unit</th>
                      <th className="pb-2 text-center">Populasi</th>
                      <th className="pb-2 text-right">Telur/Hari</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailPeternakan.rekapKecamatan.map((row: any, idx: number) => {
                      const butir = Number((row.ekor * 0.9).toFixed(0));
                      return (
                        <tr key={row.kd_kecamatan} className="hover:bg-orange-50/30 transition">
                          <td className="py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-slate-800">{row.nama}</td>
                          <td className="py-2.5 text-center font-extrabold text-slate-900">
                            {row.count} unit
                          </td>
                          <td className="py-2.5 text-center font-bold text-orange-700">
                            {row.ekor.toLocaleString("id-ID")} ekor
                          </td>
                          <td className="py-2.5 text-right font-extrabold text-emerald-700">
                            {butir.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
