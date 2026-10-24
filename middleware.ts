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
        pathname.startsWith("/uploads") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".jpeg") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".webp") ||
        pathname.endsWith(".ico") ||
        pathname.endsWith(".pdf")
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

        const role = payload.role || payload.peran;
        console.log("✅ Token payload:", { user: payload.username, role });

        // Cek expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("⏰ Token expired");
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("token");
            return response;
        }

        // Rule 1: Admin Dinas Pertanian & PPL Pertanian TIDAK DAPAT mengakses data perikanan
        if ((role === "ADMIN_PERTANIAN" || role === "PPL_PERTANIAN") && pathname.startsWith("/perikanan")) {
            console.log("⛔ Access denied - Dinas Pertanian / PPL Pertanian dilarang mengakses data perikanan");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Rule 2: Admin Dinas Perikanan & PPL Perikanan HANYA BISA akses data perikanan
        if (
            (role === "ADMIN_PERIKANAN" || role === "PPL_PERIKANAN") &&
            (pathname.startsWith("/pertanian") ||
             pathname.startsWith("/peternakan") ||
             pathname.startsWith("/kelompok-tani"))
        ) {
            console.log("⛔ Access denied - Dinas Perikanan / PPL Perikanan hanya dapat mengakses data perikanan");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Rule 3: Menu Pendanaan HANYA BISA diakses oleh SUPERADMIN, ADMIN_KABUPATEN, ADMIN_PERTANIAN, ADMIN_PERIKANAN
        if (
            pathname.startsWith("/pendanaan") &&
            !["SUPERADMIN", "ADMIN_KABUPATEN", "ADMIN_PERTANIAN", "ADMIN_PERIKANAN"].includes(role)
        ) {
            console.log("⛔ Access denied - Pendanaan hanya untuk Superadmin, Dinas Pertanian, dan Dinas Perikanan:", role);
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Rule 4: Data Master HANYA BISA diakses oleh SUPERADMIN & ADMIN_KABUPATEN
        // Rute master data meliputi: /wilayah, /pengaturan (komoditas & pengguna), dan /master-data
        const isMasterDataRoute =
            pathname.startsWith("/wilayah") ||
            pathname.startsWith("/pengaturan") ||
            pathname.startsWith("/master-data");

        if (isMasterDataRoute && role !== "SUPERADMIN" && role !== "ADMIN_KABUPATEN") {
            console.log("⛔ Access denied - Data Master hanya untuk SUPERADMIN dan ADMIN_KABUPATEN:", role);
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
    "/((?!api|_next|favicon.ico|favicon.png|uploads|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
  ],
};
