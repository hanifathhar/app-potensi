"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";

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

export default function PenggunaClientView({ kecamatans, desas }: Props) {
  const [penggunaList, setPenggunaList] = useState<PenggunaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeran, setFilterPeran] = useState("semua");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<PenggunaItem | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    peran: "PETUGAS",
    kd_kecamatan: "",
    kd_desa: "",
    aktif: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPengguna = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        peran: filterPeran,
        kd_kecamatan: selectedKec,
        kd_desa: selectedDesa,
      });
      const res = await fetch(`/api/pengaturan/pengguna?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPenggunaList(json.data);
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
    fetchPengguna();
  }, [page, search, filterPeran, selectedKec, selectedDesa]);

  const filterDesaOptions = desas.filter((d) => d.kd_kecamatan === selectedKec);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/pengaturan/pengguna";
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
        fetchPengguna();
      } else {
        alert(json.error || "Gagal menyimpan akun pengguna");
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
      const res = await fetch(`/api/pengaturan/pengguna?id=${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeleteId(null);
        fetchPengguna();
      } else {
        alert(json.error || "Gagal menghapus pengguna");
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pengguna");
    }
  };

  const availableDesas = desas.filter((d) => d.kd_kecamatan === formData.kd_kecamatan);

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama pengguna, username, atau email..."
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
            {kecamatans.map((k) => (
              <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                {k.nm_kecamatan}
              </option>
            ))}
          </select>

          {/* Filter Desa (tampil ketika kecamatan dipilih) */}
          {selectedKec !== "semua" && (
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
          )}

          <select
            value={filterPeran}
            onChange={(e) => {
              setFilterPeran(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
          >
            <option value="semua">Semua Peran</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN_KABUPATEN">Admin Kabupaten</option>
            <option value="ADMIN_KECAMATAN">Admin Kecamatan</option>
            <option value="PETUGAS">Admin PPL / Petugas</option>
            <option value="KELOMPOK_TANI">Operator Kelompok Tani</option>
          </select>

          <button
            onClick={() => {
              setModalMode("create");
              setEditingItem(null);
              setFormData({
                nama: "",
                username: "",
                email: "",
                password: "",
                peran: "PETUGAS",
                kd_kecamatan: kecamatans[0]?.kd_kecamatan || "",
                kd_desa: "",
                aktif: true,
              });
              setIsModalOpen(true);
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
                <th className="p-4">Hak Akses (Role)</th>
                <th className="p-4">Wilayah Otoritas</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat data pengguna & hak akses...
                  </td>
                </tr>
              ) : penggunaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada akun pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                penggunaList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{u.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
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
                        <span className="text-slate-400 italic">Semua Wilayah (Kabupaten)</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{u.email || "-"}</td>
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
                            setModalMode("edit");
                            setEditingItem(u);
                            setFormData({
                              nama: u.nama,
                              username: u.username,
                              email: u.email || "",
                              password: "",
                              peran: u.peran,
                              kd_kecamatan: u.kd_kecamatan || "",
                              kd_desa: u.kd_desa || "",
                              aktif: u.aktif,
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          disabled={u.username === "admin"}
                          onClick={() => setDeleteId(u.id)}
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

        {/* Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>
            Menampilkan <span className="font-semibold text-slate-800">{penggunaList.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span> pengguna
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

      {/* Modal Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {modalMode === "create" ? "Tambah Akun Pengguna Baru" : "Edit Akun Pengguna"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Siregar, S.P."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
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
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {modalMode === "create" ? "Password" : "Password Baru (Kosongkan jika tetap)"}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "create"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses (RBAC)</label>
                  <select
                    value={formData.peran}
                    onChange={(e) => setFormData({ ...formData, peran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="ADMIN_KABUPATEN">Admin Kabupaten (Semua Data)</option>
                    <option value="ADMIN_KECAMATAN">Admin Kecamatan (Sesuai Wilayah)</option>
                    <option value="PETUGAS">Admin PPL / Penyuluh (Sesuai Wilayah)</option>
                    <option value="KELOMPOK_TANI">Operator Kelompok Tani</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={formData.aktif ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, aktif: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-bold"
                  >
                    <option value="true">Aktif (Dapat Login)</option>
                    <option value="false">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah Kecamatan</label>
                  <select
                    value={formData.kd_kecamatan}
                    onChange={(e) =>
                      setFormData({ ...formData, kd_kecamatan: e.target.value, kd_desa: "" })
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
                  <label className="block font-bold text-slate-700 mb-1">Wilayah Desa</label>
                  <select
                    value={formData.kd_desa}
                    onChange={(e) => setFormData({ ...formData, kd_desa: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  {saving ? "Menyimpan..." : "Simpan Pengguna"}
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
              <h4 className="font-extrabold text-base text-slate-900">Hapus Akun Pengguna?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Akun ini tidak akan dapat mengakses aplikasi lagi. Tindakan ini permanen.
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
