"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
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

export default function KomoditasClientView() {
  const [komoditasList, setKomoditasList] = useState<KomoditasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenisUsaha, setFilterJenisUsaha] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<KomoditasItem | null>(null);
  const [formData, setFormData] = useState({
    kd_komoditas: "",
    nm_komoditas: "",
    jenisUsaha: "KEBUN",
    satuanDefault: "Kg",
    urutan: 1,
    deskripsi: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchKomoditas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        jenisUsaha: filterJenisUsaha,
      });
      const res = await fetch(`/api/pengaturan/komoditas?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setKomoditasList(json.data);
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
    fetchKomoditas();
  }, [page, search, filterJenisUsaha]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/pengaturan/komoditas";
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
        fetchKomoditas();
      } else {
        alert(json.error || "Gagal menyimpan komoditas");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pengaturan/komoditas?id=${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeleteId(null);
        fetchKomoditas();
      } else {
        alert(json.error || "Gagal menghapus komoditas");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus komoditas");
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama komoditas, kode, atau deskripsi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterJenisUsaha}
            onChange={(e) => {
              setFilterJenisUsaha(e.target.value);
              setPage(1);
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
              setModalMode("create");
              setEditingItem(null);
              setFormData({
                kd_komoditas: "",
                nm_komoditas: "",
                jenisUsaha: "KEBUN",
                satuanDefault: "Kg",
                urutan: totalItems + 1,
                deskripsi: "",
              });
              setIsModalOpen(true);
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Memuat master komoditas...
                  </td>
                </tr>
              ) : komoditasList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data komoditas yang cocok.
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
                            setModalMode("edit");
                            setEditingItem(k);
                            setFormData({
                              kd_komoditas: k.kd_komoditas,
                              nm_komoditas: k.nm_komoditas,
                              jenisUsaha: k.jenisUsaha,
                              satuanDefault: k.satuanDefault || "Kg",
                              urutan: k.urutan || 1,
                              deskripsi: k.deskripsi || "",
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(k.id)}
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

        {/* Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>
            Menampilkan <span className="font-semibold text-slate-800">{komoditasList.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span> komoditas
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Hal {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Komoditas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {modalMode === "create" ? "Tambah Master Komoditas Unggulan" : "Edit Komoditas"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Komoditas</label>
                  <input
                    type="text"
                    placeholder="Auto generate jika kosong"
                    value={formData.kd_komoditas}
                    onChange={(e) => setFormData({ ...formData, kd_komoditas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sektor Usaha</label>
                  <select
                    value={formData.jenisUsaha}
                    onChange={(e) => setFormData({ ...formData, jenisUsaha: e.target.value })}
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
                  placeholder="Contoh: Kopi Arabika Sipirok, Salak Sibakkua, Ikan Mas"
                  value={formData.nm_komoditas}
                  onChange={(e) => setFormData({ ...formData, nm_komoditas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Default</label>
                  <input
                    type="text"
                    placeholder="Kg, Ton, Ekor, Liter"
                    value={formData.satuanDefault}
                    onChange={(e) => setFormData({ ...formData, satuanDefault: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Varietas unggulan lokal, spesifikasi benih / bibit..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
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
                  {saving ? "Menyimpan..." : "Simpan Komoditas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus */}
      {deleteId && (
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
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
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
