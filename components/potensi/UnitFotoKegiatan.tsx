"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Star,
  Maximize2,
  Calendar,
  Tag,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ImageOff,
  Eye,
  Check,
} from "lucide-react";

export interface FotoData {
  id: string;
  url: string;
  judul?: string | null;
  keterangan?: string | null;
  jenisFoto?: string | null;
  tanggalFoto?: string | null;
  utama?: boolean;
  createdAt?: string;
}

interface UnitFotoKegiatanProps {
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  kdUnit: string;
  namaUnit: string;
  komoditasNama?: string;
  initialFoto?: FotoData[];
  onFotoCountChange?: (count: number) => void;
}

const KATEGORI_OPTIONS: { id: string; label: string }[] = [
  { id: "LOKASI", label: "Lokasi & Lahan / Kandang" },
  { id: "TANAMAN", label: "Tanaman / Budidaya" },
  { id: "KOLAM", label: "Kolam & Perairan" },
  { id: "TERNAK", label: "Ternak & Hewan" },
  { id: "PANEN", label: "Hasil Panen & Produksi" },
  { id: "DOKUMEN", label: "Dokumen & Bantuan" },
  { id: "LAINNYA", label: "Kegiatan Lapangan Lainnya" },
];

export default function UnitFotoKegiatan({
  jenisUsaha,
  kdUnit,
  namaUnit,
  komoditasNama,
  initialFoto = [],
  onFotoCountChange,
}: UnitFotoKegiatanProps) {
  const [fotoList, setFotoList] = useState<FotoData[]>(initialFoto);
  const [filterKategori, setFilterKategori] = useState<string>("semua");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [selectedLightbox, setSelectedLightbox] = useState<FotoData | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formJudul, setFormJudul] = useState<string>("");
  const [formKategori, setFormKategori] = useState<string>(
    jenisUsaha === "KEBUN" ? "TANAMAN" : jenisUsaha === "KOLAM" ? "KOLAM" : "TERNAK"
  );
  const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formKeterangan, setFormKeterangan] = useState<string>("");
  const [formUtama, setFormUtama] = useState<boolean>(fotoList.length === 0);
  const [uploading, setUploading] = useState<boolean>(false);

  const refreshPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/foto?jenisUsaha=${jenisUsaha}&kd_unit=${kdUnit}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFotoList(json.data);
        if (onFotoCountChange) {
          onFotoCountChange(json.data.length);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({ type: "error", message: "File harus berupa format gambar (JPG, PNG, WEBP)" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: "error", message: "Ukuran file foto maksimal adalah 5MB" });
      return;
    }

    setFileToUpload(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (!formJudul) {
      const defaultName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setFormJudul(defaultName || `Foto Kegiatan ${komoditasNama || namaUnit}`);
    }
  };

  const openUploadModal = () => {
    setFileToUpload(null);
    setPreviewUrl(null);
    setFormJudul("");
    setFormKategori(jenisUsaha === "KEBUN" ? "TANAMAN" : jenisUsaha === "KOLAM" ? "KOLAM" : "TERNAK");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKeterangan("");
    setFormUtama(fotoList.length === 0);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setAlert({ type: "error", message: "Silakan pilih foto terlebih dahulu" });
      return;
    }

    setUploading(true);
    setAlert(null);

    try {
      // Step 1: Upload physical file to server storage
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error || "Gagal mengunggah file foto");
      }

      const fileUrl = uploadJson.url;

      // Step 2: Record photo entry in database
      const fotoBody = {
        jenisUsaha,
        kd_unit: kdUnit,
        url: fileUrl,
        judul: formJudul || `Foto Kegiatan ${namaUnit}`,
        keterangan: formKeterangan || null,
        jenisFoto: formKategori,
        tanggalFoto: formTanggal,
        utama: formUtama,
      };

      const saveRes = await fetch("/api/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fotoBody),
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.success) {
        throw new Error(saveJson.error || "Gagal menyimpan data foto ke database");
      }

      setAlert({ type: "success", message: "Foto kegiatan berhasil diunggah!" });
      setUploadModalOpen(false);
      await refreshPhotos();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Gagal mengunggah foto" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: FotoData) => {
    if (!window.confirm(`Yakin ingin menghapus foto "${photo.judul || "Foto ini"}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/foto?id=${photo.id}&jenisUsaha=${jenisUsaha}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menghapus foto");

      setAlert({ type: "success", message: "Foto kegiatan berhasil dihapus!" });
      await refreshPhotos();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Gagal menghapus foto" });
    }
  };

  const handleSetPrimary = async (photo: FotoData) => {
    try {
      const res = await fetch("/api/foto", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: photo.id,
          jenisUsaha,
          kd_unit: kdUnit,
          utama: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengubah foto utama");

      setAlert({ type: "success", message: "Foto utama sampul berhasil diubah!" });
      await refreshPhotos();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    }
  };

  const filteredPhotos = fotoList.filter((f) => {
    if (filterKategori === "semua") return true;
    return f.jenisFoto === filterKategori;
  });

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

      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Camera size={20} className="text-emerald-700" />
            Galeri & Foto Kegiatan Usaha
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi berkala pertumbuhan komoditas, kegiatan pemupukan, sanitasi, dan hasil panen di lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshPhotos}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Muat Ulang Foto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition cursor-pointer"
          >
            <Upload size={16} />
            <span>Upload Foto Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterKategori("semua")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterKategori === "semua"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          Semua Foto ({fotoList.length})
        </button>
        {KATEGORI_OPTIONS.map((cat) => {
          const count = fotoList.filter((f) => f.jenisFoto === cat.id).length;
          if (count === 0 && filterKategori !== cat.id) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterKategori(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterKategori === cat.id
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Camera size={32} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-base">Belum Ada Foto Kegiatan</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Belum ada dokumentasi foto yang diunggah untuk unit usaha ini. Unggah foto kegiatan penanaman, pemeliharaan, atau panen sekarang.
          </p>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Upload size={15} />
            <span>Upload Foto Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Preview & Badges */}
              <div
                onClick={() => setSelectedLightbox(photo)}
                className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.judul || "Foto Kegiatan"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Primary Photo Badge */}
                {photo.utama && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px] flex items-center gap-1 shadow-md">
                    <Star size={11} fill="white" />
                    <span>Foto Utama</span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white font-bold text-[10px]">
                  {photo.jenisFoto || "LOKASI"}
                </div>

                {/* Hover overlay to expand */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
                    <Maximize2 size={13} />
                    Lihat Foto
                  </span>
                </div>
              </div>

              {/* Photo Caption & Info */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-1">
                    {photo.judul || "Dokumentasi Kegiatan"}
                  </h4>
                  {photo.keterangan && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {photo.keterangan}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {photo.tanggalFoto
                      ? new Date(photo.tanggalFoto).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!photo.utama && (
                      <button
                        onClick={() => handleSetPrimary(photo)}
                        title="Jadikan Foto Sampul Utama"
                        className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      title="Hapus Foto"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL UPLOAD FOTO KEGIATAN */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Upload Foto Kegiatan</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Unit: {namaUnit} ({kdUnit})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* File Dropzone / Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih File Foto</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-900 group aspect-16/9">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setFileToUpload(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs backdrop-blur-xs transition cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-600">
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        Klik untuk memilih foto kegiatan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mendukung format JPG, PNG, WEBP (Maksimal 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Foto / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemupukan Tanaman Tahap Awal, Tebar Bibit Ikan..."
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Kegiatan</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-emerald-600"
                  >
                    {KATEGORI_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai kondisi tanaman, dosis pakan, cuaca saat pemotretan..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formUtama}
                    onChange={(e) => setFormUtama(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-700 text-xs">
                    Jadikan sebagai Foto Sampul Utama unit usaha ini
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileToUpload}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-md shadow-emerald-950/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {uploading && <RefreshCw size={14} className="animate-spin" />}
                  <span>{uploading ? "Mengunggah..." : "Unggah Foto"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX */}
      {selectedLightbox && (
        <div
          onClick={() => setSelectedLightbox(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-950 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 flex flex-col"
          >
            <div className="relative max-h-[75vh] flex items-center justify-center bg-black">
              <img
                src={selectedLightbox.url}
                alt={selectedLightbox.judul || "Foto Dokumentasi"}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
              <button
                onClick={() => setSelectedLightbox(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm">{selectedLightbox.judul || "Foto Kegiatan"}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                    {selectedLightbox.jenisFoto || "LOKASI"}
                  </span>
                  {selectedLightbox.utama && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                      <Star size={10} fill="white" /> Foto Utama
                    </span>
                  )}
                </div>
                {selectedLightbox.keterangan && (
                  <p className="text-slate-300 text-xs leading-relaxed max-w-xl">
                    {selectedLightbox.keterangan}
                  </p>
                )}
                {selectedLightbox.tanggalFoto && (
                  <p className="text-slate-400 text-[11px]">
                    Tanggal Kegiatan:{" "}
                    {new Date(selectedLightbox.tanggalFoto).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedLightbox.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition flex items-center gap-1"
                >
                  <Eye size={13} />
                  <span>Lihat Asli</span>
                </a>
                <button
                  onClick={() => setSelectedLightbox(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
