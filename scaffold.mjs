import fs from 'fs';
import path from 'path';

const basePath = path.join(process.cwd(), 'app', '(dashboard)');

const routes = [
  'dashboard',
  'master-data/profil-masjid',
  'master-data/pengguna',
  'master-data/akun-keuangan',
  'master-data/sumber-dana',
  'master-data/rekening-kas',
  'master-data/kegiatan',
  'master-data/donatur',
  'perencanaan/periode-anggaran',
  'perencanaan/anggaran-kegiatan',
  'transaksi/penerimaan',
  'transaksi/pengeluaran',
  'transaksi/transfer',
  'transaksi/penyesuaian',
  'aset/daftar-aset',
  'aset/mutasi-aset',
  'laporan/bku',
  'laporan/penerimaan',
  'laporan/pengeluaran',
  'laporan/buku-besar',
  'laporan/neraca',
  'laporan/surplus-defisit',
  'laporan/sumber-dana',
  'laporan/kegiatan',
  'laporan/aset',
];

const pageTemplate = (title) => `import React from 'react';

export default function ${title.replace(/[-/\\& ]/g, '')}Page() {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">${title}</h1>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <p className="text-gray-500">Halaman ini masih dalam tahap pengembangan.</p>
        </div>
      </div>
    </div>
  );
}
`;

const layoutTemplate = `"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
`;

function createScaffold() {
  // Create layout
  fs.mkdirSync(basePath, { recursive: true });
  fs.writeFileSync(path.join(basePath, 'layout.tsx'), layoutTemplate, 'utf8');

  // Create routes
  routes.forEach(route => {
    const routePath = path.join(basePath, route);
    fs.mkdirSync(routePath, { recursive: true });
    
    // Capitalize and format title for component
    const parts = route.split('/');
    const title = parts[parts.length - 1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    fs.writeFileSync(path.join(routePath, 'page.tsx'), pageTemplate(title), 'utf8');
  });

  console.log('Scaffold complete!');
}

createScaffold();
