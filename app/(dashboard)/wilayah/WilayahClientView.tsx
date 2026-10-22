"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";

interface KecamatanItem {
  id: string;
  kd_kecamatan: string;
  nm_kecamatan: string;
  _count?: {
    desa: number;
    kebun: number;
    kolam: number;
    peternakan: number;
    kelompokTani: number;
  };
}

interface DesaItem {
  id: string;
  kd_desa: string;
  nm_desa: string;
  kd_kecamatan: string;
  alamat?: string;
  latitude?: number;
  longitude?: number;
  kecamatan?: {
    nm_kecamatan: string;
  };
}

export default function WilayahClientView() {
  const {
    user,
    isKabupaten,
    isKecamatan,
    isPplOrDesa,
    authKecamatan,
    authDesa,
    authKecamatanName,
    authDesaName,
    canChangeKecamatan,
    canChangeDesa,
  } = useAuthority();

  const [activeTab, setActiveTab] = useState<"kecamatan" | "desa">("kecamatan");

  // Kecamatan States
  const [kecamatans, setKecamatans] = useState<KecamatanItem[]>([]);
  const [kecLoading, setKecLoading] = useState(false);
  const [kecSearch, setKecSearch] = useState("");
  const [kecPage, setKecPage] = useState(1);
  const [kecTotalPages, setKecTotalPages] = useState(1);
  const [kecTotal, setKecTotal] = useState(0);

  // Desa States
  const [desas, setDesas] = useState<DesaItem[]>([]);
  const [desaLoading, setDesaLoading] = useState(false);
  const [desaSearch, setDesaSearch] = useState("");
  const [selectedKecFilter, setSelectedKecFilter] = useState("semua");
  const [desaPage, setDesaPage] = useState(1);
  const [desaTotalPages, setDesaTotalPages] = useState(1);
  const [desaTotal, setDesaTotal] = useState(0);

  // All kecamatan for dropdown select
  const [allKecamatanList, setAllKecamatanList] = useState<{ kd_kecamatan: string; nm_kecamatan: string }[]>([]);

  // Sync authority into filter
  useEffect(() => {
    if (!isKabupaten && authKecamatan) {
      setSelectedKecFilter(authKecamatan);
    }
  }, [isKabupaten, authKecamatan]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"kecamatan" | "desa">("kecamatan");
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formKdKecamatan, setFormKdKecamatan] = useState("");
  const [formNmKecamatan, setFormNmKecamatan] = useState("");

  const [formKdDesa, setFormKdDesa] = useState("");
  const [formNmDesa, setFormNmDesa] = useState("");
  const [formDesaKecamatan, setFormDesaKecamatan] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");

  // Toast / Alert
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch Kecamatan
  const fetchKecamatans = async () => {
    setKecLoading(true);
    try {
      const res = await fetch(`/api/wilayah/kecamatan?search=${encodeURIComponent(kecSearch)}&page=${kecPage}&limit=10`);
      const json = await res.json();
      if (json.success) {
        setKecamatans(json.data);
        setKecTotal(json.total);
        setKecTotalPages(json.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKecLoading(false);
    }
  };

  // Fetch All Kec for dropdowns
  const fetchAllKecamatanList = async () => {
    try {
      const res = await fetch("/api/public/wilayah");
      const json = await res.json();
      if (json.success) {
        setAllKecamatanList(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Desa
  const fetchDesas = async () => {
    setDesaLoading(true);
    try {
      const res = await fetch(
        `/api/wilayah/desa?search=${encodeURIComponent(desaSearch)}&kd_kecamatan=${selectedKecFilter}&page=${desaPage}&limit=10`
      );
      const json = await res.json();
      if (json.success) {
        setDesas(json.data);
        setDesaTotal(json.total);
        setDesaTotalPages(json.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDesaLoading(false);
    }
  };

  useEffect(() => {
    fetchAllKecamatanList();
  }, []);

  useEffect(() => {
    fetchKecamatans();
  }, [kecSearch, kecPage]);

  useEffect(() => {
    fetchDesas();
  }, [desaSearch, selectedKecFilter, desaPage]);

  const canEditOrDeleteDesa = (itemKecamatan: string, itemDesa: string) => {
    if (isKabupaten) return true;
    if (isKecamatan) return itemKecamatan === authKecamatan;
    if (isPplOrDesa) {
      if (authKecamatan && itemKecamatan !== authKecamatan) return false;
      if (authDesa && itemDesa !== authDesa) return false;
      return true;
    }
    return false;
  };

  const openTambahKecamatan = () => {
    if (!isKabupaten) return;
    setEditItem(null);
    setFormKdKecamatan("");
    setFormNmKecamatan("");
    setModalType("kecamatan");
    setModalOpen(true);
  };

  const openEditKecamatan = (item: KecamatanItem) => {
    if (!isKabupaten) return;
    setEditItem(item);
    setFormKdKecamatan(item.kd_kecamatan);
    setFormNmKecamatan(item.nm_kecamatan);
    setModalType("kecamatan");
    setModalOpen(true);
  };

  const openTambahDesa = () => {
    setEditItem(null);
    let defaultKec = allKecamatanList[0]?.kd_kecamatan || "";
    if (!isKabupaten && authKecamatan) {
      defaultKec = authKecamatan;
    }
    setFormKdDesa("");
    setFormNmDesa("");
    setFormDesaKecamatan(defaultKec);
    setFormAlamat("");
    setFormLat("");
    setFormLng("");
    setModalType("desa");
    setModalOpen(true);
  };

  const openEditDesa = (item: DesaItem) => {
    setEditItem(item);
    setFormKdDesa(item.kd_desa);
    setFormNmDesa(item.nm_desa);
    setFormDesaKecamatan(item.kd_kecamatan);
    setFormAlamat(item.alamat || "");
    setFormLat(item.latitude ? String(item.latitude) : "");
    setFormLng(item.longitude ? String(item.longitude) : "");
    setModalType("desa");
    setModalOpen(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      if (modalType === "kecamatan") {
        const method = editItem ? "PUT" : "POST";
        const body = editItem
          ? { id: editItem.id, kd_kecamatan: formKdKecamatan, nm_kecamatan: formNmKecamatan }
          : { kd_kecamatan: formKdKecamatan, nm_kecamatan: formNmKecamatan };

        const res = await fetch("/api/wilayah/kecamatan", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal menyimpan");

        setAlert({ type: "success", message: `Kecamatan berhasil ${editItem ? "diperbarui" : "ditambahkan"}!` });
        setModalOpen(false);
        fetchKecamatans();
        fetchAllKecamatanList();
      } else {
        const method = editItem ? "PUT" : "POST";
        const body = editItem
          ? {
            id: editItem.id,
            kd_desa: formKdDesa,
            nm_desa: formNmDesa,
            kd_kecamatan: formDesaKecamatan,
            alamat: formAlamat,
            latitude: formLat,
            longitude: formLng,
          }
          : {
            kd_desa: formKdDesa,
            nm_desa: formNmDesa,
            kd_kecamatan: formDesaKecamatan,
            alamat: formAlamat,
            latitude: formLat,
            longitude: formLng,
          };

        const res = await fetch("/api/wilayah/desa", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal menyimpan");

        setAlert({ type: "success", message: `Desa berhasil ${editItem ? "diperbarui" : "ditambahkan"}!` });
        setModalOpen(false);
        fetchDesas();
      }
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteKecamatan = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus Kecamatan ${name}?`)) return;
    try {
      const res = await fetch(`/api/wilayah/kecamatan?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Kecamatan ${name} berhasil dihapus.` });
      fetchKecamatans();
      fetchAllKecamatanList();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const handleDeleteDesa = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus Desa ${name}?`)) return;
    try {
      const res = await fetch(`/api/wilayah/desa?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Desa ${name} berhasil dihapus.` });
      fetchDesas();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${alert.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("kecamatan")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === "kecamatan"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
        >
          <Building2 size={15} />
          <span>Data Kecamatan ({kecTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab("desa")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === "desa"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
        >
          <MapPin size={15} />
          <span>Data Desa / Kelurahan ({desaTotal})</span>
        </button>
      </div>

      {/* TAB 1: KECAMATAN */}
      {activeTab === "kecamatan" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={kecSearch}
                onChange={(e) => {
                  setKecSearch(e.target.value);
                  setKecPage(1);
                }}
                placeholder="Cari kecamatan..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Tambah Button (Kabupaten Only) */}
            {isKabupaten && (
              <button
                onClick={openTambahKecamatan}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                <Plus size={15} />
                <span>Tambah Kecamatan</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Kode</th>
                  <th className="p-3.5">Nama Kecamatan</th>
                  <th className="p-3.5 text-center">Desa</th>
                  <th className="p-3.5 text-center">Kebun</th>
                  <th className="p-3.5 text-center">Kolam</th>
                  <th className="p-3.5 text-center">Ternak</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kecLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                      Memuat data kecamatan...
                    </td>
                  </tr>
                ) : kecamatans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Tidak ada data kecamatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  kecamatans.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-700">{k.kd_kecamatan}</td>
                      <td className="p-3.5 font-bold text-slate-900">{k.nm_kecamatan}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-600">{k._count?.desa || 0}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">{k._count?.kebun || 0}</td>
                      <td className="p-3.5 text-center font-bold text-sky-700">{k._count?.kolam || 0}</td>
                      <td className="p-3.5 text-center font-bold text-orange-700">{k._count?.peternakan || 0}</td>
                      <td className="p-3.5 text-right">
                        {isKabupaten ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditKecamatan(k)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteKecamatan(k.id, k.nm_kecamatan)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-200/60" title="Otoritas Kabupaten">
                            <Lock size={10} /> Hanya Lihat
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Menampilkan {kecamatans.length} dari {kecTotal} kecamatan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={kecPage <= 1}
                onClick={() => setKecPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold text-slate-700">
                {kecPage} / {kecTotalPages || 1}
              </span>
              <button
                disabled={kecPage >= kecTotalPages}
                onClick={() => setKecPage((p) => Math.min(kecTotalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DESA */}
      {activeTab === "desa" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={desaSearch}
                  onChange={(e) => {
                    setDesaSearch(e.target.value);
                    setDesaPage(1);
                  }}
                  placeholder="Cari desa..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Filter Kecamatan */}
              {isKabupaten ? (
                <select
                  value={selectedKecFilter}
                  onChange={(e) => {
                    setSelectedKecFilter(e.target.value);
                    setDesaPage(1);
                  }}
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="semua">Semua Kecamatan</option>
                  {allKecamatanList.map((k) => (
                    <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                      {k.nm_kecamatan}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700" title="Wilayah Otoritas Anda">
                  <Lock size={12} className="text-amber-600" />
                  <span>{allKecamatanList.find((k) => k.kd_kecamatan === authKecamatan)?.nm_kecamatan || authKecamatanName || authKecamatan}</span>
                </div>
              )}
            </div>

            {/* Tambah Button (Kabupaten & Kecamatan Admins) */}
            {(isKabupaten || isKecamatan) && (
              <button
                onClick={openTambahDesa}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                <Plus size={15} />
                <span>Tambah Desa</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Kode</th>
                  <th className="p-3.5">Nama Desa</th>
                  <th className="p-3.5">Kecamatan</th>
                  <th className="p-3.5">Koordinat (Lat, Lng)</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {desaLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                      Memuat data desa...
                    </td>
                  </tr>
                ) : desas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      Tidak ada data desa ditemukan.
                    </td>
                  </tr>
                ) : (
                  desas.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-700">{d.kd_desa}</td>
                      <td className="p-3.5 font-bold text-slate-900">{d.nm_desa}</td>
                      <td className="p-3.5 font-semibold text-emerald-700">
                        {d.kecamatan?.nm_kecamatan || d.kd_kecamatan}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : "-"}
                      </td>
                      <td className="p-3.5 text-right">
                        {canEditOrDeleteDesa(d.kd_kecamatan, d.kd_desa) ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditDesa(d)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteDesa(d.id, d.nm_desa)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-200/60" title="Di luar wilayah otoritas Anda">
                            <Lock size={10} /> Hanya Lihat
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Menampilkan {desas.length} dari {desaTotal} desa
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={desaPage <= 1}
                onClick={() => setDesaPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold text-slate-700">
                {desaPage} / {desaTotalPages || 1}
              </span>
              <button
                disabled={desaPage >= desaTotalPages}
                onClick={() => setDesaPage((p) => Math.min(desaTotalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                {editItem ? "Edit" : "Tambah"} {modalType === "kecamatan" ? "Kecamatan" : "Desa"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
              {modalType === "kecamatan" ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Kecamatan</label>
                    <input
                      type="text"
                      value={formKdKecamatan}
                      onChange={(e) => setFormKdKecamatan(e.target.value)}
                      placeholder="Contoh: 1216"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Kecamatan</label>
                    <input
                      type="text"
                      value={formNmKecamatan}
                      onChange={(e) => setFormNmKecamatan(e.target.value)}
                      placeholder="Contoh: Sipirok"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kecamatan {!canChangeKecamatan && <span className="text-xs font-normal text-amber-600">(Terkunci)</span>}
                    </label>
                    {!canChangeKecamatan ? (
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between">
                        <span>
                          {allKecamatanList.find((k) => k.kd_kecamatan === formDesaKecamatan)?.nm_kecamatan || authKecamatanName || formDesaKecamatan}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Wilayah Anda
                        </span>
                      </div>
                    ) : (
                      <select
                        value={formDesaKecamatan}
                        onChange={(e) => setFormDesaKecamatan(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      >
                        {allKecamatanList.map((k) => (
                          <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                            {k.nm_kecamatan}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Desa</label>
                    <input
                      type="text"
                      value={formKdDesa}
                      onChange={(e) => setFormKdDesa(e.target.value)}
                      placeholder="Contoh: 1205003"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Desa / Kelurahan</label>
                    <input
                      type="text"
                      value={formNmDesa}
                      onChange={(e) => setFormNmDesa(e.target.value)}
                      placeholder="Contoh: Desa Paran Padang"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={formLat}
                        onChange={(e) => setFormLat(e.target.value)}
                        placeholder="Contoh: 1.6052"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={formLng}
                        onChange={(e) => setFormLng(e.target.value)}
                        placeholder="Contoh: 99.2814"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
