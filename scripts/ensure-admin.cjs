const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.pengguna.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      aktif: true,
      peran: 'SUPERADMIN'
    },
    create: {
      nama: 'Administrator Kabupaten',
      username: 'admin',
      email: 'admin@tapselkab.go.id',
      passwordHash,
      peran: 'SUPERADMIN',
      aktif: true
    }
  });
  console.log('✅ Admin user ready:', admin.username);
}

main().finally(() => prisma.$disconnect());
