"use client";

import { useState, useEffect } from "react";

export interface UserAuthData {
  id: string;
  nama: string;
  username: string;
  email?: string | null;
  peran:
    | "SUPERADMIN"
    | "ADMIN_KABUPATEN"
    | "ADMIN_PERTANIAN"
    | "ADMIN_PERIKANAN"
    | "ADMIN_KECAMATAN"
    | "ADMIN_DESA"
    | "PETUGAS"
    | "KELOMPOK_TANI";
  role: string;
  kd_kecamatan?: string | null;
  kd_desa?: string | null;
  kd_desa_list?: string[];
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

  // Role checks
  const isSuperAdmin = peran === "SUPERADMIN";
  const isMasterDataAdmin = peran === "SUPERADMIN" || peran === "ADMIN_KABUPATEN";
  const isPertanianAdmin = peran === "ADMIN_PERTANIAN";
  const isPerikananAdmin = peran === "ADMIN_PERIKANAN";
  const isDinas = isPertanianAdmin || isPerikananAdmin;

  // Level territorial cakupan: Superadmin, Admin Kabupaten, dan Admin Dinas bekerja di tingkat Kabupaten
  const isKabupaten = isMasterDataAdmin || isDinas;
  const isKecamatan = peran === "ADMIN_KECAMATAN";
  const isPpl = peran === "PETUGAS";
  const isPplOrDesa = isPpl || peran === "ADMIN_DESA" || peran === "KELOMPOK_TANI";

  const authKecamatan = user?.kd_kecamatan || "";
  const rawAuthDesa = user?.kd_desa || "";
  const authDesaList = user?.kd_desa_list && user.kd_desa_list.length > 0
    ? user.kd_desa_list
    : rawAuthDesa
    ? [rawAuthDesa]
    : [];

  // Rule 3: Petugas PPL ditugaskan di banyak desa dalam 1 kecamatan (kd_desa_list).
  // PPL TIDAK boleh dikunci ke satu desa tunggal. Hanya ADMIN_DESA atau KELOMPOK_TANI yang terkunci ke satu desa.
  const isLockedDesa = !isPpl && !isKabupaten && !isKecamatan && Boolean(rawAuthDesa);
  const authDesa = isLockedDesa ? rawAuthDesa : "";

  const authKecamatanName = user?.kecamatan?.nm_kecamatan || "";
  const authDesaName = user?.desa?.nm_desa || "";

  const canChangeKecamatan = isKabupaten;
  const canChangeDesa = isKabupaten || isKecamatan || isPpl || !isLockedDesa;

  // Akses sektor sesuai role:
  // - Admin Pertanian: Pertanian dan Peternakan
  // - Admin Perikanan: Perikanan saja
  const canAccessSector = (sector: "pertanian" | "perikanan" | "peternakan") => {
    if (isPertanianAdmin) return sector === "pertanian" || sector === "peternakan";
    if (isPerikananAdmin) return sector === "perikanan";
    return true;
  };

  // Otoritas input, edit, dan hapus data
  const canEditOrDeleteRecord = (
    itemKecamatan?: string | null,
    itemDesa?: string | null,
    sector?: "pertanian" | "perikanan" | "peternakan"
  ) => {
    if (sector && !canAccessSector(sector)) return false;
    if (isMasterDataAdmin) return true;
    if (isPertanianAdmin) return sector === "pertanian" || sector === "peternakan";
    if (isPerikananAdmin) return sector === "perikanan";
    if (isKecamatan) return Boolean(itemKecamatan && itemKecamatan === authKecamatan);

    // Rule 3: Petugas PPL hanya dalam satu kecamatan dan desa yang ditugaskan
    if (isPpl) {
      if (itemKecamatan && authKecamatan && itemKecamatan !== authKecamatan) return false;
      if (authDesaList.length > 0 && itemDesa) {
        return authDesaList.includes(itemDesa);
      }
      return true;
    }

    if (isPplOrDesa) {
      if (authKecamatan && itemKecamatan !== authKecamatan) return false;
      if (authDesa && itemDesa !== authDesa) return false;
      return true;
    }

    return false;
  };

  return {
    user,
    loading,
    peran,
    isSuperAdmin,
    isMasterDataAdmin,
    isPertanianAdmin,
    isPerikananAdmin,
    isDinas,
    isKabupaten,
    isKecamatan,
    isPpl,
    isPplOrDesa,
    authKecamatan,
    authDesa,
    rawAuthDesa,
    authDesaList,
    isLockedDesa,
    authKecamatanName,
    authDesaName,
    canChangeKecamatan,
    canChangeDesa,
    canAccessSector,
    canEditOrDeleteRecord,
  };
}
