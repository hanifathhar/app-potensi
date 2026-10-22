"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  UserCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2,
  MapPin,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string | number;
  nama: string;
  username: string;
  email?: string;
  role: string;
  aktif?: boolean;
  kecamatanId?: string | null;
  desaId?: string | null;
  kecamatan?: {
    kd_kecamatan: string;
    nm_kecamatan: string;
  } | null;
  desa?: {
    kd_desa: string;
    nm_desa: string;
  } | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch("/api/me");

        if (!res.ok) {
          window.location.href = "/login";
          return;
        }

        const json = await res.json();
        setUser(json.user);
      } catch (err) {
        console.error("Gagal memuat profil user:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Password lama wajib diisi");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("Password baru harus berbeda dengan password lama");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "programming-123",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || "Gagal memperbarui password");
      }

      toast.success(json.message || "Password berhasil diperbarui");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "Administrator Sistem";
      case "ADMIN_KABUPATEN":
        return "Administrator Kabupaten";
      case "ADMIN_KECAMATAN":
        return "Administrator Kecamatan";
      case "ADMIN_DESA":
        return "Administrator Desa / Kader";
      case "VERIFIKATOR":
        return "Petugas Verifikator";
      case "PETUGAS":
        return "Petugas Pelaksana";
      default:
        return role ? role.replace(/_/g, " ") : "Pengguna Sistem";
    }
  };

  const getLevelDisplay = (role?: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "Administrator Sistem";
      case "ADMIN_KABUPATEN":
        return "Administrator Kabupaten";
      case "ADMIN_KECAMATAN":
        return "Administrator Kecamatan";
      case "ADMIN_DESA":
        return "Administrator Desa / Kader";
      case "VERIFIKATOR":
        return "Petugas Verifikator";
      case "PETUGAS":
        return "Petugas Pelaksana";
      default:
        return role ? role.replace(/_/g, " ") : "Pengguna Sistem";
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
        <span>Memuat data profil pengguna...</span>
      </div>
    );
  }

  if (!user) return null;

  const emailDisplay = user.email || `${user.username.toLowerCase()}@gmail.com`;

  return (
    <div className="flex h-screen bg-slate-50/80 antialiased text-slate-800 overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="profile"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="border-b border-slate-200/80 pb-6">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-50 border border-red-200/80 mb-2.5 shadow-2xs">
                <UserCircle size={14} className="text-red-500" />
                <span>Profil &amp; Akun</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Profil Pengguna &amp; Keamanan
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Informasi akun personal dan pengaturan kata sandi.
              </p>
            </div>

            {/* Two Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Card: Informasi Akun */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-6">
                {/* Profile Header Block */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-red-600/20 shrink-0">
                    {user.nama ? user.nama.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-snug">
                      {user.nama}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-red-600 truncate mt-0.5">
                      {getRoleDisplay(user.role)}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Account Details List */}
                <div className="space-y-4 text-xs sm:text-sm">


                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 font-normal">Tingkat Hak Akses (Level):</span>
                    <span className="font-bold text-red-600 text-right">
                      {getLevelDisplay(user.role)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 font-normal">Status Akun:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                      Aktif &amp; Terverifikasi
                    </span>
                  </div>

                  {/* Info Wilayah (Desa / Kecamatan) jika ada */}
                  {(user.desa || user.kecamatan) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500 font-normal">Wilayah Penugasan:</span>
                      <span className="font-semibold text-slate-800 sm:text-right">
                        {user.desa
                          ? `Desa ${user.desa.nm_desa}`
                          : user.kecamatan
                            ? `Kec. ${user.kecamatan.nm_kecamatan}`
                            : "Kabupaten Tapanuli Selatan"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Card: Ubah Kata Sandi (Password) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-red-600 shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Ubah Kata Sandi (Password)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pastikan Anda menggunakan kata sandi yang kuat dan aman.
                  </p>
                </div>

                <div className="border-t border-slate-100" />

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Password Lama */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Password Lama *
                    </label>
                    <div className="relative">
                      <input
                        type={showOld ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Password Baru * (Min. 6 karakter)
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Masukkan password baru"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Konfirmasi Password Baru *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 transition hover:shadow-lg disabled:opacity-50 shrink-0"
                    >
                      {saving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      <span>Perbarui Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}