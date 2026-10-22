import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export interface UserAuth {
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
}

export function getUserFromRequest(req: Request | NextRequest): UserAuth | null {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    let token = match ? match[1] : req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) return null;

    const desaList = Array.isArray(decoded.kd_desa_list)
      ? decoded.kd_desa_list
      : decoded.kd_desa
      ? [decoded.kd_desa]
      : [];

    return {
      id: String(decoded.id),
      nama: decoded.nama,
      username: decoded.username,
      email: decoded.email,
      peran: decoded.peran || decoded.role || "PETUGAS",
      role: decoded.role || decoded.peran || "PETUGAS",
      kd_kecamatan: decoded.kd_kecamatan || null,
      kd_desa: decoded.kd_desa || null,
      kd_desa_list: desaList,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validates sector access for Admin Dinas Pertanian & Admin Dinas Perikanan
 */
export function canAccessSector(
  user: UserAuth | null,
  sector: "pertanian" | "perikanan" | "peternakan"
): boolean {
  if (!user) return false;
  if (user.peran === "SUPERADMIN" || user.peran === "ADMIN_KABUPATEN") return true;

  // Rule 1: Admin Dinas Pertanian TIDAK DAPAT mengakses data perikanan
  if (user.peran === "ADMIN_PERTANIAN") {
    return sector !== "perikanan";
  }

  // Rule 2: Admin Dinas Perikanan HANYA BISA akses data perikanan
  if (user.peran === "ADMIN_PERIKANAN") {
    return sector === "perikanan";
  }

  return true;
}

/**
 * Rule 4: Data master hanya bisa diakses oleh superadmin/admin kabupaten
 */
export function isAuthorizedForMasterData(user: UserAuth | null): boolean {
  if (!user) return false;
  return user.peran === "SUPERADMIN" || user.peran === "ADMIN_KABUPATEN";
}

/**
 * Returns Prisma filter clause based on User Role & Authority
 */
export function getAuthorityFilter(
  user: UserAuth | null,
  requestedKecamatan?: string | null,
  requestedDesa?: string | null
) {
  if (!user || user.peran === "SUPERADMIN" || user.peran === "ADMIN_KABUPATEN") {
    const filter: any = {};
    if (requestedKecamatan && requestedKecamatan !== "semua") {
      filter.kd_kecamatan = requestedKecamatan;
    }
    if (requestedDesa && requestedDesa !== "semua") {
      filter.kd_desa = requestedDesa;
    }
    return filter;
  }

  if (user.peran === "ADMIN_PERTANIAN" || user.peran === "ADMIN_PERIKANAN") {
    const filter: any = {};
    if (user.kd_kecamatan) {
      filter.kd_kecamatan = user.kd_kecamatan;
    } else if (requestedKecamatan && requestedKecamatan !== "semua") {
      filter.kd_kecamatan = requestedKecamatan;
    }
    if (requestedDesa && requestedDesa !== "semua") {
      filter.kd_desa = requestedDesa;
    }
    return filter;
  }

  if (user.peran === "ADMIN_KECAMATAN") {
    const filter: any = { kd_kecamatan: user.kd_kecamatan || "0" };
    if (requestedDesa && requestedDesa !== "semua") {
      filter.kd_desa = requestedDesa;
    }
    return filter;
  }

  // Rule 3: Petugas PPL dapat ditugaskan di banyak desa tetapi hanya boleh di dalam satu kecamatan
  if (user.peran === "PETUGAS") {
    const filter: any = { kd_kecamatan: user.kd_kecamatan || "0" };
    const desaList =
      user.kd_desa_list && user.kd_desa_list.length > 0
        ? user.kd_desa_list
        : user.kd_desa
        ? [user.kd_desa]
        : [];

    if (requestedDesa && requestedDesa !== "semua") {
      if (desaList.length === 0 || desaList.includes(requestedDesa)) {
        filter.kd_desa = requestedDesa;
      } else {
        filter.kd_desa = "unauthorized_desa";
      }
    } else if (desaList.length === 1) {
      filter.kd_desa = desaList[0];
    } else if (desaList.length > 1) {
      filter.kd_desa = { in: desaList };
    }
    return filter;
  }

  if (user.peran === "ADMIN_DESA" || user.peran === "KELOMPOK_TANI") {
    const filter: any = { kd_kecamatan: user.kd_kecamatan || "0" };
    if (user.kd_desa) {
      filter.kd_desa = user.kd_desa;
    }
    return filter;
  }

  return {};
}

/**
 * Validates whether user is authorized to create/edit/delete in a given territory
 */
export function isAuthorizedForTerritory(
  user: UserAuth | null,
  targetKecamatan?: string | null,
  targetDesa?: string | null
): boolean {
  if (!user) return false;
  if (user.peran === "SUPERADMIN" || user.peran === "ADMIN_KABUPATEN") return true;

  if (user.peran === "ADMIN_PERTANIAN" || user.peran === "ADMIN_PERIKANAN") {
    if (user.kd_kecamatan && targetKecamatan && targetKecamatan !== user.kd_kecamatan) return false;
    return true;
  }

  if (user.peran === "ADMIN_KECAMATAN") {
    return Boolean(targetKecamatan && targetKecamatan === user.kd_kecamatan);
  }

  // Rule 3: PPL Territory check
  if (user.peran === "PETUGAS") {
    // Harus di dalam kecamatan yang sama
    if (targetKecamatan && targetKecamatan !== user.kd_kecamatan) return false;

    const desaList =
      user.kd_desa_list && user.kd_desa_list.length > 0
        ? user.kd_desa_list
        : user.kd_desa
        ? [user.kd_desa]
        : [];

    // Jika memiliki penugasan desa spesifik, target desa harus cocok
    if (desaList.length > 0 && targetDesa) {
      return desaList.includes(targetDesa);
    }
    return true;
  }

  if (user.peran === "ADMIN_DESA" || user.peran === "KELOMPOK_TANI") {
    if (targetKecamatan && targetKecamatan !== user.kd_kecamatan) return false;
    if (user.kd_desa && targetDesa && targetDesa !== user.kd_desa) return false;
    return true;
  }

  return false;
}