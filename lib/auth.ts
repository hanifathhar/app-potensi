import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export interface UserAuth {
  id: string;
  nama: string;
  username: string;
  email?: string | null;
  peran: "SUPERADMIN" | "ADMIN_KABUPATEN" | "ADMIN_KECAMATAN" | "ADMIN_DESA" | "PETUGAS" | "KELOMPOK_TANI";
  role: string;
  kd_kecamatan?: string | null;
  kd_desa?: string | null;
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

    return {
      id: String(decoded.id),
      nama: decoded.nama,
      username: decoded.username,
      email: decoded.email,
      peran: decoded.peran || decoded.role || "PETUGAS",
      role: decoded.role || decoded.peran || "PETUGAS",
      kd_kecamatan: decoded.kd_kecamatan || null,
      kd_desa: decoded.kd_desa || null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Returns Prisma filter clause based on User Role & Authority
 */
export function getAuthorityFilter(user: UserAuth | null, requestedKecamatan?: string | null, requestedDesa?: string | null) {
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

  if (user.peran === "ADMIN_KECAMATAN") {
    const filter: any = { kd_kecamatan: user.kd_kecamatan || "0" };
    if (requestedDesa && requestedDesa !== "semua") {
      filter.kd_desa = requestedDesa;
    }
    return filter;
  }

  if (user.peran === "PETUGAS" || user.peran === "ADMIN_DESA") {
    const filter: any = { kd_kecamatan: user.kd_kecamatan || "0" };
    if (user.kd_desa) {
      filter.kd_desa = user.kd_desa;
    } else if (requestedDesa && requestedDesa !== "semua") {
      filter.kd_desa = requestedDesa;
    }
    return filter;
  }

  if (user.peran === "KELOMPOK_TANI") {
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

  if (user.peran === "ADMIN_KECAMATAN") {
    return Boolean(targetKecamatan && targetKecamatan === user.kd_kecamatan);
  }

  if (user.peran === "PETUGAS" || user.peran === "ADMIN_DESA" || user.peran === "KELOMPOK_TANI") {
    if (targetKecamatan && targetKecamatan !== user.kd_kecamatan) return false;
    if (user.kd_desa && targetDesa && targetDesa !== user.kd_desa) return false;
    return true;
  }

  return false;
}