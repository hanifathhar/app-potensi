"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportRekapKecamatanPDF(chartData: any[]) {
  const doc = new jsPDF();

  // Kop Laporan Pemkab Tapanuli Selatan
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PEMERINTAH KABUPATEN TAPANULI SELATAN", 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("DINAS PERTANIAN, KELAUTAN DAN PETERNAKAN", 105, 22, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Portal DATA TANI TAPSEL - Rekapitulasi Usaha per Kecamatan", 105, 28, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  const tableData = chartData.map((item, index) => [
    index + 1,
    item.nama,
    item.kebun,
    item.kolam,
    item.peternakan,
    item.kebun + item.kolam + item.peternakan,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [["No", "Kecamatan", "Kebun (Pertanian)", "Kolam (Perikanan)", "Peternakan", "Total Unit"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [22, 163, 74] }, // Emerald color
    foot: [
      [
        "Total",
        "",
        chartData.reduce((acc, c) => acc + c.kebun, 0),
        chartData.reduce((acc, c) => acc + c.kolam, 0),
        chartData.reduce((acc, c) => acc + c.peternakan, 0),
        chartData.reduce((acc, c) => acc + c.kebun + c.kolam + c.peternakan, 0),
      ],
    ],
    footStyles: { fillColor: [15, 62, 48], textColor: 255 },
  });

  doc.save("Rekapitulasi_Potensi_Kecamatan_Tapsel.pdf");
}

export function exportPendanaanPDF(pendanaanList: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PEMERINTAH KABUPATEN TAPANULI SELATAN", 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("LAPORAN ALOKASI DAN REALISASI PENDANAAN / BANTUAN TANI", 105, 22, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  const tableData = pendanaanList.map((item, index) => [
    index + 1,
    item.program,
    item.nilai,
    `${item.realisasi}%`,
    item.status,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [["No", "Program Bantuan / Pendanaan", "Pagu Anggaran", "Realisasi (%)", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [2, 132, 199] }, // Blue
  });

  doc.save("Laporan_Pendanaan_Data_Tani_Tapsel.pdf");
}

export function exportJadwalPanenPDF(jadwalList: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PEMERINTAH KABUPATEN TAPANULI SELATAN", 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("JADWAL SIKLUS TANAM, TEBAR BENIH DAN ESTIMASI PANEN", 105, 22, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  const tableData = jadwalList.map((item, index) => [
    index + 1,
    item.komoditas,
    item.lokasi,
    item.kegiatan,
    item.tanggal,
    item.status,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [["No", "Komoditas", "Lokasi Desa", "Tahap Kegiatan", "Tanggal", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [234, 88, 12] }, // Amber/Orange
  });

  doc.save("Jadwal_Siklus_Panen_Tapsel.pdf");
}

export function exportPetaExcel(mapPins: any[]) {
  const data = mapPins.map((p, idx) => ({
    No: idx + 1,
    Nama_Usaha: p.nama,
    Sektor: p.jenisUsaha,
    Komoditas: p.komoditas,
    Pengelola: p.pemilik || "-",
    Desa: p.desa || "-",
    Kecamatan: p.kecamatan || "-",
    Latitude: p.lat,
    Longitude: p.lng,
    Skala: p.luas || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sebaran_Potensi");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "Peta_Sebaran_Potensi_Tapsel.xlsx");
}
