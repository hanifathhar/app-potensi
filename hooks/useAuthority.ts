"use client";

import { useState, useEffect } from "react";

export interface UserAuthData {
  id: string;
  nama: string;
  username: string;
  email?: string | null;
  peran: "SUPERADMIN" | "ADMIN_KABUPATEN" | "ADMIN_KECAMATAN" | "ADMIN_DESA" | "PETUGAS" | "KELOMPOK_TANI";
  role: string;
  kd_kecamatan?: string | null;
  kd_desa?: string | null;
  kecamatan?: { kd_kecamatan: string; nm_kecamatan: string } | null;
  desa?: { kd_desa: string; nm_desa: string } | null;
}

export function useAuthority() {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/me", { headers, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa otoritas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const peran = user?.peran || user?.role || "";
  const isKabupaten = peran === "SUPERADMIN" || peran === "ADMIN_KABUPATEN";
  const isKecamatan = peran === "ADMIN_KECAMATAN";
  const isPplOrDesa = peran === "PETUGAS" || peran === "ADMIN_DESA" || peran === "KELOMPOK_TANI";

  const authKecamatan = user?.kd_kecamatan || "";
  const authDesa = user?.kd_desa || "";
  const authKecamatanName = user?.kecamatan?.nm_kecamatan || "";
  const authDesaName = user?.desa?.nm_desa || "";

  const canChangeKecamatan = isKabupaten;
  const canChangeDesa = isKabupaten || (isKecamatan && !user?.kd_desa);

  return {
    user,
    loading,
    peran,
    isKabupaten,
    isKecamatan,
    isPplOrDesa,
    authKecamatan,
    authDesa,
    authKecamatanName,
    authDesaName,
    canChangeKecamatan,
    canChangeDesa,
  };
}
