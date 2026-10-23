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
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        message: "Username dan password wajib diisi.",
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

  const setCredential = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setNotif(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#071c14] text-slate-100 flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-emerald-600 selection:text-white">
      {/* PANEL KIRI: BRANDING & 3 SEKTOR */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#071c14] via-[#0b2f21] to-[#134e38] overflow-hidden border-r border-[#12382b]">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          }}
        />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-white transition mb-8"
          >
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-lg overflow-hidden shrink-0">
              <Image
                src="/images/logo-tapsel.png"
                alt="Logo Tapanuli Selatan"
                width={40}
                height={40}
                className="w-9 h-9 object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-wider text-white">
                SIDALIHAN
              </h2>
              <p className="text-xs text-emerald-200/80 font-medium">
                Pemerintah Kabupaten Tapanuli Selatan
              </p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight max-w-xl">
            Sistem Informasi Data Agro Layanan Informasi Hasil Angkola Nusantara
          </h1>
          <p className="text-sm text-emerald-100/80 mt-3 max-w-lg leading-relaxed font-medium">
            Portal data terintegrasi dari tingkat desa, kelompok tani, hingga kabupaten untuk
            mewujudkan kedaulatan pangan dan kemajuan petani Tapsel.
          </p>
        </div>

        {/* 3 Sector Highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-3 my-8">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <Sprout size={22} className="text-emerald-300 mb-2" />
            <h4 className="font-bold text-xs text-white">Pertanian</h4>
            <p className="text-[10px] text-emerald-100/70">Kopi, Jagung, Padi & Salak</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <Fish size={22} className="text-sky-300 mb-2" />
            <h4 className="font-bold text-xs text-white">Perikanan</h4>
            <p className="text-[10px] text-sky-100/70">Kolam Nila, Mas & Lele</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <Beef size={22} className="text-amber-300 mb-2" />
            <h4 className="font-bold text-xs text-white">Peternakan</h4>
            <p className="text-[10px] text-amber-100/70">Sapi, Kerbau & Kambing</p>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-emerald-800/40 text-xs text-emerald-200/60 flex items-center justify-between">
          <span>&copy; 2026 Pemerintah Kabupaten Tapanuli Selatan. All rights reserved.</span>
          <span className="italic font-semibold text-emerald-300">
            “Dari Pajak Rakyat, Dimanfaatkan oleh rakyat untuk Tapsel Berdaulat”
          </span>
        </div>
      </div>

      {/* PANEL KANAN: FORM LOGIN */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-[#061811]">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/40">
              Masuk Portal
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2">
              Autentikasi Pengguna
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan akun resmi dinas atau kelompok tani Anda.
            </p>
          </div>

          {/* Notifikasi */}
          {notif && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${notif.type === "success"
                ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                : "bg-red-950 border border-red-800 text-red-300"
                }`}
            >
              {notif.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{notif.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin"
                  className="w-full bg-[#0a261c] border border-emerald-900/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a261c] border border-emerald-900/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#16a34a] hover:bg-emerald-600 text-white shadow-md shadow-emerald-900/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Login Badge Helper */}

        </div>
      </div>
    </div>
  );
}
