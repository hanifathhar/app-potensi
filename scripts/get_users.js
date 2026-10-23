const { connectBastion, connectVM, runCmd } = require('./remote_exec');

async function main() {
  const bastion = await connectBastion();
  const { vm } = await connectVM(bastion);

  await runCmd(vm, `cd /home/hnf/app-potensi && node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function test() {
      const users = await prisma.pengguna.findMany({
        select: { id: true, username: true, peran: true, nama: true, kd_kecamatan: true, kd_desa_list: true }
      });
      console.log("All users in DB:", JSON.stringify(users, null, 2));
      await prisma.$disconnect();
    }
    test().catch(console.error);
  '`);

  vm.end();
  bastion.end();
}

main().catch(console.error);
