"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Sprout,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Building,
  Key,
  MapPin,
  Trees,
  Fish,
} from "lucide-react";

interface KomoditasItem {
  id: string;
  kd_komoditas: string;
  nm_komoditas: string;
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  satuanDefault?: string;
  urutan?: number;
  deskripsi?: string;
}

interface PenggunaItem {
  id: string;
  nama: string;
  username: string;
  email?: string;
  peran: string;
  kd_kecamatan?: string;
  kd_desa?: string;
  aktif: boolean;
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
}

interface KecamatanOption {
  kd_kecamatan: string;
  nm_kecamatan: string;
}

interface DesaOption {
  kd_desa: string;
  nm_desa: string;
  kd_kecamatan: string;
}

interface Props {
  kecamatans: KecamatanOption[];
  desas: DesaOption[];
}

export default function PengaturanClientView({ kecamatans, desas }: Props) {
  const [activeTab, setActiveTab] = useState<"komoditas" | "pengguna">("komoditas");

  // Komoditas State
  const [komoditasList, setKomoditasList] = useState<KomoditasItem[]>([]);
  const [loadingKomoditas, setLoadingKomoditas] = useState(true);
  const [searchKomoditas, setSearchKomoditas] = useState("");
  const [filterJenisUsaha, setFilterJenisUsaha] = useState("semua");
  const [pageKomoditas, setPageKomoditas] = useState(1);
  const [totalPagesKomoditas, setTotalPagesKomoditas] = useState(1);
  const [totalKomoditas, setTotalKomoditas] = useState(0);

  // Komoditas Modal
  const [isKomoditasModalOpen, setIsKomoditasModalOpen] = useState(false);
  const [komoditasModalMode, setKomoditasModalMode] = useState<"create" | "edit">("create");
  const [editingKomoditas, setEditingKomoditas] = useState<KomoditasItem | null>(null);
  const [komoditasForm, setKomoditasForm] = useState({
    kd_komoditas: "",
    nm_komoditas: "",
    jenisUsaha: "KEBUN",
    satuanDefault: "Kg",
    urutan: 1,
    deskripsi: "",
  });
  const [savingKomoditas, setSavingKomoditas] = useState(false);
  const [deleteKomoditasId, setDeleteKomoditasId] = useState<string | null>(null);

  // Pengguna State
  const [penggunaList, setPenggunaList] = useState<PenggunaItem[]>([]);
  const [loadingPengguna, setLoadingPengguna] = useState(true);
  const [searchPengguna, setSearchPengguna] = useState("");
  const [filterPeran, setFilterPeran] = useState("semua");
  const [pagePengguna, setPagePengguna] = useState(1);
  const [totalPagesPengguna, setTotalPagesPengguna] = useState(1);
  const [totalPengguna, setTotalPengguna] = useState(0);

  // Pengguna Modal
  const [isPenggunaModalOpen, setIsPenggunaModalOpen] = useState(false);
  const [penggunaModalMode, setPenggunaModalMode] = useState<"create" | "edit">("create");
  const [editingPengguna, setEditingPengguna] = useState<PenggunaItem | null>(null);
  const [penggunaForm, setPenggunaForm] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    peran: "PETUGAS",
    kd_kecamatan: "",
    kd_desa: "",
    aktif: true,
  });
  const [savingPengguna, setSavingPengguna] = useState(false);
  const [deletePenggunaId, setDeletePenggunaId] = useState<string | null>(null);

  // Fetch Komoditas
  const fetchKomoditas = async () => {
    setLoadingKomoditas(true);
    try {
      const params = new URLSearchParams({
        page: pageKomoditas.toString(),
        limit: "10",
        search: searchKomoditas,
        jenisUsaha: filterJenisUsaha,
      });
      const res = await fetch(`/api/pengaturan/komoditas?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setKomoditasList(json.data);
        setTotalPagesKomoditas(json.totalPages || 1);
        setTotalKomoditas(json.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKomoditas(false);
    }
  };

  // Fetch Pengguna
  const fetchPengguna = async () => {
    setLoadingPengguna(true);
    try {
      const params = new URLSearchParams({
        page: pagePengguna.toString(),
        limit: "10",
        search: searchPengguna,
        peran: filterPeran,
      });
      const res = await fetch(`/api/pengaturan/pengguna?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPenggunaList(json.data);
        setTotalPagesPengguna(json.totalPages || 1);
        setTotalPengguna(json.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPengguna(false);
    }
  };

  useEffect(() => {
    if (activeTab === "komoditas") {
      fetchKomoditas();
    } else {
      fetchPengguna();
    }
  }, [
    activeTab,
    pageKomoditas,
    searchKomoditas,
    filterJenisUsaha,
    pagePengguna,
    searchPengguna,
    filterPeran,
  ]);

  // Handle Save Komoditas
  const handleSaveKomoditas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKomoditas(true);
    try {
      const url = "/api/pengaturan/komoditas";
      const method = komoditasModalMode === "create" ? "POST" : "PUT";
      const payload = {
        ...komoditasForm,
        id: editingKomoditas?.id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsKomoditasModalOpen(false);
        fetchKomoditas();
      } else {
        alert(json.error || "Gagal menyimpan komoditas");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSavingKomoditas(false);
    }
  };

  const handleDeleteKomoditas = async () => {
    if (!deleteKomoditasId) return;
    try {
      const res = await fetch(`/api/pengaturan/komoditas?id=${deleteKomoditasId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeleteKomoditasId(null);
        fetchKomoditas();
      } else {
        alert(json.error || "Gagal menghapus komoditas");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus komoditas");
    }
  };

  // Handle Save Pengguna
  const handleSavePengguna = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPengguna(true);
    try {
      const url = "/api/pengaturan/pengguna";
      const method = penggunaModalMode === "create" ? "POST" : "PUT";
      const payload = {
        ...penggunaForm,
        id: editingPengguna?.id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsPenggunaModalOpen(false);
        fetchPengguna();
      } else {
        alert(json.error || "Gagal menyimpan akun pengguna");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSavingPengguna(false);
    }
  };

  const handleDeletePengguna = async () => {
    if (!deletePenggunaId) return;
    try {
      const res = await fetch(`/api/pengaturan/pengguna?id=${deletePenggunaId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeletePenggunaId(null);
        fetchPengguna();
      } else {
        alert(json.error || "Gagal menghapus pengguna");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pengguna");
    }
  };

  const availableDesas = desas.filter((d) => d.kd_kecamatan === penggunaForm.kd_kecamatan);

  return (
    <div className="space-y-6">
      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("komoditas")}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "komoditas"
              ? "border-[#16a34a] text-[#16a34a] bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout size={16} />
          Master Komoditas Unggulan
        </button>
        <button
          onClick={() => setActiveTab("pengguna")}
          className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "pengguna"
              ? "border-[#16a34a] text-[#16a34a] bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          Manajemen Pengguna & Hak Akses (RBAC)
        </button>
      </div>

      {/* ================= TAB 1: MASTER KOMODITAS ================= */}
      {activeTab === "komoditas" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama komoditas, kode, atau nama ilmiah..."
                value={searchKomoditas}
                onChange={(e) => {
                  setSearchKomoditas(e.target.value);
                  setPageKomoditas(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterJenisUsaha}
                onChange={(e) => {
                  setFilterJenisUsaha(e.target.value);
                  setPageKomoditas(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                <option value="semua">Semua Sektor</option>
                <option value="KEBUN">Pertanian (Kebun)</option>
                <option value="KOLAM">Perikanan (Kolam)</option>
                <option value="PETERNAKAN">Peternakan</option>
              </select>

              <button
                onClick={() => {
                  setKomoditasModalMode("create");
                  setEditingKomoditas(null);
                  setKomoditasForm({
                    kd_komoditas: "",
                    nm_komoditas: "",
                    jenisUsaha: "KEBUN",
                    satuanDefault: "Kg",
                    urutan: totalKomoditas + 1,
                    deskripsi: "",
                  });
                  setIsKomoditasModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus size={16} />
                Tambah Komoditas
              </button>
            </div>
          </div>

          {/* Table Komoditas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Kode</th>
                    <th className="p-4">Nama Komoditas</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4">Sektor</th>
                    <th className="p-4">Satuan Default</th>
                    <th className="p-4 text-center">Urutan</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingKomoditas ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Memuat data komoditas...
                      </td>
                    </tr>
                  ) : komoditasList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada data komoditas ditemukan.
                      </td>
                    </tr>
                  ) : (
                    komoditasList.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700">{k.kd_komoditas}</td>
                        <td className="p-4 font-bold text-slate-900">{k.nm_komoditas}</td>
                        <td className="p-4 text-slate-500">{k.deskripsi || "-"}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              k.jenisUsaha === "KEBUN"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : k.jenisUsaha === "KOLAM"
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {k.jenisUsaha}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-600">{k.satuanDefault || "Kg"}</td>
                        <td className="p-4 text-center font-bold text-slate-700">{k.urutan || 0}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setKomoditasModalMode("edit");
                                setEditingKomoditas(k);
                                setKomoditasForm({
                                  kd_komoditas: k.kd_komoditas,
                                  nm_komoditas: k.nm_komoditas,
                                  jenisUsaha: k.jenisUsaha,
                                  satuanDefault: k.satuanDefault || "Kg",
                                  urutan: k.urutan || 1,
                                  deskripsi: k.deskripsi || "",
                                });
                                setIsKomoditasModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteKomoditasId(k.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Komoditas */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <p>
                Menampilkan <span className="font-semibold text-slate-800">{komoditasList.length}</span> dari{" "}
                <span className="font-semibold text-slate-800">{totalKomoditas}</span> komoditas
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={pageKomoditas <= 1}
                  onClick={() => setPageKomoditas((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-bold text-slate-700">
                  Hal {pageKomoditas} / {totalPagesKomoditas || 1}
                </span>
                <button
                  disabled={pageKomoditas >= totalPagesKomoditas}
                  onClick={() => setPageKomoditas((p) => Math.min(totalPagesKomoditas, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MANAJEMEN PENGGUNA ================= */}
      {activeTab === "pengguna" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama pengguna, username, atau email..."
                value={searchPengguna}
                onChange={(e) => {
                  setSearchPengguna(e.target.value);
                  setPagePengguna(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPeran}
                onChange={(e) => {
                  setFilterPeran(e.target.value);
                  setPagePengguna(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                <option value="semua">Semua Peran</option>
                <option value="ADMIN_KABUPATEN">Admin Kabupaten</option>
                <option value="ADMIN_PERTANIAN">Admin Dinas Pertanian</option>
                <option value="ADMIN_PERIKANAN">Admin Dinas Perikanan</option>
                <option value="PPL_PERTANIAN">PPL Pertanian</option>
                <option value="PPL_PERIKANAN">PPL Perikanan</option>
                <option value="ADMIN_KECAMATAN">Admin Kecamatan</option>
                <option value="PETUGAS">Petugas Lapangan</option>
                <option value="KELOMPOK_TANI">Kelompok Tani</option>
              </select>

              <button
                onClick={() => {
                  setPenggunaModalMode("create");
                  setEditingPengguna(null);
                  setPenggunaForm({
                    nama: "",
                    username: "",
                    email: "",
                    password: "",
                    peran: "PETUGAS",
                    kd_kecamatan: kecamatans[0]?.kd_kecamatan || "",
                    kd_desa: "",
                    aktif: true,
                  });
                  setIsPenggunaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus size={16} />
                Tambah Pengguna
              </button>
            </div>
          </div>

          {/* Table Pengguna */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Nama & Username</th>
                    <th className="p-4">Peran (Role)</th>
                    <th className="p-4">Wilayah Tugas</th>
                    <th className="p-4">Kontak & Email</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPengguna ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Memuat data pengguna...
                      </td>
                    </tr>
                  ) : penggunaList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada pengguna ditemukan.
                      </td>
                    </tr>
                  ) : (
                    penggunaList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{u.nama}</p>
                          <p className="text-[10px] text-slate-400">@{u.username}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-[#0a261c]">
                            {u.peran}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.kecamatan ? (
                            <p className="font-semibold text-slate-800">
                              Kec. {u.kecamatan.nm_kecamatan}
                              {u.desa ? ` / Desa ${u.desa.nm_desa}` : ""}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic">Tingkat Kabupaten</span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-slate-700">{u.email || "-"}</p>
                        </td>
                        <td className="p-4 text-center">
                          {u.aktif ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle size={10} /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle size={10} /> Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setPenggunaModalMode("edit");
                                setEditingPengguna(u);
                                setPenggunaForm({
                                  nama: u.nama,
                                  username: u.username,
                                  email: u.email || "",
                                  password: "", // leave empty to keep existing
                                  peran: u.peran,
                                  kd_kecamatan: u.kd_kecamatan || "",
                                  kd_desa: u.kd_desa || "",
                                  aktif: u.aktif,
                                });
                                setIsPenggunaModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              disabled={u.username === "admin"}
                              onClick={() => setDeletePenggunaId(u.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Pengguna */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <p>
                Menampilkan <span className="font-semibold text-slate-800">{penggunaList.length}</span> dari{" "}
                <span className="font-semibold text-slate-800">{totalPengguna}</span> pengguna
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagePengguna <= 1}
                  onClick={() => setPagePengguna((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-bold text-slate-700">
                  Hal {pagePengguna} / {totalPagesPengguna || 1}
                </span>
                <button
                  disabled={pagePengguna >= totalPagesPengguna}
                  onClick={() => setPagePengguna((p) => Math.min(totalPagesPengguna, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KOMODITAS ================= */}
      {isKomoditasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {komoditasModalMode === "create" ? "Tambah Master Komoditas" : "Edit Komoditas"}
              </h3>
              <button
                onClick={() => setIsKomoditasModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKomoditas} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Komoditas</label>
                  <input
                    type="text"
                    placeholder="Auto generate jika kosong"
                    value={komoditasForm.kd_komoditas}
                    onChange={(e) => setKomoditasForm({ ...komoditasForm, kd_komoditas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sektor Usaha</label>
                  <select
                    value={komoditasForm.jenisUsaha}
                    onChange={(e) => setKomoditasForm({ ...komoditasForm, jenisUsaha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="KEBUN">Pertanian (Kebun)</option>
                    <option value="KOLAM">Perikanan (Kolam)</option>
                    <option value="PETERNAKAN">Peternakan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Komoditas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Arabika Sipirok"
                  value={komoditasForm.nm_komoditas}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, nm_komoditas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Default</label>
                  <input
                    type="text"
                    placeholder="Kg, Ton, Ekor, Liter"
                    value={komoditasForm.satuanDefault}
                    onChange={(e) => setKomoditasForm({ ...komoditasForm, satuanDefault: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={komoditasForm.urutan}
                    onChange={(e) =>
                      setKomoditasForm({ ...komoditasForm, urutan: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Varietas unggul, habitat ideal"
                  value={komoditasForm.deskripsi}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKomoditasModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingKomoditas}
                  className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingKomoditas ? "Menyimpan..." : "Simpan Komoditas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PENGGUNA ================= */}
      {isPenggunaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {penggunaModalMode === "create" ? "Tambah Akun Pengguna" : "Edit Akun Pengguna"}
              </h3>
              <button
                onClick={() => setIsPenggunaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePengguna} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Siregar, S.P."
                  value={penggunaForm.nama}
                  onChange={(e) => setPenggunaForm({ ...penggunaForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="rahmatsiregar"
                    value={penggunaForm.username}
                    onChange={(e) => setPenggunaForm({ ...penggunaForm, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {penggunaModalMode === "create" ? "Password" : "Password Baru (Kosongkan jika tetap)"}
                  </label>
                  <input
                    type="password"
                    required={penggunaModalMode === "create"}
                    placeholder="••••••••"
                    value={penggunaForm.password}
                    onChange={(e) => setPenggunaForm({ ...penggunaForm, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses (RBAC)</label>
                  <select
                    value={penggunaForm.peran}
                    onChange={(e) => setPenggunaForm({ ...penggunaForm, peran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="ADMIN_KABUPATEN">Admin Kabupaten</option>
                    <option value="ADMIN_PERTANIAN">Admin Dinas Pertanian</option>
                    <option value="ADMIN_PERIKANAN">Admin Dinas Perikanan</option>
                    <option value="PPL_PERTANIAN">PPL Pertanian (Pertanian & Peternakan)</option>
                    <option value="PPL_PERIKANAN">PPL Perikanan (Perikanan)</option>
                    <option value="ADMIN_KECAMATAN">Admin Kecamatan</option>
                    <option value="PETUGAS">Petugas PPL / Lapangan (Umum)</option>
                    <option value="KELOMPOK_TANI">Operator Kelompok Tani</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={penggunaForm.aktif ? "true" : "false"}
                    onChange={(e) =>
                      setPenggunaForm({ ...penggunaForm, aktif: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="true">Aktif (Bisa Login)</option>
                    <option value="false">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kecamatan Tugas</label>
                  <select
                    value={penggunaForm.kd_kecamatan}
                    onChange={(e) =>
                      setPenggunaForm({ ...penggunaForm, kd_kecamatan: e.target.value, kd_desa: "" })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a]"
                  >
                    <option value="">-- Semua / Tingkat Kabupaten --</option>
                    {kecamatans.map((kec) => (
                      <option key={kec.kd_kecamatan} value={kec.kd_kecamatan}>
                        {kec.nm_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Desa Tugas</label>
                  <select
                    value={penggunaForm.kd_desa}
                    onChange={(e) => setPenggunaForm({ ...penggunaForm, kd_desa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a]"
                  >
                    <option value="">-- Semua / Seluruh Desa --</option>
                    {availableDesas.map((desa) => (
                      <option key={desa.kd_desa} value={desa.kd_desa}>
                        {desa.nm_desa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="email@tapsel.go.id"
                  value={penggunaForm.email}
                  onChange={(e) => setPenggunaForm({ ...penggunaForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPenggunaModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPengguna}
                  className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingPengguna ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Komoditas */}
      {deleteKomoditasId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">Hapus Komoditas?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Data komoditas ini akan dihapus dari sistem. Pastikan tidak ada kebun/kolam/ternak yang terhubung.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteKomoditasId(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteKomoditas}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Pengguna */}
      {deletePenggunaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">Hapus Akun Pengguna?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Akun ini tidak akan dapat mengakses aplikasi lagi. Riwayat login dan aktivitas akan dicabut.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeletePenggunaId(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePengguna}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
