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
  Sparkles,
  Clock,
  TrendingUp,
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
  createdAt?: string;
  updatedAt?: string;
  kecamatan?: { nm_kecamatan: string };
  desa?: { nm_desa: string };
  _count?: { kebun: number; kolam: number; peternakan: number };
}

export default function KelompokTaniClientView() {
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
    canChangeKecamatan,
    canChangeDesa,
    canEditOrDeleteRecord,
  } = useAuthority();

  const [data, setData] = useState<PoktanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [dateFilter, setDateFilter] = useState<"semua" | "today" | "7days" | "month" | "custom">("semua");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Statistics
  const [stats, setStats] = useState<{
    total: number;
    baruHariIni: number;
    baru7Hari: number;
    baruBulanIni: number;
    totalAktif: number;
  }>({
    total: 0,
    baruHariIni: 0,
    baru7Hari: 0,
    baruBulanIni: 0,
    totalAktif: 0,
  });

  const formatInputDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isTodayRecord = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const isNewRecord = (dateStr?: string, days = 7) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr).getTime();
      const now = Date.now();
      return now - d <= days * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // Kecamatan and Desa lists for dropdowns
  const [kecamatanList, setKecamatanList] = useState<{ kd_kecamatan: string; nm_kecamatan: string }[]>([]);
  const [desaList, setDesaList] = useState<{ kd_desa: string; nm_desa: string; kd_kecamatan: string }[]>([]);

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
      let url = `/api/kelompok-tani?search=${encodeURIComponent(search)}&kd_kecamatan=${selectedKec}&kd_desa=${selectedDesa}&status=${selectedStatus}&page=${page}&limit=10&dateFilter=${dateFilter}`;
      if (dateFilter === "custom") {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }
      const res = await fetch(url);
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
    loadKecamatanAndDesa();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, selectedKec, selectedDesa, selectedStatus, page, dateFilter, startDate, endDate]);

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  // Filtered Desa based on selected Kecamatan in form and authority
  const availableDesas = desaList.filter((d) => {
    if (d.kd_kecamatan !== formKdKecamatan) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (isPplOrDesa && authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

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

      {/* KPI Stats Cards - Berdasarkan Total & Tgl Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kelompok Tani */}
        <div
          onClick={() => {
            setDateFilter("semua");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            dateFilter === "semua"
              ? "bg-gradient-to-br from-emerald-50/90 to-white border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-xs"
          }`}
          title="Klik untuk menampilkan semua kelompok tani"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Kelompok Tani</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center transition-transform group-hover:scale-105">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total.toLocaleString("id-ID")}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Poktan
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{stats.totalAktif.toLocaleString("id-ID")} Poktan Berstatus Aktif</span>
          </p>
        </div>

        {/* Card 2: Baru Hari Ini (Berdasarkan Tgl Input) */}
        <div
          onClick={() => {
            setDateFilter(dateFilter === "today" ? "semua" : "today");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            dateFilter === "today"
              ? "bg-gradient-to-br from-blue-50/90 to-white border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-xs"
          }`}
          title="Klik untuk memfilter data kelompok tani yang baru diinput hari ini"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Baru Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.baruHariIni.toLocaleString("id-ID")}
            </span>
            {stats.baruHariIni > 0 ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                +{stats.baruHariIni} Hari Ini
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                0 baru
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <Clock size={12} className="text-blue-500" />
            <span>Diinput pada tanggal hari ini</span>
          </p>
        </div>

        {/* Card 3: Baru 7 Hari Terakhir */}
        <div
          onClick={() => {
            setDateFilter(dateFilter === "7days" ? "semua" : "7days");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            dateFilter === "7days"
              ? "bg-gradient-to-br from-amber-50/90 to-white border-amber-300 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-xs"
          }`}
          title="Klik untuk memfilter data kelompok tani yang diinput 7 hari terakhir"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Baru 7 Hari Terakhir</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center transition-transform group-hover:scale-105">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.baru7Hari.toLocaleString("id-ID")}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
              1 Minggu
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span>Diinput dalam 7 hari terakhir</span>
          </p>
        </div>

        {/* Card 4: Baru Bulan Ini */}
        <div
          onClick={() => {
            setDateFilter(dateFilter === "month" ? "semua" : "month");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            dateFilter === "month"
              ? "bg-gradient-to-br from-purple-50/90 to-white border-purple-300 ring-2 ring-purple-500/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-purple-200 hover:shadow-xs"
          }`}
          title="Klik untuk memfilter data kelompok tani yang diinput bulan ini"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Baru Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center transition-transform group-hover:scale-105">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.baruBulanIni.toLocaleString("id-ID")}
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
              Bulan Berjalan
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
            <span>Akumulasi input bulan ini</span>
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        {/* Toolbar: Search, Filters, Add Button */}
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

            {/* Filter Tanggal Input */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="semua">Semua Tgl Input</option>
              <option value="today">Input Hari Ini</option>
              <option value="7days">Input 7 Hari Terakhir</option>
              <option value="month">Input Bulan Ini</option>
              <option value="custom">Rentang Tanggal...</option>
            </select>

            {/* Rentang Tanggal Custom */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                  title="Dari Tanggal"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                  title="Sampai Tanggal"
                />
              </div>
            )}
          </div>

          {/* Tambah Button */}
          <button
            onClick={openTambah}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-emerald-700 text-white shadow-xs transition shrink-0"
          >
            <Plus size={15} />
            <span>Tambah Kelompok Tani</span>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {dateFilter !== "semua" && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <span className="font-semibold text-slate-500">Filter Aktif:</span>
            <span className="font-bold text-slate-800">
              {dateFilter === "today" && "Diinput Hari Ini"}
              {dateFilter === "7days" && "Diinput 7 Hari Terakhir"}
              {dateFilter === "month" && "Diinput Bulan Ini"}
              {dateFilter === "custom" && `Rentang Input: ${startDate || "Awal"} s/d ${endDate || "Sekarang"}`}
            </span>
            <span className="text-slate-400">({total} data ditemukan)</span>
            <button
              onClick={() => {
                setDateFilter("semua");
                setStartDate("");
                setEndDate("");
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
                <th className="p-3.5">Kode & Nama Poktan</th>
                <th className="p-3.5">Kecamatan</th>
                <th className="p-3.5">Desa/Kelurahan</th>
                <th className="p-3.5">Ketua & Kontak</th>
                <th className="p-3.5 text-center">Anggota</th>
                <th className="p-3.5 text-center">Usaha Binaan</th>
                <th className="p-3.5">Tgl Input</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Memuat data kelompok tani...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
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
                    <td className="p-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {formatInputDate(p.createdAt)}
                        </span>
                        {isTodayRecord(p.createdAt) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Hari Ini
                          </span>
                        ) : isNewRecord(p.createdAt, 7) ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full w-fit">
                            Baru (7 hr)
                          </span>
                        ) : null}
                      </div>
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
              {editItem?.createdAt && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Tanggal Input Data:</span>
                    <span className="font-bold text-slate-700">
                      {formatInputDate(editItem.createdAt)}
                    </span>
                  </div>
                  {isTodayRecord(editItem.createdAt) ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Baru Diinput Hari Ini
                    </span>
                  ) : isNewRecord(editItem.createdAt, 7) ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Baru (7 Hari Terakhir)
                    </span>
                  ) : null}
                </div>
              )}

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
