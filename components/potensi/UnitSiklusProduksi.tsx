"use client";

import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  X,
  RefreshCw,
  Layers,
  Sparkles,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { useAuthority } from "@/hooks/useAuthority";

export interface SiklusData {
  id: string;
  kd_siklus: string;
  namaSiklus: string;
  tahapKegiatan: string;
  tanggalMulai: string;
  tanggalTargetPanen?: string | null;
  tanggalRealisasiPanen?: string | null;
  estimasiProduksi?: number | string | null;
  realisasiProduksi?: number | string | null;
  satuanProduksi?: string | null;
  status: string;
  catatan?: string | null;
  kd_kebun?: string | null;
  kd_kolam?: string | null;
  kd_peternakan?: string | null;
}

interface UnitSiklusProduksiProps {
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kdUnit: string;
  namaUnit: string;
  komoditasNama?: string;
  initialSiklus?: SiklusData[];
  onSiklusCountChange?: (count: number) => void;
}

const TAHAP_OPTIONS: Record<string, string[]> = {
  KEBUN: [
    "Persiapan & Olah Lahan",
    "Penyemaian Bibit",
    "Penanaman",
    "Pemupukan & Pemeliharaan",
    "Pengendalian Hama / Gulma",
    "Masa Pembungaan / Buah",
    "Panen",
    "Pasca Panen",
  ],
  KOLAM: [
    "Pengeringan & Sterilisasi Kolam",
    "Pengisian Air & Persiapan Pakan Alami",
    "Penebaran Benih",
    "Pemberian Pakan & Manajemen Air",
    "Pemeriksaan Pertumbuhan / Sampling",
    "Panen",
    "Penyortiran & Distribusi",
  ],
  PETERNAKAN: [
    "Persiapan Kandang & Sanitasi",
    "Penerimaan Bibit / DOC / Ternak Muda",
    "Fase Pemeliharaan (Starter / Grower)",
    "Pemberian Pakan & Nutrisi",
    "Vaksinasi & Pemeriksaan Kesehatan",
    "Fase Finisher / Siap Panen",
    "Panen Ternak / Telur / Susu",
  ],
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PERENCANAAN: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Perencanaan" },
  BERJALAN: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Sedang Berjalan" },
  PANEN: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300", label: "Musim Panen" },
  GAGAL: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Gagal" },
  DIBATALKAN: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", label: "Dibatalkan" },
};

export default function UnitSiklusProduksi({
  jenisUsaha,
  kdUnit,
  namaUnit,
  komoditasNama,
  initialSiklus = [],
  onSiklusCountChange,
}: UnitSiklusProduksiProps) {
  const { isKabupaten, isKecamatan, isPplOrDesa } = useAuthority();
  const [siklusList, setSiklusList] = useState<SiklusData[]>(initialSiklus);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<SiklusData | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form Fields
  const [formKdSiklus, setFormKdSiklus] = useState("");
  const [formNamaSiklus, setFormNamaSiklus] = useState("");
  const [formTahapKegiatan, setFormTahapKegiatan] = useState("");
  const [formTglMulai, setFormTglMulai] = useState("");
  const [formTglPanen, setFormTglPanen] = useState("");
  const [formEstimasi, setFormEstimasi] = useState("");
  const [formSatuan, setFormSatuan] = useState("Kg");
  const [formStatus, setFormStatus] = useState("BERJALAN");
  const [formCatatan, setFormCatatan] = useState("");

  const refreshData = async () => {
    setLoading(true);
    try {
      let queryParam = "";
      if (jenisUsaha === "KEBUN") queryParam = `kd_kebun=${kdUnit}`;
      else if (jenisUsaha === "KOLAM") queryParam = `kd_kolam=${kdUnit}`;
      else if (jenisUsaha === "PETERNAKAN") queryParam = `kd_peternakan=${kdUnit}`;

      const res = await fetch(`/api/siklus-produksi?${queryParam}&limit=100`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSiklusList(json.data);
        if (onSiklusCountChange) {
          onSiklusCountChange(json.data.length);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openTambah = () => {
    setEditItem(null);
    const prefix = jenisUsaha === "KEBUN" ? "SKL-KBN" : jenisUsaha === "KOLAM" ? "SKL-KLM" : "SKL-TRN";
    setFormKdSiklus(`${prefix}-${Date.now().toString().slice(-6)}`);
    setFormNamaSiklus(`Siklus Produksi ${komoditasNama || namaUnit}`);
    const defaultTahap = TAHAP_OPTIONS[jenisUsaha]?.[0] || "Penanaman";
    setFormTahapKegiatan(defaultTahap);
    setFormTglMulai(new Date().toISOString().split("T")[0]);
    // default target panen ~90 days later
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    setFormTglPanen(futureDate.toISOString().split("T")[0]);
    setFormEstimasi("1000");
    setFormSatuan(jenisUsaha === "PETERNAKAN" ? "Ekor" : "Kg");
    setFormStatus("BERJALAN");
    setFormCatatan("");
    setModalOpen(true);
  };

  const openEdit = (item: SiklusData) => {
    setEditItem(item);
    setFormKdSiklus(item.kd_siklus);
    setFormNamaSiklus(item.namaSiklus);
    setFormTahapKegiatan(item.tahapKegiatan);
    setFormTglMulai(item.tanggalMulai ? new Date(item.tanggalMulai).toISOString().split("T")[0] : "");
    setFormTglPanen(item.tanggalTargetPanen ? new Date(item.tanggalTargetPanen).toISOString().split("T")[0] : "");
    setFormEstimasi(item.estimasiProduksi ? String(item.estimasiProduksi) : "");
    setFormSatuan(item.satuanProduksi || "Kg");
    setFormStatus(item.status);
    setFormCatatan(item.catatan || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const isEdit = Boolean(editItem);
      const method = isEdit ? "PUT" : "POST";
      const body: any = {
        id: editItem?.id,
        kd_siklus: formKdSiklus,
        jenisUsaha,
        namaSiklus: formNamaSiklus,
        tahapKegiatan: formTahapKegiatan,
        tanggalMulai: formTglMulai,
        tanggalTargetPanen: formTglPanen || null,
        estimasiProduksi: formEstimasi ? parseFloat(formEstimasi) : null,
        satuanProduksi: formSatuan,
        status: formStatus,
        catatan: formCatatan,
      };

      if (jenisUsaha === "KEBUN") body.kd_kebun = kdUnit;
      if (jenisUsaha === "KOLAM") body.kd_kolam = kdUnit;
      if (jenisUsaha === "PETERNAKAN") body.kd_peternakan = kdUnit;

      const res = await fetch("/api/siklus-produksi", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan siklus produksi");
      }

      setAlert({
        type: "success",
        message: isEdit ? "Siklus produksi berhasil diperbarui!" : "Jadwal siklus produksi baru berhasil ditambahkan!",
      });
      setModalOpen(false);
      await refreshData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Terjadi kesalahan sistem" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SiklusData) => {
    if (!window.confirm(`Yakin ingin menghapus siklus "${item.namaSiklus}" (${item.kd_siklus})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/siklus-produksi?id=${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menghapus siklus");
      }
      setAlert({ type: "success", message: "Siklus produksi berhasil dihapus!" });
      await refreshData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Gagal menghapus" });
    }
  };

  const handleQuickStatus = async (item: SiklusData, newStatus: string) => {
    try {
      const res = await fetch("/api/siklus-produksi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          kd_siklus: item.kd_siklus,
          jenisUsaha,
          namaSiklus: item.namaSiklus,
          tahapKegiatan: newStatus === "PANEN" ? "Panen" : item.tahapKegiatan,
          tanggalMulai: item.tanggalMulai,
          tanggalTargetPanen: item.tanggalTargetPanen,
          estimasiProduksi: item.estimasiProduksi,
          satuanProduksi: item.satuanProduksi,
          status: newStatus,
          catatan: item.catatan,
          kd_kebun: item.kd_kebun,
          kd_kolam: item.kd_kolam,
          kd_peternakan: item.kd_peternakan,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal update status");
      await refreshData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    }
  };

  // Calculations
  const filteredList = siklusList.filter((s) => {
    if (filterStatus !== "semua" && s.status !== filterStatus) return false;
    return true;
  });

  const totalSiklus = siklusList.length;
  const siklusBerjalan = siklusList.filter((s) => s.status === "BERJALAN").length;
  const siklusPanen = siklusList.filter((s) => s.status === "PANEN").length;
  const totalEstimasi = siklusList.reduce((acc, curr) => acc + (Number(curr.estimasiProduksi) || 0), 0);

  const getCountdownPanen = (targetDateStr?: string | null) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    // remove time component
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `${diffDays} Hari Menuju Panen`, isClose: diffDays <= 14, isPast: false };
    } else if (diffDays === 0) {
      return { text: "Jadwal Panen Hari Ini!", isClose: true, isPast: false };
    } else {
      return { text: `Lewat ${Math.abs(diffDays)} Hari dari Jadwal`, isClose: false, isPast: true };
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Action & KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Siklus</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalSiklus}</span>
            <span className="text-xs text-slate-500 font-medium">Periode</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Sedang Berjalan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-900">{siklusBerjalan}</span>
            <span className="text-xs text-emerald-600 font-medium">Aktif</span>
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Musim Panen</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-900">{siklusPanen}</span>
            <span className="text-xs text-amber-600 font-medium">Siklus</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Est. Hasil Panen</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalEstimasi.toLocaleString("id-ID")}</span>
            <span className="text-xs text-slate-500 font-bold">Kg/Satuan</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {["semua", "BERJALAN", "PANEN", "PERENCANAAN", "GAGAL"].map((st) => {
            const isSel = filterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "semua" ? "Semua Siklus" : STATUS_COLORS[st]?.label || st}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
          <button
            onClick={openTambah}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Siklus & Jadwal Panen</span>
          </button>
        </div>
      </div>

      {/* List Siklus Items */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Calendar size={28} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">
            {filterStatus === "semua"
              ? "Belum Ada Siklus Produksi & Jadwal Panen"
              : `Tidak ada siklus dengan status "${filterStatus}"`}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Unit usaha ini belum memiliki catatan siklus tanam, tebar benih, atau jadwal panen. Klik tombol di bawah untuk menambahkan siklus baru.
          </p>
          <button
            onClick={openTambah}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Buat Jadwal Siklus Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const stColor = STATUS_COLORS[item.status] || STATUS_COLORS.BERJALAN;
            const countdown = getCountdownPanen(item.tanggalTargetPanen);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header: Kode & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.kd_siklus}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${stColor.bg} ${stColor.text} ${stColor.border}`}
                    >
                      {stColor.label}
                    </span>
                  </div>

                  {/* Title & Tahap */}
                  <div>
                    <h4 className="font-black text-slate-900 text-base leading-tight">
                      {item.namaSiklus}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-100">
                      <Sparkles size={13} className="text-emerald-600" />
                      <span>Tahap: {item.tahapKegiatan}</span>
                    </div>
                  </div>

                  {/* Timeline Dates & Countdown */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tanggal Mulai</span>
                        <span className="font-bold text-slate-800">
                          {new Date(item.tanggalMulai).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Panen</span>
                        <span className="font-bold text-slate-800">
                          {item.tanggalTargetPanen
                            ? new Date(item.tanggalTargetPanen).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {countdown && item.status === "BERJALAN" && (
                      <div
                        className={`pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 font-bold text-[11px] ${
                          countdown.isPast
                            ? "text-rose-700"
                            : countdown.isClose
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }`}
                      >
                        <Clock size={13} />
                        <span>{countdown.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Production Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-medium block">Estimasi Panen</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {item.estimasiProduksi
                          ? `${Number(item.estimasiProduksi).toLocaleString("id-ID")} ${item.satuanProduksi || "Kg"}`
                          : "-"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-medium block">Realisasi Panen</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {item.realisasiProduksi
                          ? `${Number(item.realisasiProduksi).toLocaleString("id-ID")} ${item.satuanProduksi || "Kg"}`
                          : "Belum panen"}
                      </p>
                    </div>
                  </div>

                  {item.catatan && (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{item.catatan}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {item.status === "BERJALAN" && (
                      <button
                        onClick={() => handleQuickStatus(item, "PANEN")}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <PackageCheck size={13} />
                        <span>Tandai Panen</span>
                      </button>
                    )}
                    {item.status === "PERENCANAAN" && (
                      <button
                        onClick={() => handleQuickStatus(item, "BERJALAN")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <TrendingUp size={13} />
                        <span>Mulai Siklus</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Ubah Siklus"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Hapus Siklus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT SIKLUS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editItem ? "Ubah Siklus Produksi & Panen" : "Jadwal Siklus Produksi Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Unit: {namaUnit} ({kdUnit})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Siklus</label>
                  <input
                    type="text"
                    required
                    value={formKdSiklus}
                    onChange={(e) => setFormKdSiklus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-emerald-600 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Siklus</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-emerald-600"
                  >
                    <option value="PERENCANAAN">Perencanaan</option>
                    <option value="BERJALAN">Sedang Berjalan (Aktif)</option>
                    <option value="PANEN">Musim Panen</option>
                    <option value="GAGAL">Gagal Panen</option>
                    <option value="DIBATALKAN">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Siklus Produksi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siklus Jagung Hibrida Musim Kemarau 1"
                  value={formNamaSiklus}
                  onChange={(e) => setFormNamaSiklus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahap Kegiatan Saat Ini</label>
                <div className="space-y-2">
                  <select
                    value={formTahapKegiatan}
                    onChange={(e) => setFormTahapKegiatan(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-emerald-600"
                  >
                    {(TAHAP_OPTIONS[jenisUsaha] || []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Siklus</label>
                  <input
                    type="date"
                    required
                    value={formTglMulai}
                    onChange={(e) => setFormTglMulai(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target / Estimasi Panen</label>
                  <input
                    type="date"
                    value={formTglPanen}
                    onChange={(e) => setFormTglPanen(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Hasil Panen</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Contoh: 1500"
                    value={formEstimasi}
                    onChange={(e) => setFormEstimasi(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Hasil</label>
                  <input
                    type="text"
                    placeholder="Kg / Ton / Ekor / Liter"
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan Lapangan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi cuaca, varietas benih, perlakuan pupuk khusus..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-md shadow-emerald-950/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  <span>{editItem ? "Simpan Perubahan" : "Simpan Siklus"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
