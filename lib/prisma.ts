// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Buat instance baru untuk memuat definisi enum & schema terbaru
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  try {
    globalForPrisma.prisma.$disconnect();
  } catch {}
  delete globalForPrisma.prisma;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
