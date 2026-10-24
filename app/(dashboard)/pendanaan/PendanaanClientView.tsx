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
  MapPin,
  ArrowRightLeft,
  Calendar,
  RotateCcw,
  Layers,
  X,
  Beef,
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

interface SectorStat {
  jumlahPenerima: number;
  totalUnitUnik: number;
  nilaiDicairkan: number;
  nilaiDisetujui: number;
  nilaiDiajukan: number;
}

interface PendanaanStats {
  tahun: string;
  total: SectorStat;
  pertanian: SectorStat;
  perikanan: SectorStat;
  peternakan: SectorStat;
}

interface UnitOption {
  id: string;
  kode: string;
  nama: string;
  jenis: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kd_kecamatan?: string;
  kd_desa?: string;
  nm_kecamatan?: string;
  nm_desa?: string;
  lokasi: string;
}

interface Props {
  initialUnits: UnitOption[];
}

export default function PendanaanClientView({ initialUnits }: Props) {
  const {
    user,
    loading: authLoading,
    isSuperAdmin,
    isMasterDataAdmin,
    isPertanianAdmin,
    isPerikananAdmin,
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

  const currentYear = new Date().getFullYear().toString();
  const canAccessPendanaan = isMasterDataAdmin || isPertanianAdmin || isPerikananAdmin;

  // Filter available units based on sector authority
  const scopedUnits = React.useMemo(() => {
    if (isPertanianAdmin) {
      return initialUnits.filter((u) => u.jenis !== "KOLAM");
    }
    if (isPerikananAdmin) {
      return initialUnits.filter((u) => u.jenis === "KOLAM");
    }
    return initialUnits;
  }, [initialUnits, isPertanianAdmin, isPerikananAdmin]);

  const [data, setData] = useState<PendanaanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sumberDanaFilter, setSumberDanaFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [jenisUnitFilter, setJenisUnitFilter] = useState("semua");
  const [tahunFilter, setTahunFilter] = useState(currentYear);
  const [selectedKec, setSelectedKec] = useState("semua");
  const [selectedDesa, setSelectedDesa] = useState("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [stats, setStats] = useState<PendanaanStats>({
    tahun: currentYear,
    total: { jumlahPenerima: 0, totalUnitUnik: 0, nilaiDicairkan: 0, nilaiDisetujui: 0, nilaiDiajukan: 0 },
    pertanian: { jumlahPenerima: 0, totalUnitUnik: 0, nilaiDicairkan: 0, nilaiDisetujui: 0, nilaiDiajukan: 0 },
    perikanan: { jumlahPenerima: 0, totalUnitUnik: 0, nilaiDicairkan: 0, nilaiDisetujui: 0, nilaiDiajukan: 0 },
    peternakan: { jumlahPenerima: 0, totalUnitUnik: 0, nilaiDicairkan: 0, nilaiDisetujui: 0, nilaiDiajukan: 0 },
  });

  // Wilayah lists
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

  // Unit Picker Dialog State
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerJenis, setPickerJenis] = useState<"semua" | "KEBUN" | "KOLAM" | "PETERNAKAN">("semua");
  const [pickerKec, setPickerKec] = useState("semua");
  const [pickerDesa, setPickerDesa] = useState("semua");
  const [pickerPage, setPickerPage] = useState(1);
  const PICKER_PAGE_SIZE = 8;

  // Form State
  const [formData, setFormData] = useState({
    jenisUnit: isPerikananAdmin ? "KOLAM" : "KEBUN",
    kd_unit: "",
    namaProgram: "",
    sumberDana: "KUR",
    namaSumberDana: "",
    tahunAnggaran: parseInt(currentYear),
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
        tahun: tahunFilter,
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
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, selectedKec, selectedDesa, sumberDanaFilter, statusFilter, jenisUnitFilter, tahunFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    tahunFilter !== currentYear ||
    jenisUnitFilter !== "semua" ||
    sumberDanaFilter !== "semua" ||
    statusFilter !== "semua" ||
    (isKabupaten && selectedKec !== "semua") ||
    (!isLockedDesa && selectedDesa !== "semua");

  const resetAllFilters = () => {
    setSearch("");
    setTahunFilter(currentYear);
    setJenisUnitFilter("semua");
    setSumberDanaFilter("semua");
    setStatusFilter("semua");
    if (isKabupaten) setSelectedKec("semua");
    if (!isLockedDesa) setSelectedDesa("semua");
    setPage(1);
  };

  // Filtered Desa based on selected Kecamatan for filter toolbar
  const filterDesaOptions = desaList.filter((d) => {
    if (selectedKec !== "semua" && d.kd_kecamatan !== selectedKec) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  const selectedUnit = formData.kd_unit
    ? scopedUnits.find((u) => u.kode === formData.kd_unit && u.jenis === formData.jenisUnit) ||
      scopedUnits.find((u) => u.kode === formData.kd_unit)
    : null;

  const openCreateModal = () => {
    setModalMode("create");
    setEditingItem(null);
    setFormData({
      jenisUnit: isPerikananAdmin ? "KOLAM" : "KEBUN",
      kd_unit: "",
      namaProgram: "",
      sumberDana: "KUR",
      namaSumberDana: "",
      tahunAnggaran: parseInt(tahunFilter !== "semua" ? tahunFilter : currentYear),
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
    if (!canEditOrDelete(item)) {
      alert("Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah data sektor ini.");
      return;
    }
    setModalMode("edit");
    setEditingItem(item);
    setFormData({
      jenisUnit: item.jenisUnit,
      kd_unit: item.kd_kebun || item.kd_kolam || item.kd_peternakan || "",
      namaProgram: item.namaProgram || "",
      sumberDana: item.sumberDana || "KUR",
      namaSumberDana: item.namaSumberDana || "",
      tahunAnggaran: item.tahunAnggaran || parseInt(currentYear),
      nomorUsulan: item.nomorUsulan || "",
      danaDiajukan: item.danaDiajukan?.toString() || "0",
      danaDisetujui: item.danaDisetujui?.toString() || "0",
      danaDicairkan: item.danaDicairkan?.toString() || "0",
      status: item.status || "RENCANA",
      keterangan: item.keterangan || "",
    });
    setIsModalOpen(true);
  };

  const openUnitPicker = () => {
    setPickerSearch("");
    if (isPerikananAdmin) {
      setPickerJenis("KOLAM");
    } else if (isPertanianAdmin) {
      setPickerJenis(formData.kd_unit && formData.jenisUnit !== "KOLAM" ? (formData.jenisUnit as any) : "semua");
    } else {
      setPickerJenis(formData.kd_unit ? (formData.jenisUnit as any) : "semua");
    }

    if (!isKabupaten && authKecamatan) {
      setPickerKec(authKecamatan);
    } else if (selectedUnit?.kd_kecamatan) {
      setPickerKec(selectedUnit.kd_kecamatan);
    } else {
      setPickerKec("semua");
    }

    if (isLockedDesa && authDesa) {
      setPickerDesa(authDesa);
    } else if (selectedUnit?.kd_desa) {
      setPickerDesa(selectedUnit.kd_desa);
    } else {
      setPickerDesa("semua");
    }

    setPickerPage(1);
    setIsUnitPickerOpen(true);
  };

  const handleSelectUnit = (unit: UnitOption) => {
    setFormData((prev) => ({
      ...prev,
      jenisUnit: unit.jenis,
      kd_unit: unit.kode,
    }));
    setIsUnitPickerOpen(false);
  };

  // Filter units for picker dialog
  const filteredPickerUnits = scopedUnits.filter((u) => {
    // 1. Authority filtering
    if (!isKabupaten) {
      if (isKecamatan && u.kd_kecamatan !== authKecamatan) return false;
      if (isPpl) {
        if (authKecamatan && u.kd_kecamatan !== authKecamatan) return false;
        if (authDesaList.length > 0 && u.kd_desa && !authDesaList.includes(u.kd_desa)) return false;
      }
      if (isPplOrDesa) {
        if (authKecamatan && u.kd_kecamatan !== authKecamatan) return false;
        if (authDesa && u.kd_desa !== authDesa) return false;
      }
    }

    // 2. Sector / Jenis Unit
    if (pickerJenis !== "semua" && u.jenis !== pickerJenis) return false;

    // 3. Kecamatan
    if (pickerKec !== "semua" && u.kd_kecamatan !== pickerKec) return false;

    // 4. Desa
    if (pickerDesa !== "semua" && u.kd_desa !== pickerDesa) return false;

    // 5. Search
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      const matchName = u.nama.toLowerCase().includes(q);
      const matchKode = u.kode.toLowerCase().includes(q);
      const matchKec = (u.nm_kecamatan || "").toLowerCase().includes(q);
      const matchDesa = (u.nm_desa || "").toLowerCase().includes(q);
      const matchLokasi = u.lokasi.toLowerCase().includes(q);
      if (!matchName && !matchKode && !matchKec && !matchDesa && !matchLokasi) return false;
    }

    return true;
  });

  const pickerDesaOptions = desaList.filter((d) => {
    if (pickerKec !== "semua" && d.kd_kecamatan !== pickerKec) return false;
    if (isPpl && authDesaList.length > 0) return authDesaList.includes(d.kd_desa);
    if (authDesa && d.kd_desa !== authDesa) return false;
    return true;
  });

  const pickerTotalPages = Math.ceil(filteredPickerUnits.length / PICKER_PAGE_SIZE) || 1;
  const paginatedPickerUnits = filteredPickerUnits.slice(
    (pickerPage - 1) * PICKER_PAGE_SIZE,
    pickerPage * PICKER_PAGE_SIZE
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kd_unit) {
      alert("Harap pilih Unit Usaha penerima pendanaan terlebih dahulu.");
      return;
    }
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
    const item = data.find((d) => d.id === deleteConfirmId.id);
    if (item && !canEditOrDelete(item)) {
      alert("Akses Ditolak: Anda tidak memiliki otoritas menghapus data pada sektor ini.");
      return;
    }
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

  const canEditOrDelete = (item: PendanaanItem) => {
    let sector: "pertanian" | "perikanan" | "peternakan" = "pertanian";
    if (item.jenisUnit === "KOLAM") sector = "perikanan";
    else if (item.jenisUnit === "PETERNAKAN") sector = "peternakan";
    return canEditOrDeleteRecord(item.kd_kecamatan, item.kd_desa, sector);
  };

  const availableUnits = scopedUnits.filter((u) => {
    if (u.jenis !== formData.jenisUnit) return false;
    if (isKabupaten) return true;
    if (isKecamatan) return u.kd_kecamatan === authKecamatan;
    if (isPpl) {
      if (authKecamatan && u.kd_kecamatan !== authKecamatan) return false;
      if (authDesaList.length > 0 && u.kd_desa) return authDesaList.includes(u.kd_desa);
      return true;
    }
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

  const getSumberDanaBadge = (sd: string) => {
    switch (sd) {
      case "KUR":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "APBN":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "APBD_PROVINSI":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "APBD_KABUPATEN":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "DANA_DESA":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "SWADAYA":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "CSR":
        return "bg-cyan-50 text-cyan-800 border-cyan-200";
      case "PERBANKAN":
        return "bg-sky-50 text-sky-800 border-sky-200";
      default:
        return "bg-slate-50 text-slate-800 border-slate-200";
    }
  };

  const formatSumberDana = (sd: string) => {
    switch (sd) {
      case "KUR":
        return "KUR (Kredit Usaha Rakyat)";
      case "APBD_KABUPATEN":
        return "APBD Tapsel";
      case "APBD_PROVINSI":
        return "APBD Prov";
      case "DANA_DESA":
        return "Dana Desa";
      case "BANTUAN_PEMERINTAH":
        return "Bantuan Pemerintah";
      default:
        return sd;
    }
  };

  if (!authLoading && !canAccessPendanaan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <Lock size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Akses Ditolak</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Menu <strong>Pengelolaan Pendanaan & Bantuan Usaha</strong> hanya dapat diakses oleh{" "}
              <strong>Superadmin</strong>, <strong>Admin Dinas Pertanian</strong>, dan <strong>Admin Dinas Perikanan</strong>.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Kembali ke Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards Pendanaan & Bantuan Usaha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Seluruh Penerima Bantuan */}
        <div
          onClick={() => {
            setJenisUnitFilter("semua");
            setPage(1);
          }}
          className={`bg-white rounded-2xl p-5 border transition cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
            jenisUnitFilter === "semua"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/15"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Seluruh Bantuan {stats.tahun !== "semua" ? `(TA ${stats.tahun})` : "(Semua Tahun)"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              <Coins size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.total.jumlahPenerima.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-bold text-emerald-700">Penerima</span>
            </div>
            <div className="text-sm font-extrabold text-emerald-700">
              {formatRupiah(stats.total.nilaiDicairkan)}
            </div>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>{stats.total.totalUnitUnik} Unit Usaha Terdata</span>
            <span title="Total Pagu Pengajuan">Pagu: {formatRupiah(stats.total.nilaiDiajukan)}</span>
          </div>
        </div>

        {/* Card 2: Sektor Pertanian (Kebun) */}
        {!isPerikananAdmin && (
          <div
            onClick={() => {
              setJenisUnitFilter(jenisUnitFilter === "KEBUN" ? "semua" : "KEBUN");
              setPage(1);
            }}
            className={`bg-white rounded-2xl p-5 border transition cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              jenisUnitFilter === "KEBUN"
                ? "border-lime-500 ring-2 ring-lime-500/20 bg-lime-50/20"
                : "border-slate-200/80 hover:border-lime-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sektor Pertanian (Kebun)
              </span>
              <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Sprout size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.pertanian.jumlahPenerima.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-bold text-lime-700">Penerima</span>
              </div>
              <div className="text-sm font-extrabold text-lime-800">
                {formatRupiah(stats.pertanian.nilaiDicairkan)}
              </div>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{stats.pertanian.totalUnitUnik} Kebun Penerima</span>
              <span title="Total Pagu Pengajuan">Pagu: {formatRupiah(stats.pertanian.nilaiDiajukan)}</span>
            </div>
          </div>
        )}

        {/* Card 3: Sektor Perikanan (Kolam) */}
        {!isPertanianAdmin && (
          <div
            onClick={() => {
              setJenisUnitFilter(jenisUnitFilter === "KOLAM" ? "semua" : "KOLAM");
              setPage(1);
            }}
            className={`bg-white rounded-2xl p-5 border transition cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              jenisUnitFilter === "KOLAM"
                ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20"
                : "border-slate-200/80 hover:border-sky-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sektor Perikanan (Kolam)
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Fish size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.perikanan.jumlahPenerima.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-bold text-sky-700">Penerima</span>
              </div>
              <div className="text-sm font-extrabold text-sky-800">
                {formatRupiah(stats.perikanan.nilaiDicairkan)}
              </div>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{stats.perikanan.totalUnitUnik} Kolam Penerima</span>
              <span title="Total Pagu Pengajuan">Pagu: {formatRupiah(stats.perikanan.nilaiDiajukan)}</span>
            </div>
          </div>
        )}

        {/* Card 4: Sektor Peternakan */}
        {!isPerikananAdmin && (
          <div
            onClick={() => {
              setJenisUnitFilter(jenisUnitFilter === "PETERNAKAN" ? "semua" : "PETERNAKAN");
              setPage(1);
            }}
            className={`bg-white rounded-2xl p-5 border transition cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              jenisUnitFilter === "PETERNAKAN"
                ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20"
                : "border-slate-200/80 hover:border-orange-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sektor Peternakan
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Beef size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.peternakan.jumlahPenerima.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-bold text-orange-700">Penerima</span>
              </div>
              <div className="text-sm font-extrabold text-orange-800">
                {formatRupiah(stats.peternakan.nilaiDicairkan)}
              </div>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{stats.peternakan.totalUnitUnik} Peternakan Penerima</span>
              <span title="Total Pagu Pengajuan">Pagu: {formatRupiah(stats.peternakan.nilaiDiajukan)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Header Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/40">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari program bantuan, nomor usulan, unit usaha, lokasi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 flex-wrap">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl transition"
                title="Reset semua filter pencarian"
              >
                <RotateCcw size={13} />
                <span>Reset Filter</span>
              </button>
            )}

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{totalItems} Program</span>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow"
            >
              <Plus size={16} />
              <span>Tambah Pendanaan</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Filter Tahun Anggaran */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar size={11} className="text-emerald-600" />
                <span>Tahun Anggaran</span>
              </label>
              <select
                value={tahunFilter}
                onChange={(e) => {
                  setTahunFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition ${
                  tahunFilter !== "semua"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <option value="semua">Semua Tahun</option>
                {[2027, 2026, 2025, 2024, 2023, 2022].map((yr) => (
                  <option key={yr} value={yr.toString()}>
                    Tahun {yr} {yr.toString() === currentYear ? "(Terkini)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Filter Sektor Unit */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers size={11} className="text-emerald-600" />
                <span>Sektor Usaha</span>
              </label>
              <select
                value={jenisUnitFilter}
                onChange={(e) => {
                  setJenisUnitFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition ${
                  jenisUnitFilter !== "semua"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {isPerikananAdmin ? (
                  <>
                    <option value="semua">Semua Usaha Perikanan</option>
                    <option value="KOLAM">Perikanan (Kolam)</option>
                  </>
                ) : isPertanianAdmin ? (
                  <>
                    <option value="semua">Semua Sektor Pertanian</option>
                    <option value="KEBUN">Pertanian (Kebun)</option>
                    <option value="PETERNAKAN">Peternakan</option>
                  </>
                ) : (
                  <>
                    <option value="semua">Semua Sektor</option>
                    <option value="KEBUN">Pertanian (Kebun)</option>
                    <option value="KOLAM">Perikanan (Kolam)</option>
                    <option value="PETERNAKAN">Peternakan</option>
                  </>
                )}
              </select>
            </div>

            {/* 3. Filter Sumber Dana */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Coins size={11} className="text-emerald-600" />
                <span>Sumber Dana</span>
              </label>
              <select
                value={sumberDanaFilter}
                onChange={(e) => {
                  setSumberDanaFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition ${
                  sumberDanaFilter !== "semua"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <option value="semua">Semua Sumber Dana</option>
                <option value="KUR">KUR (Kredit Usaha Rakyat)</option>
                <option value="APBD_KABUPATEN">APBD Tapsel</option>
                <option value="APBD_PROVINSI">APBD Provinsi</option>
                <option value="APBN">APBN (Pusat)</option>
                <option value="DANA_DESA">Dana Desa</option>
                <option value="SWADAYA">Swadaya</option>
                <option value="BANTUAN_PEMERINTAH">Bantuan Pemerintah</option>
                <option value="CSR">CSR / BUMN</option>
                <option value="PERBANKAN">Perbankan</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            {/* 4. Filter Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>Status Realisasi</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition ${
                  statusFilter !== "semua"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <option value="semua">Semua Status</option>
                <option value="RENCANA">Rencana</option>
                <option value="DIAJUKAN">Diajukan</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DICAIRKAN">Dicairkan</option>
                <option value="SELESAI">Selesai</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>

            {/* 5. Filter Kecamatan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin size={11} className="text-emerald-600" />
                <span>Kecamatan</span>
              </label>
              {isKabupaten ? (
                <select
                  value={selectedKec}
                  onChange={(e) => {
                    setSelectedKec(e.target.value);
                    setSelectedDesa("semua");
                    setPage(1);
                  }}
                  className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition ${
                    selectedKec !== "semua"
                      ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="semua">Semua Kecamatan</option>
                  {kecamatanList.map((k) => (
                    <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                      {k.nm_kecamatan}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 truncate"
                  title="Wilayah Otoritas Anda"
                >
                  <Lock size={11} className="text-amber-600 shrink-0" />
                  <span className="truncate">
                    {kecamatanList.find((k) => k.kd_kecamatan === authKecamatan)?.nm_kecamatan || authKecamatanName || authKecamatan}
                  </span>
                </div>
              )}
            </div>

            {/* 6. Filter Desa */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin size={11} className="text-emerald-600" />
                <span>Desa / Kelurahan</span>
              </label>
              {isLockedDesa ? (
                <div
                  className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 truncate"
                  title="Wilayah Desa Otoritas Anda"
                >
                  <Lock size={11} className="text-blue-600 shrink-0" />
                  <span className="truncate">
                    {desaList.find((d) => d.kd_desa === authDesa)?.nm_desa || authDesaName || authDesa}
                  </span>
                </div>
              ) : (
                <select
                  value={selectedDesa}
                  disabled={selectedKec === "semua" && !isPpl}
                  onChange={(e) => {
                    setSelectedDesa(e.target.value);
                    setPage(1);
                  }}
                  className={`w-full px-2.5 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                    selectedDesa !== "semua"
                      ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="semua">
                    {selectedKec === "semua" ? "Pilih Kec. Dahulu" : `Semua Desa (${filterDesaOptions.length})`}
                  </option>
                  {filterDesaOptions.map((d) => (
                    <option key={d.kd_desa} value={d.kd_desa}>
                      {d.nm_desa}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Filter Chips / Badges */}
          {hasActiveFilters && (
            <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter size={12} className="text-slate-500" />
                <span>Filter Aktif:</span>
              </span>

              {tahunFilter !== "semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs">
                  <span>Tahun: {tahunFilter}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTahunFilter("semua");
                      setPage(1);
                    }}
                    className="hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {jenisUnitFilter !== "semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs">
                  <span>
                    Sektor:{" "}
                    {jenisUnitFilter === "KEBUN"
                      ? "Pertanian"
                      : jenisUnitFilter === "KOLAM"
                      ? "Perikanan"
                      : "Peternakan"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setJenisUnitFilter("semua");
                      setPage(1);
                    }}
                    className="hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {sumberDanaFilter !== "semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 shadow-2xs">
                  <span>Sumber: {formatSumberDana(sumberDanaFilter)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSumberDanaFilter("semua");
                      setPage(1);
                    }}
                    className="hover:text-indigo-950 p-0.5 rounded hover:bg-indigo-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {statusFilter !== "semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs">
                  <span>Status: {statusFilter}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("semua");
                      setPage(1);
                    }}
                    className="hover:text-blue-950 p-0.5 rounded hover:bg-blue-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedKec !== "semua" && isKabupaten && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-300 shadow-2xs">
                  <span>Kec: {kecamatanList.find((k) => k.kd_kecamatan === selectedKec)?.nm_kecamatan || selectedKec}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKec("semua");
                      setSelectedDesa("semua");
                      setPage(1);
                    }}
                    className="hover:text-slate-950 p-0.5 rounded hover:bg-slate-200"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedDesa !== "semua" && !isLockedDesa && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-300 shadow-2xs">
                  <span>Desa: {desaList.find((d) => d.kd_desa === selectedDesa)?.nm_desa || selectedDesa}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDesa("semua");
                      setPage(1);
                    }}
                    className="hover:text-slate-950 p-0.5 rounded hover:bg-slate-200"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {search && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-200 shadow-2xs">
                  <span>Cari: &quot;{search}&quot;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="hover:text-amber-950 p-0.5 rounded hover:bg-amber-100"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
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
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getSumberDanaBadge(item.sumberDana)}`}>
                        {formatSumberDana(item.sumberDana)} {item.namaSumberDana ? `(${item.namaSumberDana})` : ""}
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
                      {canEditOrDelete(item) ? (
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
          <div className="bg-white w-full max-w-3xl lg:max-w-4xl rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {modalMode === "create" ? "Tambah Data Pendanaan / Bantuan" : "Edit Data Pendanaan"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === "create"
                      ? "Form alokasi pembiayaan, program bantuan pemerintah, KUR, atau swadaya"
                      : "Perbarui informasi pendanaan, alokasi anggaran, dan realisasi"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-lg font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* Bagian 1: Pilihan Unit Usaha Penerima */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Unit Usaha Penerima Bantuan / Pembiayaan <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Pilih unit kebun, kolam perikanan, atau peternakan yang menerima fasilitas pendanaan
                    </p>
                  </div>
                  {selectedUnit && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                      Unit Terpilih
                    </span>
                  )}
                </div>

                {selectedUnit ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedUnit.jenis === "KEBUN"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedUnit.jenis === "KOLAM"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedUnit.jenis === "KEBUN" ? (
                          <Sprout size={22} />
                        ) : selectedUnit.jenis === "KOLAM" ? (
                          <Fish size={22} />
                        ) : (
                          <Trees size={22} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {selectedUnit.nama}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {selectedUnit.kode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedUnit.jenis === "KEBUN" ? "Pertanian (Kebun)" : selectedUnit.jenis === "KOLAM" ? "Perikanan (Kolam)" : "Peternakan"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span>{selectedUnit.lokasi}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openUnitPicker}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shrink-0"
                    >
                      <ArrowRightLeft size={14} />
                      Ganti Unit Usaha
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={openUnitPicker}
                    className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 transition p-6 rounded-xl text-center space-y-2 bg-white"
                  >
                    <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">Belum ada unit usaha yang dipilih</p>
                      <p className="text-[11px] text-slate-500">
                        Klik tombol di bawah untuk mencari unit usaha berdasarkan kecamatan dan desa
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openUnitPicker}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-xs mt-1"
                    >
                      <Search size={14} />
                      Pilih Unit Usaha Sekarang...
                    </button>
                  </div>
                )}
              </div>

              {/* Bagian 2: Informasi Program & Sumber Pembiayaan */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-slate-400">
                  Informasi Program & Sumber Pembiayaan
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Program Bantuan / Pembiayaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kredit Usaha Rakyat (KUR) Sektor Pertanian / Bantuan Alsintan & Benih Padi"
                    value={formData.namaProgram}
                    onChange={(e) => setFormData({ ...formData, namaProgram: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
                    <select
                      value={formData.sumberDana}
                      onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-medium"
                    >
                      <option value="KUR">KUR (Kredit Usaha Rakyat)</option>
                      <option value="APBN">APBN (Pusat)</option>
                      <option value="APBD_PROVINSI">APBD Provinsi</option>
                      <option value="APBD_KABUPATEN">APBD Tapsel</option>
                      <option value="DANA_DESA">Dana Desa</option>
                      <option value="SWADAYA">Swadaya</option>
                      <option value="BANTUAN_PEMERINTAH">Bantuan Pemerintah</option>
                      <option value="CSR">CSR / BUMN</option>
                      <option value="PERBANKAN">Perbankan Komersial</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instansi / Bank Penyalur</label>
                    <input
                      type="text"
                      placeholder="Contoh: Bank BRI / Bank Sumut / Dinas Pertanian"
                      value={formData.namaSumberDana}
                      onChange={(e) => setFormData({ ...formData, namaSumberDana: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Anggaran</label>
                    <input
                      type="number"
                      value={formData.tahunAnggaran}
                      onChange={(e) => setFormData({ ...formData, tahunAnggaran: parseInt(e.target.value) || 2025 })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Usulan / SK / Akad</label>
                    <input
                      type="text"
                      placeholder="Contoh: 520/041/DISPERTA/2025"
                      value={formData.nomorUsulan}
                      onChange={(e) => setFormData({ ...formData, nomorUsulan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Nilai Alokasi & Pencairan Anggaran */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-slate-400">
                  Rincian Anggaran & Plafon (Rp)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dana Diajukan / Plafon (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formData.danaDiajukan}
                      onChange={(e) => setFormData({ ...formData, danaDiajukan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dana Disetujui (Rp)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.danaDisetujui}
                      onChange={(e) => setFormData({ ...formData, danaDisetujui: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dana Dicairkan (Rp)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.danaDicairkan}
                      onChange={(e) => setFormData({ ...formData, danaDicairkan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 4: Status Realisasi & Catatan */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-slate-400">
                  Status Realisasi & Dokumen Pendukung
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Keterangan / Dokumen Pendukung</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan, SP2D, nomor kontrak/akad KUR, bukti transfer, atau kelengkapan berkas..."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Pemilihan Unit Usaha dengan Filter Kecamatan & Desa */}
      {isUnitPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Pilih Unit Usaha Penerima Pendanaan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gunakan filter kecamatan dan desa atau ketik nama/kode unit usaha
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUnitPickerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 text-base font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              {/* Sektor Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Sektor:</span>
                {[
                  ...(!isPerikananAdmin
                    ? [
                        {
                          id: "semua",
                          label: isPertanianAdmin ? "Semua Pertanian & Ternak" : "Semua Sektor",
                          icon: Building2,
                        },
                      ]
                    : []),
                  ...(!isPerikananAdmin ? [{ id: "KEBUN", label: "Pertanian (Kebun)", icon: Sprout }] : []),
                  ...(!isPertanianAdmin ? [{ id: "KOLAM", label: "Perikanan (Kolam)", icon: Fish }] : []),
                  ...(!isPerikananAdmin ? [{ id: "PETERNAKAN", label: "Peternakan", icon: Trees }] : []),
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pickerJenis === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setPickerJenis(tab.id as any);
                        setPickerPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        isActive
                          ? "bg-[#16a34a] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Kecamatan, Desa, Search Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Kecamatan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kecamatan</label>
                  {isKabupaten ? (
                    <select
                      value={pickerKec}
                      onChange={(e) => {
                        setPickerKec(e.target.value);
                        setPickerDesa("semua");
                        setPickerPage(1);
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-medium"
                    >
                      <option value="semua">Semua Kecamatan</option>
                      {kecamatanList.map((k) => (
                        <option key={k.kd_kecamatan} value={k.kd_kecamatan}>
                          {k.nm_kecamatan}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 border rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Lock size={12} className="text-amber-600 shrink-0" />
                      <span className="truncate">
                        {kecamatanList.find((k) => k.kd_kecamatan === authKecamatan)?.nm_kecamatan || authKecamatanName || authKecamatan}
                      </span>
                    </div>
                  )}
                </div>

                {/* Desa */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Desa / Kelurahan</label>
                  {isLockedDesa ? (
                    <div className="px-3 py-2 border rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Lock size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">
                        {desaList.find((d) => d.kd_desa === authDesa)?.nm_desa || authDesaName || authDesa}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={pickerDesa}
                      onChange={(e) => {
                        setPickerDesa(e.target.value);
                        setPickerPage(1);
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#16a34a] font-medium"
                    >
                      <option value="semua">
                        {pickerKec === "semua" ? "Semua Desa" : `Semua Desa (${pickerDesaOptions.length})`}
                      </option>
                      {pickerDesaOptions.map((d) => (
                        <option key={d.kd_desa} value={d.kd_desa}>
                          {d.nm_desa}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Search */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Unit Usaha</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Nama unit, kode..."
                      value={pickerSearch}
                      onChange={(e) => {
                        setPickerSearch(e.target.value);
                        setPickerPage(1);
                      }}
                      className="w-full pl-8 pr-7 py-2 border rounded-xl focus:ring-2 focus:ring-[#16a34a]"
                    />
                    {pickerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickerSearch("");
                          setPickerPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {filteredPickerUnits.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-200/70 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <Search size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">Tidak ada unit usaha yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Coba ganti filter kecamatan, desa, atau kata kunci pencarian Anda
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerSearch("");
                      setPickerJenis("semua");
                      if (isKabupaten) setPickerKec("semua");
                      if (!isLockedDesa) setPickerDesa("semua");
                      setPickerPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {paginatedPickerUnits.map((u) => {
                    const isSelected = formData.kd_unit === u.kode && formData.jenisUnit === u.jenis;
                    return (
                      <div
                        key={`${u.jenis}-${u.id}`}
                        onClick={() => handleSelectUnit(u)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                          isSelected
                            ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              u.jenis === "KEBUN"
                                ? "bg-emerald-100 text-emerald-700"
                                : u.jenis === "KOLAM"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {u.jenis === "KEBUN" ? (
                              <Sprout size={18} />
                            ) : u.jenis === "KOLAM" ? (
                              <Fish size={18} />
                            ) : (
                              <Trees size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate" title={u.nama}>
                              {u.nama}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {u.kode}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {u.jenis === "KEBUN" ? "Kebun" : u.jenis === "KOLAM" ? "Kolam" : "Ternak"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate" title={u.lokasi}>
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{u.lokasi}</span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-xs">
                              <CheckCircle2 size={12} />
                              Dipilih
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition"
                            >
                              Pilih
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer & Pagination */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Ditemukan <strong className="text-slate-900 font-bold">{filteredPickerUnits.length}</strong> unit usaha
                {filteredPickerUnits.length > 0 && ` (Halaman ${pickerPage} dari ${pickerTotalPages})`}
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pickerPage <= 1}
                    onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={pickerPage >= pickerTotalPages}
                    onClick={() => setPickerPage((p) => Math.min(pickerTotalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    Selanjutnya
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnitPickerOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
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
