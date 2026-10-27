"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  User,
  LogIn,
  Sprout,
  Fish,
  Beef,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);

    if (!username.trim() || !password) {
      setNotif({
        type: "error",
        message: "Username / NIP dan Kata Sandi wajib diisi.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "programming-123",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({
          type: "error",
          message:
            data.error ||
            "Kredensial tidak valid. Silakan periksa kembali username dan kata sandi Anda.",
        });
      } else {
        if (data.token) {
          try {
            localStorage.setItem("token", data.token);
          } catch { }
        }

        setNotif({
          type: "success",
          message: "Autentikasi berhasil! Mengalihkan ke dashboard...",
        });

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch {
      setNotif({
        type: "error",
        message: "Gagal terhubung ke server jaringan. Silakan coba kembali.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setUsername("admin");
    setPassword("admin123");
    setNotif({
      type: "success",
      message: "Kredensial akun Administrator telah diisikan otomatis.",
    });
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden bg-[#02100a]">
      {/* BACKGROUND IMAGE & AMBIENT OVERLAYS */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{
          backgroundImage: "url('/images/bg_log.png')",
        }}
      />

      {/* GRADIENT BACKDROP & MESH GLOWS */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-[#02100a]/95 via-[#06241a]/90 to-[#020d08]/96 backdrop-blur-[2px]" />

      {/* AMBIENT AURORA LIGHTS */}
      <div className="fixed top-[-15%] left-[-10%] w-[650px] h-[650px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/15 blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="fixed top-[40%] right-[30%] w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />

      {/* FLOATING AMBIENT PARTICLES */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-emerald-400/40 blur-[1px] animate-float" />
        <div className="absolute top-2/3 left-1/3 w-2.5 h-2.5 rounded-full bg-teal-300/40 blur-[1px] animate-float-slow" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-400/50 blur-[1px] animate-float-reverse" />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-emerald-300/30 blur-[1px] animate-float" />
      </div>

      {/* TOP HEADER BAR (SIPD STYLE) */}
      <header className="relative z-20 w-full border-b border-emerald-900/40 bg-black/30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-md shrink-0">
            <Image
              src="/images/logo-tapsel.png"
              alt="Logo Tapanuli Selatan"
              width={28}
              height={28}
              className="w-full h-full object-contain"
              priority
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white">
                SIDALIHAN
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SISTEM ONLINE
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/70 font-medium hidden sm:block">
              Pemerintah Kabupaten Tapanuli Selatan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-200 hover:text-white text-xs font-bold border border-white/15 transition backdrop-blur-md shadow-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Beranda</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ========================================================
              PANEL KIRI: SHOWCASE ANIMASI BERGERAK LOGO TAPSEL & TAPSEL BANGKIT
             ======================================================== */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">

            {/* BADGE RESMI PEMKAB */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur-md">
              <Sparkles size={14} className="text-amber-400" />
              <span>Sistem Informasi Data Agro Layanan Informasi Hasil Angkola</span>
            </div>

            {/* JUDUL UTAMA */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
                SIDALIHAN <span className="text-emerald-400">TAPSEL</span>
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl font-medium leading-relaxed">
                Portal data terintegrasi dari tingkat desa, kelompok tani, hingga kabupaten untuk mewujudkan kedaulatan pangan dan kemajuan petani Tapsel.
              </p>
            </div>

            {/* STAGE ANIMASI BERGERAK: LOGO TAPSEL & TAPSEL BANGKIT */}
            <div className="w-full max-w-md py-4 sm:py-6 flex flex-col items-center justify-center relative">

              {/* STAGE CONTAINER WITH CONCENTRIC GLOWING TECH RINGS */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">

                {/* Outer Rotating Dashed Tech Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/25 animate-spin-slow pointer-events-none" />

                {/* Middle Reverse Ring with Tech Dots */}
                <div className="absolute inset-4 rounded-full border border-teal-300/20 animate-spin-reverse-slow pointer-events-none" />

                {/* Inner Breathing Pulse Rings */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-md animate-pulse-ring pointer-events-none" />
                <div className="absolute inset-12 rounded-full bg-emerald-400/10 blur-xl animate-pulse-glow pointer-events-none" />

                {/* Glassmorphic Center Orb */}
                <div className="relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/25 shadow-[0_15px_35px_rgba(4,120,87,0.35)] flex items-center justify-center group">

                  {/* LOGO TAPSEL DENGAN ANIMASI FLOAT BERGERAK */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 animate-float drop-shadow-[0_12px_24px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src="/images/logo-tapsel.png"
                      alt="Logo Pemkab Tapanuli Selatan"
                      fill
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Satellite Orbit Dot */}
                  <div className="absolute -top-1 right-8 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-emerald-950 shadow-md shadow-amber-400/80 animate-ping" />
                  <div className="absolute -top-1 right-8 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-emerald-950 shadow-md shadow-amber-400/80" />
                </div>
              </div>



              {/* Tagline Slogan */}
              <p className="text-xs text-emerald-200/60 mt-3 font-semibold italic text-center">
                “Tapanuli Selatan yang Berkarakter, Maju, Sehat, dan Berkelanjutan”
              </p>
            </div>

            {/* 3 SECTOR CARDS HIGHLIGHT */}
            <div className="hidden sm:grid grid-cols-3 gap-3 w-full max-w-xl pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-emerald-500/40 transition">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                  <Sprout size={18} />
                </div>
                <h4 className="font-bold text-xs text-white">Pertanian</h4>
                <p className="text-[10px] text-emerald-200/60 mt-0.5">
                  Padi, Jagung, Kopi & Salak
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-sky-500/40 transition">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-2">
                  <Fish size={18} />
                </div>
                <h4 className="font-bold text-xs text-white">Perikanan</h4>
                <p className="text-[10px] text-sky-200/60 mt-0.5">
                  Kolam Nila, Mas & Lele
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-amber-500/40 transition">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
                  <Beef size={18} />
                </div>
                <h4 className="font-bold text-xs text-white">Peternakan</h4>
                <p className="text-[10px] text-amber-200/60 mt-0.5">
                  Sapi, Kerbau & Unggas
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              PANEL KANAN: FORM LOGIN SIPD ELEGANT GLASSMORPHISM
             ======================================================== */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md relative">

              {/* Outer Decorative Gradient Border Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/40 via-teal-500/20 to-emerald-700/30 rounded-3xl blur-md opacity-75 pointer-events-none" />

              {/* CARD CONTAINER */}
              <div className="relative rounded-3xl bg-[#03150e]/85 backdrop-blur-2xl border border-emerald-500/25 p-7 sm:p-9 shadow-2xl space-y-6 text-left">

                {/* TOP BRAND ACCENT STRIPE */}
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 shadow-sm" />

                {/* MOBILE ONLY: ANIMATED LOGOS SHOWCASE COMPACT */}
                <div className="flex lg:hidden items-center justify-center gap-3 pb-2 border-b border-white/10">
                  <div className="w-12 h-12 relative animate-float">
                    <Image
                      src="/images/logo-tapsel.png"
                      alt="Logo Tapsel"
                      fill
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="w-32 h-8 relative animate-float-slow">
                    <Image
                      src="/images/tapselbangkitwhite.png"
                      alt="Tapsel Bangkit"
                      fill
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                </div>

                {/* CARD TITLE & SIPD BADGE */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      AUTENTIKASI AKUN
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300/80 flex items-center gap-1">
                      <Activity size={12} className="text-emerald-400" />
                      Server Aktif
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Masuk ke Sistem
                  </h2>
                  <p className="text-xs text-emerald-100/70 mt-1">
                    Gunakan kredensial akun kedinasan Anda untuk mengakses data.
                  </p>
                </div>

                {/* NOTIFIKASI ERROR / SUKSES */}
                {notif && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 transition-all animate-fadeIn ${notif.type === "success"
                      ? "bg-emerald-950/90 border border-emerald-500/60 text-emerald-200"
                      : "bg-red-950/90 border border-red-500/60 text-red-200"
                      }`}
                  >
                    {notif.type === "success" ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{notif.message}</span>
                  </div>
                )}

                {/* FORM INPUT LOGIN */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* INPUT USERNAME / NIP */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
                      Username / NIP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/80">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Contoh: admin atau NIP Anda"
                        className="w-full bg-[#062217] border border-emerald-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* INPUT KATA SANDI */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                        Kata Sandi
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/80">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#062217] border border-emerald-500/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-300/60 hover:text-white transition cursor-pointer"
                        title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* TOMBOL MASUK DENGAN EFEK SHINE & LOADING */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/80 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 cursor-pointer border border-emerald-400/30"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Memverifikasi Kredensial...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={15} />
                        <span>Masuk ke Dashboard</span>
                      </>
                    )}
                  </button>
                </form>



              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER BAWAH PORTAL */}
      <footer className="relative z-20 w-full border-t border-emerald-900/40 bg-black/40 backdrop-blur-md px-4 sm:px-8 py-3.5 text-center sm:flex sm:items-center sm:justify-between text-xs text-emerald-200/70">
        <p className="font-medium">
          &copy; 2026 Pemerintah Kabupaten Tapanuli Selatan. All rights reserved.
        </p>
        <p className="font-semibold text-emerald-300 text-[11px] mt-1 sm:mt-0">
          “Dari Pajak Rakyat, Dimanfaatkan oleh Rakyat untuk Tapsel Berdaulat”
        </p>
      </footer>
    </div>
  );
}
