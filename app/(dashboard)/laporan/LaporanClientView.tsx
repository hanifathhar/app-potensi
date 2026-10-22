"use client";

import React from "react";
import { FileText, Download, BarChart3, MapPin, CheckCircle } from "lucide-react";
import {
  exportRekapKecamatanPDF,
  exportPendanaanPDF,
  exportJadwalPanenPDF,
  exportPetaExcel,
} from "@/lib/exportReports";

export default function LaporanClientView({ chartData }: { chartData: any[] }) {
  const dummyPendanaan = [
    { program: "Program Pertanian Maju", nilai: "Rp 2.500.000.000", realisasi: 70, status: "Dicairkan" },
    { program: "Bantuan Kolam Ikan", nilai: "Rp 1.200.000.000", realisasi: 45, status: "Verifikasi" },
    { program: "Program Peternakan", nilai: "Rp 1.800.000.000", realisasi: 60, status: "Disetujui" },
    { program: "Dana Desa", nilai: "Rp 500.000.000", realisasi: 80, status: "Realisasi" },
  ];

  const dummyJadwal = [
    { komoditas: "Jagung", lokasi: "Desa Sipange", kegiatan: "Panen", tanggal: "12 Apr 2025", status: "Berjalan" },
    { komoditas: "Kopi", lokasi: "Desa Pagarbatu", kegiatan: "Tanam", tanggal: "20 Apr 2025", status: "Terjadwal" },
    { komoditas: "Ikan Nila", lokasi: "Desa Siandang", kegiatan: "Tebar Benih", tanggal: "25 Apr 2025", status: "Terjadwal" },
    { komoditas: "Sapi", lokasi: "Desa Aek Batu", kegiatan: "Pemeriksaan", tanggal: "28 Apr 2025", status: "Berjalan" },
  ];

  const dummyMapPins = [
    { nama: "Kebun Jagung Poktan Harapan Maju", jenisUsaha: "KEBUN", komoditas: "Jagung Hibrida", pemilik: "Syamsir Siregar", desa: "Sipange", kecamatan: "Angkola Selatan", lat: 1.3421, lng: 99.2145, luas: "1,5 Ha" },
    { nama: "Kolam Ikan Nila Siandang", jenisUsaha: "KOLAM", komoditas: "Ikan Nila", pemilik: "Baharuddin Pulungan", desa: "Siandang", kecamatan: "Angkola Sangkunur", lat: 1.4820, lng: 98.9812, luas: "1.200 m²" },
    { nama: "Peternakan Sapi Lembu Barokah", jenisUsaha: "PETERNAKAN", komoditas: "Sapi Potong", pemilik: "Zulkifli Nasution", desa: "Aek Batu", kecamatan: "Sayur Matinggi", lat: 1.2850, lng: 99.4210, luas: "45 Ekor" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Laporan 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Rekapitulasi Potensi Usaha per Kecamatan
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Laporan lengkap sebaran komoditas kebun, kolam perikanan, dan peternakan di 15 kecamatan Tapsel.
          </p>
        </div>
        <button
          onClick={() => exportRekapKecamatanPDF(chartData)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
        >
          <Download size={14} /> Unduh Format PDF
        </button>
      </div>

      {/* Laporan 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Rekapitulasi Realisasi Pendanaan & Bantuan
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Laporan alokasi dana APBN, APBD Provinsi, APBD Tapsel, dan Dana Desa beserta persentase serapan.
          </p>
        </div>
        <button
          onClick={() => exportPendanaanPDF(dummyPendanaan)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
        >
          <Download size={14} /> Unduh Format PDF
        </button>
      </div>

      {/* Laporan 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <FileText size={20} />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Laporan Siklus Produksi & Jadwal Panen
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Kalender jadwal tanam, tebar benih ikan, pemeliharaan, serta estimasi volume panen komoditas.
          </p>
        </div>
        <button
          onClick={() => exportJadwalPanenPDF(dummyJadwal)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
        >
          <Download size={14} /> Unduh Format PDF
        </button>
      </div>

      {/* Laporan 4 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Download size={20} />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">
            Ekspor Data Spasial & Titik GIS (Excel)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Data tabular koordinat Latitude/Longitude, nama pemilik, luas lahan, dan kelompok tani.
          </p>
        </div>
        <button
          onClick={() => exportPetaExcel(dummyMapPins)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
        >
          <Download size={14} /> Unduh Format XLSX (Excel)
        </button>
      </div>
    </div>
  );
}
