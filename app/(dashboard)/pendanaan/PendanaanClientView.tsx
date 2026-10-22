"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Sprout,
  Fish,
  Trees,
  Lock,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";

interface PendanaanItem {
  id: string;
  jenisUnit: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kd_kebun?: string;
  kd_kolam?: string;
  kd_peternakan?: string;
  kd_kecamatan?: string;
  kd_desa?: string;
  unitName?: string;
  lokasi?: string;
  namaProgram: string;
  sumberDana: string;
  namaSumberDana?: string;
  tahunAnggaran: number;
  nomorUsulan?: string;
  danaDiajukan: number;
  danaDisetujui?: number;
  danaDicairkan?: number;
  status: string;
  keterangan?: string;
}

interface UnitOption {
  id: string;
  kode: string;
  nama: string;
  jenis: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kd_kecamatan?: string;
  kd_desa?: string;
  lokasi: string;
}

interface Props {
  initialUnits: UnitOption[];
}

export default function PendanaanClientView({ initialUnits }: Props) {
  const {
    isKabupaten,
    isKecamatan,
    isPplOrDesa,
    authKecamatan,
    authDesa,
    authKecamatanName,
    authDesaName,
  } = useAuthority();
  const [data, setData] = useState<PendanaanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sumberDanaFilter, setSumberDanaFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [jenisUnitFilter, setJenisUnitFilter] = useState("semua");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Wilayah lists
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

  useEffect(() => {
    const loadWilayah = async () => {
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
    loadWilayah();
  }, []);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<PendanaanItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    jenisUnit: "KEBUN",
    kd_unit: "",
    namaProgram: "",
    sumberDana: "APBD_KABUPATEN",
    namaSumberDana: "",
    tahunAnggaran: 2025,
    nomorUsulan: "",
    danaDiajukan: "",
    danaDisetujui: "",
    danaDicairkan: "",
    status: "RENCANA",
    keterangan: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: string; jenisUnit: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        kd_kecamatan: selectedKec,
        kd_desa: selectedDesa,
        sumberDana: sumberDanaFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/pendanaan?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        let filtered = json.data;
        if (jenisUnitFilter !== "semua") {
          filtered = filtered.filter((item: PendanaanItem) => item.jenisUnit === jenisUnitFilter);
        }
        setData(filtered);
        setTotalPages(json.totalPages || 1);
        setTotalItems(json.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, selectedKec, selectedDesa, sumberDanaFilter, statusFilter, jenisUnitFilter]);

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingItem(null);
    setFormData({
      jenisUnit: "KEBUN",
      kd_unit: initialUnits.find((u) => u.jenis === "KEBUN")?.kode || "",
      namaProgram: "",
      sumberDana: "APBD_KABUPATEN",
      namaSumberDana: "",
      tahunAnggaran: 2025,
      nomorUsulan: "",
      danaDiajukan: "",
      danaDisetujui: "",
      danaDicairkan: "0",
      status: "RENCANA",
      keterangan: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PendanaanItem) => {
    setModalMode("edit");
    setEditingItem(item);
    setFormData({
      jenisUnit: item.jenisUnit,
      kd_unit: item.kd_kebun || item.kd_kolam || item.kd_peternakan || "",
      namaProgram: item.namaProgram || "",
      sumberDana: item.sumberDana || "APBD_KABUPATEN",
      namaSumberDana: item.namaSumberDana || "",
      tahunAnggaran: item.tahunAnggaran || 2025,
      nomorUsulan: item.nomorUsulan || "",
      danaDiajukan: item.danaDiajukan?.toString() || "0",
      danaDisetujui: item.danaDisetujui?.toString() || "0",
      danaDicairkan: item.danaDicairkan?.toString() || "0",
      status: item.status || "RENCANA",
      keterangan: item.keterangan || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/pendanaan";
      const method = modalMode === "create" ? "POST" : "PUT";
      const payload = {
        ...formData,
        id: editingItem?.id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(json.error || "Gagal menyimpan data pendanaan");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/pendanaan?id=${deleteConfirmId.id}&jenisUnit=${deleteConfirmId.jenisUnit}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        alert(json.error || "Gagal menghapus data pendanaan");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data pendanaan");
    } finally {
      setDeleting(false);
    }
  };

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const canEditOrDelete = (itemKec?: string, itemDesa?: string) => {
    if (isKabupaten) return true;
    if (isKecamatan) return itemKec === authKecamatan;
    if (isPplOrDesa) {
      if (authKecamatan && itemKec !== authKecamatan) return false;
      if (authDesa && itemDesa !== authDesa) return false;
      return true;
    }
    return false;
  };

  const availableUnits = initialUnits.filter((u) => {
    if (u.jenis !== formData.jenisUnit) return false;
    if (isKabupaten) return true;
    if (isKecamatan) return u.kd_kecamatan === authKecamatan;
    if (isPplOrDesa) {
      if (authKecamatan && u.kd_kecamatan !== authKecamatan) return false;
      if (authDesa && u.kd_desa !== authDesa) return false;
      return true;
    }
    return false;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DICAIRKAN":
      case "SELESAI":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "DISETUJUI":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DIAJUKAN":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DITOLAK":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari program bantuan, nomor usulan, atau nama unit..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kecamatan */}
            {isKabupaten ? (
              <select
                value={selectedKec}
                onChange={(e) => {
                  setSelectedKec(e.target.value);
                  setSelectedDesa("semua");
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
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
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a] max-w-[200px]"
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

            <select
              value={sumberDanaFilter}
              onChange={(e) => {
                setSumberDanaFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
            >
              <option value="semua">Semua Sumber Dana</option>
              <option value="APBN">APBN (Pusat)</option>
              <option value="APBD_PROVINSI">APBD Provinsi</option>
              <option value="APBD_KABUPATEN">APBD Tapsel</option>
              <option value="DANA_DESA">Dana Desa</option>
              <option value="SWADAYA">Swadaya</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
            >
              <option value="semua">Semua Status</option>
              <option value="RENCANA">Rencana</option>
              <option value="DIAJUKAN">Diajukan</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DICAIRKAN">Dicairkan</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>

            <select
              value={jenisUnitFilter}
              onChange={(e) => {
                setJenisUnitFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
            >
              <option value="semua">Semua Sektor Unit</option>
              <option value="KEBUN">Pertanian (Kebun)</option>
              <option value="KOLAM">Perikanan (Kolam)</option>
              <option value="PETERNAKAN">Peternakan</option>
            </select>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow"
            >
              <Plus size={16} />
              Tambah Pendanaan
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Program & Sumber Dana</th>
                <th className="p-4">Unit Penerima & Sektor</th>
                <th className="p-4">Tahun & No. Usulan</th>
                <th className="p-4">Dana Diajukan</th>
                <th className="p-4">Dana Dicairkan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Memuat data pendanaan...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data pendanaan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.namaProgram}</p>
                      <span className="inline-block mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                        {item.sumberDana} {item.namaSumberDana ? `(${item.namaSumberDana})` : ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.jenisUnit === "KEBUN" ? (
                          <Sprout size={14} className="text-emerald-600 shrink-0" />
                        ) : item.jenisUnit === "KOLAM" ? (
                          <Fish size={14} className="text-sky-600 shrink-0" />
                        ) : (
                          <Trees size={14} className="text-amber-600 shrink-0" />
                        )}
                        <p className="font-bold text-slate-800">{item.unitName || "-"}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.lokasi || "-"}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-700">Thn {item.tahunAnggaran}</span>
                      <p className="text-[10px] text-slate-400">{item.nomorUsulan || "Tanpa No. Usulan"}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {formatRupiah(item.danaDiajukan)}
                      {item.danaDisetujui && item.danaDisetujui !== item.danaDiajukan && (
                        <p className="text-[10px] text-blue-600">
                          Acc: {formatRupiah(item.danaDisetujui)}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {formatRupiah(item.danaDicairkan || 0)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {canEditOrDelete(item.kd_kecamatan, item.kd_desa) ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId({ id: item.id, jenisUnit: item.jenisUnit })}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                          <Lock size={11} /> Hanya Lihat
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
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Menampilkan <span className="font-semibold text-slate-800">{data.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span> data pendanaan
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Hal {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {modalMode === "create" ? "Tambah Data Pendanaan / Bantuan" : "Edit Data Pendanaan"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {modalMode === "create" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sektor Unit Usaha</label>
                    <select
                      value={formData.jenisUnit}
                      onChange={(e) => {
                        const nextJenis = e.target.value as any;
                        const matchUnit = initialUnits.find((u) => u.jenis === nextJenis);
                        setFormData({
                          ...formData,
                          jenisUnit: nextJenis,
                          kd_unit: matchUnit ? matchUnit.kode : "",
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-medium"
                    >
                      <option value="KEBUN">Pertanian (Kebun)</option>
                      <option value="KOLAM">Perikanan (Kolam)</option>
                      <option value="PETERNAKAN">Peternakan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilih Unit Usaha</label>
                    <select
                      value={formData.kd_unit}
                      onChange={(e) => setFormData({ ...formData, kd_unit: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-medium"
                    >
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.kode}>
                          {u.nama} ({u.lokasi})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Program Bantuan / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bantuan Benih Unggul Padi & Sarana Saprotan"
                  value={formData.namaProgram}
                  onChange={(e) => setFormData({ ...formData, namaProgram: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
                  <select
                    value={formData.sumberDana}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a]"
                  >
                    <option value="APBN">APBN (Pusat)</option>
                    <option value="APBD_PROVINSI">APBD Provinsi</option>
                    <option value="APBD_KABUPATEN">APBD Tapsel</option>
                    <option value="DANA_DESA">Dana Desa</option>
                    <option value="SWADAYA">Swadaya</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={formData.tahunAnggaran}
                    onChange={(e) => setFormData({ ...formData, tahunAnggaran: parseInt(e.target.value) || 2025 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Usulan / SK</label>
                  <input
                    type="text"
                    placeholder="Contoh: 520/041/DISPERTA/2025"
                    value={formData.nomorUsulan}
                    onChange={(e) => setFormData({ ...formData, nomorUsulan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dana Diajukan (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.danaDiajukan}
                    onChange={(e) => setFormData({ ...formData, danaDiajukan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dana Disetujui (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.danaDisetujui}
                    onChange={(e) => setFormData({ ...formData, danaDisetujui: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dana Dicairkan (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.danaDicairkan}
                    onChange={(e) => setFormData({ ...formData, danaDicairkan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Verifikasi & Realisasi</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="RENCANA">RENCANA</option>
                    <option value="DIAJUKAN">DIAJUKAN</option>
                    <option value="DISETUJUI">DISETUJUI</option>
                    <option value="DICAIRKAN">DICAIRKAN</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Sumber Dana</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinas Pertanian Kab. Tapanuli Selatan"
                    value={formData.namaSumberDana}
                    onChange={(e) => setFormData({ ...formData, namaSumberDana: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Dokumen Pendukung</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan, SP2D, nomor kontrak, atau bukti transfer..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">Hapus Data Pendanaan?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini tidak dapat dibatalkan. Riwayat pencairan dan alokasi dana akan terhapus.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
