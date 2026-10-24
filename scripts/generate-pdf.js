const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DOCS_DIR = path.resolve(__dirname, "../docs/manual-book");
const SCREENSHOTS_DIR = path.join(DOCS_DIR, "screenshots");
const OUTPUT_PDF_PATH = path.join(DOCS_DIR, "Manual_Book_SIDALIHAN_Tapanuli_Selatan.pdf");
const PUBLIC_PDF_PATH = path.resolve(__dirname, "../public/Manual_Book_SIDALIHAN_Tapanuli_Selatan.pdf");

// Helper to read image as base64 data URI
function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${data}`;
}

async function generateManualBookPDF() {
  console.log("📄 Menyiapkan aset dan konten dokumen Manual Book...");

  const logoTapsel = getBase64Image(path.resolve(__dirname, "../public/images/logo-tapsel.png"));
  const tapselBangkit = getBase64Image(path.resolve(__dirname, "../public/tapselbangkit.png"));
  const banner = getBase64Image(path.resolve(__dirname, "../public/images/banner.png"));

  const imgBeranda = getBase64Image(path.join(SCREENSHOTS_DIR, "01_beranda_publik.png"));
  const imgLogin = getBase64Image(path.join(SCREENSHOTS_DIR, "02_halaman_login.png"));
  const imgDashboardRingkasan = getBase64Image(path.join(SCREENSHOTS_DIR, "03_dashboard_ringkasan.png"));
  const imgDashboardPeta = getBase64Image(path.join(SCREENSHOTS_DIR, "04_dashboard_peta_gis.png"));
  const imgDashboardPerikanan = getBase64Image(path.join(SCREENSHOTS_DIR, "05_dashboard_perikanan.png"));
  const imgDashboardPeternakan = getBase64Image(path.join(SCREENSHOTS_DIR, "06_dashboard_peternakan.png"));
  const imgDashboardPertanian = getBase64Image(path.join(SCREENSHOTS_DIR, "07_dashboard_pertanian.png"));
  const imgMenuPertanian = getBase64Image(path.join(SCREENSHOTS_DIR, "08_menu_pertanian.png"));
  const imgMenuPerikanan = getBase64Image(path.join(SCREENSHOTS_DIR, "09_menu_perikanan.png"));
  const imgMenuPeternakan = getBase64Image(path.join(SCREENSHOTS_DIR, "10_menu_peternakan.png"));
  const imgMenuPoktan = getBase64Image(path.join(SCREENSHOTS_DIR, "11_menu_kelompok_tani.png"));
  const imgMenuPendanaan = getBase64Image(path.join(SCREENSHOTS_DIR, "12_menu_pendanaan.png"));

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Pengguna SIDALIHAN Tapanuli Selatan</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .page-break-after {
      page-break-after: always;
      break-after: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Typography */
    h1, h2, h3, h4, h5 {
      color: #064e3b;
      margin-top: 0;
      font-weight: 700;
      line-height: 1.3;
    }
    h1 {
      font-size: 20pt;
      border-bottom: 2.5px solid #10b981;
      padding-bottom: 6px;
      margin-bottom: 16px;
      margin-top: 24px;
    }
    h2 {
      font-size: 14pt;
      color: #047857;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 12pt;
      color: #0f766e;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    li {
      margin-bottom: 5px;
    }

    /* Cover Page */
    .cover-container {
      height: 100%;
      min-height: 940px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      padding: 20px 10px;
      position: relative;
    }
    .cover-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .cover-logo {
      width: 105px;
      height: auto;
      margin-bottom: 6px;
    }
    .cover-instansi {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #064e3b;
      margin: 0;
    }
    .cover-subinstansi {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .cover-divider {
      width: 140px;
      height: 3.5px;
      background: linear-gradient(90deg, #10b981, #f59e0b);
      margin: 14px auto;
      border-radius: 4px;
    }
    .cover-body {
      margin: 30px 0;
    }
    .cover-badge {
      display: inline-block;
      padding: 5px 16px;
      background: #ecfdf5;
      color: #047857;
      border: 1.5px solid #a7f3d0;
      border-radius: 30px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #064e3b;
      line-height: 1.2;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .cover-acronym {
      font-size: 32pt;
      font-weight: 950;
      color: #047857;
      letter-spacing: 3px;
      margin: 6px 0 14px 0;
    }
    .cover-subtitle {
      font-size: 12pt;
      font-weight: 500;
      color: #334155;
      max-width: 600px;
      margin: 0 auto 24px auto;
      line-height: 1.5;
    }
    .cover-banner-img {
      width: 100%;
      max-width: 640px;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
      border: 1.5px solid #d1fae5;
      margin: 0 auto;
    }
    .cover-footer {
      border-top: 1.5px solid #e2e8f0;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
    }
    .cover-footer-left {
      text-align: left;
    }
    .cover-footer-right {
      text-align: right;
    }

    /* Document Info Box */
    .info-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .info-box-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Table of Contents */
    .toc-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .toc-table td {
      padding: 7px 0;
      font-size: 10.5pt;
    }
    .toc-chapter {
      font-weight: 700;
      color: #064e3b;
    }
    .toc-sub {
      padding-left: 20px !important;
      color: #334155;
    }
    .toc-page {
      text-align: right;
      font-weight: 600;
      color: #059669;
    }
    .toc-dots {
      border-bottom: 1px dotted #cbd5e1;
      width: 100%;
      margin: 0 8px;
    }

    /* Callout & Notes */
    .callout {
      border-left: 4.5px solid #10b981;
      background: #f0fdf4;
      padding: 12px 16px;
      border-radius: 0 10px 10px 0;
      margin: 16px 0;
      font-size: 10pt;
    }
    .callout-title {
      font-weight: 700;
      color: #065f46;
      margin-bottom: 4px;
    }
    .callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .callout-warning .callout-title {
      color: #b45309;
    }
    .callout-info {
      border-left-color: #0284c7;
      background: #f0f9ff;
    }
    .callout-info .callout-title {
      color: #0369a1;
    }

    /* Image Screenshots in Manual */
    .screenshot-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      overflow: hidden;
      margin: 14px 0 18px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .screenshot-header {
      background: #f8fafc;
      padding: 6px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9pt;
      font-weight: 700;
      color: #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .screenshot-img {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 1px solid #f1f5f9;
    }
    .screenshot-caption {
      padding: 6px 14px;
      font-size: 8.5pt;
      color: #64748b;
      font-style: italic;
      background: #ffffff;
      text-align: center;
    }

    /* Tables in Manual */
    .manual-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }
    .manual-table th {
      background: #064e3b;
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #064e3b;
    }
    .manual-table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .manual-table tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Step Badge */
    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background: #059669;
      color: #ffffff;
      border-radius: 50%;
      font-size: 9pt;
      font-weight: 700;
      margin-right: 6px;
      vertical-align: middle;
    }
    
    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 700;
      margin-right: 4px;
    }
    .role-admin { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .role-pertanian { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .role-perikanan { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .role-ppl { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  </style>
</head>
<body>

  <!-- =========================================================================
       HALAMAN 1: COVER MANUAL BOOK
  ========================================================================== -->
  <div class="cover-container page-break-after">
    <div class="cover-header">
      <img src="${logoTapsel}" alt="Logo Kabupaten Tapanuli Selatan" class="cover-logo" />
      <h2 class="cover-instansi">Pemerintah Kabupaten Tapanuli Selatan</h2>
      <p class="cover-subinstansi">Dinas Pertanian • Dinas Perikanan • Bappeda Tapanuli Selatan</p>
      <div class="cover-divider"></div>
    </div>

    <div class="cover-body">
      <div class="cover-badge">Buku Panduan Pengguna Resmi (User Manual)</div>
      <h1 class="cover-title">PANDUAN PENGGUNA APLIKASI</h1>
      <div class="cover-acronym">SIDALIHAN</div>
      <p class="cover-subtitle">
        <strong>Sistem Informasi Data Agro Layanan Informasi Hasil Angkola Nusantara</strong><br>
        Platform Digital Terintegrasi Pemetaan Potensi Pertanian, Perikanan, Peternakan, Kelompok Tani, dan Pengelolaan Pendanaan Daerah
      </p>

      <img src="${banner}" alt="Banner Ketahanan Pangan Tapsel" class="cover-banner-img" />
    </div>

    <div class="cover-footer">
      <div class="cover-footer-left">
        <span>KABUPATEN TAPANULI SELATAN, SUMATERA UTARA</span><br>
        <span style="color: #059669; font-weight: 700;">Ketahanan Pangan: Maju, Mandiri, dan Sejahtera</span>
      </div>
      <div class="cover-footer-right">
        <span>Edisi: Tahun 2026 (Versi 1.0)</span><br>
        <span>Dokumentasi Standar Operasional Pengguna</span>
      </div>
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 2: KATA PENGANTAR & INFORMASI DOKUMEN
  ========================================================================== -->
  <div class="page-break-after">
    <h1>KATA PENGANTAR</h1>
    <p>
      Puji dan syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya, aplikasi <strong>SIDALIHAN (Sistem Informasi Data Agro Layanan Informasi Hasil Angkola Nusantara)</strong> Kabupaten Tapanuli Selatan dapat diimplementasikan sebagai platform terpadu pemetaan dan monitoring potensi sektor agro daerah.
    </p>
    <p>
      Buku Panduan Pengguna (<em>User Manual Book</em>) ini disusun secara khusus sebagai pedoman teknis operasional bagi seluruh pemangku kepentingan, mulai dari jajaran Administrator Pemerintah Kabupaten, Administrator Dinas Pertanian, Administrator Dinas Perikanan, Penyuluh Pertanian Lapangan (PPL), hingga masyarakat umum yang mengakses data keterbukaan informasi publik.
    </p>
    <p>
      Dengan adanya panduan komprehensif ini, diharapkan seluruh pengguna dapat mengoperasikan fitur-fitur aplikasi dengan optimal, mulai dari pemantauan dashboard eksekutif berbasis peta spasial GIS, pencatatan dan verifikasi data kelompok tani, pengelolaan potensi kebun/lahan, kolam budidaya, peternakan, hingga tata kelola penyaluran bantuan pendanaan pemerintah yang transparan dan akuntabel.
    </p>

    <div class="info-box avoid-break" style="margin-top: 25px;">
      <div class="info-box-title">📋 LEMBAR KENDALI DOKUMEN (DOCUMENT CONTROL)</div>
      <table class="manual-table" style="margin: 6px 0 0 0;">
        <tr>
          <td style="width: 25%;"><strong>Nama Aplikasi</strong></td>
          <td>SIDALIHAN (Sistem Informasi Data Agro Layanan Informasi Hasil Angkola Nusantara)</td>
        </tr>
        <tr>
          <td><strong>Versi Dokumen</strong></td>
          <td>1.0.0 (Tahun Anggaran 2026)</td>
        </tr>
        <tr>
          <td><strong>Klasifikasi Akses</strong></td>
          <td>Buku Panduan Pengguna Internal & Publik</td>
        </tr>
        <tr>
          <td><strong>Penerbit</strong></td>
          <td>Pemerintah Kabupaten Tapanuli Selatan, Provinsi Sumatera Utara</td>
        </tr>
        <tr>
          <td><strong>Cakupan Wilayah</strong></td>
          <td>15 Kecamatan & Seluruh Desa/Kelurahan se-Kabupaten Tapanuli Selatan</td>
        </tr>
        <tr>
          <td><strong>Sektor Utama</strong></td>
          <td>Pertanian (Tanaman/Kebun), Perikanan (Kolam), Peternakan, Kelompok Tani, Pendanaan</td>
        </tr>
      </table>
    </div>

    <div class="callout callout-info avoid-break">
      <div class="callout-title">💡 Petunjuk Singkat Bagi Pengguna</div>
      Simpan buku manual ini sebagai referensi utama saat melakukan input data, verifikasi lapangan, atau pelaporan berkala. Jika terdapat ketidaksesuaian data atau kendala teknis sistem, silakan menghubungi administrator dinas terkait melalui kontak bantuan di bab penutup.
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 3: DAFTAR ISI
  ========================================================================== -->
  <div class="page-break-after">
    <h1>DAFTAR ISI</h1>
    <table class="toc-table">
      <tr>
        <td class="toc-chapter">KATA PENGANTAR & LEMBAR KENDALI DOKUMEN</td>
        <td class="toc-page">2</td>
      </tr>
      <tr>
        <td class="toc-chapter">DAFTAR ISI</td>
        <td class="toc-page">3</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB I: PENDAHULUAN & GAMBARAN UMUM SISTEM</td>
        <td class="toc-page">4</td>
      </tr>
      <tr>
        <td class="toc-sub">1.1 Latar Belakang dan Tujuan SIDALIHAN</td>
        <td class="toc-page">4</td>
      </tr>
      <tr>
        <td class="toc-sub">1.2 Hak Akses dan Peran Pengguna (User Roles)</td>
        <td class="toc-page">4</td>
      </tr>
      <tr>
        <td class="toc-sub">1.3 Kebutuhan Perangkat dan Spesifikasi Teknis</td>
        <td class="toc-page">5</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB II: AKSES SISTEM & PANDUAN AUTENTIKASI</td>
        <td class="toc-page">6</td>
      </tr>
      <tr>
        <td class="toc-sub">2.1 Halaman Portal Beranda Publik (Tanpa Login)</td>
        <td class="toc-page">6</td>
      </tr>
      <tr>
        <td class="toc-sub">2.2 Prosedur Masuk Sistem (Login Petugas/Admin)</td>
        <td class="toc-page">7</td>
      </tr>
      <tr>
        <td class="toc-sub">2.3 Keamanan Sesi dan Prosedur Keluar (Logout)</td>
        <td class="toc-page">7</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB III: DASHBOARD EKSEKUTIF DAN PETA SPASIAL GIS</td>
        <td class="toc-page">8</td>
      </tr>
      <tr>
        <td class="toc-sub">3.1 Dashboard Ringkasan Utama & Indikator Kinerja Utama</td>
        <td class="toc-page">8</td>
      </tr>
      <tr>
        <td class="toc-sub">3.2 Peta GIS Sebaran Potensi & Fitur Pop-Up Perbesar Peta</td>
        <td class="toc-page">9</td>
      </tr>
      <tr>
        <td class="toc-sub">3.3 Dashboard Sektor Perikanan Budidaya</td>
        <td class="toc-page">10</td>
      </tr>
      <tr>
        <td class="toc-sub">3.4 Dashboard Sektor Peternakan Daerah</td>
        <td class="toc-page">11</td>
      </tr>
      <tr>
        <td class="toc-sub">3.5 Dashboard Sektor Pertanian Daerah</td>
        <td class="toc-page">12</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB IV: PENGELOLAAN DATA KELOMPOK TANI (POKTAN)</td>
        <td class="toc-page">13</td>
      </tr>
      <tr>
        <td class="toc-sub">4.1 Kartu KPI Kelompok Tani (Total Poktan & Poktan Baru Terdaftar)</td>
        <td class="toc-page">13</td>
      </tr>
      <tr>
        <td class="toc-sub">4.2 Pencarian, Filter Kecamatan/Desa, dan Ekspor Laporan</td>
        <td class="toc-page">14</td>
      </tr>
      <tr>
        <td class="toc-sub">4.3 Penambahan, Pengubahan, dan Penghapusan Data Poktan</td>
        <td class="toc-page">14</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB V: PENGELOLAAN DATA SEKTORAL (KEBUN, KOLAM, TERNAK)</td>
        <td class="toc-page">15</td>
      </tr>
      <tr>
        <td class="toc-sub">5.1 Modul Pertanian: Lahan Kebun & Status Usaha</td>
        <td class="toc-page">15</td>
      </tr>
      <tr>
        <td class="toc-sub">5.2 Modul Perikanan: Kolam Budidaya, Tebar Benih & Komoditas Riil</td>
        <td class="toc-page">16</td>
      </tr>
      <tr>
        <td class="toc-sub">5.3 Modul Peternakan: Populasi Ternak, Kandang & Komoditas Riil</td>
        <td class="toc-page">17</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB VI: PENGELOLAAN PENDANAAN & BANTUAN PEMERINTAH</td>
        <td class="toc-page">18</td>
      </tr>
      <tr>
        <td class="toc-sub">6.1 Kartu KPI Pendanaan per Sektor & per Tahun Anggaran</td>
        <td class="toc-page">18</td>
      </tr>
      <tr>
        <td class="toc-sub">6.2 Total Seluruh Penerima & Nilai Bantuan Berdasarkan Filter Tahun</td>
        <td class="toc-page">19</td>
      </tr>
      <tr>
        <td class="toc-sub">6.3 Pengelolaan Transaksi Pencairan Dana & Sumber Anggaran</td>
        <td class="toc-page">19</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB VII: TANYA JAWAB (FAQ) & PEMECAHAN MASALAH</td>
        <td class="toc-page">20</td>
      </tr>
      <tr>
        <td class="toc-chapter">BAB VIII: PENUTUP DAN KONTAK BANTUAN TEKNIS</td>
        <td class="toc-page">21</td>
      </tr>
    </table>
  </div>

  <!-- =========================================================================
       HALAMAN 4: BAB I - PENDAHULUAN & GAMBARAN UMUM
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB I: PENDAHULUAN & GAMBARAN UMUM</h1>

    <h2>1.1 Latar Belakang dan Tujuan SIDALIHAN</h2>
    <p>
      Kabupaten Tapanuli Selatan memiliki potensi agro yang sangat melimpah, mencakup perkebunan rakyat (kopi arabika Sipirok, kelapa sawit, karet, kakao), perikanan budidaya air tawar (ikan mas, nila, lele, tawes), serta aneka peternakan (ayam, sapi, kambing). Untuk mendukung visi <strong>"Ketahanan Pangan: Mewujudkan Tapsel yang Maju, Mandiri, dan Sejahtera"</strong>, Pemerintah Kabupaten Tapanuli Selatan meluncurkan platform <strong>SIDALIHAN</strong>.
    </p>
    <p>
      SIDALIHAN berfungsi sebagai basis data tunggal (<em>single source of truth</em>) yang memadukan data numerik dan spasial (geografis) untuk:
    </p>
    <ul>
      <li><strong>Inventarisasi Akurat</strong>: Mendata lokasi fisik, luas, populasi, dan status operasional kebun, kolam, dan kandang peternakan di 15 kecamatan.</li>
      <li><strong>Transparansi Bantuan</strong>: Memantau penyaluran dan realisasi bantuan dana pemerintah agar tepat sasaran kepada kelompok tani dan pembudidaya.</li>
      <li><strong>Pengambilan Kebijakan Cepat</strong>: Menyajikan dashboard eksekutif interaktif untuk pimpinan daerah dan kepala dinas terkait.</li>
    </ul>

    <h2>1.2 Hak Akses dan Peran Pengguna (User Roles)</h2>
    <p>
      Sistem menerapkan manajemen hak akses berbasis peran (<em>Role-Based Access Control / RBAC</em>) dengan pembagian kewenangan sebagai berikut:
    </p>

    <table class="manual-table avoid-break">
      <thead>
        <tr>
          <th style="width: 25%;">Peran (Role)</th>
          <th style="width: 35%;">Kewenangan Utama</th>
          <th>Cakupan Wilayah / Sektor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="role-badge role-admin">ADMIN_KABUPATEN</span><br><strong>Superadmin</strong></td>
          <td>Akses penuh ke seluruh menu, konfigurasi master data wilayah/komoditas, manajemen pengguna, approval, dan seluruh rekap laporan.</td>
          <td>Seluruh Kabupaten (15 Kecamatan & 248 Desa/Kelurahan)</td>
        </tr>
        <tr>
          <td><span class="role-badge role-pertanian">ADMIN_PERTANIAN</span><br><strong>Dinas Pertanian</strong></td>
          <td>Pengelolaan master data kebun, komoditas tanaman pangan/perkebunan, kelompok tani, dan penyaluran dana pertanian.</td>
          <td>Sektor Pertanian & Kelompok Tani se-Kabupaten</td>
        </tr>
        <tr>
          <td><span class="role-badge role-perikanan">ADMIN_PERIKANAN</span><br><strong>Dinas Perikanan</strong></td>
          <td>Pengelolaan data kolam budidaya, kapasitas benih, kelompok pembudidaya ikan (Pokdakan), dan bantuan dana perikanan.</td>
          <td>Sektor Perikanan Kolam se-Kabupaten</td>
        </tr>
        <tr>
          <td><span class="role-badge role-ppl">PPL_PERTANIAN / PERIKANAN</span><br><strong>Penyuluh Lapangan</strong></td>
          <td>Pencatatan data lapangan, upload foto dokumentasi usaha, penentuan titik GPS, monitoring siklus panen.</td>
          <td>Sesuai Wilayah Kerja Binaan (Kecamatan / Desa binaan)</td>
        </tr>
        <tr>
          <td><span class="role-badge" style="background: #f1f5f9; color: #475569;">PUBLIK / MASYARAKAT</span></td>
          <td>Melihat dashboard ringkasan eksekutif publik, statistik terbuka, profil umum komoditas, dan peta sebaran potensi umum.</td>
          <td>Akses Publik (Read-Only) tanpa autentikasi login</td>
        </tr>
      </tbody>
    </table>

    <h2>1.3 Kebutuhan Perangkat dan Spesifikasi Teknis</h2>
    <p>
      Aplikasi SIDALIHAN berbasis web modern (Next.js & Tailwind CSS) yang ringan dan responsif, dapat diakses melalui:
    </p>
    <ul>
      <li><strong>Komputer / Laptop</strong>: Browser modern versi terbaru (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari). Resolusi layar yang disarankan minimal 1366 x 768 piksel.</li>
      <li><strong>Smartphone / Tablet</strong>: Perangkat Android atau iOS dengan browser bawaan untuk kemudahan petugas PPL saat verifikasi titik GPS di lapangan.</li>
      <li><strong>Koneksi Internet</strong>: Kecepatan minimal 512 Kbps untuk akses data tabel, dan 2 Mbps untuk pemuatan peta GIS spasial dan foto beresolusi tinggi.</li>
    </ul>
  </div>

  <!-- =========================================================================
       HALAMAN 5: BAB II - AKSES SISTEM & PANDUAN AUTENTIKASI
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB II: AKSES SISTEM & PANDUAN AUTENTIKASI</h1>

    <h2>2.1 Halaman Portal Beranda Publik (Tanpa Login)</h2>
    <p>
      Masyarakat umum dan mitra pembangunan dapat mengakses portal utama SIDALIHAN langsung melalui alamat web peramban tanpa perlu masuk log.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 2.1: Tampilan Halaman Portal Beranda Utama SIDALIHAN</span>
        <span>Akses: http://localhost:3000/</span>
      </div>
      <img src="${imgBeranda}" alt="Beranda Publik SIDALIHAN" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 2.1: Header navigasi resmi dengan Logo Tapsel & Tapsel Bangkit, Banner Ketahanan Pangan, pencarian cepat, kartu metrik, dan tautan jelajah data.</div>
    </div>

    <p><strong>Fitur-fitur Halaman Beranda:</strong></p>
    <ul>
      <li><strong>Identitas Resmi Pemkab</strong>: Logo Kabupaten Tapanuli Selatan, gambar resmi Tapsel Bangkit, dan banner program Ketahanan Pangan.</li>
      <li><strong>Navigasi Menu Utama</strong>: Pencarian potensi daerah, tombol cepat menuju Dashboard GIS, dan tombol <em>Login Petugas</em>.</li>
      <li><strong>Kartu Ringkasan Publik</strong>: Menampilkan total potensi usaha terdata, total kelompok tani aktif, cakupan kecamatan (100%), dan total realisasi bantuan tahun berjalan.</li>
    </ul>

    <h2>2.2 Prosedur Masuk Sistem (Login Petugas/Admin)</h2>
    <p>
      Untuk mengakses fitur administrasi, input data, dan approval, petugas wajib melakukan autentikasi:
    </p>
    <ol>
      <li>Klik tombol <strong>"Login"</strong> pada sudut kanan atas bilah navigasi beranda.</li>
      <li>Sistem akan menampilkan jendela masuk akun yang aman.</li>
      <li>Masukkan <strong>Nama Pengguna (Username)</strong> dan <strong>Kata Sandi (Password)</strong> resmi yang telah diberikan oleh Administrator Kabupaten.</li>
      <li>Klik tombol <strong>"Masuk ke Sistem"</strong>. Setelah verifikasi berhasil, sistem otomatis mengarahkan ke Dashboard Utama.</li>
    </ol>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 2.2: Tampilan Halaman Autentikasi Masuk (Login)</span>
        <span>URL: /login</span>
      </div>
      <img src="${imgLogin}" alt="Halaman Login SIDALIHAN" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 2.2: Antarmuka login terenkripsi dengan proteksi sesi JWT dan validasi peran pengguna.</div>
    </div>

    <div class="callout callout-warning avoid-break">
      <div class="callout-title">⚠️ Peringatan Keamanan Akun</div>
      Jangan pernah membagikan nama pengguna dan kata sandi kepada pihak lain. Jika Anda menggunakan komputer bersama di kantor kecamatan/balai penyuluhan, pastikan untuk selalu menekan tombol <strong>Logout</strong> setelah selesai bertugas.
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 6: BAB III - DASHBOARD EKSEKUTIF DAN PETA SPASIAL GIS
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB III: DASHBOARD EKSEKUTIF & PETA GIS</h1>

    <h2>3.1 Dashboard Ringkasan Utama & Indikator Kinerja</h2>
    <p>
      Dashboard utama menyajikan kompilasi data strategis secara <em>real-time</em> untuk memberikan wawasan menyeluruh kepada para pengambil keputusan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 3.1: Dashboard Ringkasan Eksekutif & Tab Sektoral</span>
        <span>URL: /dashboard</span>
      </div>
      <img src="${imgDashboardRingkasan}" alt="Dashboard Ringkasan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 3.1: Ringkasan metrik usaha, grafik statistik per kecamatan, dan diagram komposisi sektor.</div>
    </div>

    <p><strong>Komponen Utama Dashboard Ringkasan:</strong></p>
    <ul>
      <li><strong>Tab Navigasi Sektoral</strong>: Berpindah cepat antara tab <em>Ringkasan</em>, <em>Pertanian</em>, <em>Perikanan</em>, dan <em>Peternakan</em>.</li>
      <li><strong>Kartu Metrik KPI Eksekutif</strong>: Memuat Total Kebun Tani, Total Kolam Ikan, Total Peternakan, Total Kelompok Tani, dan Total Penyaluran Dana pada tahun berjalan.</li>
      <li><strong>Grafik Statistik per Kecamatan</strong>: Diagram batang vertikal yang memvisualisasikan jumlah unit usaha per kecamatan dengan filter dinamis (Kebun, Kolam, Ternak).</li>
      <li><strong>Diagram Donut Komposisi</strong>: Menampilkan rasio persentase keterwakilan masing-masing sektor secara komprehensif.</li>
    </ul>

    <h2>3.2 Peta GIS Sebaran Potensi & Fitur Pop-Up Perbesar Peta</h2>
    <p>
      Salah satu fitur unggulan SIDALIHAN adalah <strong>Peta GIS Interaktif</strong> yang memetakan koordinat presisi titik-titik usaha tani di seluruh wilayah Tapanuli Selatan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 3.2: Peta GIS Sebaran Potensi & Tombol Perbesar Peta</span>
        <span>Bagian Spasial Dashboard</span>
      </div>
      <img src="${imgDashboardPeta}" alt="Peta GIS Sebaran" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 3.2: Peta digital berbasis Leaflet dengan marker multi-warna sektoral dan tombol kontrol "Perbesar Peta".</div>
    </div>

    <div class="callout callout-info avoid-break">
      <div class="callout-title">🗺️ Fitur Baru: Pop-Up Modal Perbesar Peta (Fullscreen Map)</div>
      <p>Untuk memudahkan analisis spasial yang lebih detail dan luas:</p>
      <ol>
        <li>Klik tombol <strong>"Perbesar Peta"</strong> yang terletak pada bilah filter peta (bersebelahan dengan tombol <em>Fokus Tapsel</em>).</li>
        <li>Sistem akan membuka jendela pop-up peta berukuran layar penuh (<em>Fullscreen Modal</em>) beresolusi tinggi.</li>
        <li>Pada pop-up peta besar, fitur <em>Scroll Wheel Zoom</em> aktif, dropdown filter kecamatan/desa tetap berfungsi, dan seluruh pin dapat diklik untuk melihat foto maupun detail usaha.</li>
        <li>Untuk menutup pop-up, klik tombol <strong>"Tutup"</strong> atau tekan tombol <strong>Escape (Esc)</strong> pada keyboard.</li>
      </ol>
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 7: BAB III (LANJUTAN) - DASHBOARD PERIKANAN & PETERNAKAN
  ========================================================================== -->
  <div class="page-break-after">
    <h2>3.3 Dashboard Sektor Perikanan Budidaya</h2>
    <p>
      Tab Dashboard Perikanan dirancang khusus untuk memantau kapasitas budidaya perikanan air tawar di Tapanuli Selatan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 3.3: Dashboard Sektor Perikanan Budidaya Kolam</span>
        <span>Tab: Perikanan</span>
      </div>
      <img src="${imgDashboardPerikanan}" alt="Dashboard Perikanan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 3.3: Metrik jumlah kolam, luas area (Ha), kapasitas tebar benih, jumlah komoditas riil data (4 jenis), dan sebaran kecamatan.</div>
    </div>

    <p><strong>Informasi Utama Dashboard Perikanan:</strong></p>
    <ul>
      <li><strong>Jumlah Komoditas Riil</strong>: Menampilkan jumlah jenis komoditas ikan yang <em>benar-benar terdata pada kolam terdaftar</em> (contoh: Ikan Mas, Nila, Lele, Tawes), bukan sekadar seluruh daftar tabel master.</li>
      <li><strong>Total Kapasitas Tebar Benih</strong>: Akumulasi daya tampung bibit ikan dalam satuan ekor.</li>
      <li><strong>Rekapitulasi per Kecamatan</strong>: Tabel peringkat kecamatan berdasarkan luas kolam dan komoditas dominan.</li>
      <li><strong>Diagram Donut & Bar Komoditas Unggulan</strong>: Persentase kontribusi masing-masing jenis ikan terhadap total produksi.</li>
    </ul>

    <h2>3.4 Dashboard Sektor Peternakan Daerah</h2>
    <p>
      Tab Dashboard Peternakan memberikan gambaran lengkap tentang populasi hewan ternak besar, kecil, dan unggas di seluruh wilayah binaan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 3.4: Dashboard Sektor Peternakan Daerah</span>
        <span>Tab: Peternakan</span>
      </div>
      <img src="${imgDashboardPeternakan}" alt="Dashboard Peternakan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 3.4: Statistik total unit peternakan, populasi ternak (ekor), jumlah kandang, dan komoditas ternak riil data.</div>
    </div>

    <p><strong>Informasi Utama Dashboard Peternakan:</strong></p>
    <ul>
      <li><strong>Jumlah Komoditas Ternak Riil</strong>: Menghitung secara otomatis jenis ternak yang aktif terdata di lapangan (seperti Ayam Broiler/Layer, Sapi, Kambing).</li>
      <li><strong>Populasi Ternak per Jenis</strong>: Diagram batang horizontal perbandingan jumlah populasi ekor ternak antar jenis hewan.</li>
      <li><strong>Peta Persebaran Titik Peternakan</strong>: Menampilkan sebaran kandang peternakan dengan indikator warna khusus oranye.</li>
    </ul>
  </div>

  <!-- =========================================================================
       HALAMAN 8: BAB III (LANJUTAN) - DASHBOARD PERTANIAN
  ========================================================================== -->
  <div class="page-break-after">
    <h2>3.5 Dashboard Sektor Pertanian Daerah</h2>
    <p>
      Tab Dashboard Pertanian mengintegrasikan seluruh data lahan pertanian pangan dan tanaman perkebunan yang menjadi tulang punggung perekonomian Tapsel.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 3.5: Dashboard Sektor Pertanian & Perkebunan</span>
        <span>Tab: Pertanian</span>
      </div>
      <img src="${imgDashboardPertanian}" alt="Dashboard Pertanian" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 3.5: Metrik total unit kebun, total luas lahan (Ha), komoditas tanaman aktif, dan rekapitulasi luas per kecamatan.</div>
    </div>

    <p><strong>Fitur Analisis Dashboard Pertanian:</strong></p>
    <ul>
      <li><strong>Total Luas Area Kebun (Ha)</strong>: Luas kumulatif lahan yang terverifikasi dalam sistem.</li>
      <li><strong>Rincian Komposisi Komoditas</strong>: Diagram persentase luas lahan untuk komoditas unggulan seperti Kopi Arabika, Padi Sawah, Jagung, dan Kelapa Sawit.</li>
      <li><strong>Pemantauan Jadwal Tanam & Panen</strong>: Tabel perkiraan waktu panen raya untuk mengantisipasi kestabilan harga dan stok pangan daerah.</li>
    </ul>

    <div class="callout callout-info avoid-break">
      <div class="callout-title">💡 Integrasi Pendanaan di Dashboard Sektoral</div>
      Pada setiap tab sektor (Pertanian, Perikanan, Peternakan), terdapat kartu metrik <strong>Realisasi Pendanaan Terkini</strong> lengkap dengan filter dropdown tahun anggaran. Pengguna dapat memilih tahun anggaran untuk melihat rincian alokasi bantuan dan daftar kelompok penerima dana pada tahun tersebut.
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 9: BAB IV - PENGELOLAAN DATA KELOMPOK TANI (POKTAN)
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB IV: PENGELOLAAN KELOMPOK TANI</h1>

    <h2>4.1 Kartu KPI Kelompok Tani (Total & Poktan Baru)</h2>
    <p>
      Menu <strong>Kelompok Tani</strong> (diakses melalui sidebar navigasi <code>/kelompok-tani</code>) menyajikan basis data seluruh kelembagaan tani resmi di Kabupaten Tapanuli Selatan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 4.1: Antarmuka Modul Kelompok Tani dengan KPI Informatif</span>
        <span>URL: /kelompok-tani</span>
      </div>
      <img src="${imgMenuPoktan}" alt="Menu Kelompok Tani" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 4.1: Kartu KPI Total Kelompok Tani, Poktan Baru Berdasarkan Tanggal Input, filter wilayah, dan tabel manajemen data.</div>
    </div>

    <p><strong>Kartu KPI Ringkasan Kelompok Tani:</strong></p>
    <ul>
      <li><strong>Total Kelompok Tani</strong>: Akumulasi seluruh kelompok tani terdaftar di sistem (menampilkan jumlah kelompok dan total anggota terdata).</li>
      <li><strong>Poktan Baru Ditambahkan (Berdasarkan Tgl Input)</strong>: Menghitung secara otomatis kelompok tani yang baru didaftarkan dalam kurun waktu 30 hari terakhir berdasarkan riwayat waktu input sistem (<em>createdAt</em>).</li>
    </ul>

    <h2>4.2 Pencarian, Filter Wilayah & Ekspor Laporan</h2>
    <p>
      Pengguna dapat memfilter data kelompok tani berdasarkan <strong>Kecamatan</strong> dan <strong>Desa/Kelurahan</strong>, atau menggunakan kotak pencarian nama kelompok, ketua, maupun nomor registrasi SIMLUHTAN.
    </p>
    <p>
      Sistem menyediakan tombol <strong>"Ekspor PDF"</strong> dan <strong>"Ekspor Excel"</strong> untuk mengunduh rekapitulasi data kelompok tani secara instan siap cetak.
    </p>

    <h2>4.3 Formulir Penambahan & Pengubahan Data Poktan</h2>
    <ol>
      <li>Klik tombol hijau <strong>"+ Tambah Poktan"</strong> pada sudut kanan atas tabel.</li>
      <li>Isi formulir pendaftaran:
        <ul>
          <li><strong>Nama Kelompok Tani</strong> (contoh: Poktan Maju Bersama).</li>
          <li><strong>Nama Ketua Kelompok & Nomor Kontak/HP</strong>.</li>
          <li><strong>Wilayah Administratif</strong> (Pilih Kecamatan dan Desa).</li>
          <li><strong>Tahun Berdiri & Jumlah Anggota</strong>.</li>
          <li><strong>Nomor Registrasi SIMLUHTAN / Kemenkumham</strong> (jika ada).</li>
        </ul>
      </li>
      <li>Klik tombol <strong>"Simpan Data"</strong>. Data baru akan otomatis masuk ke tabel dan menambah counter KPI Poktan Baru.</li>
    </ol>
  </div>

  <!-- =========================================================================
       HALAMAN 10: BAB V - PENGELOLAAN DATA SEKTORAL (PERTANIAN)
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB V: PENGELOLAAN DATA SEKTORAL</h1>

    <h2>5.1 Modul Pertanian: Lahan Kebun & Status Usaha</h2>
    <p>
      Modul Pertanian (<code>/pertanian</code>) digunakan untuk mendata seluruh persil lahan kebun tanaman pangan, hortikultura, dan perkebunan.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 5.1: Antarmuka Modul Pertanian dengan Kartu Status Usaha</span>
        <span>URL: /pertanian</span>
      </div>
      <img src="${imgMenuPertanian}" alt="Modul Pertanian" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 5.1: Kartu KPI Total Kebun/Lahan, Luas Lahan (Ha), Jumlah Komoditas Terinput, dan Status Usaha (Aktif/Istirahat/Gagal Panen/Non Aktif).</div>
    </div>

    <p><strong>Kartu KPI Informatif Modul Pertanian:</strong></p>
    <ul>
      <li><strong>Total Kebun / Lahan</strong>: Jumlah keseluruhan unit kebun terdaftar beserta total luas hektare (Ha).</li>
      <li><strong>Komoditas Diinput</strong>: Jumlah varietas tanaman yang tercatat dalam data riil kebun.</li>
      <li><strong>Status Lahan / Usaha</strong>:
        <ul>
          <li><strong style="color: #16a34a;">Aktif</strong>: Lahan produktif yang sedang dalam masa tanam, pemeliharaan, atau panen.</li>
          <li><strong style="color: #0284c7;">Istirahat</strong>: Lahan bera / istirahat sementara pasca panen.</li>
          <li><strong style="color: #ea580c;">Gagal Panen</strong>: Lahan terdampak bencana hama, kekeringan, atau banjir.</li>
          <li><strong style="color: #64748b;">Non Aktif</strong>: Lahan yang dialihfungsikan atau belum dikelola kembali.</li>
        </ul>
      </li>
    </ul>

    <p><strong>Tata Cara Input Lahan Kebun:</strong></p>
    <ol>
      <li>Klik <strong>"+ Tambah Kebun"</strong>. Pilih Kelompok Tani naungan (atau isi pemilik perorangan).</li>
      <li>Pilih jenis komoditas utama (Kopi, Padi, Jagung, dll.) dan luas lahan dalam meter persegi (m²).</li>
      <li>Tentukan titik koordinat (Latitude & Longitude) melalui tombol penunjuk peta atau input manual GPS.</li>
      <li>Pilih <strong>Status Usaha</strong> (Aktif / Istirahat / Gagal Panen / Non Aktif).</li>
      <li>Unggah <strong>Foto Dokumentasi Kebun</strong> untuk melengkapi profil fisik lahan, lalu klik <strong>Simpan</strong>.</li>
    </ol>
  </div>

  <!-- =========================================================================
       HALAMAN 11: BAB V (LANJUTAN) - MODUL PERIKANAN & PETERNAKAN
  ========================================================================== -->
  <div class="page-break-after">
    <h2>5.2 Modul Perikanan: Kolam Budidaya & Tebar Benih</h2>
    <p>
      Modul Perikanan (<code>/perikanan</code>) difokuskan pada tata kelola kolam budidaya air tawar (kolam tanah, kolam terpal, maupun bioflok).
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 5.2: Antarmuka Modul Perikanan Budidaya Kolam</span>
        <span>URL: /perikanan</span>
      </div>
      <img src="${imgMenuPerikanan}" alt="Modul Perikanan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 5.2: KPI Total Usaha, Luas & Petak Kolam, Komoditas Ikan Terdata, dan Status Operasional Kolam.</div>
    </div>

    <p><strong>Field Khusus Modul Perikanan:</strong></p>
    <ul>
      <li><strong>Jumlah Petak Kolam</strong>: Jumlah kolam fisik dalam satu hamparan usaha.</li>
      <li><strong>Kapasitas Tebar Benih (Ekor)</strong>: Jumlah maksimal benih yang ditebar per siklus budidaya.</li>
      <li><strong>Sumber Air</strong>: Irigasi primer, mata air pegunungan, atau aliran sungai.</li>
      <li><strong>Status Usaha Kolam</strong>: Aktif produksi, kolam istirahat pengeringan, gagal panen, atau non-aktif.</li>
    </ul>

    <h2>5.3 Modul Peternakan: Populasi Ternak & Kandang</h2>
    <p>
      Modul Peternakan (<code>/peternakan</code>) mencatat kepemilikan hewan ternak, populasi ekor, dan kondisi kandang peternak.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 5.3: Antarmuka Modul Peternakan Daerah</span>
        <span>URL: /peternakan</span>
      </div>
      <img src="${imgMenuPeternakan}" alt="Modul Peternakan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 5.3: KPI Total Peternakan, Populasi Ekor Ternak, Jumlah Kandang, Komoditas Ternak, dan Status Kandang.</div>
    </div>

    <p><strong>Field Khusus Modul Peternakan:</strong></p>
    <ul>
      <li><strong>Jumlah Ternak (Ekor)</strong>: Populasi hidup saat pendataan terakhir.</li>
      <li><strong>Jumlah Kandang</strong>: Unit bangunan kandang terkelola.</li>
      <li><strong>Jenis Komoditas Ternak</strong>: Ayam Pedaging/Petelur, Sapi Potong/Perah, Kambing/Domba, Bebek.</li>
      <li><strong>Estimasi Produksi</strong>: Produksi telur harian (butir) atau bobot daging siap panen.</li>
    </ul>
  </div>

  <!-- =========================================================================
       HALAMAN 12: BAB VI - PENGELOLAAN PENDANAAN & BANTUAN PEMERINTAH
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB VI: PENGELOLAAN PENDANAAN & BANTUAN</h1>

    <h2>6.1 KPI Pendanaan per Sektor & per Tahun Anggaran</h2>
    <p>
      Menu <strong>Pendanaan</strong> (<code>/pendanaan</code>) merupakan pusat monitoring akuntabilitas penyaluran bantuan sarana dan prasarana dari pemerintah ke para petani, peternak, dan pembudidaya.
    </p>

    <div class="screenshot-card avoid-break">
      <div class="screenshot-header">
        <span>Gambar 6.1: Antarmuka Modul Pendanaan dengan KPI Sektoral Terfilter</span>
        <span>URL: /pendanaan</span>
      </div>
      <img src="${imgMenuPendanaan}" alt="Modul Pendanaan" class="screenshot-img" />
      <div class="screenshot-caption">Gambar 6.1: Filter tahun anggaran, KPI jumlah penerima & nilai uang per sektor usaha, serta total akumulasi seluruh penerima.</div>
    </div>

    <p><strong>Struktur Kartu KPI Pendanaan Terfilter (Sesuai Tahun Anggaran Dipilih):</strong></p>
    <ul>
      <li><strong>Kartu Sektor Pertanian</strong>: Menampilkan jumlah kelompok penerima bantuan pertanian dan total nilai rupiah yang dicairkan pada tahun anggaran terpilih.</li>
      <li><strong>Kartu Sektor Perikanan</strong>: Menampilkan jumlah penerima bantuan perikanan kolam dan total nominal rupiah bantuan pada tahun anggaran terpilih.</li>
      <li><strong>Kartu Sektor Peternakan</strong>: Menampilkan jumlah penerima bantuan peternakan dan total nominal rupiah bantuan pada tahun anggaran terpilih.</li>
      <li><strong>Kartu Total Seluruh Bantuan</strong>: Menghitung secara otomatis <strong>Total Seluruh Penerima Bantuan</strong> dan <strong>Total Nilai Uang Bantuan Seluruh Sektor</strong> sesuai filter tahun anggaran aktif.</li>
    </ul>

    <h2>6.2 Tata Cara Filter dan Analisis Pendanaan</h2>
    <ol>
      <li>Pada bilah alat (toolbar) di atas kartu KPI, temukan dropdown <strong>"Tahun Anggaran"</strong>.</li>
      <li>Pilih tahun anggaran yang ingin dianalisis (misal: <code>Tahun 2026</code>, <code>Tahun 2025</code>, dll.).</li>
      <li>Seluruh kartu KPI (jumlah penerima dan nilai uang) beserta tabel transaksi di bawahnya akan seketika disaring hanya menampilkan realisasi pada tahun tersebut.</li>
    </ol>

    <h2>6.3 Pencatatan Bantuan Dana Baru</h2>
    <ol>
      <li>Klik tombol <strong>"+ Tambah Pendanaan"</strong>.</li>
      <li>Tentukan sektor usaha (Kebun Tani / Kolam Ikan / Peternakan) dan cari unit penerima.</li>
      <li>Masukkan nama program bantuan, sumber dana (APBD Kab / APBN / DAK / CSR), tahun anggaran, dan nilai dana dicairkan (Rp).</li>
      <li>Simpan data. Sistem otomatis mengkalkulasi ulang rekapitulasi dana dan grafik serapan anggaran daerah.</li>
    </ol>
  </div>

  <!-- =========================================================================
       HALAMAN 13: BAB VII - TANYA JAWAB (FAQ) & PEMECAHAN MASALAH
  ========================================================================== -->
  <div class="page-break-after">
    <h1>BAB VII: TANYA JAWAB (FAQ) & TROUBLESHOOTING</h1>

    <div class="avoid-break" style="margin-bottom: 18px;">
      <h3 style="color: #064e3b; margin-bottom: 4px;">Q1: Mengapa angka Jumlah Komoditas di card Dashboard berbeda dengan total master komoditas?</h3>
      <p>
        <strong>Jawaban:</strong> Sesuai pembaruan sistem terkini, kartu <strong>Jumlah Komoditas</strong> di Dashboard Perikanan dan Peternakan menampilkan <em>jumlah komoditas yang benar-benar aktif ada pada data lapangan saja</em> (bukan total komoditas di tabel master). Hal ini bertujuan agar data statistik menyajikan kondisi riil di lapangan secara jujur dan akurat.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 18px;">
      <h3 style="color: #064e3b; margin-bottom: 4px;">Q2: Bagaimana cara membuka peta sebaran dalam tampilan yang lebih besar?</h3>
      <p>
        <strong>Jawaban:</strong> Pada halaman Dashboard Utama di bagian Peta GIS, klik tombol <strong>"Perbesar Peta"</strong> di sebelah tombol <em>Fokus Tapsel</em>. Sistem akan menampilkan jendela pop-up interaktif berukuran penuh layar (<em>fullscreen</em>). Anda dapat menutup pop-up tersebut kapan saja dengan menekan tombol <strong>Esc (Escape)</strong> pada keyboard.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 18px;">
      <h3 style="color: #064e3b; margin-bottom: 4px;">Q3: Bagaimana jika titik koordinat kebun/kolam di peta muncul di luar Tapanuli Selatan?</h3>
      <p>
        <strong>Jawaban:</strong> Sistem SIDALIHAN telah dilengkapi filter batas spasial Kabupaten Tapanuli Selatan (koordinat lat 0.8 s.d 2.2, lng 98.6 s.d 99.8). Jika titik Anda tidak muncul, periksa kembali penulisan latitude dan longitude pada form data, pastikan tidak tertukar antara lintang dan bujur.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 18px;">
      <h3 style="color: #064e3b; margin-bottom: 4px;">Q4: Apakah PPL dapat mengubah data milik kelompok tani di kecamatan lain?</h3>
      <p>
        <strong>Jawaban:</strong> Tidak. Sistem membatasi hak akses akun PPL hanya untuk melihat dan memperbarui data di wilayah kecamatan/desa binaan yang terdaftar pada profil akunnya demi menjaga integritas data antar wilayah.
      </p>
    </div>

    <div class="callout callout-warning avoid-break">
      <div class="callout-title">🔧 Troubleshooting: Gambar / Foto Tidak Muncul di Browser</div>
      <p>Jika foto atau gambar tampak tidak termuat (icon gambar pecah):</p>
      <ul>
        <li>Lakukan <em>Hard Refresh</em> peramban dengan menekan kombinasi tombol <strong>Ctrl + F5</strong> (Windows) atau <strong>Cmd + Shift + R</strong> (Mac).</li>
        <li>Pastikan format file foto yang diunggah adalah <code>.jpg</code>, <code>.jpeg</code>, atau <code>.png</code> dengan ukuran file maksimal 5 MB per foto.</li>
      </ul>
    </div>
  </div>

  <!-- =========================================================================
       HALAMAN 14: BAB VIII - PENUTUP & KONTAK DUKUNGAN TEKNIS
  ========================================================================== -->
  <div>
    <h1>BAB VIII: PENUTUP & LAYANAN BANTUAN</h1>
    <p>
      Buku Panduan Pengguna ini disusun sebagai wujud komitmen Pemerintah Kabupaten Tapanuli Selatan dalam mewujudkan tata kelola data pertanian dan pangan terpadu yang transparan, modern, dan berdaya guna tinggi. Diharapkan aplikasi <strong>SIDALIHAN</strong> senantiasa menjadi instrumen andalan dalam mengawal ketahanan pangan dan kesejahteraan para petani di Bumi Angkola.
    </p>

    <div class="info-box avoid-break" style="margin-top: 24px;">
      <div class="info-box-title" style="font-size: 11pt; color: #064e3b;">
        📞 LAYANAN BANTUAN & DUKUNGAN TEKNIS (HELP DESK)
      </div>
      <p style="margin-bottom: 12px; font-size: 9.5pt;">
        Jika Anda memerlukan bantuan teknis, reset kata sandi, pendampingan input data, atau konsultasi pemanfaatan sistem, silakan menghubungi:
      </p>
      <table class="manual-table" style="font-size: 9pt; margin-top: 4px;">
        <tr>
          <td style="width: 30%;"><strong>Pusat Layanan</strong></td>
          <td>Dinas Komunikasi dan Informatika / Bappeda Kabupaten Tapanuli Selatan</td>
        </tr>
        <tr>
          <td><strong>Alamat Kantor</strong></td>
          <td>Kompleks Perkantoran Pemerintah Kabupaten Tapanuli Selatan, Jl. Prof. Lafran Pane, Sipirok</td>
        </tr>
        <tr>
          <td><strong>Dinas Pertanian</strong></td>
          <td>Jl. Merdeka No. 12, Sipirok, Tapanuli Selatan • Email: <em>pertanian@tapselkab.go.id</em></td>
        </tr>
        <tr>
          <td><strong>Dinas Perikanan</strong></td>
          <td>Jl. Lintas Padangsidimpuan - Sipirok • Email: <em>perikanan@tapselkab.go.id</em></td>
        </tr>
        <tr>
          <td><strong>Waktu Layanan</strong></td>
          <td>Senin – Jumat, Pukul 08.00 – 16.30 WIB</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 40px; text-align: center;" class="avoid-break">
      <p style="font-weight: 700; color: #064e3b; margin-bottom: 2px;">
        PEMERINTAH KABUPATEN TAPANULI SELATAN
      </p>
      <p style="font-size: 10pt; color: #64748b; margin: 0;">
        "Wujudkan Ketahanan Pangan: Tapsel yang Maju, Mandiri, dan Sejahtera"
      </p>
      <div style="width: 80px; height: 2px; background: #10b981; margin: 10px auto;"></div>
      <p style="font-size: 8.5pt; color: #94a3b8;">
        © 2026 SIDALIHAN Tapanuli Selatan. Hak Cipta Dilindungi Undang-Undang.
      </p>
    </div>
  </div>

</body>
</html>
`;

  console.log("🌐 Meluncurkan browser Puppeteer untuk merender PDF...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  console.log("🖨️ Mencetak halaman ke PDF A4...");
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 8pt; color: #64748b; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between; font-family: sans-serif; border-bottom: 0.5px solid #e2e8f0; padding-bottom: 4px;">
        <span>BUKU PANDUAN PENGGUNA - SIDALIHAN TAPSEL</span>
        <span>PEMKAB TAPANULI SELATAN</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 8pt; color: #64748b; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between; font-family: sans-serif; border-top: 0.5px solid #e2e8f0; padding-top: 4px;">
        <span>Sistem Informasi Data Agro Tapanuli Selatan</span>
        <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "18mm",
      right: "18mm",
    },
  });

  fs.writeFileSync(OUTPUT_PDF_PATH, pdfBuffer);
  fs.writeFileSync(PUBLIC_PDF_PATH, pdfBuffer);
  await browser.close();

  console.log("✅ PDF Manual Book berhasil dibuat di:");
  console.log("   1. " + OUTPUT_PDF_PATH);
  console.log("   2. " + PUBLIC_PDF_PATH + " (Dapat diakses di http://localhost:3000/Manual_Book_SIDALIHAN_Tapanuli_Selatan.pdf)");
}

generateManualBookPDF().catch((err) => {
  console.error("❌ Error generating PDF:", err);
  process.exit(1);
});
