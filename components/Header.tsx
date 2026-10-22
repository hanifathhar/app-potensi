"use client";

import { Menu, LogOut, Bell, ChevronDown, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header({
  setSidebarOpen,
}: {
  setSidebarOpen?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Gagal ambil data user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const formatRoleName = (role?: string) => {
    if (!role) return "Admin Kabupaten";
    return role.replace(/_/g, " ");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs print:hidden">
      <div className="px-5 py-3 flex items-center justify-between">
        {/* Left: Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            onClick={() => {
              if (setSidebarOpen) setSidebarOpen(true);
            }}
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">
              Sistem Aktif & Terhubung ke Server Tapsel
            </span>
          </div>
        </div>

        {/* Right: Notification & Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <button
            type="button"
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Pemberitahuan"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Profile Dropdown Button */}
          <div className="relative">
            <button
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              onClick={() => setOpen(!open)}
            >
              <div className="w-8 h-8 rounded-full bg-[#0a261c] text-emerald-400 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                {user?.nama?.charAt(0).toUpperCase() || "A"}
              </div>

              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.nama || "Admin Kabupaten"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {formatRoleName(user?.role)} - Dinas Pertanian
                </p>
              </div>

              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-[#0a261c] p-3.5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {user?.nama?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-xs leading-tight truncate">
                        {user?.nama || "Admin Kabupaten"}
                      </h3>
                      <p className="text-[10px] text-emerald-300 mt-0.5 truncate uppercase font-semibold">
                        {formatRoleName(user?.role)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2 space-y-1 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <User size={15} className="text-slate-400" />
                    <span>Profil Saya</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                  >
                    <LogOut size={15} />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}