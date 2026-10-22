"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";

interface PoktanItem {
  id: string;
  kd_kelompok: string;
  nm_kelompok: string;
  kd_kecamatan: string;
  kd_desa: string;
  namaKetua: string;
  noTelepon?: string;
  alamat?: string;
  jumlahAnggota: number;
  tahunBerdiri?: number;
  status: string;
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  _count?: { kebun: number; kolam: number; peternakan: number };
}

export default function KelompokTaniClientView() {
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

  const [data, setData] = useState<PoktanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Kecamatan and Desa lists for dropdowns
  const [kecamatanList, setKecamatanList] = useState<{ kd_kecamatan: string; nm_kecamatan: string }[]>([]);
  const [desaList, setDesaList] = useState<{ kd_desa: string; nm_desa: string; kd_kecamatan: string }[]>([]);

  // Sync authority into filter
  useEffect(() => {
    if (!isKabupaten && authKecamatan) {
      setSelectedKec(authKecamatan);
    }
    if (authDesa) {
      setSelectedDesa(authDesa);
    }
  }, [isKabupaten, authKecamatan, authDesa]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PoktanItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formKdKelompok, setFormKdKelompok] = useState("");
  const [formNmKelompok, setFormNmKelompok] = useState("");
  const [formKdKecamatan, setFormKdKecamatan] = useState("");
  const [formKdDesa, setFormKdDesa] = useState("");
  const [formNamaKetua, setFormNamaKetua] = useState("");
  const [formNoTelepon, setFormNoTelepon] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formJumlahAnggota, setFormJumlahAnggota] = useState("20");
  const [formTahunBerdiri, setFormTahunBerdiri] = useState("2020");
  const [formStatus, setFormStatus] = useState("AKTIF");
  const [formKeterangan, setFormKeterangan] = useState("");

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load Dropdowns
  const loadKecamatanAndDesa = async () => {
    try {
      const [resKec, resDesa] = await Promise.all([
        fetch("/api/public/wilayah"),
        fetch("/api/public/wilayah?all_desa=true"),
      ]);
      const jsonKec = await resKec.json();
      const jsonDesa = await resDesa.json();
      if (jsonKec.success) setKecamatanList(jsonKec.data);
      if (jsonDesa.success) setDesaList(jsonDesa.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Poktan
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kelompok-tani?search=${encodeURIComponent(search)}&kd_kecamatan=${selectedKec}&kd_desa=${selectedDesa}&status=${selectedStatus}&page=${page}&limit=10`
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKecamatanAndDesa();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, selectedKec, selectedDesa, selectedStatus, page]);

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  // Filtered Desa based on selected Kecamatan in form and authority
  const availableDesas = desaList.filter((d) => {
    if (d.kd_kecamatan !== formKdKecamatan) return false;
    if (isPplOrDesa && authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  const canEditOrDelete = (itemKecamatan: string, itemDesa: string) => {
    if (isKabupaten) return true;
    if (isKecamatan) return itemKecamatan === authKecamatan;
    if (isPplOrDesa) {
      if (authKecamatan && itemKecamatan !== authKecamatan) return false;
      if (authDesa && itemDesa !== authDesa) return false;
      return true;
    }
    return false;
  };

  const openTambah = () => {
    setEditItem(null);
    let defaultKec = kecamatanList[0]?.kd_kecamatan || "";
    if (!isKabupaten && authKecamatan) {
      defaultKec = authKecamatan;
    }

    const desasOfKec = desaList.filter((d) => d.kd_kecamatan === defaultKec);
    let defaultDesa = desasOfKec[0]?.kd_desa || "";
    if (isPplOrDesa && authDesa) {
      defaultDesa = authDesa;
    }

    setFormKdKelompok(`PKT-${Date.now().toString().slice(-6)}`);
    setFormNmKelompok("");
    setFormKdKecamatan(defaultKec);
    setFormKdDesa(defaultDesa);
    setFormNamaKetua("");
    setFormNoTelepon("");
    setFormAlamat("");
    setFormJumlahAnggota("25");
    setFormTahunBerdiri("2021");
    setFormStatus("AKTIF");
    setFormKeterangan("");
    setModalOpen(true);
  };

  const openEdit = (item: PoktanItem) => {
    setEditItem(item);
    setFormKdKelompok(item.kd_kelompok);
    setFormNmKelompok(item.nm_kelompok);
    setFormKdKecamatan(item.kd_kecamatan);
    setFormKdDesa(item.kd_desa);
    setFormNamaKetua(item.namaKetua);
    setFormNoTelepon(item.noTelepon || "");
    setFormAlamat(item.alamat || "");
    setFormJumlahAnggota(String(item.jumlahAnggota || 0));
    setFormTahunBerdiri(item.tahunBerdiri ? String(item.tahunBerdiri) : "");
    setFormStatus(item.status);
    setFormKeterangan((item as any).keterangan || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const method = editItem ? "PUT" : "POST";
      const body = {
        id: editItem?.id,
        kd_kelompok: formKdKelompok,
        nm_kelompok: formNmKelompok,
        kd_kecamatan: formKdKecamatan,
        kd_desa: formKdDesa,
        namaKetua: formNamaKetua,
        noTelepon: formNoTelepon,
        alamat: formAlamat,
        jumlahAnggota: formJumlahAnggota,
        tahunBerdiri: formTahunBerdiri,
        status: formStatus,
        keterangan: formKeterangan,
      };

      const res = await fetch("/api/kelompok-tani", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan data");

      setAlert({
        type: "success",
        message: `Kelompok Tani berhasil ${editItem ? "diperbarui" : "ditambahkan"}!`,
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus Kelompok Tani ${name}?`)) return;
    try {
      const res = await fetch(`/api/kelompok-tani?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Kelompok Tani ${name} berhasil dihapus.` });
      fetchData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-5">
      {/* Alert */}
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        {/* Toolbar: Search, Filters, Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari kelompok / ketua..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Filter Kecamatan */}
            {isKabupaten ? (
              <select
                value={selectedKec}
                onChange={(e) => {
                  setSelectedKec(e.target.value);
                  setSelectedDesa("semua");
                  setPage(1);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="semua">Semua Kecamatan</option>
                {kecamatanList.map((k) => (
                  <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                    {k.nm_kecamatan}
                  </option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700" title="Wilayah Otoritas Anda">
                <Lock size={12} className="text-amber-600" />
                <span>{kecamatanList.find((k) => k.kd_kecamatan === authKecamatan)?.nm_kecamatan || authKecamatanName || authKecamatan}</span>
              </div>
            )}

            {/* Filter Desa (tampil ketika kecamatan dipilih) */}
            {selectedKec !== "semua" && (
              authDesa ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700" title="Wilayah Desa Otoritas Anda">
                  <Lock size={12} className="text-blue-600" />
                  <span>{desaList.find((d) => d.kd_desa === authDesa)?.nm_desa || authDesaName || authDesa}</span>
                </div>
              ) : (
                <select
                  value={selectedDesa}
                  onChange={(e) => {
                    setSelectedDesa(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 max-w-[200px]"
                >
                  <option value="semua">Semua Desa</option>
                  {filterDesaOptions.map((d) => (
                    <option key={d.kd_desa} value={d.kd_desa}>
                      {d.nm_desa}
                    </option>
                  ))}
                </select>
              )
            )}

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="semua">Semua Status</option>
              <option value="AKTIF">AKTIF</option>
              <option value="DRAFT">DRAFT</option>
              <option value="DIVERIFIKASI">DIVERIFIKASI</option>
            </select>
          </div>

          {/* Tambah Button */}
          <button
            onClick={openTambah}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-emerald-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>Tambah Kelompok Tani</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Kode & Nama Poktan</th>
                <th className="p-3.5">Kecamatan</th>
                <th className="p-3.5">Desa/Kelurahan</th>
                <th className="p-3.5">Ketua & Kontak</th>
                <th className="p-3.5 text-center">Anggota</th>
                <th className="p-3.5 text-center">Usaha Binaan</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Memuat data kelompok tani...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada data kelompok tani ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{p.nm_kelompok}</p>
                      <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {p.kd_kelompok}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{p.kecamatan?.nm_kecamatan || "-"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{p.desa?.nm_desa || "-"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{p.namaKetua}</p>
                      <p className="text-[10px] text-slate-500">{p.noTelepon || "-"}</p>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {p.jumlahAnggota} Orang
                    </td>
                    <td className="p-3.5 text-center text-[11px] font-semibold text-slate-600">
                      <span className="text-emerald-700">{p._count?.kebun || 0} Kebun</span> •{" "}
                      <span className="text-sky-700">{p._count?.kolam || 0} Kolam</span> •{" "}
                      <span className="text-orange-700">{p._count?.peternakan || 0} Ternak</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.status === "AKTIF"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {canEditOrDelete(p.kd_kecamatan, p.kd_desa) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nm_kelompok)}
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
            Menampilkan {data.length} dari {total} Kelompok Tani
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-semibold text-slate-700">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Poktan (Diperlebar) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {editItem ? "Edit Kelompok Tani" : "Tambah Kelompok Tani Baru"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lengkapi identitas kelembagaan, wilayah tugas, pengurus, dan anggota kelompok tani
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Poktan</label>
                  <input
                    type="text"
                    value={formKdKelompok}
                    onChange={(e) => setFormKdKelompok(e.target.value)}
                    required
                    placeholder="Contoh: PKT-1210-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Kelompok Tani</label>
                  <input
                    type="text"
                    value={formNmKelompok}
                    onChange={(e) => setFormNmKelompok(e.target.value)}
                    required
                    placeholder="Contoh: Poktan Harapan Maju"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Kecamatan</span>
                    {!canChangeKecamatan && (
                      <span className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                        <Lock size={10} /> Terkunci
                      </span>
                    )}
                  </label>
                  {canChangeKecamatan ? (
                    <select
                      value={formKdKecamatan}
                      onChange={(e) => {
                        const newKec = e.target.value;
                        setFormKdKecamatan(newKec);
                        const desas = desaList.filter((d) => d.kd_kecamatan === newKec);
                        setFormKdDesa(desas[0]?.kd_desa || "");
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      {kecamatanList.map((k) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between">
                      <span>{kecamatanList.find((k) => k.kd_kecamatan === formKdKecamatan)?.nm_kecamatan || authKecamatanName || formKdKecamatan}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Wilayah Anda</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Desa / Kelurahan</span>
                    {!canChangeDesa && (
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
                        <Lock size={10} /> Terkunci
                      </span>
                    )}
                  </label>
                  {canChangeDesa ? (
                    <select
                      value={formKdDesa}
                      onChange={(e) => setFormKdDesa(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    >
                      {availableDesas.length === 0 ? (
                        <option value="">(Pilih Kecamatan terlebih dahulu)</option>
                      ) : (
                        availableDesas.map((d) => (
                          <option key={d.kd_desa} value={d.kd_desa}>
                            {d.nm_desa}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between">
                      <span>{desaList.find((d) => d.kd_desa === formKdDesa)?.nm_desa || authDesaName || formKdDesa}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Wilayah PPL</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Ketua Kelompok</label>
                  <input
                    type="text"
                    value={formNamaKetua}
                    onChange={(e) => setFormNamaKetua(e.target.value)}
                    required
                    placeholder="Contoh: H. Syamsir Siregar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formNoTelepon}
                    onChange={(e) => setFormNoTelepon(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Anggota (Orang)</label>
                  <input
                    type="number"
                    value={formJumlahAnggota}
                    onChange={(e) => setFormJumlahAnggota(e.target.value)}
                    min={0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Berdiri</label>
                  <input
                    type="number"
                    value={formTahunBerdiri}
                    onChange={(e) => setFormTahunBerdiri(e.target.value)}
                    placeholder="Contoh: 2020"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kelembagaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="DIVERIFIKASI">DIVERIFIKASI</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Sekretariat</label>
                <input
                  type="text"
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Lintas Sipirok Dusun II RT 01 / RW 02"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan kelembagaan, legalitas kemenkumham/sk dinas, komoditas unggulan poktan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-xs disabled:opacity-50 transition"
                >
                  {saving ? "Menyimpan..." : "Simpan Kelompok Tani"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
