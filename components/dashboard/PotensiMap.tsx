"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Filter,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  X,
  ImageOff,
  ArrowUpRight,
  ExternalLink,
  Users,
  Sprout,
  Fish,
  Beef,
  Calendar,
  Coins,
  CheckCircle2,
  Sparkles,
  Info,
  Building,
} from "lucide-react";

interface MapPinItem {
  id: string;
  dbId?: string;
  kode?: string;
  nama: string;
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN" | "POKTAN";
  komoditas: string;
  pemilik?: string;
  desa?: string;
  kecamatan?: string;
  lat: number;
  lng: number;
  luas?: string;
  color: string;
  foto?: any[];
  fotoUrl?: string | null;
  detail?: {
    kode: string;
    nama: string;
    status: string;
    komoditas: string;
    namaPemilik: string;
    alamat: string;
    desa: string;
    kecamatan: string;
    kelompokTani?: {
      kode: string;
      nama: string;
      ketua?: string;
      anggota?: number;
    } | null;
    spesifikasi: { label: string; value: string }[];
    pendanaan: {
      program: string;
      sumberDana: string;
      danaDiajukan: number;
      danaDicairkan: number;
      status: string;
    }[];
    siklus: {
      nama: string;
      tahap: string;
      tanggalMulai: string;
      targetPanen: string;
    }[];
  };
}

interface PotensiMapProps {
  pins: MapPinItem[];
  kecamatanList?: { kd_kecamatan: string; nm_kecamatan: string }[];
  selectedKecamatan: string;
  setSelectedKecamatan: (k: string) => void;
  selectedDesa?: string;
  setSelectedDesa?: (d: string) => void;
  selectedJenis: string;
  setSelectedJenis: (j: string) => void;
}

const LeafletMapInner = ({
  pins,
  center,
  zoom,
  onSelectPhoto,
  onSelectDetail,
}: {
  pins: MapPinItem[];
  center: [number, number];
  zoom: number;
  onSelectPhoto?: (item: { url: string; title: string; subtitle: string }) => void;
  onSelectDetail?: (item: MapPinItem) => void;
}) => {
  const { MapContainer, TileLayer, Marker, Popup, useMap } = require("react-leaflet");
  const L = require("leaflet");

  // Center update controller
  function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
  }

  // DivIcon Generator
  const getIcon = (item: MapPinItem) => {
    let symbol = "🌱";
    let bg = "#16a34a"; // Kebun

    if (item.jenisUsaha === "KOLAM") {
      symbol = "🐟";
      bg = "#0284c7"; // Kolam
    } else if (item.jenisUsaha === "PETERNAKAN") {
      symbol = "🐄";
      bg = "#ea580c"; // Peternakan
    } else if (item.jenisUsaha === "POKTAN") {
      symbol = "👥";
      bg = "#9333ea"; // Poktan
    }

    return L.divIcon({
      className: "custom-map-pin",
      html: `
        <div style="
          background-color: ${bg};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2px solid #ffffff;
          transition: transform 0.2s ease;
        ">
          <span style="transform: rotate(45deg); font-size: 14px; line-height: 1;">${symbol}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -30],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 10 }}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pins.map((pin) => {
        const hasRealPhoto = Boolean(pin.fotoUrl || (pin.foto && pin.foto.length > 0 && pin.foto[0].url));
        const photoUrl = hasRealPhoto ? (pin.fotoUrl || pin.foto![0].url) : null;

        // Dedicated detail page link based on sector
        let detailHref = `/pertanian/${pin.dbId || pin.kode || pin.id}`;
        let btnTheme = "bg-emerald-600 hover:bg-emerald-700 text-white";
        if (pin.jenisUsaha === "KOLAM") {
          detailHref = `/perikanan/${pin.dbId || pin.kode || pin.id}`;
          btnTheme = "bg-sky-600 hover:bg-sky-700 text-white";
        } else if (pin.jenisUsaha === "PETERNAKAN") {
          detailHref = `/peternakan/${pin.dbId || pin.kode || pin.id}`;
          btnTheme = "bg-orange-600 hover:bg-orange-700 text-white";
        }

        return (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={getIcon(pin)}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[220px] max-w-[260px]">
                {/* Tampilan Foto atau Keterangan Belum Ada Foto */}
                {hasRealPhoto && photoUrl ? (
                  <div
                    onClick={() => {
                      if (onSelectPhoto) {
                        onSelectPhoto({
                          url: photoUrl,
                          title: pin.nama,
                          subtitle: `${pin.komoditas} • Desa ${pin.desa || "-"}, Kec. ${pin.kecamatan || "Tapsel"}`,
                        });
                      }
                    }}
                    className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-slate-100 cursor-pointer group shadow-2xs"
                    title="Klik untuk memperbesar foto"
                  >
                    <img
                      src={photoUrl}
                      alt={pin.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 rounded bg-black/60 text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-xs">
                        🔍 Perbesar Foto
                      </span>
                    </div>
                    <span
                      className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs"
                      style={{ backgroundColor: pin.color }}
                    >
                      {pin.jenisUsaha}
                    </span>
                  </div>
                ) : (
                  <div className="relative h-24 w-full rounded-lg overflow-hidden mb-2 bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <ImageOff size={24} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500">
                      Belum ada foto
                    </span>
                    <span
                      className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-md shadow-xs"
                      style={{ backgroundColor: pin.color }}
                    >
                      {pin.jenisUsaha}
                    </span>
                  </div>
                )}

                <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                  {pin.nama}
                </h4>
                <p className="text-xs text-slate-600 mb-0.5">
                  <strong>Komoditas:</strong> {pin.komoditas}
                </p>
                {pin.luas && (
                  <p className="text-xs text-slate-600 mb-0.5">
                    <strong>Skala:</strong> {pin.luas}
                  </p>
                )}
                {pin.pemilik && (
                  <p className="text-xs text-slate-600 mb-0.5">
                    <strong>Pengelola:</strong> {pin.pemilik}
                  </p>
                )}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-emerald-600 shrink-0" />
                    Desa {pin.desa || "-"}, {pin.kecamatan || "Tapsel"}
                  </span>
                </div>

                {/* Tombol Diarahkan ke Halaman Detail Lengkap */}
                <a
                  href={detailHref}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${btnTheme}`}
                >
                  <span>Lihat Detail</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

// Client-only dynamic wrapper
const DynamicLeafletMap = dynamic(() => Promise.resolve(LeafletMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
      <RefreshCw className="animate-spin text-emerald-600" size={24} />
      <span className="text-xs font-medium">Memuat Peta Wilayah Tapanuli Selatan...</span>
    </div>
  ),
});

export default function PotensiMap({
  pins,
  kecamatanList = [],
  selectedKecamatan,
  setSelectedKecamatan,
  selectedDesa = "semua",
  setSelectedDesa,
  selectedJenis,
  setSelectedJenis,
}: PotensiMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const desaOptions = useMemo(() => {
    if (selectedKecamatan === "semua") return [];
    const desas = new Set<string>();
    pins.forEach((p) => {
      if (p.kecamatan?.toLowerCase() === selectedKecamatan.toLowerCase() && p.desa) {
        desas.add(p.desa);
      }
    });
    return Array.from(desas).sort();
  }, [pins, selectedKecamatan]);

  // Filtered Pins
  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      const matchJenis =
        selectedJenis === "semua" ||
        p.jenisUsaha.toLowerCase() === selectedJenis.toLowerCase();
      const matchKecamatan =
        selectedKecamatan === "semua" ||
        p.kecamatan?.toLowerCase() === selectedKecamatan.toLowerCase();
      const matchDesa =
        !selectedDesa ||
        selectedDesa === "semua" ||
        p.desa?.toLowerCase() === selectedDesa.toLowerCase();
      return matchJenis && matchKecamatan && matchDesa;
    });
  }, [pins, selectedJenis, selectedKecamatan, selectedDesa]);

  // Center Tapanuli Selatan (Sipirok region)
  const defaultCenter: [number, number] = [1.45, 99.25];
  const defaultZoom = 10;

  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    title: string;
    subtitle: string;
  } | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<MapPinItem | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Map Header & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Peta Sebaran Potensi & Usaha Tani
          </h3>
          <p className="text-xs text-slate-500">
            Sebaran geospasial Kebun, Kolam, dan Peternakan Kabupaten Tapanuli Selatan
          </p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Kecamatan */}
          <div className="relative">
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                if (setSelectedDesa) setSelectedDesa("semua");
              }}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Kecamatan ({kecamatanList.length || 15})</option>
              {kecamatanList.map((k) => (
                <option key={k.kd_kecamatan} value={k.nm_kecamatan}>
                  {k.nm_kecamatan}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Desa (tampil ketika kecamatan dipilih) */}
          {selectedKecamatan !== "semua" && setSelectedDesa && (
            <div className="relative">
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer shadow-2xs max-w-[150px]"
              >
                <option value="semua">Semua Desa</option>
                {desaOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Jenis Usaha */}
          <div className="relative">
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Jenis Usaha</option>
              <option value="kebun">Kebun (Pertanian)</option>
              <option value="kolam">Kolam (Perikanan)</option>
              <option value="peternakan">Peternakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container & Overlay Legend */}
      <div className="relative flex-1 w-full overflow-hidden">
        {mounted && (
          <DynamicLeafletMap
            pins={filteredPins}
            center={defaultCenter}
            zoom={defaultZoom}
            onSelectPhoto={setSelectedPhotoModal}
            onSelectDetail={setSelectedDetail}
          />
        )}

        {/* Legend Box matching Mockup */}
        <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-md border border-slate-200 text-xs font-medium space-y-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#16a34a] border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold">Kebun</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0284c7] border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold">Kolam</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ea580c] border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold">Peternakan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#9333ea] border border-white shadow-2xs" />
            <span className="text-slate-700 font-semibold">Kelompok Tani</span>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX FOTO */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="relative h-80 sm:h-96 w-full bg-slate-900">
              <img
                src={selectedPhotoModal.url}
                alt={selectedPhotoModal.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-5 flex items-center justify-between bg-white">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {selectedPhotoModal.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPhotoModal.subtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PROFIL USAHA LENGKAP */}
      {selectedDetail && (
        <div
          onClick={() => setSelectedDetail(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div
              className="p-5 text-white flex items-start justify-between gap-4 shrink-0"
              style={{
                backgroundColor:
                  selectedDetail.jenisUsaha === "KOLAM"
                    ? "#0369a1"
                    : selectedDetail.jenisUsaha === "PETERNAKAN"
                    ? "#c2410c"
                    : "#15803d",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  {selectedDetail.jenisUsaha === "KOLAM" ? (
                    <Fish size={24} className="text-sky-200" />
                  ) : selectedDetail.jenisUsaha === "PETERNAKAN" ? (
                    <Beef size={24} className="text-orange-200" />
                  ) : (
                    <Sprout size={24} className="text-emerald-200" />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase mb-1">
                    <span>{selectedDetail.jenisUsaha}</span>
                    <span>•</span>
                    <span>{selectedDetail.detail?.kode || selectedDetail.id}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black leading-tight">
                    {selectedDetail.nama}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    {selectedDetail.detail?.komoditas} • Kec. {selectedDetail.kecamatan || "Tapsel"}, Desa {selectedDetail.desa || "-"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetail(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
              {/* Foto Banner / Status Foto */}
              {selectedDetail.fotoUrl || (selectedDetail.foto && selectedDetail.foto.length > 0) ? (
                <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                  <img
                    src={selectedDetail.fotoUrl || selectedDetail.foto![0].url}
                    alt={selectedDetail.nama}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                    Dokumentasi Terverifikasi Lapangan
                  </div>
                </div>
              ) : (
                <div className="h-32 w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                  <ImageOff size={28} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">
                    Belum ada foto dokumentasi untuk unit usaha ini
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Foto dapat diunggah melalui formulir pembaruan data
                  </span>
                </div>
              )}

              {/* Data Kelompok Tani / Pengelola */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-700" />
                    Kelembagaan & Pengelola
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Status: {selectedDetail.detail?.status || "AKTIF"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Kelompok Tani / Pokdakan:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedDetail.detail?.kelompokTani?.nama || "Usaha Mandiri"}
                    </p>
                    {selectedDetail.detail?.kelompokTani?.kode && (
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                        {selectedDetail.detail?.kelompokTani?.kode}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Nama Ketua / Pengelola:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedDetail.detail?.kelompokTani?.ketua || selectedDetail.pemilik || "-"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedDetail.detail?.kelompokTani?.anggota
                        ? `${selectedDetail.detail?.kelompokTani?.anggota} Orang Anggota Aktif`
                        : "Pengelola Perseorangan / Mandiri"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-slate-600">
                  <MapPin size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lokasi Geospasial:</strong> {selectedDetail.detail?.alamat} (Lat: {selectedDetail.lat.toFixed(5)}, Lng: {selectedDetail.lng.toFixed(5)})
                  </span>
                </div>
              </div>

              {/* Rincian Teknis & Spesifikasi Usaha */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" />
                  Rincian Teknis & Karakteristik Usaha
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedDetail.detail?.spesifikasi?.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {item.label}
                      </span>
                      <p className="font-bold text-slate-900 text-xs mt-1">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Riwayat Siklus Produksi / Bantuan Terkait */}
              {selectedDetail.detail?.siklus && selectedDetail.detail.siklus.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-sky-600" />
                    Siklus Produksi & Kegiatan Terdata
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetail.detail.siklus.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{s.nama}</p>
                          <p className="text-[10px] text-slate-500">
                            Dimulai: {s.tanggalMulai} • Estimasi Panen: {s.targetPanen}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {s.tahap}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-500">
                Pemerintah Kabupaten Tapanuli Selatan
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={
                    selectedDetail.jenisUsaha === "KOLAM"
                      ? `/perikanan/${selectedDetail.dbId || selectedDetail.kode || selectedDetail.id}`
                      : selectedDetail.jenisUsaha === "PETERNAKAN"
                      ? `/peternakan/${selectedDetail.dbId || selectedDetail.kode || selectedDetail.id}`
                      : `/pertanian/${selectedDetail.dbId || selectedDetail.kode || selectedDetail.id}`
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Buka Halaman Detail Penuh</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
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
