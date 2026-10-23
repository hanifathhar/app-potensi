const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const u = await p.pengguna.findFirst();
  console.log('Found user:', u?.username, 'current peran:', u?.peran);
  if (u) {
    const updated = await p.pengguna.update({
      where: { id: u.id },
      data: { peran: 'PPL_PERTANIAN' }
    });
    console.log('Successfully updated to PPL_PERTANIAN:', updated.username, updated.peran);
    await p.pengguna.update({
      where: { id: u.id },
      data: { peran: u.peran }
    });
    console.log('Restored to original peran:', u.peran);
  }
  await p.$disconnect();
}

main().catch(console.error);
