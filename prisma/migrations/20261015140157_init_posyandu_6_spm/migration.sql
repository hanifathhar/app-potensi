-- CreateEnum
CREATE TYPE "BidangSPM" AS ENUM ('SOSIAL', 'PENDIDIKAN', 'KESEHATAN', 'PEKERJAAN_UMUM', 'PERUMAHAN_RAKYAT', 'TRANTIBUM_LINMAS');

-- CreateEnum
CREATE TYPE "StatusPengaduan" AS ENUM ('BARU', 'DITINDAKLANJUTI', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "JenisDokumen" AS ENUM ('KTP', 'KARTU_KELUARGA', 'SURAT_KETERANGAN_TIDAK_MAMPU', 'DOKUMEN_LAINNYA');

-- CreateEnum
CREATE TYPE "JenisTindakLanjut" AS ENUM ('VERIFIKASI_DATA', 'EDUKASI', 'KUNJUNGAN_RUMAH', 'PELAPORAN_PEMERINTAH_DESA', 'TINDAKAN_LAINNYA');

-- CreateEnum
CREATE TYPE "RolePengguna" AS ENUM ('SUPERADMIN', 'ADMIN', 'OPERATOR', 'PETUGAS', 'VERIFIKATOR');

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RolePengguna" NOT NULL DEFAULT 'PETUGAS',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kecamatan" (
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa" (
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "nama" TEXT NOT NULL,
    "kecamatanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posyandu" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "desaId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posyandu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelapor" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "nik" TEXT,
    "noHp" TEXT,
    "desaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pelapor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidang_spm" (
    "id" TEXT NOT NULL,
    "kode" "BidangSPM" NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bidang_spm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_pengaduan" (
    "id" TEXT NOT NULL,
    "bidangId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenis_pengaduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaduan" (
    "id" TEXT NOT NULL,
    "nomorPengaduan" TEXT NOT NULL,
    "tanggalPengaduan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pelaporId" TEXT NOT NULL,
    "bidangId" TEXT NOT NULL,
    "jenisPengaduanId" TEXT NOT NULL,
    "posyanduId" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" "StatusPengaduan" NOT NULL DEFAULT 'BARU',
    "alasanPenolakan" TEXT,
    "catatan" TEXT,
    "petugasId" TEXT,
    "dibuatOlehId" TEXT,
    "namaPetugasTtd" TEXT,
    "tandaTanganPetugas" TEXT,
    "tanggalSelesai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_pendukung" (
    "id" TEXT NOT NULL,
    "pengaduanId" TEXT NOT NULL,
    "jenis" "JenisDokumen" NOT NULL,
    "namaFile" TEXT NOT NULL,
    "pathFile" TEXT NOT NULL,
    "mimeType" TEXT,
    "ukuranFile" INTEGER,
    "terverifikasi" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_pendukung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tindak_lanjut" (
    "id" TEXT NOT NULL,
    "pengaduanId" TEXT NOT NULL,
    "jenis" "JenisTindakLanjut" NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uraian" TEXT NOT NULL,
    "hasil" TEXT,
    "petugasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tindak_lanjut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_username_key" ON "pengguna"("username");

-- CreateIndex
CREATE INDEX "pengguna_role_aktif_idx" ON "pengguna"("role", "aktif");

-- CreateIndex
CREATE UNIQUE INDEX "kecamatan_kode_key" ON "kecamatan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "desa_kode_key" ON "desa"("kode");

-- CreateIndex
CREATE INDEX "desa_kecamatanId_nama_idx" ON "desa"("kecamatanId", "nama");

-- CreateIndex
CREATE INDEX "posyandu_desaId_idx" ON "posyandu"("desaId");

-- CreateIndex
CREATE UNIQUE INDEX "posyandu_nama_desaId_key" ON "posyandu"("nama", "desaId");

-- CreateIndex
CREATE UNIQUE INDEX "pelapor_nik_key" ON "pelapor"("nik");

-- CreateIndex
CREATE INDEX "pelapor_nama_idx" ON "pelapor"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "bidang_spm_kode_key" ON "bidang_spm"("kode");

-- CreateIndex
CREATE INDEX "jenis_pengaduan_bidangId_aktif_idx" ON "jenis_pengaduan"("bidangId", "aktif");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_pengaduan_bidangId_nama_key" ON "jenis_pengaduan"("bidangId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "pengaduan_nomorPengaduan_key" ON "pengaduan"("nomorPengaduan");

-- CreateIndex
CREATE INDEX "pengaduan_tanggalPengaduan_idx" ON "pengaduan"("tanggalPengaduan");

-- CreateIndex
CREATE INDEX "pengaduan_status_tanggalPengaduan_idx" ON "pengaduan"("status", "tanggalPengaduan");

-- CreateIndex
CREATE INDEX "pengaduan_bidangId_status_idx" ON "pengaduan"("bidangId", "status");

-- CreateIndex
CREATE INDEX "pengaduan_desaId_tanggalPengaduan_idx" ON "pengaduan"("desaId", "tanggalPengaduan");

-- CreateIndex
CREATE INDEX "pengaduan_posyanduId_idx" ON "pengaduan"("posyanduId");

-- CreateIndex
CREATE INDEX "pengaduan_pelaporId_idx" ON "pengaduan"("pelaporId");

-- CreateIndex
CREATE INDEX "dokumen_pendukung_pengaduanId_jenis_idx" ON "dokumen_pendukung"("pengaduanId", "jenis");

-- CreateIndex
CREATE INDEX "tindak_lanjut_pengaduanId_tanggal_idx" ON "tindak_lanjut"("pengaduanId", "tanggal");

-- CreateIndex
CREATE INDEX "tindak_lanjut_petugasId_idx" ON "tindak_lanjut"("petugasId");

-- AddForeignKey
ALTER TABLE "desa" ADD CONSTRAINT "desa_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "kecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posyandu" ADD CONSTRAINT "posyandu_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenis_pengaduan" ADD CONSTRAINT "jenis_pengaduan_bidangId_fkey" FOREIGN KEY ("bidangId") REFERENCES "bidang_spm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_pelaporId_fkey" FOREIGN KEY ("pelaporId") REFERENCES "pelapor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_bidangId_fkey" FOREIGN KEY ("bidangId") REFERENCES "bidang_spm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_jenisPengaduanId_fkey" FOREIGN KEY ("jenisPengaduanId") REFERENCES "jenis_pengaduan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_pendukung" ADD CONSTRAINT "dokumen_pendukung_pengaduanId_fkey" FOREIGN KEY ("pengaduanId") REFERENCES "pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tindak_lanjut" ADD CONSTRAINT "tindak_lanjut_pengaduanId_fkey" FOREIGN KEY ("pengaduanId") REFERENCES "pengaduan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tindak_lanjut" ADD CONSTRAINT "tindak_lanjut_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
