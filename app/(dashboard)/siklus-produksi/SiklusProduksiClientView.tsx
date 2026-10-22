"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Fish,
  Beef,
  Lock,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";

interface SiklusItem {
  id: string;
  kd_siklus: string;
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  namaSiklus: string;
  tahapKegiatan: string;
  tanggalMulai: string;
  tanggalTargetPanen?: string;
  estimasiProduksi?: number;
  satuanProduksi?: string;
  status: string;
  kd_kebun?: string;
  kd_kolam?: string;
  kd_peternakan?: string;
  kebun?: { nama: string; kd_kecamatan?: string; kd_desa?: string; desa?: { nm_desa: string }; kecamatan?: { nm_kecamatan: string }; komoditas?: { nm_komoditas: string } };
  kolam?: { nm_kolam: string; kd_kecamatan?: string; kd_desa?: string; desa?: { nm_desa: string }; kecamatan?: { nm_kecamatan: string }; komoditas?: { nm_komoditas: string } };
  peternakan?: { nm_peternakan: string; kd_kecamatan?: string; kd_desa?: string; desa?: { nm_desa: string }; kecamatan?: { nm_kecamatan: string }; komoditas?: { nm_komoditas: string } };
  catatan?: string;
}

export default function SiklusProduksiClientView() {
  const {
    user,
    isKabupaten,
    isKecamatan,
    isPpl,
    isPplOrDesa,
    authKecamatan,
    authDesa,
    isLockedDesa,
    authDesaList,
    authKecamatanName,
    authDesaName,
    canEditOrDeleteRecord,
  } = useAuthority();
  const [data, setData] = useState<SiklusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Wilayah lists
  const [kecamatanList, setKecamatanList] = useState<{ kd_kecamatan: string; nm_kecamatan: string }[]>([]);
  const [desaList, setDesaList] = useState<{ kd_desa: string; nm_desa: string; kd_kecamatan: string }[]>([]);

  // Unit Usaha lists
  const [kebunList, setKebunList] = useState<{ kd_kebun: string; nama: string }[]>([]);
  const [kolamList, setKolamList] = useState<{ kd_kolam: string; nm_kolam: string }[]>([]);
  const [ternakList, setTernakList] = useState<{ kd_peternakan: string; nm_peternakan: string }[]>([]);

  // Sync authority into filter
  useEffect(() => {
    if (!isKabupaten && authKecamatan) {
      setSelectedKec(authKecamatan);
    }
    if (isLockedDesa && authDesa) {
      setSelectedDesa(authDesa);
    }
  }, [isKabupaten, authKecamatan, authDesa, isLockedDesa]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SiklusItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formKdSiklus, setFormKdSiklus] = useState("");
  const [formJenisUsaha, setFormJenisUsaha] = useState<"KEBUN" | "KOLAM" | "PETERNAKAN">("KEBUN");
  const [formNamaSiklus, setFormNamaSiklus] = useState("");
  const [formTahapKegiatan, setFormTahapKegiatan] = useState("Tanam");
  const [formTglMulai, setFormTglMulai] = useState("");
  const [formTglPanen, setFormTglPanen] = useState("");
  const [formEstimasi, setFormEstimasi] = useState("1000");
  const [formSatuan, setFormSatuan] = useState("Kg");
  const [formStatus, setFormStatus] = useState("BERJALAN");
  const [formKdUnit, setFormKdUnit] = useState("");
  const [formCatatan, setFormCatatan] = useState("");

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canEditOrDelete = (itemKec?: string, itemDesa?: string, jenis?: string) => {
    const sector = jenis === "KOLAM" ? "perikanan" : jenis === "PETERNAKAN" ? "peternakan" : "pertanian";
    return canEditOrDeleteRecord(itemKec, itemDesa, sector);
  };

  const loadUnits = async () => {
    try {
      const [resK, resKl, resT, resKec, resDesa] = await Promise.all([
        fetch("/api/pertanian?limit=100"),
        fetch("/api/perikanan?limit=100"),
        fetch("/api/peternakan?limit=100"),
        fetch("/api/public/wilayah"),
        fetch("/api/public/wilayah?all_desa=true"),
      ]);
      const jsonK = await resK.json();
      const jsonKl = await resKl.json();
      const jsonT = await resT.json();
      const jsonKec = await resKec.json();
      const jsonDesa = await resDesa.json();

      if (jsonK.success) setKebunList(jsonK.data);
      if (jsonKl.success) setKolamList(jsonKl.data);
      if (jsonT.success) setTernakList(jsonT.data);
      if (jsonKec.success) setKecamatanList(jsonKec.data);
      if (jsonDesa.success) setDesaList(jsonDesa.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/siklus-produksi?search=${encodeURIComponent(search)}&kd_kecamatan=${selectedKec}&kd_desa=${selectedDesa}&jenisUsaha=${selectedJenis}&status=${selectedStatus}&page=${page}&limit=10`
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
    loadUnits();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, selectedKec, selectedDesa, selectedJenis, selectedStatus, page]);

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  const openTambah = () => {
    setEditItem(null);
    setFormKdSiklus(`SKL-${Date.now().toString().slice(-6)}`);
    setFormJenisUsaha("KEBUN");
    setFormNamaSiklus("");
    setFormTahapKegiatan("Tanam");
    setFormTglMulai(new Date().toISOString().split("T")[0]);
    setFormTglPanen("");
    setFormEstimasi("2000");
    setFormSatuan("Kg");
    setFormStatus("BERJALAN");
    setFormKdUnit(kebunList[0]?.kd_kebun || "");
    setFormCatatan("");
    setModalOpen(true);
  };

  const openEdit = (item: SiklusItem) => {
    setEditItem(item);
    setFormKdSiklus(item.kd_siklus);
    setFormJenisUsaha(item.jenisUsaha);
    setFormNamaSiklus(item.namaSiklus);
    setFormTahapKegiatan(item.tahapKegiatan);
    setFormTglMulai(item.tanggalMulai ? new Date(item.tanggalMulai).toISOString().split("T")[0] : "");
    setFormTglPanen(item.tanggalTargetPanen ? new Date(item.tanggalTargetPanen).toISOString().split("T")[0] : "");
    setFormEstimasi(item.estimasiProduksi ? String(item.estimasiProduksi) : "");
    setFormSatuan(item.satuanProduksi || "Kg");
    setFormStatus(item.status);
    setFormKdUnit(item.kd_kebun || item.kd_kolam || item.kd_peternakan || "");
    setFormCatatan(item.catatan || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const method = editItem ? "PUT" : "POST";
      const body: any = {
        id: editItem?.id,
        kd_siklus: formKdSiklus,
        jenisUsaha: formJenisUsaha,
        namaSiklus: formNamaSiklus,
        tahapKegiatan: formTahapKegiatan,
        tanggalMulai: formTglMulai,
        tanggalTargetPanen: formTglPanen || null,
        estimasiProduksi: formEstimasi,
        satuanProduksi: formSatuan,
        status: formStatus,
        catatan: formCatatan,
      };

      if (formJenisUsaha === "KEBUN") body.kd_kebun = formKdUnit;
      if (formJenisUsaha === "KOLAM") body.kd_kolam = formKdUnit;
      if (formJenisUsaha === "PETERNAKAN") body.kd_peternakan = formKdUnit;

      const res = await fetch("/api/siklus-produksi", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan data");

      setAlert({
        type: "success",
        message: `Siklus Produksi berhasil ${editItem ? "diperbarui" : "ditambahkan"}!`,
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
    if (!confirm(`Hapus Siklus ${name}?`)) return;
    try {
      const res = await fetch(`/api/siklus-produksi?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Siklus ${name} berhasil dihapus.` });
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
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            alert.type === "success"
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
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari siklus / kegiatan..."
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
                <span>{kecamatanList.find(k => k.kd_kecamatan === authKecamatan)?.nm_kecamatan || authKecamatanName || authKecamatan}</span>
              </div>
            )}

            {/* Filter Desa (tampil ketika kecamatan dipilih) */}
            {selectedKec !== "semua" && (
              isLockedDesa ? (
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
                  <option value="semua">
                    {isPpl ? `Semua Desa Tugas (${filterDesaOptions.length} Desa)` : "Semua Desa"}
                  </option>
                  {filterDesaOptions.map((d) => (
                    <option key={d.kd_desa} value={d.kd_desa}>
                      {d.nm_desa}
                    </option>
                  ))}
                </select>
              )
            )}

            {/* Filter Sektor */}
            <select
              value={selectedJenis}
              onChange={(e) => {
                setSelectedJenis(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="semua">Semua Sektor</option>
              <option value="KEBUN">Pertanian / Kebun</option>
              <option value="KOLAM">Perikanan / Kolam</option>
              <option value="PETERNAKAN">Peternakan</option>
            </select>

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
              <option value="PERENCANAAN">PERENCANAAN</option>
              <option value="BERJALAN">BERJALAN</option>
              <option value="PANEN">PANEN</option>
              <option value="GAGAL">GAGAL</option>
            </select>
          </div>

          {/* Tambah Button */}
          <button
            onClick={openTambah}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-emerald-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>Tambah Siklus Produksi</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Kode & Nama Siklus</th>
                <th className="p-3.5">Sektor & Unit Usaha</th>
                <th className="p-3.5">Tahap Kegiatan</th>
                <th className="p-3.5">Tgl Mulai</th>
                <th className="p-3.5">Target Panen</th>
                <th className="p-3.5 text-center">Estimasi Hasil</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Memuat siklus produksi...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada data siklus produksi ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((s) => {
                  let unitName = "-";
                  let komoditas = "-";
                  if (s.kebun) {
                    unitName = s.kebun.nama;
                    komoditas = s.kebun.komoditas?.nm_komoditas || "Kebun";
                  } else if (s.kolam) {
                    unitName = s.kolam.nm_kolam;
                    komoditas = s.kolam.komoditas?.nm_komoditas || "Kolam";
                  } else if (s.peternakan) {
                    unitName = s.peternakan.nm_peternakan;
                    komoditas = s.peternakan.komoditas?.nm_komoditas || "Ternak";
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{s.namaSiklus}</p>
                        <span className="font-mono text-[10px] text-slate-400">{s.kd_siklus}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{unitName}</p>
                        <p className="text-[10px] text-emerald-700 font-bold">{komoditas}</p>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">{s.tahapKegiatan}</td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(s.tanggalMulai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {s.tanggalTargetPanen
                          ? new Date(s.tanggalTargetPanen).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {s.estimasiProduksi ? `${s.estimasiProduksi} ${s.satuanProduksi || ""}` : "-"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                            s.status === "BERJALAN"
                              ? "bg-emerald-600"
                              : s.status === "PANEN"
                              ? "bg-purple-600"
                              : "bg-sky-500"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {canEditOrDelete(
                          s.kebun?.kd_kecamatan || s.kolam?.kd_kecamatan || s.peternakan?.kd_kecamatan,
                          s.kebun?.kd_desa || s.kolam?.kd_desa || s.peternakan?.kd_desa,
                          s.jenisUsaha
                        ) ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.namaSiklus)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                            <Lock size={11} /> Hanya Lihat
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Menampilkan {data.length} dari {total} siklus produksi
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

      {/* Modal Tambah / Edit Siklus */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                {editItem ? "Edit Siklus Produksi" : "Tambah Siklus Produksi Baru"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Siklus</label>
                  <input
                    type="text"
                    value={formKdSiklus}
                    onChange={(e) => setFormKdSiklus(e.target.value)}
                    required
                    placeholder="Contoh: SKL-2025-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sektor Usaha</label>
                  <select
                    value={formJenisUsaha}
                    onChange={(e) => {
                      const newJenis = e.target.value as any;
                      setFormJenisUsaha(newJenis);
                      if (newJenis === "KEBUN") setFormKdUnit(kebunList[0]?.kd_kebun || "");
                      if (newJenis === "KOLAM") setFormKdUnit(kolamList[0]?.kd_kolam || "");
                      if (newJenis === "PETERNAKAN") setFormKdUnit(ternakList[0]?.kd_peternakan || "");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="KEBUN">Pertanian / Kebun</option>
                    <option value="KOLAM">Perikanan / Kolam</option>
                    <option value="PETERNAKAN">Peternakan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Siklus</label>
                <input
                  type="text"
                  value={formNamaSiklus}
                  onChange={(e) => setFormNamaSiklus(e.target.value)}
                  required
                  placeholder="Contoh: Panen Jagung Hibrida Musim I"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Usaha Terkait</label>
                  <select
                    value={formKdUnit}
                    onChange={(e) => setFormKdUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {formJenisUsaha === "KEBUN" &&
                      kebunList.map((k) => (
                        <option key={k.kd_kebun} value={k.kd_kebun}>
                          {k.nama}
                        </option>
                      ))}
                    {formJenisUsaha === "KOLAM" &&
                      kolamList.map((k) => (
                        <option key={k.kd_kolam} value={k.kd_kolam}>
                          {k.nm_kolam}
                        </option>
                      ))}
                    {formJenisUsaha === "PETERNAKAN" &&
                      ternakList.map((t) => (
                        <option key={t.kd_peternakan} value={t.kd_peternakan}>
                          {t.nm_peternakan}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahap Kegiatan</label>
                  <input
                    type="text"
                    value={formTahapKegiatan}
                    onChange={(e) => setFormTahapKegiatan(e.target.value)}
                    required
                    placeholder="Tanam / Tebar Benih / Panen / Pemeriksaan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formTglMulai}
                    onChange={(e) => setFormTglMulai(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Tanggal Panen</label>
                  <input
                    type="date"
                    value={formTglPanen}
                    onChange={(e) => setFormTglPanen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Produksi</label>
                  <input
                    type="number"
                    value={formEstimasi}
                    onChange={(e) => setFormEstimasi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    placeholder="Kg / Ton / Ekor"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="PERENCANAAN">PERENCANAAN</option>
                    <option value="BERJALAN">BERJALAN</option>
                    <option value="PANEN">PANEN</option>
                    <option value="GAGAL">GAGAL</option>
                    <option value="DIBATALKAN">DIBATALKAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

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
                  {saving ? "Menyimpan..." : "Simpan Siklus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
