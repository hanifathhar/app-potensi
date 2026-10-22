"use client";

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
  ExternalLink,
} from "lucide-react";

export default function LandingPageDataTaniTapsel() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/30">
              <Sprout size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-wider text-slate-900">
                  DATA TANI
                </span>
                <span className="font-extrabold text-base tracking-wider text-emerald-600">
                  TAPSEL
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-tight mt-0.5">
                Pemerintah Kabupaten Tapanuli Selatan
              </p>
            </div>
          </Link>

          {/* Nav links & CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-700 hover:text-emerald-700 transition hidden sm:inline-block"
            >
              Dashboard Spasial
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02]"
            >
              <span>Masuk Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a261c] via-[#0f3e2d] to-[#14533c] text-white py-16 sm:py-24">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80')",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-200 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Portal Terpadu Pertanian, Perikanan & Peternakan</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              DATA TANI TAPSEL
            </h1>

            <p className="text-base sm:text-xl text-emerald-100 font-medium leading-relaxed">
              Sistem Informasi Data Pertanian, Perikanan dan Peternakan
              Kabupaten Tapanuli Selatan
            </p>

            <p className="text-xs sm:text-sm text-emerald-200/80 italic font-semibold">
              “Data Lengkap, Petani Sejahtera, Tapsel Maju”
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02]"
              >
                <span>Buka Dashboard Interaktif</span>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition"
              >
                <span>Login Petugas / Poktan</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TIGA SEKTOR UTAMA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sektor Pertanian */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Sprout size={26} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Pertanian & Perkebunan
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Kesuburan tanah dan ketahanan pangan. Meliputi kebun jagung, kopi arabika Sipirok,
              padi sawah, salak Sibakkua, karet, dan kelapa sawit.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-3 border-t border-slate-100">
              <span>1.248 Unit Usaha</span>
              <span>+12% Thn Lalu</span>
            </div>
          </div>

          {/* Sektor Perikanan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Fish size={26} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Perikanan Budidaya
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Optimalisasi sumber daya perairan tawar dan danau. Budidaya ikan mas, nila, lele,
              serta gurami dengan debit mata air pegunungan alami.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-sky-700 pt-3 border-t border-slate-100">
              <span>486 Unit Kolam</span>
              <span>+8% Thn Lalu</span>
            </div>
          </div>

          {/* Sektor Peternakan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Beef size={26} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Peternakan Rakyat
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Ketahanan ekonomi desa dan sentra protein hewani. Populasi sapi potong, kerbau
              lumpur, kambing peranakan etawa, dan unggas pedaging/petelur.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-orange-700 pt-3 border-t border-slate-100">
              <span>732 Unit Ternak</span>
              <span>+10% Thn Lalu</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ENAM TAHAPAN INTEGRASI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Fitur Utama Aplikasi
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Portal Terpadu Tingkat Desa hingga Kabupaten
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Mengintegrasikan seluruh siklus produksi dan tata kelola bantuan dari 15 kecamatan di
            Kabupaten Tapanuli Selatan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <MapPin size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Data Wilayah & GIS</h4>
            <p className="text-xs text-slate-500">
              Kecamatan, desa, serta pemetaan titik koordinat GPS akurat berbasis Leaflet / OpenStreetMap.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Kelompok Tani (Poktan)</h4>
            <p className="text-xs text-slate-500">
              Profil kelembagaan kelompok, data legalitas SK, pengurus, serta daftar NIK anggota aktif.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Calendar size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Siklus Produksi & Panen</h4>
            <p className="text-xs text-slate-500">
              Kalender jadwal tanam, tebar benih, evaluasi pertumbuhan, dan estimasi jadwal panen komoditas.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Coins size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Pendanaan & Bantuan</h4>
            <p className="text-xs text-slate-500">
              Transparansi program APBN, APBD Provinsi, APBD Tapsel, Dana Desa, bantuan alsintan, dan KUR.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Dokumentasi & Foto GPS</h4>
            <p className="text-xs text-slate-500">
              Galeri foto kegiatan lapangan terverifikasi beserta metadata lokasi untuk bukti pertanggungjawaban.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Layers size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Laporan Cepat PDF / Excel</h4>
            <p className="text-xs text-slate-500">
              Ekspor rekapitulasi data potensi per kecamatan dan laporan keuangan siap cetak berstandar dinas.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-[#071c14] text-slate-300 py-10 border-t border-[#12382b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm text-white">DATA TANI TAPSEL</p>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Dinas Pertanian, Kelautan dan Peternakan Kabupaten Tapanuli Selatan
            </p>
          </div>
          <p className="text-xs text-slate-500 text-center sm:text-right">
            &copy; {new Date().getFullYear()} Pemerintah Kabupaten Tapanuli Selatan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
