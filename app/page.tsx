import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sprout,
  Fish,
  Beef,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Users,
  Coins,
  Calendar,
  Layers,
  ChevronRight,
  Activity,
  CheckCircle2,
  Search,
  LogIn,
  Home,
  Map,
  FileText,
  Info,
  ChevronDown,
  Flame,
  Check,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import PortalMapSection from "@/components/landing/PortalMapSection";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Query live database metrics in parallel
  const [
    kebunCount,
    kolamCount,
    ternakCount,
    poktanCount,
    kecamatanList,
    danaKebunAgg,
    danaKolamAgg,
    danaTernakAgg,
    topKecamatanRaw,
    kebunPins,
    kolamPins,
    ternakPins,
    recentPoktan,
    recentKolam,
    recentTernak,
    recentKebun,
  ] = await Promise.all([
    prisma.kebun.count(),
    prisma.kolam.count(),
    prisma.peternakan.count(),
    prisma.kelompokTani.count(),
    prisma.kecamatan.findMany({
      select: { kd_kecamatan: true, nm_kecamatan: true },
      orderBy: { nm_kecamatan: "asc" },
    }),
    prisma.pendanaanKebun.aggregate({ _sum: { danaDicairkan: true } }),
    prisma.pendanaanKolam.aggregate({ _sum: { danaDicairkan: true } }),
    prisma.pendanaanPeternakan.aggregate({ _sum: { danaDicairkan: true } }),
    prisma.kecamatan.findMany({
      select: {
        nm_kecamatan: true,
        _count: { select: { kebun: true, kolam: true, peternakan: true } },
      },
    }),
    prisma.kebun.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        nama: true,
        latitude: true,
        longitude: true,
        kecamatan: { select: { nm_kecamatan: true } },
        komoditas: { select: { nm_komoditas: true } },
      },
      take: 150,
    }),
    prisma.kolam.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        nm_kolam: true,
        latitude: true,
        longitude: true,
        kecamatan: { select: { nm_kecamatan: true } },
        komoditas: { select: { nm_komoditas: true } },
      },
      take: 100,
    }),
    prisma.peternakan.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        nm_peternakan: true,
        latitude: true,
        longitude: true,
        kecamatan: { select: { nm_kecamatan: true } },
        komoditas: { select: { nm_komoditas: true } },
      },
      take: 100,
    }),
    prisma.kelompokTani.findFirst({
      orderBy: { createdAt: "desc" },
      include: { kecamatan: true },
    }),
    prisma.kolam.findFirst({
      orderBy: { createdAt: "desc" },
      include: { kecamatan: true },
    }),
    prisma.peternakan.findFirst({
      orderBy: { createdAt: "desc" },
      include: { kecamatan: true },
    }),
    prisma.kebun.findFirst({
      orderBy: { createdAt: "desc" },
      include: { kecamatan: true },
    }),
  ]);

  const totalUnitUsaha = kebunCount + kolamCount + ternakCount;
  const totalKecamatan = kecamatanList.length;

  const totalDanaDicairkan =
    Number(danaKebunAgg._sum.danaDicairkan || 0) +
    Number(danaKolamAgg._sum.danaDicairkan || 0) +
    Number(danaTernakAgg._sum.danaDicairkan || 0);

  const topKecamatan = topKecamatanRaw
    .map((k) => ({
      nama: k.nm_kecamatan,
      total: k._count.kebun + k._count.kolam + k._count.peternakan,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const mapPins = [
    ...kebunPins.map((k) => ({
      id: `kebun-${k.id}`,
      nama: k.nama,
      jenisUsaha: "KEBUN" as const,
      lat: Number(k.latitude),
      lng: Number(k.longitude),
      kecamatan: k.kecamatan?.nm_kecamatan,
      komoditas: k.komoditas?.nm_komoditas,
    })),
    ...kolamPins.map((k) => ({
      id: `kolam-${k.id}`,
      nama: k.nm_kolam,
      jenisUsaha: "KOLAM" as const,
      lat: Number(k.latitude),
      lng: Number(k.longitude),
      kecamatan: k.kecamatan?.nm_kecamatan,
      komoditas: k.komoditas?.nm_komoditas,
    })),
    ...ternakPins.map((t) => ({
      id: `ternak-${t.id}`,
      nama: t.nm_peternakan,
      jenisUsaha: "PETERNAKAN" as const,
      lat: Number(t.latitude),
      lng: Number(t.longitude),
      kecamatan: t.kecamatan?.nm_kecamatan,
      komoditas: t.komoditas?.nm_komoditas,
    })),
  ];

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP NAVBAR (Clean, Professional, Logo Tapsel) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
              <Image
                src="/images/logo-tapsel.png"
                alt="Logo Pemerintah Kabupaten Tapanuli Selatan"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="leading-tight">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pemerintah Kabupaten
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  Tapanuli Selatan
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-black text-slate-900 tracking-wide">
                  DATA POTENSI TAPSEL
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Sistem Informasi Data Pertanian, Perikanan dan Peternakan
                </p>
              </div>
            </div>
          </Link>



          {/* Right Area: Search & Login */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden md:block w-48 xl:w-56">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari potensi, kecamatan, desa..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-400"
              />
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#0f4633] hover:bg-[#0b3527] text-white shadow-sm transition hover:scale-[1.02]"
            >
              <LogIn size={14} />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Lush Green Hills & Terraces with "Tapsel Bangkit" badge) */}
      <section className="relative overflow-hidden bg-[#072419] text-white py-14 sm:py-20 lg:py-24">
        {/* Background Image Panorama */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/kebun.jpeg')",
          }}
        />

        {/* Gradient Lighting Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#072419]/95 via-[#0c3928]/85 to-[#124b35]/70 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left Content */}
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200 backdrop-blur-md">
                <Sprout size={13} className="text-emerald-300" />
                <span className="tracking-wide">PORTAL DATA POTENSI DAERAH</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
                Potensi Tapsel, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-100 to-amber-200">
                  Untuk Masa Depan yang Lebih Baik
                </span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl">
                Sistem informasi terpadu untuk mendukung pembangunan sektor pertanian,
                perikanan dan peternakan di Kabupaten Tapanuli Selatan.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 shadow-lg shadow-amber-950/30 transition hover:scale-[1.02]"
                >
                  <Sprout size={15} />
                  <span>Jelajahi Data Potensi</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#0a2f22]/70 hover:bg-[#0a2f22] text-white border border-emerald-500/40 backdrop-blur-md transition hover:scale-[1.02]"
                >
                  <Map size={15} className="text-emerald-300" />
                  <span>Lihat Peta GIS</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STAT CARDS STRIP (4 Cards with Live DB Metrics) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-9 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Potensi Usaha */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0f4633] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sprout size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Potensi Usaha
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                  {totalUnitUsaha}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-3 mt-3 border-t border-slate-100">
              <span className="text-slate-500 font-semibold">Unit Usaha</span>
              <span className="text-emerald-600 flex items-center gap-1 font-extrabold">
                <span>↑ 12%</span>
                <span className="text-[10px] text-slate-400 font-normal">dari tahun lalu</span>
              </span>
            </div>
          </div>

          {/* Card 2: Kelompok Tani */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0f4633] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kelompok Tani
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                  {poktanCount}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-3 mt-3 border-t border-slate-100">
              <span className="text-slate-500 font-semibold">Poktan</span>
              <span className="text-emerald-600 flex items-center gap-1 font-extrabold">
                <span>↑ 8%</span>
                <span className="text-[10px] text-slate-400 font-normal">dari tahun lalu</span>
              </span>
            </div>
          </div>

          {/* Card 3: Cakupan Wilayah */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0f4633] text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Cakupan Wilayah
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                  {totalKecamatan}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-3 mt-3 border-t border-slate-100">
              <span className="text-slate-500 font-semibold">Kecamatan</span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <span>100%</span>
                <span className="text-[10px] text-slate-400 font-normal">terdata</span>
              </span>
            </div>
          </div>

          {/* Card 4: Realisasi Bantuan */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0f4633] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Coins size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Realisasi Bantuan
                </p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none truncate">
                  {formatRupiah(totalDanaDicairkan)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-3 mt-3 border-t border-slate-100">
              <span className="text-slate-500 font-semibold">Tahun 2026</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                <Check size={11} />
                <span>Aktif</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN BODY (3 Columns Grid: Left Map 6 cols, Middle Potensi Sektor 3.5 cols, Right Data Terbaru 2.5 cols) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Large Interactive GIS Map Card (6 of 12) */}
          <div className="lg:col-span-12 xl:col-span-6">
            <PortalMapSection
              pins={mapPins}
              kecamatanList={kecamatanList}
              ringkasan={{
                kebun: kebunCount,
                kolam: kolamCount,
                ternak: ternakCount,
                total: totalUnitUsaha,
              }}
              topKecamatan={topKecamatan}
            />
          </div>

          {/* COLUMN 2: Jelajahi Potensi Sektor (3 of 12) */}
          <div className="lg:col-span-6 xl:col-span-3 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Jelajahi Potensi Sektor
            </h3>

            {/* Sektor 1: Pertanian & Perkebunan */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-md hover:shadow-lg transition space-y-3">
              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src="/images/kebun.jpeg"
                  alt="Pertanian & Perkebunan Tapsel"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sprout size={14} />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    Pertanian & Perkebunan
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Lahan, komoditas, dan kelompok tani di seluruh kecamatan.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sektor 2: Perikanan Budidaya */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-md hover:shadow-lg transition space-y-3">
              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src="/images/kolam.jpg"
                  alt="Perikanan Budidaya Tapsel"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Fish size={14} />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    Perikanan Budidaya
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kolam, luas budidaya, dan produksi perikanan.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sektor 3: Peternakan Rakyat */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-md hover:shadow-lg transition space-y-3">
              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src="/images/ternak.jpeg"
                  alt="Peternakan Rakyat Tapsel"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover hover:scale-105 transition duration-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    <Beef size={14} />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    Peternakan Rakyat
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Populasi ternak dan lokasi kandang di setiap wilayah.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 transition"
                  >
                    <span>Lihat Detail</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Data Terbaru & Potensi Unggulan Banner (3 of 12) */}
          <div className="lg:col-span-6 xl:col-span-3 space-y-5">
            {/* Card: Data Terbaru */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={16} className="text-amber-500" />
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Data Terbaru
                  </h3>
                </div>
                <Link
                  href="/dashboard"
                  className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {/* Activity List */}
              <div className="space-y-3.5 text-xs">
                {/* Item 1: Poktan */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Sprout size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {recentPoktan?.nm_kelompok || "Data Kelompok Tani"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Kecamatan {recentPoktan?.kecamatan?.nm_kecamatan || "Angkola Sangkunur"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">12 Okt 2026 • 5 unit baru</p>
                  </div>
                </div>

                {/* Item 2: Kolam */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5 border border-sky-200">
                    <Fish size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {recentKolam?.nm_kolam || "Data Kolam Budidaya"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Kecamatan {recentKolam?.kecamatan?.nm_kecamatan || "Sayur Matinggi"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">11 Okt 2026 • 3 unit baru</p>
                  </div>
                </div>

                {/* Item 3: Peternakan */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                    <Beef size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {recentTernak?.nm_peternakan || "Data Peternakan"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Kecamatan {recentTernak?.kecamatan?.nm_kecamatan || "Batang Angkola"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">10 Okt 2026 • 7 unit baru</p>
                  </div>
                </div>

                {/* Item 4: Lahan */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 border border-teal-200">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {recentKebun?.nama || "Update Luas Lahan"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Kecamatan {recentKebun?.kecamatan?.nm_kecamatan || "Sipirok"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">9 Okt 2026 • 12 ha baru</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner: Potensi Unggulan Tapsel */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3928] via-[#0f4633] to-[#165a42] text-white p-5 border border-emerald-600/30 shadow-lg">
              {/* Background Landscape Texture */}
              <div
                className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    "url('/images/kebun.jpeg')",
                }}
              />

              {/* Decorative Corner Motif */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 border-8 border-amber-400/20 rounded-full pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                  Komoditas Pilihan
                </span>
                <h4 className="font-black text-base tracking-tight leading-snug">
                  Potensi Unggulan Tapsel!
                </h4>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Kopi Arabika Sipirok, Sawit, dan Perikanan Air Tawar
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs shadow-md transition hover:scale-[1.02]"
                  >
                    <span>Lihat Potensi</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER (Dark Green Strip with Traditional Accents) */}
      <footer id="tentang" className="mt-auto bg-[#071c14] text-slate-300 py-6 border-t border-[#12382b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Location on Left */}
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin size={14} className="text-emerald-500 shrink-0" />
            <span>Kabupaten Tapanuli Selatan, Sumatera Utara</span>
          </div>

          {/* Slogan Center */}
          <div className="text-center font-serif italic text-amber-200/90 tracking-wide font-medium">
            <span>Data Akurat</span>
            <span className="mx-2 text-emerald-500">•</span>
            <span>Potensi Optimal</span>
            <span className="mx-2 text-emerald-500">•</span>
            <span>Tapsel Maju</span>
          </div>

          {/* Timestamp on Right */}
          <div className="flex items-center gap-2 text-slate-400 text-center sm:text-right">
            <Calendar size={13} className="text-emerald-500 shrink-0" />
            <span>Data terakhir diperbarui: 22 Oktober 2026 10:45 WIB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
