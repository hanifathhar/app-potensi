const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);
  
  await runCmd(vm, `cd /home/hnf/app-potensi && node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function test() {
      const pengguna = await prisma.pengguna.count();
      const kelompokTani = await prisma.kelompokTani.count();
      const pendanaanKebun = await prisma.pendanaanKebun.count();
      console.log("DATABASE INTACT: Pengguna =", pengguna, ", Kelompok Tani =", kelompokTani, ", Pendanaan Kebun =", pendanaanKebun);
      await prisma.$disconnect();
    }
    test().catch(console.error);
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
