"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sprout,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  Calendar,
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
  Layers,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";
import LocationPicker from "@/components/potensi/LocationPicker";

interface KebunItem {
  id: string;
  kd_kebun: string;
  nama: string;
  kd_desa: string;
  kd_kecamatan: string;
  kd_kelompok?: string;
  kd_komoditas: string;
  namaPemilik?: string;
  alamatLokasi?: string;
  latitude?: number;
  longitude?: number;
  luasLahanHa?: number;
  tahunTanam?: number;
  sistemTanam?: string;
  kondisiTanaman?: string;
  statusLahan?: string;
  status: string;
  statusUsaha?: string;
  deskripsi?: string;
  foto?: { id?: string; url: string; judul?: string; jenisFoto?: string }[];
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  komoditas?: { nm_komoditas: string };
  kelompokTani?: { nm_kelompok: string };
}

export default function PertanianClientView() {
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

  const [data, setData] = useState<KebunItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [selectedKomoditas, setSelectedKomoditas] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Statistics
  const [stats, setStats] = useState<{
    totalKebun: number;
    totalLuasHa: number;
    totalKomoditas: number;
    statusAktif: number;
    statusIstirahat: number;
    statusGagalPanen: number;
    statusNonAktif: number;
  }>({
    totalKebun: 0,
    totalLuasHa: 0,
    totalKomoditas: 0,
    statusAktif: 0,
    statusIstirahat: 0,
    statusGagalPanen: 0,
    statusNonAktif: 0,
  });

  // Dropdown lists
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
  const [editItem, setEditItem] = useState<KebunItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formKdKebun, setFormKdKebun] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKdKecamatan, setFormKdKecamatan] = useState("");
  const [formKdDesa, setFormKdDesa] = useState("");
  const [formKdKomoditas, setFormKdKomoditas] = useState("");
  const [formKdKelompok, setFormKdKelompok] = useState("");
  const [formNamaPemilik, setFormNamaPemilik] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formLuasHa, setFormLuasHa] = useState("1.0");
  const [formTahunTanam, setFormTahunTanam] = useState("2023");
  const [formSistemTanam, setFormSistemTanam] = useState("Monokultur");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formStatus, setFormStatus] = useState("AKTIF");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formFotoUrl, setFormFotoUrl] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload handler
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pertanian");
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

  // Load Dropdowns
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
        setKomoditasList(jsonKom.data.filter((k: any) => k.jenisUsaha === "KEBUN"));
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
        `/api/pertanian?search=${encodeURIComponent(search)}&kd_kecamatan=${selectedKec}&kd_desa=${selectedDesa}&kd_komoditas=${selectedKomoditas}&status=${selectedStatus}&page=${page}&limit=10`
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        if (json.stats) {
          setStats(json.stats);
        }
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
    // Jika nama pemilik/pengelola belum terisi, otomatis isi nama ketua kelompok
    if (!formNamaPemilik.trim() && poktan.namaKetua && poktan.namaKetua !== "-") {
      setFormNamaPemilik(poktan.namaKetua);
    }
    setPoktanModalOpen(false);
  };

  const canEditOrDelete = (itemKecamatan: string, itemDesa: string) => {
    return canEditOrDeleteRecord(itemKecamatan, itemDesa, "pertanian");
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

    setFormKdKebun(`KBN-${Date.now().toString().slice(-6)}`);
    setFormNama("");
    setFormKdKecamatan(defaultKec);
    setFormKdDesa(defaultDesa);
    setFormKdKomoditas(komoditasList[0]?.kd_komoditas || "KBN-JAGUNG");
    setFormKdKelompok("");
    setFormNamaPemilik("");
    setFormAlamat("");
    setFormLuasHa("1.5");
    setFormTahunTanam("2024");
    setFormSistemTanam("Monokultur");
    setFormLat("1.4500");
    setFormLng("99.2500");
    setFormStatus("AKTIF");
    setFormDeskripsi("");
    setFormFotoUrl("");
    setModalOpen(true);
  };

  const openEdit = (item: KebunItem) => {
    setEditItem(item);
    setFormKdKebun(item.kd_kebun);
    setFormNama(item.nama);
    setFormKdKecamatan(item.kd_kecamatan);
    setFormKdDesa(item.kd_desa);
    setFormKdKomoditas(item.kd_komoditas);
    setFormKdKelompok(item.kd_kelompok || "");
    setFormNamaPemilik(item.namaPemilik || "");
    setFormAlamat(item.alamatLokasi || "");
    setFormLuasHa(item.luasLahanHa ? String(item.luasLahanHa) : "1.0");
    setFormTahunTanam(item.tahunTanam ? String(item.tahunTanam) : "");
    setFormSistemTanam(item.sistemTanam || "Monokultur");
    setFormLat(item.latitude ? String(item.latitude) : "");
    setFormLng(item.longitude ? String(item.longitude) : "");
    setFormStatus((item as any).statusUsaha || item.status);
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
        kd_kebun: formKdKebun,
        nama: formNama,
        kd_kecamatan: formKdKecamatan,
        kd_desa: formKdDesa,
        kd_komoditas: formKdKomoditas,
        kd_kelompok: formKdKelompok || null,
        namaPemilik: formNamaPemilik,
        alamatLokasi: formAlamat,
        luasLahanHa: formLuasHa,
        tahunTanam: formTahunTanam,
        sistemTanam: formSistemTanam,
        latitude: formLat,
        longitude: formLng,
        status: formStatus,
        deskripsi: formDeskripsi,
        fotoUrl: formFotoUrl || null,
      };

      const res = await fetch("/api/pertanian", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan data");

      setAlert({
        type: "success",
        message: `Data Kebun berhasil ${editItem ? "diperbarui" : "ditambahkan"}!`,
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
    if (!confirm(`Hapus Kebun ${name}?`)) return;
    try {
      const res = await fetch(`/api/pertanian?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menghapus");
      setAlert({ type: "success", message: `Kebun ${name} berhasil dihapus.` });
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

      {/* KPI Stats Cards - Usaha Kebun, Komoditas, & Status Usaha/Lahan */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Kebun / Lahan */}
        <div
          onClick={() => {
            setSelectedStatus("semua");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatus === "semua"
              ? "bg-gradient-to-br from-emerald-50/90 to-white border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-2xs"
          }`}
          title="Klik untuk melihat semua data kebun"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Total Kebun</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sprout size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.totalKebun.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
              Lahan
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {stats.totalLuasHa.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha Luas Lahan
          </p>
        </div>

        {/* Card 2: Komoditas Diinput */}
        <div
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs relative overflow-hidden group"
          title="Jumlah jenis komoditas yang diinput"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Komoditas Diinput</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.totalKomoditas}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
              Jenis
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {komoditasList.length > 0 ? `${komoditasList.length} Terdaftar` : "Komoditas Kebun"}
          </p>
        </div>

        {/* Card 3: Usaha / Lahan Aktif */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "AKTIF" ? "semua" : "AKTIF");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatus === "AKTIF"
              ? "bg-gradient-to-br from-emerald-50/90 to-white border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-2xs"
          }`}
          title="Klik untuk memfilter kebun yang aktif berproduksi"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Status Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.statusAktif.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
              Aktif
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Aktif Berproduksi</span>
          </p>
        </div>

        {/* Card 4: Lahan Istirahat */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "ISTIRAHAT" ? "semua" : "ISTIRAHAT");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatus === "ISTIRAHAT"
              ? "bg-gradient-to-br from-sky-50/90 to-white border-sky-300 ring-2 ring-sky-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-sky-200 hover:shadow-2xs"
          }`}
          title="Klik untuk memfilter kebun yang sedang istirahat / bera"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Lahan Istirahat</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.statusIstirahat.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-semibold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded-md">
              Istirahat
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>Masa Bera / Jeda Tanam</span>
          </p>
        </div>

        {/* Card 5: Gagal Panen */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "GAGAL_PANEN" ? "semua" : "GAGAL_PANEN");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatus === "GAGAL_PANEN"
              ? "bg-gradient-to-br from-rose-50/90 to-white border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-2xs"
          }`}
          title="Klik untuk memfilter kebun yang mengalami gagal panen / puso"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Gagal Panen</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.statusGagalPanen.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md">
              Puso
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Puso / Cuaca / Hama</span>
          </p>
        </div>

        {/* Card 6: Non Aktif */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "NON_AKTIF" ? "semua" : "NON_AKTIF");
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            selectedStatus === "NON_AKTIF"
              ? "bg-gradient-to-br from-slate-100 to-white border-slate-400 ring-2 ring-slate-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
          }`}
          title="Klik untuk memfilter kebun yang non aktif"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 truncate">Non Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats.statusNonAktif.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
              Non Aktif
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>Tidak Beroperasi</span>
          </p>
        </div>
      </div>

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
                placeholder="Cari kebun / pemilik..."
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
                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 max-w-[220px]"
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
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="semua">Semua Komoditas</option>
              {komoditasList.map((k) => (
                <option key={k.kd_komoditas} value={k.kd_komoditas}>
                  {k.nm_komoditas}
                </option>
              ))}
            </select>

            {/* Filter Status Usaha */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="semua">Semua Status Usaha</option>
              <option value="AKTIF">Aktif</option>
              <option value="ISTIRAHAT">Istirahat</option>
              <option value="GAGAL_PANEN">Gagal Panen</option>
              <option value="NON_AKTIF">Non Aktif</option>
            </select>
          </div>

          {/* Tambah Button */}
          <button
            onClick={openTambah}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-emerald-700 text-white shadow-xs transition shrink-0"
          >
            <Plus size={15} />
            <span>Tambah Usaha Kebun</span>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {selectedStatus !== "semua" && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <span className="font-semibold text-slate-500">Filter Status:</span>
            <span className="font-bold text-slate-800">
              {selectedStatus === "AKTIF" && "Usaha / Lahan Aktif"}
              {selectedStatus === "ISTIRAHAT" && "Lahan Istirahat (Bera)"}
              {selectedStatus === "GAGAL_PANEN" && "Gagal Panen (Puso)"}
              {selectedStatus === "NON_AKTIF" && "Non Aktif"}
            </span>
            <span className="text-slate-400">({total} data ditemukan)</span>
            <button
              onClick={() => {
                setSelectedStatus("semua");
                setPage(1);
              }}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition"
            >
              <X size={12} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Kode & Nama Kebun</th>
                <th className="p-3.5">Komoditas</th>
                <th className="p-3.5">Lokasi Wilayah</th>
                <th className="p-3.5">Pemilik / Pengelola</th>
                <th className="p-3.5 text-center">Luas (Ha)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Memuat data kebun...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data usaha kebun ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {k.foto && k.foto.length > 0 && k.foto[0].url ? (
                          <img
                            src={k.foto[0].url}
                            alt={k.nama}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Sprout size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{k.nama}</p>
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {k.kd_kebun}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-800">
                      {k.komoditas?.nm_komoditas}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">Desa {k.desa?.nm_desa || "-"}</p>
                      <p className="text-[10px] text-slate-500">Kec. {k.kecamatan?.nm_kecamatan || "-"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{k.namaPemilik || "-"}</p>
                      <p className="text-[10px] text-slate-500">{k.kelompokTani?.nm_kelompok || "Mandiri"}</p>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {k.luasLahanHa || "-"} Ha
                    </td>
                    <td className="p-3.5 text-center">
                      {(k.statusUsaha || k.status) === "AKTIF" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          AKTIF
                        </span>
                      ) : (k.statusUsaha || k.status) === "ISTIRAHAT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                          ISTIRAHAT
                        </span>
                      ) : (k.statusUsaha || k.status) === "GAGAL_PANEN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          GAGAL PANEN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          NON AKTIF
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/pertanian/${k.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Lihat Halaman Detail"
                        >
                          <Eye size={14} />
                        </Link>
                        {canEditOrDelete(k.kd_kecamatan, k.kd_desa) ? (
                          <>
                            <button
                              onClick={() => openEdit(k)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id, k.nama)}
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
            Menampilkan {data.length} dari {total} kebun terdaftar
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

      {/* Modal Tambah / Edit Kebun (Lebar & Lengkap) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Sprout size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editItem ? "Edit Usaha Pertanian / Kebun" : "Tambah Usaha Pertanian / Kebun Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Lengkapi formulir detail kebun dan dokumentasi lahan/kegiatan</p>
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
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2.5 pb-1 border-b border-slate-100">
                  1. Identitas Usaha & Komoditas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Kebun</label>
                    <input
                      type="text"
                      value={formKdKebun}
                      onChange={(e) => setFormKdKebun(e.target.value)}
                      required
                      placeholder="Contoh: KBN-1210-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nama Kebun</label>
                    <input
                      type="text"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      required
                      placeholder="Contoh: Kebun Jagung Poktan Harapan Maju"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komoditas Pertanian</label>
                    <select
                      value={formKdKomoditas}
                      onChange={(e) => setFormKdKomoditas(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      {komoditasList.map((k) => (
                        <option key={k.kd_komoditas} value={k.kd_komoditas}>
                          {k.nm_komoditas}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pemilik / Pengelola</label>
                    <input
                      type="text"
                      value={formNamaPemilik}
                      onChange={(e) => setFormNamaPemilik(e.target.value)}
                      placeholder="Contoh: H. Syamsir Siregar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian Wilayah & Lokasi */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2.5 pb-1 border-b border-slate-100">
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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

                {/* Input Kelompok Tani / Pembudidaya (Setelah Memilih Desa) */}
                <div className="mt-3.5">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-emerald-600" />
                      <span>Kelompok Tani</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Sesuai Desa: {desaList.find((d) => d.kd_desa === formKdDesa)?.nm_desa || "Pilih desa"}
                    </span>
                  </label>

                  {formKdKelompok ? (
                    // Tampilan jika sudah memilih kelompok tani
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Users size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {poktanList.find((p) => p.kd_kelompok === formKdKelompok)?.nm_kelompok || formKdKelompok}
                            </h5>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded">
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
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition"
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
                      className="group cursor-pointer w-full p-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 bg-slate-50/60 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800">
                        <Users size={16} className="text-slate-400 group-hover:text-emerald-600 transition" />
                        <span className="text-xs">
                          (Non-Kelompok / Mandiri) - <span className="text-emerald-600 font-semibold group-hover:underline">Klik untuk cari & pilih Kelompok Tani</span>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 group-hover:border-emerald-300 group-hover:text-emerald-700 text-slate-600 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition shrink-0">
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
                      placeholder="Contoh: Jl. Lintas Timur Km 12"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <LocationPicker
                    lat={formLat}
                    lng={formLng}
                    onChange={(newLat, newLng) => {
                      setFormLat(newLat);
                      setFormLng(newLng);
                    }}
                    accentColor="emerald"
                    unitName={formNama || "Usaha Pertanian"}
                  />
                </div>
              </div>

              {/* Bagian Data Teknis & Status */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2.5 pb-1 border-b border-slate-100">
                  3. Spesifikasi Teknis Kebun
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Luas Lahan (Ha)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formLuasHa}
                      onChange={(e) => setFormLuasHa(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Tanam</label>
                    <input
                      type="number"
                      value={formTahunTanam}
                      onChange={(e) => setFormTahunTanam(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sistem Tanam</label>
                    <input
                      type="text"
                      value={formSistemTanam}
                      onChange={(e) => setFormSistemTanam(e.target.value)}
                      placeholder="Monokultur / Tumpangsari"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Usaha</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="ISTIRAHAT">ISTIRAHAT</option>
                      <option value="GAGAL_PANEN">GAGAL PANEN</option>
                      <option value="NON_AKTIF">NON AKTIF</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bagian Foto Dokumentasi Kegiatan / Lahan */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <Camera size={14} />
                  <span>4. Foto Kegiatan & Dokumentasi Lahan</span>
                </h4>
                
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-5">
                  {/* Preview / Placeholder */}
                  <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 relative group shadow-2xs">
                    {formFotoUrl ? (
                      <>
                        <img
                          src={formFotoUrl}
                          alt="Foto Kegiatan Lahan"
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
                      Unggah Foto Dokumentasi Kebun / Tanaman
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Format yang didukung: JPG, PNG, atau WEBP (Maksimal 5MB). Foto ini akan ditampilkan pada profil usaha kebun dan peta pemetaan potensi daerah.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs transition">
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
                        <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
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
                  placeholder="Tambahkan catatan khusus kondisi komoditas, masa panen, atau kendala lapangan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-xs disabled:opacity-50 transition"
                >
                  {saving ? "Menyimpan Data..." : "Simpan Data Kebun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Pencarian Kelompok Tani */}
      {poktanModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            {/* Header Dialog */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Users size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Pilih Kelompok Tani
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
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
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
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-emerald-700 hover:text-emerald-800 font-medium">
                    <input
                      type="checkbox"
                      checked={showAllInKec}
                      onChange={(e) => setShowAllInKec(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 text-xs"
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
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10"
                    : "border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                    -
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Non-Kelompok / Mandiri</h5>
                    <p className="text-[11px] text-slate-400">Pilih opsi ini jika usaha kebun dikelola perorangan secara mandiri</p>
                  </div>
                </div>
                {!formKdKelompok ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
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
                          ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/15"
                          : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition truncate">
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
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Terpilih</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg transition"
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
