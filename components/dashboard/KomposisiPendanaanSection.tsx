"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChevronDown, Users, CheckCircle2 } from "lucide-react";

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
  danaDicairkan?: number;
}

interface KomposisiPendanaanSectionProps {
  data?: PendanaanItem[];
  loading?: boolean;
  sector?: "Pertanian" | "Perikanan" | "Semua";
}

// Nuansa Hijau Hutan, Emas, dan Putih sesuai standar desain kepemerintahan Tapanuli Selatan
const PALETTE = {
  APBD_KAB: "#166534",  // Hijau Hutan Tua (Forest Green)
  APBD_PROV: "#ca8a04", // Emas Pemerintahan (Regal Gold)
  APBN: "#2563eb",      // Biru Sedang (Royal Blue)
  DAK: "#d97706",       // Amber Keemasan
  DANA_DESA: "#7da883", // Hijau Sage Lembut (Soft Sage Green)
  DEFAULT: "#64748b",   // Slate
};

const SOURCE_COLORS: Record<string, string> = {
  "APBD Kabupaten": PALETTE.APBD_KAB,
  "APBD Kab. Tapsel": PALETTE.APBD_KAB,
  "APBD Tapsel": PALETTE.APBD_KAB,
  "APBD": PALETTE.APBD_KAB,
  "APBD Provinsi": PALETTE.APBD_PROV,
  "APBD Prov": PALETTE.APBD_PROV,
  "APBN": PALETTE.APBN,
  "APBN (Pusat)": PALETTE.APBN,
  "DAK": PALETTE.DAK,
  "Bantuan Pemerintah": PALETTE.DAK,
  "Dana Desa": PALETTE.DANA_DESA,
  "KUR": "#0284c7",
  "Swadaya": "#0d9488",
  "CSR / BUMN": "#ec4899",
  "Lainnya": PALETTE.DEFAULT,
};

// Format nominal rupiah singkat: Rp0, Rp125 jt, Rp405 jt, Rp1.2 M
const formatRupiahShort = (val: number): string => {
  if (!val || val === 0) return "Rp0";
  if (val >= 1_000_000_000) {
    const m = (val / 1_000_000_000).toFixed(1).replace(".0", "");
    return `Rp${m} M`;
  }
  if (val >= 1_000_000) {
    const jt = (val / 1_000_000).toFixed(0);
    return `Rp${jt} jt`;
  }
  if (val >= 1_000) {
    const rb = (val / 1_000).toFixed(0);
    return `Rp${rb} rb`;
  }
  return `Rp${val.toLocaleString("id-ID")}`;
};

// Format persentase gaya Indonesia (koma sebagai pemisah desimal, misal 29,1%)
const formatPercentIndo = (val: number): string => {
  return `${val.toFixed(1).replace(".", ",")}%`;
};

// Helper normalisasi nama sumber dana ke standar resmi Pemkab Tapsel
const getCleanSourceName = (raw?: string): string => {
  const s = (raw || "").trim().toUpperCase();
  if (s.includes("KABUPATEN") || s.includes("TAPSEL") || s === "APBD") return "APBD Kabupaten";
  if (s.includes("PROVINSI") || s.includes("PROV")) return "APBD Provinsi";
  if (s.includes("APBN") || s.includes("PUSAT")) return "APBN";
  if (s.includes("DAK") || s.includes("BANTUAN PEMERINTAH")) return "DAK";
  if (s.includes("DANA DESA") || s.includes("DESA")) return "Dana Desa";
  if (s.includes("KUR")) return "KUR";
  if (s.includes("SWADAYA")) return "Swadaya";
  return raw?.trim() || "Lainnya";
};

export default function KomposisiPendanaanSection({
  data = [],
  loading = false,
  sector = "Semua",
}: KomposisiPendanaanSectionProps) {
  // 1. Filter data berdasarkan sektor
  const sectorFiltered = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (sector === "Semua") return data;
    return data.filter(
      (item) => item.sektor?.toLowerCase() === sector.toLowerCase()
    );
  }, [data, sector]);

  // 2. Daftar tahun unik dari data riil database
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sectorFiltered.forEach((item) => {
      if (item.tahun) years.add(item.tahun.toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [sectorFiltered]);

  const currentYearStr = new Date().getFullYear().toString();
  const [selectedTahun, setSelectedTahun] = useState<string>("semua");

  useEffect(() => {
    if (availableYears.length > 0) {
      if (availableYears.includes(currentYearStr)) {
        setSelectedTahun(currentYearStr);
      } else {
        setSelectedTahun(availableYears[0]);
      }
    }
  }, [availableYears, currentYearStr]);

  // 3. Data terfilter per tahun
  const yearFiltered = useMemo(() => {
    if (selectedTahun === "semua") return sectorFiltered;
    return sectorFiltered.filter(
      (item) => item.tahun?.toString() === selectedTahun
    );
  }, [sectorFiltered, selectedTahun]);

  // 4. Kalkulasi Agregasi dari Database (Nilai murni dari field danaDicairkan)
  const { items, totalDana, totalPenerima } = useMemo(() => {
    const sourceMap = new Map<string, { rawName: string; count: number; totalNilai: number }>();

    yearFiltered.forEach((item) => {
      const src = getCleanSourceName(item.sumberDana || item.namaSumberDana || item.sumberDanaRaw);
      const existing = sourceMap.get(src) || { rawName: src, count: 0, totalNilai: 0 };
      existing.count += 1;
      // Nilai bantuan murni diambil dari field danaDicairkan
      const cair = Number(item.danaDicairkan ?? item.nilaiBantuan ?? 0);
      existing.totalNilai += cair;
      sourceMap.set(src, existing);
    });

    let aggregated = Array.from(sourceMap.entries()).map(([name, val]) => {
      const color = SOURCE_COLORS[name] || PALETTE.DEFAULT;
      return {
        name,
        color,
        nilai: val.totalNilai, // 100% dari field danaDicairkan database
        penerima: val.count,
        percentage: 0,
        // pieSlice: bobot slice grafik (jika danaDicairkan = 0, pakai jumlah penerima agar grafik tetap terbagi proporsional)
        pieSlice: val.totalNilai > 0 ? val.totalNilai : val.count,
      };
    });

    // Urutkan sumber dana: APBD Kabupaten, APBD Provinsi, APBN, DAK, Dana Desa
    const priorityOrder = ["APBD Kabupaten", "APBD Provinsi", "APBN", "DAK", "Dana Desa"];
    aggregated.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.name);
      const idxB = priorityOrder.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.penerima - a.penerima;
    });

    const sumDana = aggregated.reduce((acc, curr) => acc + curr.nilai, 0);
    const sumPenerima = aggregated.reduce((acc, curr) => acc + curr.penerima, 0);

    const calculatedItems = aggregated.map((it) => ({
      ...it,
      percentage: sumDana > 0 ? (it.nilai / sumDana) * 100 : sumPenerima > 0 ? (it.penerima / sumPenerima) * 100 : 0,
    }));

    return {
      items: calculatedItems,
      totalDana: sumDana,
      totalPenerima: sumPenerima,
    };
  }, [yearFiltered]);

  return (
    <div className="w-full space-y-4">
      {/* Baris Filter Tahun jika ada variasi tahun */}
      {availableYears.length > 0 && (
        <div className="flex items-center justify-end gap-2 pr-1">
          <span className="text-xs font-semibold text-slate-500">Tahun Anggaran:</span>
          <div className="relative">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="appearance-none bg-white hover:bg-slate-50 border border-slate-300 rounded-full py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              size={13}
            />
          </div>
        </div>
      )}

      {/* DUA PANEL KANAN - KIRI DALAM SATU BARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* =========================================================
            PANEL KIRI: PERSENTASE NILAI PENDANAAN (DONUT + LEGENDA)
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Panel Kiri */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Persentase Nilai Pendanaan
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Realisasi dana dicairkan per sumber dana
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Dana Dicairkan
              </span>
            </div>

            {/* Donut Chart dengan Total Dana Dicairkan di Tengah */}
            <div className="relative h-[240px] w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: item.payload.color }}
                              />
                              <span className="font-bold text-slate-900">
                                {item.payload.name}
                              </span>
                            </div>
                            <div className="text-slate-700 font-semibold">
                              {formatRupiahShort(item.payload.nilai)}{" "}
                              <span className="text-slate-400 font-normal">
                                ({formatPercentIndo(item.payload.percentage)})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {item.payload.penerima} Unit Usaha Penerima
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={items}
                    dataKey="pieSlice"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Teks di Tengah Donut Chart: Total Dana Dicairkan */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs sm:text-sm font-medium text-slate-500 tracking-tight">
                  Dana Dicairkan
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatRupiahShort(totalDana)}
                </span>
              </div>
            </div>
          </div>

          {/* Legenda & Persentase List di Bawah Donut Chart */}
          <div className="space-y-3 pt-5 mt-2 border-t border-slate-100">
            {items.map((item) => (
              <div
                key={`legend-${item.name}`}
                className="flex items-center justify-between text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-800">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({item.penerima} Unit Usaha)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {formatRupiahShort(item.nilai)}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({formatPercentIndo(item.percentage)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================
            PANEL KANAN: REKAPITULASI SUMBER DANA (PROGRESS BARS)
        ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Panel Kanan */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Rekapitulasi Sumber Dana
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 mb-5">
                  Dana dicairkan dan unit penerima per sumber dana
                </p>
              </div>
            </div>

            {/* List Sumber Dana dengan Progress Bar */}
            <div className="space-y-5">
              {items.map((item) => (
                <div key={`rekap-${item.name}`} className="space-y-1.5">
                  {/* Baris Atas: Nama Sumber Dana & Nilai Dana Dicairkan */}
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatRupiahShort(item.nilai)}
                    </span>
                  </div>

                  {/* Progress Bar Berwarna Sesuai Sumber */}
                  <div className="h-2 w-full bg-[#edf2ee] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(item.percentage, 2), 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  {/* Baris Bawah: Jumlah Penerima & Persentase */}
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                    <span className="font-medium">
                      {item.penerima.toLocaleString("id-ID")} Unit Usaha Penerima
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatPercentIndo(item.percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              FOOTER PANEL KANAN: TOTAL PENERIMA WIDGET ELEGAN & MENARIK
          ======================================================== */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-5 text-white shadow-md border border-emerald-700/50">
              {/* Ornamen Latar Belakang Cahaya Keemasan */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-4 -top-4 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Bagian Kiri: Ikon & Keterangan Resmi */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-emerald-950 flex items-center justify-center shadow-md shrink-0">
                    <Users size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                        Total Penerima Bantuan
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                      Unit Usaha Binaan Terdaftar di Pemkab Tapsel
                    </p>
                  </div>
                </div>

                {/* Bagian Kanan: Angka Hero Menonjol */}
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-emerald-700/60 pt-2 sm:pt-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                      {totalPenerima.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      Unit Usaha
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-200/80 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-400" /> 100% Terverifikasi
                  </span>
                </div>
              </div>

              {/* Rincian Ringkas Sumber Dana di Bawah */}
              {items.length > 0 && (
                <div className="relative z-10 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3.5 pt-3 border-t border-emerald-700/50">
                  {items.map((it) => (
                    <div
                      key={`chip-${it.name}`}
                      className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-medium text-emerald-50 transition"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: it.color }}
                      />
                      <span>
                        <strong className="text-amber-200 font-bold">{it.penerima}</strong> {it.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
