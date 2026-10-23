"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronDown,
  Layers,
  Database,
} from "lucide-react";

export interface PendanaanItem {
  id?: string | number;
  namaPenerima: string;
  sektor: string;
  jenisUsaha: string;
  tahun: number | string;
  sumberDana: string;
  sumberDanaRaw?: string;
  namaSumberDana?: string | null;
  nilaiBantuan: number;
}

interface PendanaanTerbaruSectionProps {
  data?: PendanaanItem[];
  loading?: boolean;
}

// Urutan sektor baku sesuai gambar referensi: Perikanan, Pertanian, Peternakan
const SECTORS = ["Perikanan", "Pertanian", "Peternakan"];

// Daftar nama resmi sumber dana yang ada di sistem
export const SYSTEM_SUMBER_DANA = [
  "KUR",
  "APBD Tapsel",
  "APBD Provinsi",
  "APBN (Pusat)",
  "Dana Desa",
  "Swadaya",
  "Bantuan Pemerintah",
  "CSR / BUMN",
];

// Palet warna yang persis dengan gambar referensi
const SOURCE_COLORS: Record<string, string> = {
  "APBD Tapsel": "#0ea5e9",                 // Biru Cerah (seperti APBD di gambar)
  "Bantuan Pemerintah": "#8b5cf6",          // Ungu (seperti DAK di gambar)
  "APBN (Pusat)": "#f97316",                // Oranye (seperti APBN di gambar)
  "Dana Desa": "#22c55e",                   // Hijau (seperti Dana Desa di gambar)
  "KUR": "#3b82f6",                         // Biru Klasik
  "APBD Provinsi": "#06b6d4",               // Cyan
  "Swadaya": "#14b8a6",                     // Teal
  "CSR / BUMN": "#ec4899",                  // Pink / Rose
  "Perbankan": "#6366f1",                   // Indigo
  "Lainnya": "#64748b",                     // Slate
};

const FALLBACK_PALETTE = [
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
  "#64748b",
];

// Format nominal rupiah penuh (misal: Rp 150.000.000)
const formatRupiah = (val: number): string => {
  return `Rp ${val.toLocaleString("id-ID")}`;
};

// Tooltip kustom interaktif untuk grafik
const CustomChartTooltip = ({
  active,
  payload,
  label,
  unitSuffix,
  chartType,
}: any) => {
  if (active && payload && payload.length) {
    const visibleEntries = payload.filter((entry: any) => Number(entry.value || 0) > 0);
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-xs min-w-[200px]">
        <p className="font-bold text-slate-900 mb-1.5 pb-1 border-b border-slate-100">
          Sektor {label}
        </p>
        <div className="space-y-1.5">
          {visibleEntries.length > 0 ? (
            visibleEntries.map((entry: any, index: number) => {
              const rawVal = entry.payload?.[`${entry.dataKey}_raw`] || 0;
              const numVal = Number(entry.value || 0);
              const valDisplay = numVal % 1 === 0 ? numVal.toFixed(0) : numVal.toFixed(1);

              return (
                <div key={`tt-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {valDisplay} {unitSuffix}
                    </span>
                    {chartType === "nilai" && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {formatRupiah(rawVal)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada bantuan tercatat</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function PendanaanTerbaruSection({
  data = [],
  loading = false,
}: PendanaanTerbaruSectionProps) {
  const listToUse = data || [];

  // 1. Ekstrak daftar tahun unik yang tercatat di database (terurut dari tahun terkini)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    listToUse.forEach((item) => {
      if (item.tahun) years.add(item.tahun.toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [listToUse]);

  const currentYearStr = new Date().getFullYear().toString();

  // Penentuan tahun terkini (tahun tertinggi di database atau tahun kalender berjalan)
  const defaultYear = useMemo(() => {
    if (availableYears.length > 0) {
      if (availableYears.includes(currentYearStr)) return currentYearStr;
      return availableYears[0];
    }
    return currentYearStr;
  }, [availableYears, currentYearStr]);

  const [selectedTahun, setSelectedTahun] = useState<string>(defaultYear);
  const [hasUserChangedTahun, setHasUserChangedTahun] = useState<boolean>(false);

  // Otomatis atur tahun anggaran ke tahun terkini saat data database dimuat
  useEffect(() => {
    if (!hasUserChangedTahun && availableYears.length > 0) {
      const latest = availableYears.includes(currentYearStr) ? currentYearStr : availableYears[0];
      setSelectedTahun(latest);
    }
  }, [availableYears, hasUserChangedTahun, currentYearStr]);

  // Kontrol tampilan grafik: "nilai" (Nilai Rp) | "penerima" (Jumlah Penerima)
  const [chartType, setChartType] = useState<"nilai" | "penerima">("nilai");

  // 2. Data terfilter berdasarkan tahun terpilih
  const yearFiltered = useMemo(() => {
    if (selectedTahun === "semua") return listToUse;
    return listToUse.filter((item) => item.tahun.toString() === selectedTahun);
  }, [listToUse, selectedTahun]);

  // 3. Sumber dana unik yang aktif di data tahun terpilih (diurutkan standar sistem)
  const dynamicSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    yearFiltered.forEach((item) => {
      if (item.sumberDana) {
        sourcesSet.add(item.sumberDana.trim());
      }
    });

    return Array.from(sourcesSet).sort((a, b) => {
      const idxA = SYSTEM_SUMBER_DANA.indexOf(a);
      const idxB = SYSTEM_SUMBER_DANA.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [yearFiltered]);

  // 4. Hitung skala nilai sebenarnya (Juta / Miliar / Penerima)
  const { scaleDivisor, unitSuffix, unitLabel } = useMemo(() => {
    if (chartType === "penerima") {
      return {
        scaleDivisor: 1,
        unitSuffix: "Penerima",
        unitLabel: "orang/kelompok",
      };
    }

    let maxVal = 0;
    yearFiltered.forEach((item) => {
      const val = Number(item.nilaiBantuan || 0);
      if (val > maxVal) maxVal = val;
    });

    if (maxVal >= 1_000_000_000) {
      return {
        scaleDivisor: 1_000_000_000,
        unitSuffix: "M",
        unitLabel: "miliar rupiah",
      };
    }

    return {
      scaleDivisor: 1_000_000,
      unitSuffix: "Jt",
      unitLabel: "juta rupiah",
    };
  }, [yearFiltered, chartType]);

  // 5. Agregasi data untuk Grafik Batang (Perikanan, Pertanian, Peternakan)
  const chartData = useMemo(() => {
    return SECTORS.map((sektorName) => {
      const itemsInSektor = yearFiltered.filter((item) =>
        item.sektor.toLowerCase().includes(sektorName.toLowerCase())
      );

      const row: any = {
        sektor: sektorName,
      };

      dynamicSources.forEach((src) => {
        const matching = itemsInSektor.filter(
          (it) => it.sumberDana.toLowerCase() === src.toLowerCase()
        );

        if (chartType === "nilai") {
          const sumRaw = matching.reduce(
            (acc, curr) => acc + Number(curr.nilaiBantuan || 0),
            0
          );
          row[src] = Number((sumRaw / scaleDivisor).toFixed(2));
          row[`${src}_raw`] = sumRaw;
        } else {
          const count = matching.length;
          row[src] = count;
          row[`${src}_raw`] = count;
        }
      });

      return row;
    });
  }, [yearFiltered, dynamicSources, scaleDivisor, chartType]);

  // 6. Hitung batas atas domain sumbu Y grafik
  const yAxisMax = useMemo(() => {
    let maxInRow = 0;
    chartData.forEach((row) => {
      dynamicSources.forEach((src) => {
        const val = Number(row[src] || 0);
        if (val > maxInRow) maxInRow = val;
      });
    });

    if (chartType === "penerima") {
      if (maxInRow === 0) return 5;
      return Math.max(Math.ceil(maxInRow * 1.25), 4);
    }

    if (maxInRow === 0) return 10;
    const target = maxInRow * 1.25;
    if (target > 100) return Math.ceil(target / 50) * 50;
    if (target > 10) return Math.ceil(target / 10) * 10;
    return Math.ceil(target);
  }, [chartData, dynamicSources, chartType]);

  // 7. Agregasi Baris Tabel Rekapitulasi Pendanaan (Sektor, Jumlah Penerima, Nilai Uang)
  const sectorSummaryRows = useMemo(() => {
    let totalPenerima = 0;
    let grandTotalNilai = 0;

    const rows = SECTORS.map((sektorName) => {
      const itemsInSektor = yearFiltered.filter((item) =>
        item.sektor.toLowerCase().includes(sektorName.toLowerCase())
      );

      const count = itemsInSektor.length;
      totalPenerima += count;

      const totalNilai = itemsInSektor.reduce(
        (acc, curr) => acc + Number(curr.nilaiBantuan || 0),
        0
      );
      grandTotalNilai += totalNilai;

      return {
        sektor: sektorName,
        penerima: count,
        totalNilai: totalNilai,
      };
    });

    return {
      rows,
      totalPenerima,
      grandTotalNilai,
    };
  }, [yearFiltered]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      {/* ========================================================
          1. HEADER SECTION (Icon, Title, Subtitle)
      ======================================================== */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rekapitulasi Pendanaan Usaha
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Perikanan &middot; Pertanian &middot; Peternakan
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CONTROLS SECTION (Tahun Anggaran & Tampilan Grafik)
      ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Kontrol Kiri: Tahun Anggaran */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
            Tahun anggaran
          </label>
          <div className="relative w-full sm:w-64">
            <select
              value={selectedTahun}
              onChange={(e) => {
                setSelectedTahun(e.target.value);
                setHasUserChangedTahun(true);
              }}
              className="appearance-none w-full bg-white border border-slate-300 hover:border-slate-400 rounded-full py-2.5 pl-4 pr-10 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* Kontrol Kanan: Tampilan Grafik (Radio Buttons) */}
        <div>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-medium text-slate-800 select-none">
              <input
                type="radio"
                name="chartType"
                value="nilai"
                checked={chartType === "nilai"}
                onChange={() => setChartType("nilai")}
                className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
              />
              <span>Nilai (Rp)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-medium text-slate-800 select-none">
              <input
                type="radio"
                name="chartType"
                value="penerima"
                checked={chartType === "penerima"}
                onChange={() => setChartType("penerima")}
                className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
              />
              <span>Jumlah Penerima</span>
            </label>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ========================================================
          3 & 4. GRAFIK & TABEL BERSEBELAHAN (GRID 2 KOLOM)
      ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* KOLOM KIRI: GRAFIK PENDANAAN PER SEKTOR */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1">
            {/* Subheading Dalam Card */}
            <div className="mb-3">
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {chartType === "nilai" ? "Pendanaan per sektor" : "Penerima bantuan per sektor"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {chartType === "nilai"
                  ? `Nilai dana dalam ${unitLabel}, ditumpuk berdasarkan sumber pendanaan.`
                  : `Jumlah penerima bantuan (orang/kelompok), dikelompokkan berdasarkan sumber pendanaan.`}
              </p>
            </div>

            {/* Area Render Grafik Recharts */}
            <div className="h-[280px] sm:h-[320px] w-full pt-2">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">
                      Memuat grafik...
                    </span>
                  </div>
                </div>
              ) : dynamicSources.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs sm:text-sm font-semibold">
                    Tidak ada data pendanaan untuk tahun {selectedTahun}
                  </p>
                  <button
                    onClick={() => setSelectedTahun("semua")}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Tampilkan Semua Tahun
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 15, left: 0, bottom: 15 }}
                    barGap={4}
                    barCategoryGap={dynamicSources.length > 3 ? 24 : 48}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="sektor"
                      tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      domain={[0, yAxisMax]}
                      tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                      tickFormatter={(val) =>
                        chartType === "nilai" ? `${val} ${unitSuffix}` : `${val}`
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <CustomChartTooltip
                          unitSuffix={unitSuffix}
                          chartType={chartType}
                        />
                      }
                      cursor={{ fill: "#f8fafc" }}
                    />

                    {/* Batang Sumber Dana */}
                    {dynamicSources.map((source, idx) => {
                      const color =
                        SOURCE_COLORS[source] ||
                        FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
                      return (
                        <Bar
                          key={source}
                          dataKey={source}
                          name={source}
                          fill={color}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={38}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Keterangan / Legenda Sumber Dana Horizontal di Bawah Grafik */}
            {dynamicSources.length > 0 && (
              <div className="flex flex-row flex-wrap items-center justify-center gap-x-5 sm:gap-x-7 gap-y-2 pt-3">
                {dynamicSources.map((source, idx) => {
                  const color =
                    SOURCE_COLORS[source] ||
                    FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
                  return (
                    <div
                      key={`legend-${source}`}
                      className="inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {source}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: TABEL REKAPITULASI PENDANAAN (SEKTOR, PENERIMA, NILAI UANG) */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1">
            <div>
              {/* Header Tabel dengan Icon Database Hijau */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0f2c42] tracking-tight">
                  Rekapitulasi Pendanaan
                </h3>
              </div>

              {/* Tabel Berbasis Baris Berwarna: Sektor, Jumlah Penerima, Nilai Uang */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-[13px] border-separate border-spacing-y-2.5">
                  <thead>
                    <tr className="text-slate-800 font-bold bg-[#f1f5f9]">
                      <th className="py-3 px-4 first:rounded-l-xl">Sektor</th>
                      <th className="py-3 px-4 text-center sm:text-left">Jumlah Penerima</th>
                      <th className="py-3 px-4 last:rounded-r-xl text-right sm:text-left">Nilai Uang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Baris Perikanan (Biru Muda) */}
                    {(() => {
                      const row = sectorSummaryRows.rows.find((r) => r.sektor === "Perikanan") || {
                        sektor: "Perikanan",
                        penerima: 0,
                        totalNilai: 0,
                      };
                      return (
                        <tr className="bg-[#f0f7ff] hover:bg-[#e0efff] transition-colors">
                          <td className="py-3.5 px-4 first:rounded-l-xl">
                            <div className="flex items-center gap-2.5">
                              {/* Ikon Ikan Biru */}
                              <svg
                                className="w-5 h-5 text-[#1d75dd] shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M2.5 12c3.5-3.5 8-4.8 13.5-3.5 2-1.8 4-2.2 6-2.5-.8 2.2-.2 4.2.8 6-.8 2-2 3.8-6.8 3.8-5 0-9.8-1.5-13.5-3.8z" />
                                <circle cx="15.5" cy="11.5" r="1" fill="#ffffff" />
                              </svg>
                              <span className="font-bold text-[#0c4a6e]">Perikanan</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm text-center sm:text-left">
                            {row.penerima.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 last:rounded-r-xl font-bold text-slate-900 text-sm text-right sm:text-left">
                            {formatRupiah(row.totalNilai)}
                          </td>
                        </tr>
                      );
                    })()}

                    {/* 2. Baris Pertanian (Hijau Muda) */}
                    {(() => {
                      const row = sectorSummaryRows.rows.find((r) => r.sektor === "Pertanian") || {
                        sektor: "Pertanian",
                        penerima: 0,
                        totalNilai: 0,
                      };
                      return (
                        <tr className="bg-[#f0fdf4] hover:bg-[#dcfce7] transition-colors">
                          <td className="py-3.5 px-4 first:rounded-l-xl">
                            <div className="flex items-center gap-2.5">
                              {/* Ikon Daun Hijau */}
                              <svg
                                className="w-5 h-5 text-[#057a44] shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                              </svg>
                              <span className="font-bold text-[#064e3b]">Pertanian</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm text-center sm:text-left">
                            {row.penerima.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 last:rounded-r-xl font-bold text-slate-900 text-sm text-right sm:text-left">
                            {formatRupiah(row.totalNilai)}
                          </td>
                        </tr>
                      );
                    })()}

                    {/* 3. Baris Peternakan (Oranye/Krem Muda) */}
                    {(() => {
                      const row = sectorSummaryRows.rows.find((r) => r.sektor === "Peternakan") || {
                        sektor: "Peternakan",
                        penerima: 0,
                        totalNilai: 0,
                      };
                      return (
                        <tr className="bg-[#fff7ed] hover:bg-[#ffedd5] transition-colors">
                          <td className="py-3.5 px-4 first:rounded-l-xl">
                            <div className="flex items-center gap-2.5">
                              {/* Ikon Sapi/Ternak Cokelat Karamel */}
                              <svg
                                className="w-5 h-5 text-[#c2410c] shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M19.5 9.5c-.83 0-1.5.67-1.5 1.5v2.5h-1v-4c0-.83-.67-1.5-1.5-1.5h-5c-.83 0-1.5.67-1.5 1.5v4h-1v-2c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1h1v3c0 .55.45 1 1 1s1-.45 1-1v-3h7v3c0 .55.45 1 1 1s1-.45 1-1v-3h1c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5z" />
                              </svg>
                              <span className="font-bold text-[#7c2d12]">Peternakan</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm text-center sm:text-left">
                            {row.penerima.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 last:rounded-r-xl font-bold text-slate-900 text-sm text-right sm:text-left">
                            {formatRupiah(row.totalNilai)}
                          </td>
                        </tr>
                      );
                    })()}

                    {/* 4. Baris Total (Abu-abu Muda Netral) */}
                    <tr className="bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors">
                      <td className="py-3.5 px-4 first:rounded-l-xl font-extrabold text-slate-900 text-sm">
                        Total
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm text-center sm:text-left">
                        {sectorSummaryRows.totalPenerima.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 last:rounded-r-xl font-extrabold text-emerald-700 text-sm text-right sm:text-left">
                        {formatRupiah(sectorSummaryRows.grandTotalNilai)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>* Terhubung dengan data riil Tapanuli Selatan</span>
              <span className="text-emerald-700 font-bold">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
