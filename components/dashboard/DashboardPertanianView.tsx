"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Sprout,
  TrendingUp,
  MapPin,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Users,
  CircleDollarSign,
  Wallet,
  FileText,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { TAPSEL_CENTER, TAPSEL_MIN_ZOOM, TAPSEL_MAX_ZOOM, TAPSEL_BOUNDS } from "@/components/dashboard/PotensiMap";

// =============================================================================
// SUB-KOMPONEN PETA SEBARAN LAHAN PERTANIAN (LEAFLET DYNAMIC)
// =============================================================================

interface MapPointItem {
  id: string;
  dbId?: string;
  nama: string;
  tipe: "KEBUN" | "POKTAN" | "BANTUAN";
  jenisUsaha?: string;
  komoditas: string;
  pemilik?: string;
  lat: number;
  lng: number;
  desa?: string;
  kecamatan?: string;
  luas?: string;
  color?: string;
  fotoUrl?: string | null;
}

const LeafletPertanianInner = ({ pins }: { pins: MapPointItem[] }) => {
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  const L = require("leaflet");

  const createIcon = (tipe: "KEBUN" | "POKTAN" | "BANTUAN") => {
    let bg = "#16a34a"; // Hijau kebun
    let border = "#ffffff";
    let innerDot = "#ffffff";

    if (tipe === "POKTAN") {
      bg = "#0d9488"; // Teal kelompok tani
    } else if (tipe === "BANTUAN") {
      bg = "#ea580c"; // Oranye bantuan
    }

    return L.divIcon({
      className: "custom-pertanian-pin",
      html: `
        <div style="
          background-color: ${bg};
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2.5px solid ${border};
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        ">
          <div style="width: 5px; height: 5px; border-radius: 50%; background-color: ${innerDot};"></div>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
  };

  return (
    <MapContainer
      center={TAPSEL_CENTER}
      zoom={10}
      minZoom={TAPSEL_MIN_ZOOM}
      maxZoom={TAPSEL_MAX_ZOOM}
      maxBounds={TAPSEL_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={false}
      zoomControl={true}
      className="w-full h-full rounded-2xl z-0"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pins.map((pin) => {
        if (!pin.lat || !pin.lng || isNaN(pin.lat) || isNaN(pin.lng)) return null;

        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createIcon(pin.tipe)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[200px] max-w-[240px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                      pin.tipe === "BANTUAN"
                        ? "bg-amber-600"
                        : pin.tipe === "POKTAN"
                        ? "bg-teal-600"
                        : "bg-emerald-600"
                    }`}
                  >
                    {pin.tipe === "BANTUAN"
                      ? "Penerima Bantuan"
                      : pin.tipe === "POKTAN"
                      ? "Kelompok Tani"
                      : "Kebun / Lahan"}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {pin.nama}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  <strong>Komoditas:</strong> {pin.komoditas}
                </p>
                {pin.luas && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Kapasitas / Luas:</strong> {pin.luas}
                  </p>
                )}
                {pin.pemilik && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Pengelola:</strong> {pin.pemilik}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 truncate">
                  <MapPin size={10} className="text-emerald-600 shrink-0" />
                  Desa {pin.desa || "-"}, Kec. {pin.kecamatan || "Tapsel"}
                </p>
                {pin.dbId && (
                  <Link
                    href={`/pertanian/${pin.dbId}`}
                    className="mt-2 block w-full py-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition"
                  >
                    Buka Detail Usaha
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

const DynamicPertanianMap = dynamic(() => Promise.resolve(LeafletPertanianInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2 rounded-2xl">
      <RefreshCw className="animate-spin text-emerald-600" size={20} />
      <span className="text-xs font-medium">Memuat Peta Sebaran Lahan...</span>
    </div>
  ),
});

// =============================================================================
// MAIN VIEW: DASHBOARD PERTANIAN
// =============================================================================

interface DashboardPertanianViewProps {
  data: any;
  loading?: boolean;
}

export default function DashboardPertanianView({
  data,
  loading = false,
}: DashboardPertanianViewProps) {
  const [modalKecamatanOpen, setModalKecamatanOpen] = useState(false);
  const [modalKomoditasOpen, setModalKomoditasOpen] = useState(false);

  const detail = data?.detailPertanian || {
    totalUnit: 0,
    displayKebun: "0",
    growthKebun: "↑ 12% dibanding tahun lalu",
    totalLuasHa: 0,
    displayLuasHa: "0 Ha",
    growthLuas: "↑ 8% dibanding tahun lalu",
    jumlahKomoditas: 0,
    growthKomoditas: "↑ 5% dibanding tahun lalu",
    totalPendanaan: 0,
    displayPendanaan: "Rp 0",
    totalPenerima: 0,
    displayPenerima: "0 penerima",
    growthPendanaan: "↑ 15% dibanding tahun lalu",
    komoditas: [],
    rekapKecamatan: [],
    mapPinsPertanian: [],
  };

  // 1. Data Rekap Luas per Kecamatan (Horizontal Bar Chart)
  const rekapKecamatan = detail.rekapKecamatan || [];
  const maxLuas = useMemo(() => {
    if (rekapKecamatan.length === 0) return 1;
    return Math.max(...rekapKecamatan.map((k: any) => k.luasHa || 0), 1);
  }, [rekapKecamatan]);

  // Tampilkan top 8 kecamatan pada tampilan depan seperti di mockup referensi
  const displayedKecamatan = useMemo(() => {
    return rekapKecamatan.slice(0, 8);
  }, [rekapKecamatan]);

  // 2. Data Komoditas Unggulan (Donut Chart & Legend)
  const komoditasList = detail.komoditas || [];
  const activeKomoditas = useMemo(() => {
    return komoditasList.filter((k: any) => k.count > 0);
  }, [komoditasList]);

  // Jika data komoditas belum ada penghitungan, sediakan fallback yang terdaftar
  const donutData = useMemo(() => {
    if (activeKomoditas.length > 0) {
      return activeKomoditas;
    }
    return komoditasList.slice(0, 6);
  }, [activeKomoditas, komoditasList]);

  const totalKomoditasCount = detail.jumlahKomoditas || komoditasList.length || 0;

  // 3. Titik Peta Sebaran Pertanian
  const mapPins: MapPointItem[] = detail.mapPinsPertanian || [];

  // 4. Filter Tahun Anggaran untuk Informasi Pendanaan (Default: Tahun Terkini)
  const currentYearStr = String(detail.tahunTerkini || new Date().getFullYear());
  const [selectedTahun, setSelectedTahun] = useState<string>(currentYearStr);

  useEffect(() => {
    if (detail.tahunTerkini) {
      setSelectedTahun(String(detail.tahunTerkini));
    }
  }, [detail.tahunTerkini]);

  const availableYears: (number | string)[] = useMemo(() => {
    const list = detail.availableYears || [];
    if (!list.includes(Number(currentYearStr))) {
      return [Number(currentYearStr), ...list];
    }
    return list;
  }, [detail.availableYears, currentYearStr]);

  // Data Pendanaan Terfilter per Tahun
  const rawPendanaan: any[] = detail.rawPendanaan || [];

  const filteredPendanaan = useMemo(() => {
    if (selectedTahun === "semua") return rawPendanaan;
    return rawPendanaan.filter((p: any) => String(p.tahun) === selectedTahun);
  }, [rawPendanaan, selectedTahun]);

  // Kalkulasi agregat dinamis per tahun terpilih
  const dynamicPendanaanStats = useMemo(() => {
    const totalDana = filteredPendanaan.reduce((acc, curr) => acc + Number(curr.bantuan || 0), 0);
    const uniquePenerima = new Set(filteredPendanaan.map((p) => p.kd_kebun || p.id).filter(Boolean)).size;
    const rataRata = uniquePenerima > 0 ? Math.round(totalDana / uniquePenerima) : 0;

    // Grouping sumber dana
    const sourceMap = new Map<string, number>();
    filteredPendanaan.forEach((p) => {
      const src = p.sumberDana || "Lainnya";
      sourceMap.set(src, (sourceMap.get(src) || 0) + Number(p.bantuan || 0));
    });

    const sourceColorMap: Record<string, string> = {
      "APBD Kabupaten": "#16a34a",
      "APBN": "#ef4444",
      "APBD Provinsi": "#eab308",
      "Provinsi": "#eab308",
      "CSR / Swasta": "#8b5cf6",
      "CSR / BUMN": "#8b5cf6",
      "KUR (Kredit Usaha Rakyat)": "#0284c7",
      "KUR": "#0284c7",
      "Dana Desa": "#10b981",
      "Swadaya": "#14b8a6",
      "Lainnya": "#3b82f6",
    };

    let komposisi = Array.from(sourceMap.entries()).map(([nama, nilai]) => ({
      nama,
      totalNilai: nilai,
      percentage: totalDana > 0 ? Number(((nilai / totalDana) * 100).toFixed(1)) : 0,
      color: sourceColorMap[nama] || "#3b82f6",
    })).sort((a, b) => b.totalNilai - a.totalNilai);

    if (komposisi.length === 0) {
      komposisi = detail.pendanaanKomposisi || [];
    }

    const formatShort = (val: number) => {
      if (val >= 1_000_000_000) {
        return `Rp ${(val / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
      }
      if (val >= 1_000_000) {
        return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
      }
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    return {
      totalDana,
      displayTotalFull: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalDana),
      displayTotalShort: formatShort(totalDana),
      totalPenerima: uniquePenerima,
      displayRataRata: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rataRata),
      komposisi,
      terbaru: filteredPendanaan,
    };
  }, [filteredPendanaan, detail.pendanaanKomposisi]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 bg-slate-200/70 rounded-2xl" />
          <div className="h-96 bg-slate-200/70 rounded-2xl" />
          <div className="h-96 bg-slate-200/70 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================
          BARIS ATAS: 4 KARTU STATISTIK METRIK UTAMA
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KARTU 1: JUMLAH KEBUN / LAHAN PERTANIAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              {/* Sprout Icon Sesuai Referensi Gambar */}
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Jumlah Kebun / Lahan Pertanian
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {detail.displayKebun}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthKebun}</span>
            </div>
          </div>
        </div>

        {/* KARTU 2: TOTAL LUAS LAHAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
              {/* Landscape / Lahan Icon */}
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 16 5-5c.9-.9 2.3-.9 3.2 0l5 5" />
                <path d="m14 14 1-1c.9-.9 2.3-.9 3.2 0l3 3" />
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Total Luas Lahan
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.totalLuasHa.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-bold text-slate-700">Ha</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthLuas}</span>
            </div>
          </div>
        </div>

        {/* KARTU 3: JUMLAH KOMODITAS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              {/* Plant / Komoditas Icon */}
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a9 9 0 0 0-9 9c0 4 3.5 7.5 7.5 8.7V22h3v-2.3c4-1.2 7.5-4.7 7.5-8.7a9 9 0 0 0-9-9z" />
                <path d="M12 6v8" />
                <path d="M9 10l3-3 3 3" />
              </svg>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Jumlah Komoditas
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {detail.jumlahKomoditas}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthKomoditas}</span>
            </div>
          </div>
        </div>

        {/* KARTU 4: PENDANAAN / PENERIMA BANTUAN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7e22ce] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
              {/* Wallet / Hand & Coin Icon */}
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
                <path d="M16 12h.01" />
                <path d="M7 15h6" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Pendanaan / Penerima Bantuan
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 mt-1">
                Tahun {selectedTahun === "semua" ? "Semua" : selectedTahun}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate"
              title={dynamicPendanaanStats.displayTotalFull}
            >
              {dynamicPendanaanStats.displayTotalFull}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {dynamicPendanaanStats.totalPenerima} penerima
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthPendanaan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARIS TENGAH: 2 WIDGET BERDAMPINGAN (REKAP LUAS LAHAN & KOMODITAS UNGGULAN)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ----------------------------------------------------
            WIDGET 1: REKAP LUAS LAHAN PER KECAMATAN (HORIZONTAL BAR)
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Sprout size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Rekap Luas Lahan per Kecamatan
                </h3>
              </div>
              <button
                onClick={() => setModalKecamatanOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-3.5 pt-1">
              {displayedKecamatan.length > 0 ? (
                displayedKecamatan.map((item: any) => {
                  const percentage = maxLuas > 0 ? (item.luasHa / maxLuas) * 100 : 0;
                  return (
                    <div key={item.kd_kecamatan} className="group">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-32 sm:w-36 text-xs font-bold text-slate-700 truncate"
                          title={item.nama}
                        >
                          {item.nama}
                        </span>

                        <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-emerald-500 group-hover:bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 3)}%` }}
                          />
                        </div>

                        <span className="w-20 text-right text-xs font-extrabold text-slate-800 tabular-nums">
                          {item.luasHa.toLocaleString("id-ID", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          })}{" "}
                          Ha
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  Belum ada data luas lahan per kecamatan
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sumber: Data Spasial Kebun Tapsel</span>
            <span className="font-semibold text-emerald-700">Terverifikasi</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            WIDGET 2: KOMODITAS UNGGULAN (DONUT CHART & LEGEND)
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Sprout size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Komoditas Unggulan
                </h3>
              </div>
              <Link
                href="/pertanian"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Layout 2 Kolom: Donut di Kiri, Legend di Kanan */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              {/* Donut Chart Recharts dengan Center Text */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                      }}
                      formatter={(val: any, name: any) => [`${val} kebun`, name]}
                    />
                    <Pie
                      data={donutData}
                      dataKey="count"
                      nameKey="nama"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {donutData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#16a34a"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label: X Komoditas */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {totalKomoditasCount}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">
                    Komoditas
                  </span>
                </div>
              </div>

              {/* Legend List Sesuai Referensi Gambar */}
              <div className="flex-1 w-full space-y-2 py-1 max-h-[260px] overflow-y-auto">
                {donutData.map((item: any) => (
                  <div
                    key={item.kode}
                    className="flex items-center justify-between text-xs py-0.5 px-1 rounded-md hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || "#16a34a" }}
                      />
                      <span className="font-semibold text-slate-700 truncate">
                        {item.nama}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sektor Pertanian & Perkebunan</span>
            <span className="font-semibold text-emerald-700">Dinas Pertanian</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARIS INFORMASI PENDANAAN PERTANIAN (2 PANEL BERDAMPINGAN)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ----------------------------------------------------
            PANEL KIRI: PENDANAAN / PENERIMA BANTUAN
        ---------------------------------------------------- */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Sprout size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Pendanaan / Penerima Bantuan
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                {/* FILTER TAHUN */}
                <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition shadow-2xs">
                  <Calendar size={13} className="text-emerald-700 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500">Tahun:</span>
                  <select
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={String(yr)}>
                        {yr} {String(yr) === currentYearStr ? "(Terkini)" : ""}
                      </option>
                    ))}
                    <option value="semua">Semua Tahun</option>
                  </select>
                </div>

                <Link
                  href="/pendanaan"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Konten Atas: Donut Chart + Legend di Kiri, 2 Card Metrik di Kanan */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
              {/* Donut Chart & Legend (7 Cols) */}
              <div className="md:col-span-7 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          border: "1px solid #e2e8f0",
                          fontSize: "11px",
                        }}
                        formatter={(val: any, name: any) => [`${val}%`, name]}
                      />
                      <Pie
                        data={dynamicPendanaanStats.komposisi}
                        dataKey="percentage"
                        nameKey="nama"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={68}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {dynamicPendanaanStats.komposisi.map((entry: any, index: number) => (
                          <Cell key={`cell-dana-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-slate-900 tracking-tight leading-none text-center px-1 truncate max-w-[85px]">
                      {dynamicPendanaanStats.displayTotalShort || "Rp 0"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">
                      Total Bantuan
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 w-full space-y-2 py-1 max-h-[160px] overflow-y-auto">
                  {dynamicPendanaanStats.komposisi.map((item: any) => (
                    <div
                      key={item.nama}
                      className="flex items-center justify-between text-xs py-0.5 px-1 rounded-md hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2 truncate pr-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-700 truncate">
                          {item.nama}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 Card Metrik Vertikal (5 Cols) */}
              <div className="md:col-span-5 space-y-3">
                {/* Card 1: Penerima Bantuan */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {dynamicPendanaanStats.totalPenerima}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-1 block">
                      Penerima Bantuan {selectedTahun !== "semua" ? selectedTahun : ""}
                    </span>
                  </div>
                </div>

                {/* Card 2: Rata-rata per Penerima */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <CircleDollarSign size={22} />
                  </div>
                  <div>
                    <div
                      className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none truncate max-w-[160px]"
                      title={dynamicPendanaanStats.displayRataRata}
                    >
                      {dynamicPendanaanStats.displayRataRata}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-1 block">
                      Rata-rata per penerima
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Bawah: Dukung Pertanian Tapsel */}
          <div className="mt-5 relative rounded-2xl overflow-hidden shadow-sm border border-emerald-900/20 bg-gradient-to-r from-[#0a2e22] via-[#0f4433] to-[#125841] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div
              className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80')",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sprout size={16} className="text-emerald-300" />
                <h4 className="text-sm font-extrabold tracking-wide text-white">
                  Dukung Pertanian Tapsel
                </h4>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium max-w-md">
                Bersama kita wujudkan ketahanan pangan dan kesejahteraan petani.
              </p>
            </div>

            <Link
              href="/pendanaan"
              className="relative z-10 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-emerald-900 text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Lihat Detail</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------
            PANEL KANAN: DATA TERBARU
        ---------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Wallet size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Data Terbaru
                </h3>
              </div>
              <Link
                href="/pendanaan"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Tabel Data Terbaru */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 font-bold">
                    <th className="pb-2.5 w-8 text-center font-bold">No</th>
                    <th className="pb-2.5 font-bold">Nama Kelompok Tani / Petani</th>
                    <th className="pb-2.5 font-bold">Komoditas</th>
                    <th className="pb-2.5 font-bold">Bantuan</th>
                    <th className="pb-2.5 font-bold text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dynamicPendanaanStats.terbaru && dynamicPendanaanStats.terbaru.length > 0 ? (
                    dynamicPendanaanStats.terbaru.slice(0, 5).map((row: any, idx: number) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 font-bold text-slate-800 pr-2">
                          <span className="truncate block max-w-[170px]" title={row.namaPenerima}>
                            {row.namaPenerima}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-600">{row.komoditas}</td>
                        <td className="py-3 font-extrabold text-slate-900 tabular-nums">
                          {row.displayBantuan}
                        </td>
                        <td className="py-3 text-right font-medium text-slate-500 whitespace-nowrap">
                          {row.tanggal}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Belum ada data penyaluran bantuan pertanian {selectedTahun !== "semua" ? `tahun ${selectedTahun}` : ""}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-4">
            <span>Realisasi Bantuan Tercatat {selectedTahun !== "semua" ? `(${selectedTahun})` : ""}</span>
            <span className="font-semibold text-emerald-700">100% Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: LIHAT SEMUA REKAP KECAMATAN
      ======================================================== */}
      {modalKecamatanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sprout size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Rekap Luas Lahan Seluruh Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total {rekapKecamatan.length} Kecamatan di Kabupaten Tapanuli Selatan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalKecamatanOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-3 pr-2">
              {rekapKecamatan.map((item: any, idx: number) => {
                const percentage = maxLuas > 0 ? (item.luasHa / maxLuas) * 100 : 0;
                return (
                  <div
                    key={item.kd_kecamatan}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-emerald-50/40 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {item.nama}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{item.count} kebun</span>
                        <span className="font-extrabold text-emerald-700">
                          {item.luasHa.toLocaleString("id-ID")} Ha
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setModalKecamatanOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
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
