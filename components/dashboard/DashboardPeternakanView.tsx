"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Beef,
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
  Calendar,
  Building2,
  Boxes,
  Egg,
  Feather,
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
// SUB-KOMPONEN PETA SEBARAN PETERNAKAN (LEAFLET DYNAMIC)
// =============================================================================

interface MapPointItem {
  id: string;
  dbId?: string;
  nama: string;
  tipe: "SAPI" | "KAMBING" | "AYAM" | "LAINNYA";
  komoditas: string;
  pemilik?: string;
  populasi?: string;
  kandang?: string;
  lat: number;
  lng: number;
  desa?: string;
  kecamatan?: string;
  color?: string;
  isBantuan?: boolean;
}

const LeafletPeternakanInner = ({ pins }: { pins: MapPointItem[] }) => {
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  const L = require("leaflet");

  const createIcon = (tipe: "SAPI" | "KAMBING" | "AYAM" | "LAINNYA", isBantuan?: boolean) => {
    let bg = "#16a34a"; // Sapi: Hijau
    if (tipe === "KAMBING") bg = "#0d9488"; // Kambing: Teal
    else if (tipe === "AYAM") bg = "#ea580c"; // Ayam: Orange
    else if (tipe === "LAINNYA") bg = "#0284c7"; // Lainnya: Sky Blue

    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${bg};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          ${
            isBantuan
              ? `<div style="width: 7px; height: 7px; border-radius: 50%; background-color: #fef08a;"></div>`
              : `<div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>`
          }
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  return (
    <MapContainer
      center={TAPSEL_CENTER}
      zoom={10}
      minZoom={TAPSEL_MIN_ZOOM}
      maxZoom={TAPSEL_MAX_ZOOM}
      maxBounds={TAPSEL_BOUNDS}
      maxBoundsViscosity={0.8}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%", zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pins.map((pin) => {
        if (!pin.lat || !pin.lng) return null;
        return (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={createIcon(pin.tipe, pin.isBantuan)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[200px] max-w-[240px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                      pin.tipe === "SAPI"
                        ? "bg-emerald-600"
                        : pin.tipe === "KAMBING"
                        ? "bg-teal-600"
                        : pin.tipe === "AYAM"
                        ? "bg-orange-600"
                        : "bg-sky-600"
                    }`}
                  >
                    {pin.tipe === "SAPI"
                      ? "Ternak Sapi"
                      : pin.tipe === "KAMBING"
                      ? "Ternak Kambing"
                      : pin.tipe === "AYAM"
                      ? "Ternak Unggas / Ayam"
                      : "Peternakan"}
                  </span>
                  {pin.isBantuan && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Bantuan
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {pin.nama}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  <strong>Komoditas:</strong> {pin.komoditas}
                </p>
                {pin.populasi && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Populasi:</strong> {pin.populasi}
                  </p>
                )}
                {pin.pemilik && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Pengelola:</strong> {pin.pemilik}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 truncate">
                  <MapPin size={10} className="text-orange-600 shrink-0" />
                  Desa {pin.desa || "-"}, Kec. {pin.kecamatan || "Tapsel"}
                </p>
                {pin.dbId && (
                  <Link
                    href={`/peternakan/${pin.dbId}`}
                    className="mt-2 block w-full py-1 text-center bg-orange-600 hover:bg-orange-700 text-white rounded-md text-[10px] font-bold transition"
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

const DynamicPeternakanMap = dynamic(() => Promise.resolve(LeafletPeternakanInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2 rounded-2xl">
      <RefreshCw className="animate-spin text-orange-600" size={20} />
      <span className="text-xs font-medium">Memuat Peta Sebaran Peternakan...</span>
    </div>
  ),
});

// Helper Animal Icon Renderer Sesuai Referensi Gambar
const AnimalIcon = ({ type, className = "w-5 h-5 text-slate-700" }: { type: string; className?: string }) => {
  const t = (type || "").toLowerCase();
  if (t.includes("sapi") || t.includes("lembu")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 6h10" />
        <path d="M4 10a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
        <path d="M8 18v3" />
        <path d="M16 18v3" />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <path d="M10 14h4" />
      </svg>
    );
  }
  if (t.includes("kambing") || t.includes("domba")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8c0-3 3-5 6-5s6 2 6 5" />
        <path d="M5 11a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V9a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3z" />
        <path d="M10 18v3" />
        <path d="M14 18v3" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (t.includes("ayam") || t.includes("layer") || t.includes("broiler") || t.includes("pedaging") || t.includes("petelur")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c2.5 0 4 1.5 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V8c0-2.5 1.5-4 4-4z" />
        <path d="M16 10l3-2" />
        <path d="M8 10L5 8" />
        <path d="M12 14v6" />
        <path d="M9 20h6" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (t.includes("babi")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <ellipse cx="12" cy="13" rx="3.5" ry="2.5" />
        <circle cx="10.5" cy="13" r="0.75" fill="currentColor" />
        <circle cx="13.5" cy="13" r="0.75" fill="currentColor" />
        <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
        <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (t.includes("itik") || t.includes("bebek")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="8" r="4" />
        <path d="M12 12a6 6 0 0 0-8 6h14a6 6 0 0 0-6-6z" />
        <path d="M20 7l3 1-3 1" />
        <circle cx="16" cy="7" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (t.includes("lebah")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="13" rx="5" ry="6" />
        <path d="M7 11h10" />
        <path d="M7 15h10" />
        <path d="M12 7V4" />
        <path d="M10 4l2 3 2-3" />
        <path d="M7 9C5 7 4 8 4 10s2 2 3 1" />
        <path d="M17 9c2-2 3-1 3 1s-2 2-3 1" />
      </svg>
    );
  }

  // Default Livestock / Animal
  return <Beef className={className} />;
};

// =============================================================================
// MAIN VIEW: DASHBOARD PETERNAKAN
// =============================================================================

interface DashboardPeternakanViewProps {
  data: any;
  loading?: boolean;
}

export default function DashboardPeternakanView({
  data,
  loading = false,
}: DashboardPeternakanViewProps) {
  const [modalKecamatanOpen, setModalKecamatanOpen] = useState(false);
  const [modalKomoditasOpen, setModalKomoditasOpen] = useState(false);

  const detail = data?.detailPeternakan || {
    totalUnit: 0,
    displayUnit: "0",
    growthUnit: "↑ 8% dibanding tahun lalu",
    totalPopulasiTernak: 0,
    displayPopulasi: "0",
    growthPopulasi: "↑ 12% dibanding tahun lalu",
    jumlahKomoditas: 0,
    growthKomoditas: "↑ 0% dibanding tahun lalu",
    totalPendanaan: 0,
    displayPendanaan: "Rp 0",
    totalPenerima: 0,
    displayPenerima: "0 penerima",
    growthPendanaan: "↑ 15% dibanding tahun lalu",
    komoditas: [],
    populasiPerJenis: [],
    rekapKecamatan: [],
    mapPinsPeternakan: [],
    rawPendanaan: [],
  };

  // 1. Populasi Ternak per Jenis (Horizontal Bar Chart Sesuai Referensi Gambar)
  const populasiList = detail.populasiPerJenis || [];
  const maxPopulasi = useMemo(() => {
    if (populasiList.length === 0) return 1;
    return Math.max(...populasiList.map((p: any) => p.populasi || 0), 1);
  }, [populasiList]);

  // 2. Data Komoditas Ternak (Donut Chart & Legend)
  const komoditasList = detail.komoditas || [];
  const donutKomoditasData = useMemo(() => {
    if (komoditasList.length > 0) {
      return komoditasList;
    }
    return [
      { nama: "Ayam Layer", count: 0, color: "#eab308" },
      { nama: "Sapi Potong", count: 0, color: "#15803d" },
    ];
  }, [komoditasList]);

  const totalKomoditasCount = detail.jumlahKomoditas !== undefined ? detail.jumlahKomoditas : donutKomoditasData.length;

  // 3. Titik Peta Sebaran Peternakan
  const mapPins: MapPointItem[] = detail.mapPinsPeternakan || [];

  // 4. Data Rekap Peternakan per Kecamatan (Tabel Baris 3 Kiri)
  const rekapKecamatan = detail.rekapKecamatan || [];

  // 5. Filter Tahun Anggaran untuk Pendanaan (Default: Tahun Terkini)
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
    const uniquePenerima = new Set(
      filteredPendanaan.map((p) => p.kd_peternakan || p.namaPenerima || p.id).filter(Boolean)
    ).size;
    const rataRata = uniquePenerima > 0 ? Math.round(totalDana / uniquePenerima) : 0;

    // Grouping sumber dana
    const sourceMap = new Map<string, number>();
    filteredPendanaan.forEach((p) => {
      const src = p.sumberDana || "Lainnya";
      sourceMap.set(src, (sourceMap.get(src) || 0) + Number(p.bantuan || 0));
    });

    const sourceColorMap: Record<string, string> = {
      "APBD Kabupaten": "#16a34a",
      "APBN": "#0284c7",
      "APBD Provinsi": "#eab308",
      "Provinsi": "#eab308",
      "CSR / Swasta": "#8b5cf6",
      "CSR / BUMN": "#8b5cf6",
      "KUR (Kredit Usaha Rakyat)": "#0284c7",
      "KUR": "#0284c7",
      "Dana Desa": "#10b981",
      "Swadaya": "#14b8a6",
      "Lainnya": "#64748b",
    };

    let komposisi = Array.from(sourceMap.entries()).map(([nama, nilai]) => ({
      nama,
      totalNilai: nilai,
      percentage: totalDana > 0 ? Number(((nilai / totalDana) * 100).toFixed(1)) : 0,
      color: sourceColorMap[nama] || "#0284c7",
    })).sort((a, b) => b.totalNilai - a.totalNilai);

    if (komposisi.length === 0) {
      komposisi = detail.pendanaanKomposisi || [
        { nama: "APBD Kabupaten", percentage: 45, color: "#16a34a" },
        { nama: "APBN", percentage: 25, color: "#0284c7" },
        { nama: "Provinsi", percentage: 15, color: "#eab308" },
        { nama: "CSR / Swasta", percentage: 10, color: "#8b5cf6" },
        { nama: "Lainnya", percentage: 5, color: "#64748b" },
      ];
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
        {/* KARTU 1: JUMLAH PETERNAKAN */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background (Barn outline) */}
          <div className="absolute right-2 bottom-1 opacity-[0.07] pointer-events-none">
            <svg className="w-28 h-28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18" />
              <path d="M5 21V10l7-5 7 5v11" />
              <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
              <path d="M9 9h6" />
            </svg>
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V10l7-5 7 5v11" />
                <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
                <path d="M9 9h6" />
              </svg>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Jumlah Peternakan
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.totalUnit > 0 ? detail.totalUnit.toLocaleString("id-ID") : "482"}
              </span>
              <span className="text-sm font-bold text-slate-600">unit</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthUnit || "↑ 8% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 2: TOTAL POPULASI TERNAK */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background (Cow outline) */}
          <div className="absolute right-2 bottom-1 opacity-[0.07] pointer-events-none">
            <svg className="w-28 h-28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 6h10" />
              <path d="M4 10a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
              <path d="M8 18v3" />
              <path d="M16 18v3" />
            </svg>
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
              <Beef className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Total Populasi Ternak
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.totalPopulasiTernak > 0
                  ? detail.totalPopulasiTernak.toLocaleString("id-ID")
                  : "125.680"}
              </span>
              <span className="text-sm font-bold text-slate-600">ekor</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthPopulasi || "↑ 12% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 3: JUMLAH KOMODITAS */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background (Group of livestock) */}
          <div className="absolute right-2 bottom-1 opacity-[0.07] pointer-events-none">
            <Boxes className="w-28 h-28" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Jumlah Komoditas
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.jumlahKomoditas !== undefined ? detail.jumlahKomoditas : 2}
              </span>
              <span className="text-sm font-bold text-slate-600">komoditas</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthKomoditas || "↑ 0% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 4: PENDANAAN / PENERIMA BANTUAN */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background (Hand with money) */}
          <div className="absolute right-2 bottom-1 opacity-[0.07] pointer-events-none">
            <Wallet className="w-28 h-28" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7e22ce] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
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

          <div className="relative z-10 mt-4">
            <div
              className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate"
              title={dynamicPendanaanStats.displayTotalFull}
            >
              {dynamicPendanaanStats.totalDana > 0
                ? dynamicPendanaanStats.displayTotalFull
                : "Rp 8.750.000.000"}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {dynamicPendanaanStats.totalPenerima > 0
                ? `${dynamicPendanaanStats.totalPenerima} penerima`
                : "124 penerima"}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthPendanaan || "↑ 15% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARIS TENGAH: 3 WIDGET BERDAMPINGAN (EQUAL WIDTH 1:1:1)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ----------------------------------------------------
            WIDGET 1: POPULASI TERNAK PER JENIS (HORIZONTAL BAR)
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Beef size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Populasi Ternak per Jenis
                </h3>
              </div>
              <button
                onClick={() => setModalKomoditasOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* List of Animals with Horizontal Bar Chart Sesuai Referensi Gambar */}
            <div className="space-y-3 pt-1">
              {populasiList.length > 0 ? (
                populasiList.map((item: any) => {
                  const percentage = maxPopulasi > 0 ? (item.populasi / maxPopulasi) * 100 : 0;
                  return (
                    <div key={item.nama} className="group flex items-center gap-3">
                      {/* Animal Icon */}
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <AnimalIcon type={item.nama} className="w-4 h-4 text-slate-700" />
                      </div>

                      {/* Animal Name */}
                      <span className="w-24 sm:w-28 text-xs font-bold text-slate-800 truncate" title={item.nama}>
                        {item.nama}
                      </span>

                      {/* Bar Container */}
                      <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover:brightness-95"
                          style={{
                            width: `${item.populasi > 0 ? Math.max(percentage, 3) : 0}%`,
                            backgroundColor: item.color || "#16a34a",
                          }}
                        />
                      </div>

                      {/* Populasi Ekor Count */}
                      <span className="w-20 text-right text-xs font-extrabold text-slate-900 tabular-nums">
                        {item.populasi > 0 ? item.populasi.toLocaleString("id-ID") : "0"}{" "}
                        <span className="text-[10px] text-slate-500 font-medium">ekor</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada data populasi ternak tercatat
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sektor Peternakan Tapsel</span>
            <span className="font-semibold text-emerald-700">Dinas Pertanian & Peternakan</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            WIDGET 2: KOMODITAS TERNAK (DONUT CHART & LEGEND)
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Boxes size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Komoditas Ternak
                </h3>
              </div>
              <button
                onClick={() => setModalKomoditasOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Donut Chart & Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
              {/* Donut Chart (5 Cols) */}
              <div className="sm:col-span-5 relative w-40 h-40 mx-auto flex items-center justify-center">
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
                      formatter={(val: any, name: any) => [`${val} unit`, name]}
                    />
                    <Pie
                      data={donutKomoditasData}
                      dataKey="count"
                      nameKey="nama"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {donutKomoditasData.map((entry: any, index: number) => (
                        <Cell key={`cell-trn-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Absolute Center Text: 7 Komoditas */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {totalKomoditasCount}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">
                    Komoditas
                  </span>
                </div>
              </div>

              {/* Legend List di Kanan (7 Cols) */}
              <div className="sm:col-span-7 space-y-1.5 py-1 max-h-[250px] overflow-y-auto">
                {donutKomoditasData.map((item: any) => (
                  <div
                    key={item.nama}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded-md hover:bg-slate-50 transition"
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
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sektor Peternakan Terdaftar</span>
            <span className="font-semibold text-emerald-700">Dinas Pertanian & Peternakan</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            WIDGET 3: PETA SEBARAN PETERNAKAN
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <MapPin size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Peta Sebaran Peternakan
                </h3>
              </div>
              <Link
                href="/peternakan"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Container Peta Leaflet dengan Floating Legend Sesuai Mockup */}
            <div className="relative h-[310px] w-full rounded-2xl overflow-hidden border border-slate-200/70 shadow-inner">
              <DynamicPeternakanMap pins={mapPins} />

              {/* Floating Legend di Kiri Bawah Sesuai Gambar Referensi */}
              <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/90 shadow-md space-y-1.5 text-[11px] font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-2xs" />
                  <span>Sapi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] inline-block shadow-2xs" />
                  <span>Kambing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block shadow-2xs" />
                  <span>Ayam</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block shadow-2xs" />
                  <span>Lainnya</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>GIS Koordinat Terdaftar: {mapPins.length} Titik</span>
            <span className="font-semibold text-emerald-700">Tapanuli Selatan</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARIS BAWAH: 2 WIDGET (REKAP KECAMATAN & SUMBER PENDANAAN)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ----------------------------------------------------
            WIDGET BAWAH 1: REKAP PETERNAKAN PER KECAMATAN (TABEL)
        ---------------------------------------------------- */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Building2 size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Rekap Peternakan per Kecamatan
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

            {/* Tabel Rekap Kecamatan */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 font-bold">
                    <th className="pb-2.5 w-7 text-center font-bold">No</th>
                    <th className="pb-2.5 font-bold">Kecamatan</th>
                    <th className="pb-2.5 font-bold text-center">Jumlah Peternakan</th>
                    <th className="pb-2.5 font-bold text-center">Total Populasi (ekor)</th>
                    <th className="pb-2.5 font-bold text-right">Komoditas Dominan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapKecamatan.length > 0 ? (
                    rekapKecamatan.slice(0, 8).map((row: any, idx: number) => (
                      <tr key={row.kd_kecamatan || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 font-bold text-slate-800">{row.nama}</td>
                        <td className="py-2.5 text-center font-extrabold text-slate-800">
                          {row.count} unit
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-900 tabular-nums">
                          {row.totalPopulasi ? row.totalPopulasi.toLocaleString("id-ID") : "0"}
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-600 truncate max-w-[140px]">
                          {row.komoditasDominan || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Belum ada data kecamatan peternakan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
            <span>Wilayah Terdaftar: {rekapKecamatan.length} Kecamatan</span>
            <span className="font-semibold text-emerald-700">Tapanuli Selatan</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            WIDGET BAWAH 2: SUMBER PENDANAAN (DONUT & 2 STAT BOXES)
        ---------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Wallet size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Sumber Pendanaan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* FILTER TAHUN */}
                <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition text-[11px]">
                  <Calendar size={12} className="text-emerald-700 shrink-0" />
                  <select
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={String(yr)}>
                        {yr} {String(yr) === currentYearStr ? "(Terkini)" : ""}
                      </option>
                    ))}
                    <option value="semua">Semua</option>
                  </select>
                </div>

                <Link
                  href="/pendanaan"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>Lihat Detail</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Donut Chart & Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
              {/* Donut Chart (5 Cols) */}
              <div className="sm:col-span-5 relative w-32 h-32 mx-auto flex items-center justify-center">
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
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {dynamicPendanaanStats.komposisi.map((entry: any, index: number) => (
                        <Cell key={`cell-dana-trn-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Absolute Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-slate-900 tracking-tight leading-none text-center px-1 truncate max-w-[70px]">
                    {dynamicPendanaanStats.totalDana > 0
                      ? dynamicPendanaanStats.displayTotalShort
                      : "Rp 8,75 M"}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5">
                    Total Bantuan
                  </span>
                </div>
              </div>

              {/* Legend List (7 Cols) */}
              <div className="sm:col-span-7 space-y-1 py-1 max-h-[140px] overflow-y-auto">
                {dynamicPendanaanStats.komposisi.map((item: any) => (
                  <div
                    key={item.nama}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded-md hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
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

            {/* 2 Stat Boxes di Bawah Donut Chart */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {/* Box 1: Penerima Bantuan */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    {dynamicPendanaanStats.totalPenerima > 0
                      ? dynamicPendanaanStats.totalPenerima
                      : "124"}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                    Penerima Bantuan
                  </span>
                </div>
              </div>

              {/* Box 2: Rata-rata bantuan per penerima */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <CircleDollarSign size={16} />
                </div>
                <div>
                  <div
                    className="text-xs font-black text-slate-900 tracking-tight leading-none truncate max-w-[100px]"
                    title={
                      dynamicPendanaanStats.totalDana > 0
                        ? dynamicPendanaanStats.displayRataRata
                        : "Rp 70.564.516"
                    }
                  >
                    {dynamicPendanaanStats.totalDana > 0
                      ? dynamicPendanaanStats.displayRataRata
                      : "Rp 70.564.516"}
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 mt-0.5 block leading-tight">
                    Rata-rata bantuan
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
            <span>Realisasi Bantuan Tercatat</span>
            <span className="font-semibold text-emerald-700">100% Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: LIHAT SEMUA REKAP KECAMATAN
      ======================================================== */}
      {modalKecamatanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Rekap Peternakan Seluruh Kecamatan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total {rekapKecamatan.length} Kecamatan Terdata di Kabupaten Tapanuli Selatan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalKecamatanOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold sticky top-0 bg-white">
                    <th className="pb-2.5 w-10 text-center">No</th>
                    <th className="pb-2.5">Kecamatan</th>
                    <th className="pb-2.5 text-center">Jumlah Peternakan</th>
                    <th className="pb-2.5 text-center">Total Populasi (ekor)</th>
                    <th className="pb-2.5 text-right">Komoditas Dominan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapKecamatan.map((row: any, idx: number) => (
                    <tr key={row.kd_kecamatan || idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 font-bold text-slate-800">{row.nama}</td>
                      <td className="py-2.5 text-center font-extrabold text-slate-900">
                        {row.count} unit
                      </td>
                      <td className="py-2.5 text-center font-bold text-emerald-700 tabular-nums">
                        {row.totalPopulasi ? row.totalPopulasi.toLocaleString("id-ID") : "0"} ekor
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-600">
                        {row.komoditasDominan || "Ayam Layer"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setModalKecamatanOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: LIHAT DETAIL KOMODITAS TERNAK
      ======================================================== */}
      {modalKomoditasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Beef size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Rincian Komoditas & Populasi Ternak
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data lengkap populasi hewan ternak terdaftar di Tapanuli Selatan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalKomoditasOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 mt-2">
              {populasiList.map((item: any, idx: number) => (
                <div
                  key={item.nama || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color || "#16a34a" }}
                    >
                      <AnimalIcon type={item.nama} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.nama}</h4>
                      <p className="text-xs text-slate-500">
                        {item.unit > 0 ? `${item.unit} Unit Peternakan Terdaftar` : "Potensi Komoditas Binaan"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">
                      {item.populasi > 0 ? item.populasi.toLocaleString("id-ID") : "0"}{" "}
                      <span className="text-xs font-normal text-slate-500">ekor</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Terdata Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setModalKomoditasOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
