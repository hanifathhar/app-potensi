-- DropForeignKey
ALTER TABLE "public"."pengaduan" DROP CONSTRAINT "pengaduan_jenisPengaduanId_fkey";

-- AlterTable
ALTER TABLE "pengaduan" DROP COLUMN "jenisPengaduanId";

-- CreateTable
CREATE TABLE "_JenisPengaduanToPengaduan" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JenisPengaduanToPengaduan_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_JenisPengaduanToPengaduan_B_index" ON "_JenisPengaduanToPengaduan"("B");

-- AddForeignKey
ALTER TABLE "_JenisPengaduanToPengaduan" ADD CONSTRAINT "_JenisPengaduanToPengaduan_A_fkey" FOREIGN KEY ("A") REFERENCES "jenis_pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JenisPengaduanToPengaduan" ADD CONSTRAINT "_JenisPengaduanToPengaduan_B_fkey" FOREIGN KEY ("B") REFERENCES "pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
