/*
  Warnings:

  - The values [ADMIN] on the enum `RolePengguna` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `nama` on the `bidang_spm` table. All the data in the column will be lost.
  - You are about to drop the column `kecamatanId` on the `desa` table. All the data in the column will be lost.
  - You are about to drop the column `kode` on the `desa` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `desa` table. All the data in the column will be lost.
  - You are about to drop the column `kode` on the `kecamatan` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `kecamatan` table. All the data in the column will be lost.
  - You are about to drop the column `desaId` on the `pelapor` table. All the data in the column will be lost.
  - You are about to drop the column `desaId` on the `pengaduan` table. All the data in the column will be lost.
  - You are about to drop the column `desaId` on the `posyandu` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `posyandu` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kd_desa]` on the table `desa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kd_kecamatan]` on the table `kecamatan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenPelacakan]` on the table `pengaduan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nama_posyandu,kd_desa]` on the table `posyandu` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nm_bidang` to the `bidang_spm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_desa` to the `desa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_kecamatan` to the `desa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nm_desa` to the `desa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `dokumen_pendukung` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_kecamatan` to the `kecamatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nm_kecamatan` to the `kecamatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_desa` to the `pengaduan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_kecamatan` to the `pengaduan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_desa` to the `posyandu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kd_kecamatan` to the `posyandu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_posyandu` to the `posyandu` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TahapVerifikasi" AS ENUM ('DESA', 'KECAMATAN', 'KABUPATEN');

-- CreateEnum
CREATE TYPE "KeputusanVerifikasi" AS ENUM ('DISETUJUI', 'PERLU_PERBAIKAN', 'DITOLAK');

-- CreateEnum
CREATE TYPE "JenisPeristiwa" AS ENUM ('PENGADUAN_DIBUAT', 'VERIFIKASI', 'PERBAIKAN_DIMINTA', 'PERBAIKAN_DIKIRIM', 'STATUS_DIUBAH', 'TINDAK_LANJUT', 'PENGADUAN_DISELESAIKAN');

-- AlterEnum
BEGIN;
CREATE TYPE "RolePengguna_new" AS ENUM ('SUPERADMIN', 'ADMIN_KABUPATEN', 'ADMIN_KECAMATAN', 'ADMIN_DESA', 'OPERATOR', 'PETUGAS', 'VERIFIKATOR');
ALTER TABLE "public"."pengguna" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "pengguna" ALTER COLUMN "role" TYPE "RolePengguna_new" USING ("role"::text::"RolePengguna_new");
ALTER TYPE "RolePengguna" RENAME TO "RolePengguna_old";
ALTER TYPE "RolePengguna_new" RENAME TO "RolePengguna";
DROP TYPE "public"."RolePengguna_old";
ALTER TABLE "pengguna" ALTER COLUMN "role" SET DEFAULT 'PETUGAS';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StatusPengaduan_new" AS ENUM ('BARU', 'MENUNGGU_VERIFIKASI_DESA', 'MENUNGGU_VERIFIKASI_KECAMATAN', 'MENUNGGU_VERIFIKASI_KABUPATEN', 'PERLU_PERBAIKAN', 'DISETUJUI', 'DITOLAK', 'DITINDAKLANJUTI', 'SELESAI');
ALTER TABLE "public"."pengaduan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pengaduan" ALTER COLUMN "status" TYPE "StatusPengaduan_new" USING ("status"::text::"StatusPengaduan_new");
ALTER TYPE "StatusPengaduan" RENAME TO "StatusPengaduan_old";
ALTER TYPE "StatusPengaduan_new" RENAME TO "StatusPengaduan";
DROP TYPE "public"."StatusPengaduan_old";
ALTER TABLE "pengaduan" ALTER COLUMN "status" SET DEFAULT 'MENUNGGU_VERIFIKASI_DESA';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."desa" DROP CONSTRAINT "desa_kecamatanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pelapor" DROP CONSTRAINT "pelapor_desaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pengaduan" DROP CONSTRAINT "pengaduan_desaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pengaduan" DROP CONSTRAINT "pengaduan_dibuatOlehId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pengaduan" DROP CONSTRAINT "pengaduan_petugasId_fkey";

-- DropForeignKey
ALTER TABLE "public"."posyandu" DROP CONSTRAINT "posyandu_desaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tindak_lanjut" DROP CONSTRAINT "tindak_lanjut_petugasId_fkey";

-- DropIndex
DROP INDEX "public"."desa_kecamatanId_nama_idx";

-- DropIndex
DROP INDEX "public"."desa_kode_key";

-- DropIndex
DROP INDEX "public"."kecamatan_kode_key";

-- DropIndex
DROP INDEX "public"."pengaduan_desaId_tanggalPengaduan_idx";

-- DropIndex
DROP INDEX "public"."posyandu_desaId_idx";

-- DropIndex
DROP INDEX "public"."posyandu_nama_desaId_key";

-- AlterTable
ALTER TABLE "bidang_spm" DROP COLUMN "nama",
ADD COLUMN     "nm_bidang" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "desa" DROP COLUMN "kecamatanId",
DROP COLUMN "kode",
DROP COLUMN "nama",
ADD COLUMN     "aktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kd_desa" TEXT NOT NULL,
ADD COLUMN     "kd_kecamatan" TEXT NOT NULL,
ADD COLUMN     "nm_desa" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dokumen_pendukung" ADD COLUMN     "diverifikasiOlehId" TEXT,
ADD COLUMN     "tanggalVerifikasi" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "kecamatan" DROP COLUMN "kode",
DROP COLUMN "nama",
ADD COLUMN     "aktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kd_kecamatan" TEXT NOT NULL,
ADD COLUMN     "nm_kecamatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pelapor" DROP COLUMN "desaId",
ADD COLUMN     "kd_desa" TEXT,
ADD COLUMN     "kd_kecamatan" TEXT;

-- AlterTable
ALTER TABLE "pengaduan" DROP COLUMN "desaId",
ADD COLUMN     "hasilPenyelesaian" TEXT,
ADD COLUMN     "kd_desa" TEXT NOT NULL,
ADD COLUMN     "kd_kecamatan" TEXT NOT NULL,
ADD COLUMN     "tahapPerbaikanKe" "TahapVerifikasi",
ADD COLUMN     "tanggalDisetujui" TIMESTAMP(3),
ADD COLUMN     "tokenPelacakan" TEXT,
ALTER COLUMN "status" SET DEFAULT 'MENUNGGU_VERIFIKASI_DESA';

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN     "desaId" TEXT,
ADD COLUMN     "kecamatanId" TEXT;

-- AlterTable
ALTER TABLE "posyandu" DROP COLUMN "desaId",
DROP COLUMN "nama",
ADD COLUMN     "kd_desa" TEXT NOT NULL,
ADD COLUMN     "kd_kecamatan" TEXT NOT NULL,
ADD COLUMN     "nama_posyandu" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "verifikasi_pengaduan" (
    "id" TEXT NOT NULL,
    "pengaduanId" TEXT NOT NULL,
    "penggunaId" TEXT NOT NULL,
    "tahap" "TahapVerifikasi" NOT NULL,
    "keputusan" "KeputusanVerifikasi" NOT NULL,
    "catatan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "putaran" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifikasi_pengaduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_pengaduan" (
    "id" TEXT NOT NULL,
    "pengaduanId" TEXT NOT NULL,
    "penggunaId" TEXT,
    "peristiwa" "JenisPeristiwa" NOT NULL,
    "statusSebelum" "StatusPengaduan",
    "statusSesudah" "StatusPengaduan",
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "riwayat_pengaduan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verifikasi_pengaduan_pengaduanId_tahap_tanggal_idx" ON "verifikasi_pengaduan"("pengaduanId", "tahap", "tanggal");

-- CreateIndex
CREATE INDEX "verifikasi_pengaduan_penggunaId_tanggal_idx" ON "verifikasi_pengaduan"("penggunaId", "tanggal");

-- CreateIndex
CREATE INDEX "verifikasi_pengaduan_pengaduanId_putaran_idx" ON "verifikasi_pengaduan"("pengaduanId", "putaran");

-- CreateIndex
CREATE INDEX "riwayat_pengaduan_pengaduanId_tanggal_idx" ON "riwayat_pengaduan"("pengaduanId", "tanggal");

-- CreateIndex
CREATE INDEX "riwayat_pengaduan_penggunaId_tanggal_idx" ON "riwayat_pengaduan"("penggunaId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "desa_kd_desa_key" ON "desa"("kd_desa");

-- CreateIndex
CREATE INDEX "desa_kd_kecamatan_nm_desa_idx" ON "desa"("kd_kecamatan", "nm_desa");

-- CreateIndex
CREATE UNIQUE INDEX "kecamatan_kd_kecamatan_key" ON "kecamatan"("kd_kecamatan");

-- CreateIndex
CREATE INDEX "kecamatan_nm_kecamatan_idx" ON "kecamatan"("nm_kecamatan");

-- CreateIndex
CREATE INDEX "pelapor_noHp_idx" ON "pelapor"("noHp");

-- CreateIndex
CREATE INDEX "pelapor_kd_desa_idx" ON "pelapor"("kd_desa");

-- CreateIndex
CREATE UNIQUE INDEX "pengaduan_tokenPelacakan_key" ON "pengaduan"("tokenPelacakan");

-- CreateIndex
CREATE INDEX "pengaduan_kd_desa_status_idx" ON "pengaduan"("kd_desa", "status");

-- CreateIndex
CREATE INDEX "pengaduan_kd_kecamatan_status_idx" ON "pengaduan"("kd_kecamatan", "status");

-- CreateIndex
CREATE INDEX "pengaduan_petugasId_idx" ON "pengaduan"("petugasId");

-- CreateIndex
CREATE INDEX "pengguna_kecamatanId_idx" ON "pengguna"("kecamatanId");

-- CreateIndex
CREATE INDEX "pengguna_desaId_idx" ON "pengguna"("desaId");

-- CreateIndex
CREATE INDEX "posyandu_kd_desa_idx" ON "posyandu"("kd_desa");

-- CreateIndex
CREATE INDEX "posyandu_kd_kecamatan_idx" ON "posyandu"("kd_kecamatan");

-- CreateIndex
CREATE UNIQUE INDEX "posyandu_nama_posyandu_kd_desa_key" ON "posyandu"("nama_posyandu", "kd_desa");

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "kecamatan"("kd_kecamatan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("kd_desa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desa" ADD CONSTRAINT "desa_kd_kecamatan_fkey" FOREIGN KEY ("kd_kecamatan") REFERENCES "kecamatan"("kd_kecamatan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posyandu" ADD CONSTRAINT "posyandu_kd_desa_fkey" FOREIGN KEY ("kd_desa") REFERENCES "desa"("kd_desa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posyandu" ADD CONSTRAINT "posyandu_kd_kecamatan_fkey" FOREIGN KEY ("kd_kecamatan") REFERENCES "kecamatan"("kd_kecamatan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_kd_desa_fkey" FOREIGN KEY ("kd_desa") REFERENCES "desa"("kd_desa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_kd_kecamatan_fkey" FOREIGN KEY ("kd_kecamatan") REFERENCES "kecamatan"("kd_kecamatan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_kd_desa_fkey" FOREIGN KEY ("kd_desa") REFERENCES "desa"("kd_desa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_kd_kecamatan_fkey" FOREIGN KEY ("kd_kecamatan") REFERENCES "kecamatan"("kd_kecamatan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_pendukung" ADD CONSTRAINT "dokumen_pendukung_diverifikasiOlehId_fkey" FOREIGN KEY ("diverifikasiOlehId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifikasi_pengaduan" ADD CONSTRAINT "verifikasi_pengaduan_pengaduanId_fkey" FOREIGN KEY ("pengaduanId") REFERENCES "pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifikasi_pengaduan" ADD CONSTRAINT "verifikasi_pengaduan_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tindak_lanjut" ADD CONSTRAINT "tindak_lanjut_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_pengaduan" ADD CONSTRAINT "riwayat_pengaduan_pengaduanId_fkey" FOREIGN KEY ("pengaduanId") REFERENCES "pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_pengaduan" ADD CONSTRAINT "riwayat_pengaduan_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
