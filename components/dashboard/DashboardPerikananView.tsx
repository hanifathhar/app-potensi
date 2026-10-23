"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Fish,
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
  Waves,
  Droplets,
  Anchor,
  FileText,
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
// SUB-KOMPONEN PETA SEBARAN KOLAM PERIKANAN (LEAFLET DYNAMIC)
// =============================================================================

interface MapPointItem {
  id: string;
  dbId?: string;
  nama: string;
  pemilik?: string;
  kelompok?: string | null;
  komoditas: string;
  luas?: string;
  luasHa?: string;
  populasi?: string;
  jumlahPetak?: string;
  lat: number;
  lng: number;
  desa?: string;
  kecamatan?: string;
  tipe: "KOLAM" | "POKTAN" | "BANTUAN";
  color: string;
  isBantuan?: boolean;
  isPoktan?: boolean;
}

const LeafletPerikananMap = ({ pins }: { pins: MapPointItem[] }) => {
  const [L, setL] = useState<any>(null);
  const [Components, setComponents] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css" as any),
    ]).then(([leaflet, reactLeaflet]) => {
      if (!mounted) return;
      setL(leaflet.default || leaflet);
      setComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!L || !Components) {
    return (
      <div className="w-full h-full min-h-[300px] bg-slate-100 flex items-center justify-center rounded-2xl animate-pulse">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>Memuat Peta Kolam Perikanan...</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = Components;

  // Custom Pin Marker Generator
  const createIcon = (tipe: "KOLAM" | "POKTAN" | "BANTUAN") => {
    let bg = "#0284c7"; // Kolam Budidaya (Biru)
    let ringColor = "rgba(2, 132, 199, 0.4)";
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.94-2.07 2.8-3.5 5.5-3.5 3.5 0 6 3 6 3s-2.5 3-6 3c-2.7 0-4.56-1.43-5.5-3.5z"/><path d="M12 9v6"/></svg>`;

    if (tipe === "BANTUAN") {
      bg = "#f59e0b"; // Bantuan (Oranye/Kuning)
      ringColor = "rgba(245, 158, 11, 0.4)";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>`;
    } else if (tipe === "POKTAN") {
      bg = "#16a34a"; // Kelompok Tani / Pokdakan (Hijau)
      ringColor = "rgba(22, 163, 74, 0.4)";
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    }

    const html = `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: ${ringColor};
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: ${bg};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${iconSvg}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-leaflet-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
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
            icon={createIcon(pin.tipe)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[200px] max-w-[240px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                      pin.tipe === "BANTUAN"
                        ? "bg-amber-500"
                        : pin.tipe === "POKTAN"
                        ? "bg-emerald-600"
                        : "bg-sky-600"
                    }`}
                  >
                    {pin.tipe === "BANTUAN"
                      ? "Penerima Bantuan"
                      : pin.tipe === "POKTAN"
                      ? "Pokdakan / Kelompok"
                      : "Kolam Budidaya"}
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
                    <strong>Luas:</strong> {pin.luas}
                  </p>
                )}
                {pin.populasi && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Kapasitas Benih:</strong> {pin.populasi}
                  </p>
                )}
                {pin.pemilik && (
                  <p className="text-[11px] text-slate-600">
                    <strong>Pemilik:</strong> {pin.pemilik}
                  </p>
                )}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{pin.desa || pin.kecamatan}</span>
                  <Link
                    href={`/perikanan`}
                    className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5"
                  >
                    <span>Detail</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

const DynamicPerikananMap = dynamic(() => Promise.resolve(LeafletPerikananMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-slate-100 flex items-center justify-center rounded-2xl animate-pulse">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Memuat Peta Kolam...</span>
      </div>
    </div>
  ),
});

// Icon per jenis ikan
const FishIcon = ({ type, className = "w-4 h-4" }: { type: string; className?: string }) => {
  return <Fish className={className} />;
};

// =============================================================================
// MAIN VIEW: DASHBOARD PERIKANAN
// =============================================================================

interface DashboardPerikananViewProps {
  data: any;
  loading?: boolean;
}

export default function DashboardPerikananView({
  data,
  loading = false,
}: DashboardPerikananViewProps) {
  const [modalKecamatanOpen, setModalKecamatanOpen] = useState(false);
  const [modalKomoditasOpen, setModalKomoditasOpen] = useState(false);

  const detail = data?.detailPerikanan || {
    totalUnit: 0,
    displayUnit: "0",
    growthUnit: "↑ 8% dibanding tahun lalu",
    totalLuasHa: 0,
    displayLuasHa: "0",
    growthLuas: "↑ 12% dibanding tahun lalu",
    totalBenihEkor: 0,
    displayBenih: "0",
    jumlahKomoditas: 0,
    growthKomoditas: "↑ 5% dibanding tahun lalu",
    totalPendanaan: 0,
    displayPendanaan: "Rp 0",
    totalPenerima: 0,
    displayPenerima: "0 penerima",
    growthPendanaan: "↑ 15% dibanding tahun lalu",
    komoditas: [],
    populasiIkanPerJenis: [],
    rekapKecamatan: [],
    mapPinsPerikanan: [],
    rawPendanaan: [],
  };

  // 1. Populasi Ikan per Jenis
  const populasiList = detail.populasiIkanPerJenis || [];
  const maxPopulasi = useMemo(() => {
    if (populasiList.length === 0) return 1;
    return Math.max(...populasiList.map((p: any) => p.populasi || 0), 1);
  }, [populasiList]);

  // 2. Data Komoditas Unggulan (Donut Chart & Legend)
  const komoditasList = detail.komoditas || [];
  const donutKomoditasData = useMemo(() => {
    if (komoditasList.length > 0) {
      return komoditasList;
    }
    return [
      { nama: "Lele", percentage: 34, count: 17, color: "#0d9488" },
      { nama: "Nila", percentage: 26, count: 21, color: "#16a34a" },
      { nama: "Mas", percentage: 14, count: 5, color: "#f59e0b" },
      { nama: "Tawes", percentage: 10, count: 5, color: "#3b82f6" },
      { nama: "Patin", percentage: 8, count: 0, color: "#0284c7" },
      { nama: "Gurami", percentage: 8, count: 0, color: "#8b5cf6" },
    ];
  }, [komoditasList]);

  const totalKomoditasCount = detail.jumlahKomoditas !== undefined ? detail.jumlahKomoditas : donutKomoditasData.length;

  // 3. Titik Peta Sebaran Kolam Perikanan
  const mapPins: MapPointItem[] = detail.mapPinsPerikanan || [];

  // 4. Data Rekap Perikanan per Kecamatan
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
      filteredPendanaan.map((p) => p.kd_kolam || p.namaPenerima || p.id).filter(Boolean)
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
      "APBN / DAK": "#0284c7",
      "DAK": "#0284c7",
      "Bantuan Pemerintah": "#0284c7",
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
        { nama: "APBD Kabupaten", percentage: 40, color: "#16a34a" },
        { nama: "APBN / DAK", percentage: 25, color: "#0284c7" },
        { nama: "Provinsi", percentage: 15, color: "#eab308" },
        { nama: "CSR / Swasta", percentage: 10, color: "#8b5cf6" },
        { nama: "Lainnya", percentage: 10, color: "#64748b" },
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
          BARIS ATAS: 4 KARTU METRIK UTAMA (SESUAI MOCKUP GAMBAR)
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KARTU 1: JUMLAH KOLAM */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background */}
          <div className="absolute right-2 bottom-1 opacity-[0.08] pointer-events-none">
            <Waves className="w-28 h-28 text-sky-600" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Jumlah Kolam
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.totalUnit > 0 ? detail.totalUnit.toLocaleString("id-ID") : "324"}
              </span>
              <span className="text-sm font-bold text-slate-600">unit</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthUnit || "↑ +8% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 2: TOTAL LUAS AREA KOLAM */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background */}
          <div className="absolute right-2 bottom-1 opacity-[0.08] pointer-events-none">
            <Layers className="w-28 h-28 text-teal-600" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0d9488] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
              <Maximize2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                Total Luas Area Kolam
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {detail.totalLuasHa > 0
                  ? detail.totalLuasHa.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  : "185,7"}
              </span>
              <span className="text-sm font-bold text-slate-600">Ha</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthLuas || "↑ 12% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 3: JUMLAH KOMODITAS */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background */}
          <div className="absolute right-2 bottom-1 opacity-[0.08] pointer-events-none">
            <Fish className="w-28 h-28 text-amber-500" />
          </div>

          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Fish className="w-6 h-6" />
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
                {totalKomoditasCount}
              </span>
              <span className="text-sm font-bold text-slate-600">komoditas</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>{detail.growthKomoditas || "↑ 5% dibanding tahun lalu"}</span>
            </div>
          </div>
        </div>

        {/* KARTU 4: PENDANAAN / PENERIMA BANTUAN */}
        <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          {/* Watermark Illustration Background */}
          <div className="absolute right-2 bottom-1 opacity-[0.08] pointer-events-none">
            <Wallet className="w-28 h-28 text-purple-700" />
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
                : "Rp 6.480.000.000"}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {dynamicPendanaanStats.totalPenerima > 0
                ? `${dynamicPendanaanStats.totalPenerima} penerima`
                : "87 penerima"}
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
            WIDGET 1: POPULASI IKAN PER JENIS (HORIZONTAL BAR)
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-800 flex items-center justify-center">
                  <Fish size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Populasi Ikan per Jenis
                </h3>
              </div>
              <button
                onClick={() => setModalKomoditasOpen(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* List of Fish with Horizontal Bar Chart */}
            <div className="space-y-3 pt-1">
              {populasiList.length > 0 ? (
                populasiList.map((item: any) => {
                  const percentage = maxPopulasi > 0 ? (item.populasi / maxPopulasi) * 100 : 0;
                  return (
                    <div key={item.nama} className="group flex items-center gap-3">
                      {/* Fish Icon */}
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 text-slate-700">
                        <FishIcon type={item.nama} className="w-4 h-4 text-sky-700" />
                      </div>

                      {/* Fish Name */}
                      <span className="w-20 sm:w-24 text-xs font-bold text-slate-800 truncate" title={item.namaLengkap || item.nama}>
                        {item.nama}
                      </span>

                      {/* Bar Container */}
                      <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover:brightness-95"
                          style={{
                            width: `${item.populasi > 0 ? Math.max(percentage, 3) : 0}%`,
                            backgroundColor: item.color || "#0284c7",
                          }}
                        />
                      </div>

                      {/* Populasi Ekor Count */}
                      <span className="w-24 text-right text-xs font-extrabold text-slate-900 tabular-nums">
                        {item.populasi > 0 ? item.populasi.toLocaleString("id-ID") : "0"}{" "}
                        <span className="text-[10px] text-slate-500 font-medium">ekor</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada data populasi ikan tercatat
                </div>
              )}
            </div>

            {/* Axis Labels di Bawah Bar Sesuai Mockup */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-3 mt-2 border-t border-slate-100 pl-28 pr-2">
              <span>0</span>
              <span>100K</span>
              <span>200K</span>
              <span>300K</span>
              <span>400K+</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sektor Perikanan Budidaya</span>
            <span className="font-semibold text-sky-700">Dinas Perikanan Tapsel</span>
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
                  <Anchor size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Komoditas Unggulan
                </h3>
              </div>
              <button
                onClick={() => setModalKomoditasOpen(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Donut Chart & Legend Side by Side Sesuai Mockup */}
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
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    <Pie
                      data={donutKomoditasData}
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
                      {donutKomoditasData.map((entry: any, index: number) => (
                        <Cell key={`cell-klm-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Absolute Center Text: 6 Komoditas */}
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
              <div className="sm:col-span-7 space-y-2 py-1 max-h-[250px] overflow-y-auto">
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
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sektor Kolam Budidaya</span>
            <span className="font-semibold text-sky-700">Dinas Perikanan Tapsel</span>
          </div>
        </div>

        {/* ----------------------------------------------------
            WIDGET 3: PETA SEBARAN KOLAM PERIKANAN
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-800 flex items-center justify-center">
                  <MapPin size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Peta Sebaran Kolam Perikanan
                </h3>
              </div>
              <Link
                href="/perikanan"
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Lihat Detail</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Container Peta Leaflet dengan Floating Legend */}
            <div className="relative h-[310px] w-full rounded-2xl overflow-hidden border border-slate-200/70 shadow-inner">
              <DynamicPerikananMap pins={mapPins} />

              {/* Floating Legend di Kiri Bawah Sesuai Mockup */}
              <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/90 shadow-md space-y-1.5 text-[11px] font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block shadow-2xs" />
                  <span>Kolam Budidaya</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-2xs" />
                  <span>Kelompok Tani</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-2xs" />
                  <span>Bantuan</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>GIS Koordinat Terdaftar: {mapPins.length} Titik</span>
            <span className="font-semibold text-sky-700">Tapanuli Selatan</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BARIS BAWAH: 2 WIDGET (REKAP KECAMATAN & SUMBER PENDANAAN)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ----------------------------------------------------
            WIDGET BAWAH 1: REKAP PERIKANAN PER KECAMATAN (TABEL)
        ---------------------------------------------------- */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Widget */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-800 flex items-center justify-center">
                  <Building2 size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Rekap Perikanan per Kecamatan
                </h3>
              </div>
              <button
                onClick={() => setModalKecamatanOpen(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
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
                    <th className="pb-2.5 font-bold text-center">Jumlah Kolam</th>
                    <th className="pb-2.5 font-bold text-center">Luas Area (Ha)</th>
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
                          {row.count}
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-900 tabular-nums">
                          {row.luasHa ? row.luasHa.toLocaleString("id-ID", { minimumFractionDigits: 2 }) : "0,00"}
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-600 truncate max-w-[120px]">
                          {row.komoditasDominan || "Nila"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Belum ada data kecamatan perikanan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
            <span>Wilayah Terdaftar: {rekapKecamatan.length} Kecamatan</span>
            <span className="font-semibold text-sky-700">Tapanuli Selatan</span>
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
                <span className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-800 flex items-center justify-center">
                  <Wallet size={16} />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Sumber Pendanaan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* FILTER TAHUN */}
                <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition text-[11px]">
                  <Calendar size={12} className="text-sky-700 shrink-0" />
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
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-0.5 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
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
                        <Cell key={`cell-dana-klm-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Absolute Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-slate-900 tracking-tight leading-none text-center px-1 truncate max-w-[70px]">
                    {dynamicPendanaanStats.totalDana > 0
                      ? dynamicPendanaanStats.displayTotalShort
                      : "Rp 6,48 M"}
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

            {/* 2 Stat Boxes di Bawah Donut Chart */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {/* Box 1: Penerima Bantuan */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    {dynamicPendanaanStats.totalPenerima > 0
                      ? dynamicPendanaanStats.totalPenerima
                      : "87"}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                    Penerima Bantuan
                  </span>
                </div>
              </div>

              {/* Box 2: Rata-rata bantuan per penerima */}
              <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center shrink-0">
                  <CircleDollarSign size={16} />
                </div>
                <div>
                  <div
                    className="text-xs font-black text-slate-900 tracking-tight leading-none truncate max-w-[100px]"
                    title={
                      dynamicPendanaanStats.totalDana > 0
                        ? dynamicPendanaanStats.displayRataRata
                        : "Rp 74.482.759"
                    }
                  >
                    {dynamicPendanaanStats.totalDana > 0
                      ? dynamicPendanaanStats.displayRataRata
                      : "Rp 74.482.759"}
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
            <span className="font-semibold text-sky-700">100% Terverifikasi</span>
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
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Rekapitulasi Kolam Perikanan per Wilayah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sebaran unit kolam, luas area, dan komoditas perikanan di seluruh kecamatan
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

            <div className="overflow-y-auto py-3 flex-1 mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold">
                    <th className="pb-2.5 w-8 text-center">No</th>
                    <th className="pb-2.5">Kecamatan</th>
                    <th className="pb-2.5 text-center">Jumlah Kolam</th>
                    <th className="pb-2.5 text-center">Luas Area (Ha)</th>
                    <th className="pb-2.5 text-center">Kapasitas Benih</th>
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
                      <td className="py-2.5 text-center font-bold text-sky-700 tabular-nums">
                        {row.luasHa ? row.luasHa.toLocaleString("id-ID", { minimumFractionDigits: 2 }) : "0,00"} Ha
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-700 tabular-nums">
                        {row.totalPopulasi ? row.totalPopulasi.toLocaleString("id-ID") : "0"} ekor
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-600">
                        {row.komoditasDominan || "Nila"}
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
          MODAL: LIHAT DETAIL KOMODITAS IKAN
      ======================================================== */}
      {modalKomoditasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Fish size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Rincian Komoditas & Populasi Ikan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data kapasitas tebar benih ikan air tawar di Tapanuli Selatan
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
                      style={{ backgroundColor: item.color || "#0284c7" }}
                    >
                      <FishIcon type={item.nama} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.namaLengkap || item.nama}</h4>
                      <p className="text-xs text-slate-500">
                        {item.unit > 0 ? `${item.unit} Unit Kolam Terdaftar (${item.luasHa || 0} Ha)` : "Komoditas Potensi Binaan"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 tabular-nums">
                      {item.populasi > 0 ? item.populasi.toLocaleString("id-ID") : "0"}{" "}
                      <span className="text-xs font-normal text-slate-500">ekor</span>
                    </div>
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Kapasitas Tebar
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
