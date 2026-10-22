"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Beef,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Camera,
  Upload,
  Loader2,
  Image as ImageIcon,
  Users,
  Eye,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";
import LocationPicker from "@/components/potensi/LocationPicker";

interface PeternakanItem {
  id: string;
  kd_peternakan: string;
  nm_peternakan: string;
  kd_desa: string;
  kd_kecamatan: string;
  kd_kelompok?: string;
  kd_komoditas: string;
  namaPemilik?: string;
  alamatLokasi?: string;
  latitude?: number;
  longitude?: number;
  jenisTernak?: string;
  jenisKandang?: string;
  jumlahKandang?: number;
  jumlahTernak?: number;
  satuanTernak?: string;
  sistemPemeliharaan?: string;
  sumberPakan?: string;
  status: string;
  deskripsi?: string;
  foto?: { id?: string; url: string; judul?: string; jenisFoto?: string }[];
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  komoditas?: { nm_komoditas: string };
  kelompokTani?: { nm_kelompok: string };
}

export default function PeternakanClientView() {
  const {
    user,
    isKabupaten,
    isKecamatan,
    isPpl,
    isPplOrDesa,
    isLockedDesa,
    authKecamatan,
    authDesa,
    authDesaList,
    authKecamatanName,
    authDesaName,
    canChangeKecamatan,
    canChangeDesa,
    canEditOrDeleteRecord,
  } = useAuthority();

  const [data, setData] = useState<PeternakanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [selectedKomoditas, setSelectedKomoditas] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dropdowns
  const [kecamatanList, setKecamatanList] = useState<{ kd_kecamatan: string; nm_kecamatan: string }[]>([]);
  const [desaList, setDesaList] = useState<{ kd_desa: string; nm_desa: string; kd_kecamatan: string }[]>([]);
  const [komoditasList, setKomoditasList] = useState<{ kd_komoditas: string; nm_komoditas: string }[]>([]);
  const [poktanList, setPoktanList] = useState<{
    kd_kelompok: string;
    nm_kelompok: string;
    kd_kecamatan?: string;
    kd_desa?: string;
    namaKetua?: string;
    jumlahAnggota?: number;
    tahunBerdiri?: number;
    alamat?: string;
    kecamatan?: { nm_kecamatan: string };
    desa?: { nm_desa: string };
  }[]>([]);

  // Poktan Search Dialog Modal State
  const [poktanModalOpen, setPoktanModalOpen] = useState(false);
  const [poktanSearch, setPoktanSearch] = useState("");
  const [showAllInKec, setShowAllInKec] = useState(false);

  // Sync authority into filter
  useEffect(() => {
    if (!isKabupaten && authKecamatan) {
      setSelectedKec(authKecamatan);
    }
    if (isLockedDesa && authDesa) {
      setSelectedDesa(authDesa);
    }
  }, [isKabupaten, authKecamatan, isLockedDesa, authDesa]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PeternakanItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formKdPeternakan, setFormKdPeternakan] = useState("");
  const [formNmPeternakan, setFormNmPeternakan] = useState("");
  const [formKdKecamatan, setFormKdKecamatan] = useState("");
  const [formKdDesa, setFormKdDesa] = useState("");
  const [formKdKomoditas, setFormKdKomoditas] = useState("");
  const [formKdKelompok, setFormKdKelompok] = useState("");
  const [formNamaPemilik, setFormNamaPemilik] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formJumlahTernak, setFormJumlahTernak] = useState("20");
  const [formSatuanTernak, setFormSatuanTernak] = useState("Ekor");
  const [formJenisTernak, setFormJenisTernak] = useState("Sapi Potong Simental");
  const [formJenisKandang, setFormJenisKandang] = useState("Kandang Koloni Terbuka");
  const [formSumberPakan, setFormSumberPakan] = useState("Rumput Gajah & Konsentrat");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formStatus, setFormStatus] = useState("AKTIF");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formFotoUrl, setFormFotoUrl] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload handler foto peternakan / kegiatan
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "peternakan");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal mengunggah foto");
      setFormFotoUrl(json.url);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Gagal mengunggah foto" });
    } finally {
      setUploadingFoto(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [resKec, resDesa, resKom, resPok] = await Promise.all([
        fetch("/api/public/wilayah"),
        fetch("/api/public/wilayah?all_desa=true"),
        fetch("/api/public/bidang"),
        fetch("/api/kelompok-tani?limit=500"),
      ]);
      const jsonKec = await resKec.json();
      const jsonDesa = await resDesa.json();
      const jsonKom = await resKom.json();
      const jsonPok = await resPok.json();

      if (jsonKec.success) setKecamatanList(jsonKec.data);
      if (jsonDesa.success) setDesaList(jsonDesa.data);
      if (jsonKom.success) {
        setKomoditasList(jsonKom.data.filter((k: any) => k.jenisUsaha === "PETERNAKAN"));
      }
      if (jsonPok.success) setPoktanList(jsonPok.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/peternakan?search=${encodeURIComponent(search)}&kd_kecamatan=${selectedKec}&kd_desa=${selectedDesa}&kd_komoditas=${selectedKomoditas}&status=${selectedStatus}&page=${page}&limit=10`
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
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, selectedKec, selectedDesa, selectedKomoditas, selectedStatus, page]);

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  // Filter desas according to territory authority
  const availableDesas = desaList.filter((d) => {
    if (d.kd_kecamatan !== formKdKecamatan) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (isPplOrDesa && authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  // Filtered Poktan untuk Modal Dialog Pencarian
  const filteredPoktanModal = poktanList.filter((p) => {
    // Jika tidak memilih seluruh kecamatan, filter berdasarkan desa yang dipilih di form
    if (!showAllInKec && formKdDesa) {
      if (p.kd_desa !== formKdDesa) return false;
    } else if (formKdKecamatan) {
      if (p.kd_kecamatan && p.kd_kecamatan !== formKdKecamatan) return false;
    }

    if (poktanSearch.trim()) {
      const q = poktanSearch.toLowerCase();
      const matchName = p.nm_kelompok?.toLowerCase().includes(q);
      const matchKetua = p.namaKetua?.toLowerCase().includes(q);
      const matchKode = p.kd_kelompok?.toLowerCase().includes(q);
      const matchDesa = p.desa?.nm_desa?.toLowerCase().includes(q);
      return Boolean(matchName || matchKetua || matchKode || matchDesa);
    }

    return true;
  });

  const handleSelectPoktan = (poktan: { kd_kelompok: string; nm_kelompok: string; namaKetua?: string }) => {
    setFormKdKelompok(poktan.kd_kelompok);
    // Jika nama pemilik/peternak belum terisi, otomatis isi nama ketua kelompok
    if (!formNamaPemilik.trim() && poktan.namaKetua && poktan.namaKetua !== "-") {
      setFormNamaPemilik(poktan.namaKetua);
    }
    setPoktanModalOpen(false);
  };

  const canEditOrDelete = (itemKecamatan: string, itemDesa: string) => {
    return canEditOrDeleteRecord(itemKecamatan, itemDesa, "peternakan");
  };

  const openTambah = () => {
    setEditItem(null);
    let defaultKec = kecamatanList[0]?.kd_kecamatan || "";
    if (!isKabupaten && authKecamatan) {
      defaultKec = authKecamatan;
    }

    const desasOfKec = desaList.filter((d) => {
      if (d.kd_kecamatan !== defaultKec) return false;
      if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
      return true;
    });
    let defaultDesa = desasOfKec[0]?.kd_desa || "";
    if (isPpl && authDesaList.length > 0) {
      defaultDesa = authDesaList[0];
    } else if (isPplOrDesa && authDesa) {
      defaultDesa = authDesa;
    }

    setFormKdPeternakan(`TRN-${Date.now().toString().slice(-6)}`);
    setFormNmPeternakan("");
    setFormKdKecamatan(defaultKec);
    setFormKdDesa(defaultDesa);
    setFormKdKomoditas(komoditasList[0]?.kd_komoditas || "TRN-SAPI");
    setFormKdKelompok("");
    setFormNamaPemilik("");
    setFormAlamat("");
    setFormJumlahTernak("25");
    setFormSatuanTernak("Ekor");
    setFormJenisTernak("Sapi Limosin / Simental");
    setFormJenisKandang("Kandang Koloni");
    setFormSumberPakan("Rumput Gajah & Silase");
    setFormLat("1.2850");
    setFormLng("99.4210");
    setFormStatus("AKTIF");
    setFormDeskripsi("");
    setFormFotoUrl("");
    setModalOpen(true);
  };

  const openEdit = (item: PeternakanItem) => {
    setEditItem(item);
    setFormKdPeternakan(item.kd_peternakan);
    setFormNmPeternakan(item.nm_peternakan);
    setFormKdKecamatan(item.kd_kecamatan);
    setFormKdDesa(item.kd_desa);
    setFormKdKomoditas(item.kd_komoditas);
    setFormKdKelompok(item.kd_kelompok || "");
    setFormNamaPemilik(item.namaPemilik || "");
    setFormAlamat(item.alamatLokasi || "");
    setFormJumlahTernak(String(item.jumlahTernak || 0));
    setFormSatuanTernak(item.satuanTernak || "Ekor");
    setFormJenisTernak(item.jenisTernak || "");
    setFormJenisKandang(item.jenisKandang || "");
    setFormSumberPakan(item.sumberPakan || "");
    setFormLat(item.latitude ? String(item.latitude) : "");
    setFormLng(item.longitude ? String(item.longitude) : "");
    setFormStatus(item.status);
    setFormDeskripsi(item.deskripsi || "");
    setFormFotoUrl(item.foto?.[0]?.url || "");
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
        kd_peternakan: formKdPeternakan,
        nm_peternakan: formNmPeternakan,
        kd_kecamatan: formKdKecamatan,
        kd_desa: formKdDesa,
        kd_komoditas: formKdKomoditas,
        kd_kelompok: formKdKelompok || null,
        namaPemilik: formNamaPemilik,
        alamatLokasi: formAlamat,
        jumlahTernak: formJumlahTernak,
        satuanTernak: formSatuanTernak,
        jenisTernak: formJenisTernak,
        jenisKandang: formJenisKandang,
        sumberPakan: formSumberPakan,
        latitude: formLat,
        longitude: formLng,
        status: formStatus,
        deskripsi: formDeskripsi,
        fotoUrl: formFotoUrl || null,
      };

      const res = await fetch("/api/peternakan", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan data");

      setAlert({
        type: "success",
        message: `Data Peternakan berhasil ${editItem ? "diperbarui" : "ditambahkan"}!`,
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
    if (!confirm(`Hapus Peternakan ${name}?`)) return;
    try {
      const res = await fetch(`/api/peternakan?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Peternakan ${name} berhasil dihapus.` });
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
                placeholder="Cari peternakan / pemilik..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
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
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
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
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 max-w-[220px]"
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

            {/* Filter Komoditas */}
            <select
              value={selectedKomoditas}
              onChange={(e) => {
                setSelectedKomoditas(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            >
              <option value="semua">Semua Ternak</option>
              {komoditasList.map((k) => (
                <option key={k.kd_komoditas} value={k.kd_komoditas}>
                  {k.nm_komoditas}
                </option>
              ))}
            </select>
          </div>

          {/* Tambah Button */}
          <button
            onClick={openTambah}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#ea580c] hover:bg-orange-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>Tambah Usaha Ternak</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Kode & Nama Usaha</th>
                <th className="p-3.5">Komoditas Ternak</th>
                <th className="p-3.5">Lokasi Wilayah</th>
                <th className="p-3.5">Pemilik / Pengelola</th>
                <th className="p-3.5 text-center">Populasi</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Memuat data peternakan...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data usaha peternakan ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {t.foto && t.foto.length > 0 && t.foto[0].url ? (
                          <img
                            src={t.foto[0].url}
                            alt={t.nm_peternakan}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <Beef size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{t.nm_peternakan}</p>
                          <span className="font-mono text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                            {t.kd_peternakan}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-orange-800">
                      {t.komoditas?.nm_komoditas}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">Desa {t.desa?.nm_desa || "-"}</p>
                      <p className="text-[10px] text-slate-500">Kec. {t.kecamatan?.nm_kecamatan || "-"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{t.namaPemilik || "-"}</p>
                      <p className="text-[10px] text-slate-500">{t.kelompokTani?.nm_kelompok || "Mandiri"}</p>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {t.jumlahTernak || 0} {t.satuanTernak || "Ekor"}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/peternakan/${t.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-orange-700 hover:bg-orange-50 transition"
                          title="Lihat Halaman Detail"
                        >
                          <Eye size={14} />
                        </Link>
                        {canEditOrDelete(t.kd_kecamatan, t.kd_desa) ? (
                          <>
                            <button
                              onClick={() => openEdit(t)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-orange-700 hover:bg-orange-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id, t.nm_peternakan)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-200/60" title="Di luar wilayah otoritas Anda">
                            <Lock size={10} /> Hanya Lihat
                          </span>
                        )}
                      </div>
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
            Menampilkan {data.length} dari {total} peternakan terdaftar
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

      {/* Modal Tambah / Edit Peternakan (Lebar & Lengkap) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                  <Beef size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editItem ? "Edit Usaha Peternakan" : "Tambah Usaha Peternakan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Lengkapi data usaha peternakan dan dokumentasi foto kandang/kegiatan</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Bagian Identitas */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-800 mb-2.5 pb-1 border-b border-slate-100">
                  1. Identitas Usaha & Komoditas Ternak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Peternakan</label>
                    <input
                      type="text"
                      value={formKdPeternakan}
                      onChange={(e) => setFormKdPeternakan(e.target.value)}
                      required
                      placeholder="Contoh: TRN-1202-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nama Peternakan / Kandang</label>
                    <input
                      type="text"
                      value={formNmPeternakan}
                      onChange={(e) => setFormNmPeternakan(e.target.value)}
                      required
                      placeholder="Contoh: Peternakan Sapi Lembu Barokah"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komoditas Ternak</label>
                    <select
                      value={formKdKomoditas}
                      onChange={(e) => setFormKdKomoditas(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    >
                      {komoditasList.map((k) => (
                        <option key={k.kd_komoditas} value={k.kd_komoditas}>
                          {k.nm_komoditas}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pemilik / Peternak</label>
                    <input
                      type="text"
                      value={formNamaPemilik}
                      onChange={(e) => setFormNamaPemilik(e.target.value)}
                      placeholder="Contoh: Zulkifli Nasution"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian Wilayah & Lokasi */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-800 mb-2.5 pb-1 border-b border-slate-100">
                  2. Wilayah & Titik Lokasi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                          const firstDesa = desas[0]?.kd_desa || "";
                          setFormKdDesa(firstDesa);
                          setFormKdKelompok("");
                        }}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                      >
                        {kecamatanList.map((k) => (
                          <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                            {k.nm_kecamatan}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between">
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
                        onChange={(e) => {
                          setFormKdDesa(e.target.value);
                          setFormKdKelompok("");
                        }}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
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
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between">
                        <span>Desa {desaList.find((d) => d.kd_desa === formKdDesa)?.nm_desa || authDesaName || formKdDesa}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Wilayah PPL</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Kelompok Tani / Ternak (Setelah Memilih Desa) */}
                <div className="mt-3.5">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-orange-600" />
                      <span>Kelompok Tani / Ternak</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Sesuai Desa: {desaList.find((d) => d.kd_desa === formKdDesa)?.nm_desa || "Pilih desa"}
                    </span>
                  </label>

                  {formKdKelompok ? (
                    // Tampilan jika sudah memilih kelompok tani
                    <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Users size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {poktanList.find((p) => p.kd_kelompok === formKdKelompok)?.nm_kelompok || formKdKelompok}
                            </h5>
                            <span className="text-[10px] bg-orange-100 text-orange-800 font-mono px-1.5 py-0.5 rounded">
                              {formKdKelompok}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Ketua:{" "}
                            <span className="font-semibold text-slate-700">
                              {poktanList.find((p) => p.kd_kelompok === formKdKelompok)?.namaKetua || "-"}
                            </span>
                            {poktanList.find((p) => p.kd_kelompok === formKdKelompok)?.jumlahAnggota ? (
                              <span> • {poktanList.find((p) => p.kd_kelompok === formKdKelompok)?.jumlahAnggota} Anggota</span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPoktanSearch("");
                            setPoktanModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-orange-300 hover:bg-orange-50 text-orange-700 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition"
                        >
                          <Search size={12} />
                          <span>Ganti</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormKdKelompok("")}
                          title="Hapus pilihan kelompok (Jadikan Non-Kelompok)"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-400 text-[11px] transition"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Tampilan jika belum memilih (Trigger Dialog Pencarian)
                    <div
                      onClick={() => {
                        setPoktanSearch("");
                        setPoktanModalOpen(true);
                      }}
                      className="group cursor-pointer w-full p-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/40 bg-slate-50/60 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800">
                        <Users size={16} className="text-slate-400 group-hover:text-orange-600 transition" />
                        <span className="text-xs">
                          (Non-Kelompok / Mandiri) - <span className="text-orange-600 font-semibold group-hover:underline">Klik untuk cari & pilih Kelompok Tani / Ternak</span>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 group-hover:border-orange-300 group-hover:text-orange-700 text-slate-600 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition shrink-0">
                        <Search size={12} />
                        <span>Cari Kelompok</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alamat / Dusun</label>
                    <input
                      type="text"
                      value={formAlamat}
                      onChange={(e) => setFormAlamat(e.target.value)}
                      placeholder="Contoh: Dusun Simaninggir, Kec. Angkola"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>

                  <LocationPicker
                    lat={formLat}
                    lng={formLng}
                    onChange={(newLat, newLng) => {
                      setFormLat(newLat);
                      setFormLng(newLng);
                    }}
                    accentColor="orange"
                    unitName={formNmPeternakan || "Usaha Peternakan"}
                  />
                </div>
              </div>

              {/* Bagian Data Teknis Peternakan */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-800 mb-2.5 pb-1 border-b border-slate-100">
                  3. Spesifikasi Teknis Peternakan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Populasi Ternak</label>
                    <input
                      type="number"
                      value={formJumlahTernak}
                      onChange={(e) => setFormJumlahTernak(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan Populasi</label>
                    <input
                      type="text"
                      value={formSatuanTernak}
                      onChange={(e) => setFormSatuanTernak(e.target.value)}
                      placeholder="Ekor / Indukan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Kandang</label>
                    <input
                      type="text"
                      value={formJenisKandang}
                      onChange={(e) => setFormJenisKandang(e.target.value)}
                      placeholder="Koloni / Panggung"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Usaha</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="ISTIRAHAT">ISTIRAHAT</option>
                      <option value="GAGAL_PANEN">WABAH / PENYAKIT</option>
                      <option value="NON_AKTIF">NON AKTIF</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rincian Jenis / Ras Ternak</label>
                    <input
                      type="text"
                      value={formJenisTernak}
                      onChange={(e) => setFormJenisTernak(e.target.value)}
                      placeholder="Contoh: Sapi Simental / Limosin / Kambing Etawa"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber & Manajemen Pakan</label>
                    <input
                      type="text"
                      value={formSumberPakan}
                      onChange={(e) => setFormSumberPakan(e.target.value)}
                      placeholder="Rumput Gajah, Konsentrat, Silase"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian Foto Dokumentasi Kandang / Kegiatan */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-800 mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Camera size={14} />
                  <span>4. Foto Kegiatan & Dokumentasi Kandang</span>
                </h4>
                
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-5">
                  {/* Preview / Placeholder */}
                  <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 relative group shadow-2xs">
                    {formFotoUrl ? (
                      <>
                        <img
                          src={formFotoUrl}
                          alt="Foto Usaha Peternakan"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormFotoUrl("")}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-md opacity-90 hover:opacity-100 shadow transition"
                          title="Hapus Foto"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 text-center">
                        <ImageIcon size={32} className="text-slate-300" />
                        <span className="text-[11px]">Belum ada foto</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & Guide */}
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-slate-800 text-xs">
                      Unggah Foto Dokumentasi Kandang / Ternak
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Format yang didukung: JPG, PNG, atau WEBP (Maksimal 5MB). Foto akan ditampilkan pada profil direktori peternakan dan pemetaan potensi daerah.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer shadow-xs transition">
                        {uploadingFoto ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Mengunggah Foto...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Pilih File Foto</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleUploadFoto}
                          disabled={uploadingFoto}
                        />
                      </label>
                      {formFotoUrl && (
                        <span className="text-[11px] text-orange-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                          Foto terpasang
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Tambahan & Catatan Lapangan</label>
                <textarea
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  rows={2}
                  placeholder="Tambahkan catatan khusus program vaksinasi, kondisi kesehatan ternak, atau kendala lapangan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFoto}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold text-white shadow-xs disabled:opacity-50 transition"
                >
                  {saving ? "Menyimpan Data..." : "Simpan Data Ternak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Pencarian Kelompok Tani / Ternak */}
      {poktanModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            {/* Header Dialog */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Users size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Pilih Kelompok Tani / Ternak
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kec. {kecamatanList.find((k) => k.kd_kecamatan === formKdKecamatan)?.nm_kecamatan || "-"} • Desa{" "}
                    {desaList.find((d) => d.kd_desa === formKdDesa)?.nm_desa || "(Semua Desa)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPoktanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar & Filter Options */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={poktanSearch}
                  onChange={(e) => setPoktanSearch(e.target.value)}
                  placeholder="Ketik nama kelompok, nama ketua, atau kode..."
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition"
                />
                {poktanSearch && (
                  <button
                    type="button"
                    onClick={() => setPoktanSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Menampilkan <strong className="text-slate-800">{filteredPoktanModal.length}</strong> kelompok tani
                </span>
                {formKdKecamatan && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-orange-700 hover:text-orange-800 font-medium">
                    <input
                      type="checkbox"
                      checked={showAllInKec}
                      onChange={(e) => setShowAllInKec(e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 text-xs"
                    />
                    <span>Cari se-Kecamatan</span>
                  </label>
                )}
              </div>
            </div>

            {/* List Kelompok Tani */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1 text-xs">
              {/* Opsi Non-Kelompok / Mandiri */}
              <div
                onClick={() => {
                  setFormKdKelompok("");
                  setPoktanModalOpen(false);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  !formKdKelompok
                    ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/10"
                    : "border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                    -
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Non-Kelompok / Peternak Mandiri</h5>
                    <p className="text-[11px] text-slate-400">Pilih opsi ini jika usaha ternak dikelola perorangan secara mandiri</p>
                  </div>
                </div>
                {!formKdKelompok ? (
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                    Aktif Terpilih
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">Pilih</span>
                )}
              </div>

              {/* List Data Kelompok */}
              {filteredPoktanModal.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <AlertCircle size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Tidak ada kelompok tani yang sesuai</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {showAllInKec
                      ? "Coba gunakan kata kunci pencarian yang lain."
                      : "Belum ada kelompok di desa ini. Coba aktifkan centang 'Cari se-Kecamatan' di atas."}
                  </p>
                </div>
              ) : (
                filteredPoktanModal.map((p) => {
                  const isSelected = formKdKelompok === p.kd_kelompok;
                  return (
                    <div
                      key={p.kd_kelompok}
                      onClick={() => handleSelectPoktan(p)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/15"
                          : "border-slate-200 hover:border-orange-400 hover:bg-orange-50/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-xs text-slate-900 group-hover:text-orange-700 transition truncate">
                            {p.nm_kelompok}
                          </h5>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.kd_kelompok}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span>
                            Ketua: <strong className="text-slate-700">{p.namaKetua || "-"}</strong>
                          </span>
                          {p.jumlahAnggota ? (
                            <span>• {p.jumlahAnggota} Anggota</span>
                          ) : null}
                          <span>
                            • Desa {p.desa?.nm_desa || desaList.find((d) => d.kd_desa === p.kd_desa)?.nm_desa || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Terpilih</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white px-2.5 py-1 rounded-lg transition"
                          >
                            Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Dialog */}
            <div className="p-3 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPoktanModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-xs font-semibold text-slate-600 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
