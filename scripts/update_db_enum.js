const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  console.log("Checking and updating PeranPengguna enum in database...");
  await runCmd(vm, `cd /home/hnf/app-potensi && node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function updateEnum() {
      try {
        const enumsBefore = await prisma.$queryRawUnsafe(
          "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = \\x27PeranPengguna\\x27"
        );
        console.log("Current enum labels:", enumsBefore);

        await prisma.$executeRawUnsafe("ALTER TYPE \\"PeranPengguna\\" ADD VALUE IF NOT EXISTS \\x27PPL_PERTANIAN\\x27;");
        await prisma.$executeRawUnsafe("ALTER TYPE \\"PeranPengguna\\" ADD VALUE IF NOT EXISTS \\x27PPL_PERIKANAN\\x27;");
        console.log("ALTER TYPE executed successfully.");

        const enumsAfter = await prisma.$queryRawUnsafe(
          "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = \\x27PeranPengguna\\x27"
        );
        console.log("Updated enum labels:", enumsAfter);
      } catch (err) {
        console.error("Enum update error:", err);
      } finally {
        await prisma.$disconnect();
      }
    }
    updateEnum();
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
