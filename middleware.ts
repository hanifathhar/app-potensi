import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

// Route yang tidak memerlukan autentikasi
const publicRoutes = ["/login", "/unauthorized", "/display", "/pengaduan", "/spm"];

// Route yang hanya bisa diakses admin
const adminOnlyRoutes = ["/master-data"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log("MIDDLEWARE HIT:", request.nextUrl.pathname);

    // Izinkan akses ke semua API routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Izinkan akses ke root (landing page) dan public routes
    if (pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Izinkan akses ke static files dan uploads
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/favicon.png") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/uploads")
    ) {
        return NextResponse.next();
    }

    // Cek token dari cookie
    const token = request.cookies.get("token")?.value;

    console.log("🔍 Middleware check:", { pathname, hasToken: !!token });

    if (!token) {
        console.log("❌ No token found, redirecting to login");
        // Redirect ke login jika tidak ada token
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // Decode token secara manual tanpa verifikasi di middleware
        // Verifikasi akan dilakukan di API route
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
        );

        console.log("✅ Token payload:", { user: payload.username, role: payload.role });

        // Cek expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("⏰ Token expired");
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("token");
            return response;
        }

        // Rule 1: Admin Dinas Pertanian TIDAK DAPAT mengakses data perikanan
        if (payload.role === "ADMIN_PERTANIAN" && pathname.startsWith("/perikanan")) {
            console.log("⛔ Access denied - Admin Dinas Pertanian dilarang mengakses data perikanan");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Rule 2: Admin Dinas Perikanan HANYA BISA akses data perikanan (dilarang pertanian, peternakan, kelompok-tani, pendanaan)
        if (
            payload.role === "ADMIN_PERIKANAN" &&
            (pathname.startsWith("/pertanian") ||
             pathname.startsWith("/peternakan") ||
             pathname.startsWith("/kelompok-tani") ||
             pathname.startsWith("/pendanaan"))
        ) {
            console.log("⛔ Access denied - Admin Dinas Perikanan hanya dapat mengakses data perikanan");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Rule 4: Data Master HANYA BISA diakses oleh SUPERADMIN & ADMIN_KABUPATEN
        // Rute master data meliputi: /wilayah, /pengaturan (komoditas & pengguna), dan /master-data
        const isMasterDataRoute =
            pathname.startsWith("/wilayah") ||
            pathname.startsWith("/pengaturan") ||
            pathname.startsWith("/master-data");

        if (isMasterDataRoute && payload.role !== "SUPERADMIN" && payload.role !== "ADMIN_KABUPATEN") {
            console.log("⛔ Access denied - Data Master hanya untuk SUPERADMIN dan ADMIN_KABUPATEN:", payload.role);
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Cek akses rute laporan
        if (pathname.startsWith("/laporan/posyandu-kabupaten")) {
            const allowedRoles = ["SUPERADMIN", "ADMIN_KABUPATEN"];
            if (!allowedRoles.includes(payload.role)) {
                console.log("⛔ Access denied - Laporan Kabupaten restricted for role:", payload.role);
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        } else if (pathname.startsWith("/laporan/posyandu-kecamatan")) {
            const allowedRoles = ["SUPERADMIN", "ADMIN_KABUPATEN", "ADMIN_KECAMATAN"];
            if (!allowedRoles.includes(payload.role)) {
                console.log("⛔ Access denied - Laporan Kecamatan restricted for role:", payload.role);
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.log("❌ Token invalid:", error);
        // Token invalid, redirect ke login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|favicon.png|uploads|images|icons).*)",
  ],
};
