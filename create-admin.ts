const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Create Default Masjid if it doesn't exist
    const defaultMasjidKode = "MSJ-001";
    let masjid = await prisma.masjid.findUnique({
      where: { kode: defaultMasjidKode }
    });

    if (!masjid) {
      masjid = await prisma.masjid.create({
        data: {
          kode: defaultMasjidKode,
          nama: "Masjid Raya",
          alamat: "Jl. Utama No. 1",
          status: "AKTIF"
        }
      });
      console.log("✅ Masjid default berhasil dibuat:", masjid.nama);
    } else {
      console.log("ℹ️ Masjid default sudah ada:", masjid.nama);
    }

    // 2. Create Default Admin if it doesn't exist
    const adminUsername = "admin";
    const adminPassword = "password123";
    
    let admin = await prisma.pengguna.findFirst({
      where: { username: adminUsername, masjidId: masjid.id }
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await prisma.pengguna.create({
        data: {
          username: adminUsername,
          password: hashedPassword,
          nama: "Administrator",
          role: "ADMIN",
          status: "AKTIF",
          masjidId: masjid.id
        }
      });
      console.log("✅ Admin default berhasil dibuat.");
      console.log(`\n🔑 Gunakan kredensial berikut untuk login:`);
      console.log(`   Username : ${adminUsername}`);
      console.log(`   Password : ${adminPassword}\n`);
    } else {
      console.log("ℹ️ Admin default sudah ada.");
    }

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
