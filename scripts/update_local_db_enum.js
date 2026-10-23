const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Updating local PostgreSQL enum PeranPengguna...");
    await prisma.$executeRawUnsafe(`ALTER TYPE "PeranPengguna" ADD VALUE IF NOT EXISTS 'PPL_PERTANIAN';`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "PeranPengguna" ADD VALUE IF NOT EXISTS 'PPL_PERIKANAN';`);
    console.log("Local PostgreSQL enum PeranPengguna successfully updated!");

    const enums = await prisma.$queryRawUnsafe(
      `SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'PeranPengguna'`
    );
    console.log("Current local enum labels:", enums);
  } catch (err) {
    console.error("Local enum update error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
