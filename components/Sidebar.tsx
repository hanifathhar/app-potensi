"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Sprout,
  Fish,
  Beef,
  Calendar,
  Wallet,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Dot,
  Layers,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  active?: string;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [potensiOpen, setPotensiOpen] = useState<boolean>(true);
  const [pengaturanOpen, setPengaturanOpen] = useState<boolean>(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/me", { headers, credentials: "include" });
        const data = await res.json();
        if (data.user) {
          setRole(data.user.role || data.user.peran || "PETUGAS");
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error("Gagal ambil role:", error);
      }
    };

    fetchRole();
  }, []);

  useEffect(() => {
    if (
      pathname.startsWith("/pertanian") ||
      pathname.startsWith("/perikanan") ||
      pathname.startsWith("/peternakan")
    ) {
      setPotensiOpen(true);
    }
    if (pathname.startsWith("/pengaturan")) {
      setPengaturanOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
    } catch { }
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.href = "/login";
  };

  const isSuperOrKabupaten = role === "SUPERADMIN" || role === "ADMIN_KABUPATEN";
  const isPotensiActive =
    pathname.startsWith("/pertanian") ||
    pathname.startsWith("/perikanan") ||
    pathname.startsWith("/peternakan");

  const topNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      href: "/dashboard",
    },
    // Rule 4: Data Wilayah (Master Kecamatan & Desa) hanya untuk Superadmin & Admin Kabupaten
    ...(isSuperOrKabupaten
      ? [
        {
          title: "Data Wilayah",
          icon: <MapPin size={18} />,
          href: "/wilayah",
        },
      ]
      : []),
    // Rule 2: Admin Dinas Perikanan & PPL Perikanan hanya bisa akses data perikanan (hide Kelompok Tani)
    ...(role !== "ADMIN_PERIKANAN" && role !== "PPL_PERIKANAN"
      ? [
        {
          title: "Kelompok Tani",
          icon: <Users size={18} />,
          href: "/kelompok-tani",
        },
      ]
      : []),
  ];

  const potensiItems = [
    {
      title: "Usaha Pertanian",
      icon: <Sprout size={14} />,
      href: "/pertanian",
      color: "text-emerald-400",
      sector: "pertanian",
    },
    {
      title: "Usaha Perikanan",
      icon: <Fish size={14} />,
      href: "/perikanan",
      color: "text-cyan-400",
      sector: "perikanan",
    },
    {
      title: "Usaha Peternakan",
      icon: <Beef size={14} />,
      href: "/peternakan",
      color: "text-amber-400",
      sector: "peternakan",
    },
  ];

  // Filter menu potensi sesuai peran:
  // - Admin Dinas Pertanian & PPL Pertanian: Usaha Pertanian dan Usaha Peternakan
  // - Admin Dinas Perikanan & PPL Perikanan: Hanya Usaha Perikanan
  const filteredPotensiItems = potensiItems.filter((item) => {
    if ((role === "ADMIN_PERTANIAN" || role === "PPL_PERTANIAN") && item.sector === "perikanan") return false;
    if ((role === "ADMIN_PERIKANAN" || role === "PPL_PERIKANAN") && item.sector !== "perikanan") return false;
    return true;
  });

  const canAccessPendanaan =
    role === "SUPERADMIN" ||
    role === "ADMIN_KABUPATEN" ||
    role === "ADMIN_PERTANIAN" ||
    role === "ADMIN_PERIKANAN";

  const bottomNavItems = [
    ...(canAccessPendanaan
      ? [
        {
          title: "Pendanaan",
          icon: <Wallet size={18} />,
          href: "/pendanaan",
        },
      ]
      : []),
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0a261c] text-slate-100 border-r border-[#153e30] flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none shadow-xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#153e30]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Logo Badge */}
            <div className="relative w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform overflow-hidden">
              <Image
                src="/images/logo-tapsel.png"
                alt="Logo Tapanuli Selatan"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
                priority
                unoptimized
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">
                  SIDALIHAN
                </span>
                <span className="font-extrabold text-base tracking-wider text-emerald-400">
                  TAPSEL
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/70 font-medium tracking-tight">
                Sinergi Dalihan Natolu untuk Tapsel Bangkit
              </p>
            </div>
          </Link>

          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-emerald-900">
          {/* Top Menu Items (Dashboard, Wilayah, Kelompok Tani) */}
          {topNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${isActive
                  ? "bg-[#16a34a] text-white shadow-md shadow-emerald-950/40 font-semibold"
                  : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                  }`}
              >
                <span className={isActive ? "text-white" : "text-emerald-400/80"}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* Menu Induk: Data Potensi (Sub-menu: Usaha Pertanian, Usaha Perikanan, Usaha Peternakan) */}
          <div className="pt-0.5">
            <button
              onClick={() => setPotensiOpen(!potensiOpen)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${isPotensiActive
                ? "bg-[#12382b] text-white font-semibold"
                : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={isPotensiActive ? "text-emerald-400" : "text-emerald-400/80"}>
                  <Layers size={18} />
                </span>
                <span>Data Potensi</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isPotensiActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span className="text-emerald-400/60">
                  {potensiOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
              </div>
            </button>

            {/* Sub-menu items Data Potensi */}
            {potensiOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-emerald-800/60 space-y-1">
                {filteredPotensiItems.map((subItem) => {
                  const isSubActive = pathname.startsWith(subItem.href);
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${isSubActive
                        ? "bg-[#16a34a] text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                        }`}
                    >
                      <span className={isSubActive ? "text-white" : subItem.color}>
                        {subItem.icon}
                      </span>
                      <span className="flex-1">{subItem.title}</span>
                      {isSubActive && (
                        <span className="w-1 h-1 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Menu Items (Siklus Produksi, Pendanaan, Laporan) */}
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${isActive
                  ? "bg-[#16a34a] text-white shadow-md shadow-emerald-950/40 font-semibold"
                  : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                  }`}
              >
                <span className={isActive ? "text-white" : "text-emerald-400/80"}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}


          {/* Rule 4: Data Master (Pengaturan Komoditas & Manajemen Pengguna) hanya untuk Superadmin & Admin Kabupaten */}
          {isSuperOrKabupaten && (
            <div className="pt-1.5">
              <button
                onClick={() => setPengaturanOpen(!pengaturanOpen)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${pathname.startsWith("/pengaturan")
                  ? "bg-[#12382b] text-white font-semibold"
                  : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400/80">
                    <Settings size={18} />
                  </span>
                  <span>Pengaturan</span>
                </div>
                <span className="text-emerald-400/60">
                  {pengaturanOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
              </button>

              {/* Sub-menu items */}
              {pengaturanOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-emerald-800/60 space-y-1">
                  {/* Sub-menu 1: Master Komoditas */}
                  <Link
                    href="/pengaturan/komoditas"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${pathname === "/pengaturan/komoditas"
                      ? "bg-[#16a34a] text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                      }`}
                  >
                    <Sprout size={14} className={pathname === "/pengaturan/komoditas" ? "text-white" : "text-emerald-400"} />
                    <span>Master Komoditas</span>
                  </Link>

                  {/* Sub-menu 2: Manajemen Pengguna */}
                  <Link
                    href="/pengaturan/pengguna"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${pathname === "/pengaturan/pengguna"
                      ? "bg-[#16a34a] text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:bg-[#12382b] hover:text-white"
                      }`}
                  >
                    <Users size={14} className={pathname === "/pengaturan/pengguna" ? "text-white" : "text-purple-400"} />
                    <span>Manajemen Pengguna</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User Card & Logout Bottom */}
        <div className="p-4 border-t border-[#153e30] bg-[#071d15]/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800/80 text-emerald-200 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/30">
              {userInfo?.nama?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userInfo?.nama || "Admin Kabupaten"}
              </p>
              <p className="text-[10px] text-emerald-300/80 truncate font-medium">
                {userInfo?.kecamatan
                  ? `${userInfo.role?.replace(/_/g, " ")} (${userInfo.kecamatan.nm_kecamatan})`
                  : userInfo?.role?.replace(/_/g, " ") || ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-300 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 rounded-xl transition"
          >
            <LogOut size={14} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
}