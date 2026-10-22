"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  ExternalLink,
  RefreshCw,
  X,
  Check,
  Compass,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
  accentColor?: "emerald" | "sky" | "orange";
  unitName?: string;
  helperText?: string;
}

// Inner Leaflet Map Component (loaded dynamically on client)
const LeafletPickerMapInner = ({
  currentLat,
  currentLng,
  onPickCoordinate,
  pinColor = "#16a34a",
}: {
  currentLat: number;
  currentLng: number;
  onPickCoordinate: (lat: number, lng: number) => void;
  pinColor?: string;
}) => {
  const { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } = require("react-leaflet");
  const L = require("leaflet");

  // Fix icon anchor & style
  const customMarkerIcon = L.divIcon({
    className: "custom-picker-pin",
    html: `
      <div style="
        background-color: ${pinColor};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

  function MapClickEvent() {
    useMapEvents({
      click(e: any) {
        onPickCoordinate(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function MapRecenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom() || 14);
    }, [center, map]);
    return null;
  }

  return (
    <MapContainer
      center={[currentLat, currentLng]}
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 10 }}
    >
      <MapRecenter center={[currentLat, currentLng]} />
      <MapClickEvent />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[currentLat, currentLng]}
        icon={customMarkerIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e: any) => {
            const marker = e.target;
            const position = marker.getLatLng();
            onPickCoordinate(position.lat, position.lng);
          },
        }}
      >
        <Popup>
          <div className="p-1 text-center font-sans">
            <span className="font-bold text-xs text-slate-800 block">Titik Lokasi Terpilih</span>
            <span className="text-[11px] font-mono text-emerald-700 block mt-0.5">
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Geser pin untuk mengatur ulang posisi
            </span>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

const DynamicLeafletPickerMap = dynamic(() => Promise.resolve(LeafletPickerMapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
      <RefreshCw className="animate-spin text-emerald-600" size={24} />
      <span className="text-xs font-semibold">Memuat Peta Interaktif...</span>
    </div>
  ),
});

// Default center coordinate for Tapanuli Selatan (Sipirok)
const DEFAULT_TAPSEL_LAT = 1.5917;
const DEFAULT_TAPSEL_LNG = 99.2789;

export default function LocationPicker({
  lat,
  lng,
  onChange,
  accentColor = "emerald",
  unitName,
  helperText,
}: LocationPickerProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState<number>(DEFAULT_TAPSEL_LAT);
  const [tempLng, setTempLng] = useState<number>(DEFAULT_TAPSEL_LNG);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(
    null
  );
  const [pasteInput, setPasteInput] = useState("");

  const colorThemes = {
    emerald: {
      btn: "bg-emerald-700 hover:bg-emerald-800 text-white",
      btnLight: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200",
      focus: "focus:ring-emerald-500/20 focus:border-emerald-600",
      accentText: "text-emerald-700",
      hex: "#16a34a",
    },
    sky: {
      btn: "bg-sky-600 hover:bg-sky-700 text-white",
      btnLight: "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200",
      focus: "focus:ring-sky-500/20 focus:border-sky-600",
      accentText: "text-sky-700",
      hex: "#0284c7",
    },
    orange: {
      btn: "bg-orange-600 hover:bg-orange-700 text-white",
      btnLight: "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200",
      focus: "focus:ring-orange-500/20 focus:border-orange-600",
      accentText: "text-orange-700",
      hex: "#ea580c",
    },
  };

  const theme = colorThemes[accentColor] || colorThemes.emerald;

  // Initialize temp coordinates whenever map modal opens or values change
  useEffect(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setTempLat(parsedLat);
      setTempLng(parsedLng);
    } else {
      setTempLat(DEFAULT_TAPSEL_LAT);
      setTempLng(DEFAULT_TAPSEL_LNG);
    }
  }, [lat, lng, mapModalOpen]);

  // AUTO-GPS HANDLER (HTML5 Geolocation API)
  const handleGetGPSLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setNotification({
        type: "error",
        message: "Perangkat atau browser Anda tidak mendukung fitur Geolocation GPS.",
      });
      return;
    }

    setGpsLoading(true);
    setNotification({
      type: "info",
      message: "Sedang mengambil titik koordinat GPS presisi tinggi...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude.toFixed(6);
        const userLng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        onChange(userLat, userLng);
        setTempLat(parseFloat(userLat));
        setTempLng(parseFloat(userLng));
        setGpsLoading(false);

        setNotification({
          type: "success",
          message: `Titik GPS berhasil didapatkan! (Akurasi: ±${accuracy} meter)`,
        });

        setTimeout(() => setNotification(null), 5000);
      },
      (error) => {
        setGpsLoading(false);
        let errorMsg = "Gagal mengambil titik GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin akses lokasi ditolak oleh browser/pengguna. Silakan aktifkan izin lokasi di pengaturan browser Anda.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Sinyal GPS tidak tersedia saat ini. Pastikan GPS/Location perangkat aktif.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Waktu pencarian sinyal GPS habis. Coba lagi atau gunakan pemilihan titik di peta.";
        }
        setNotification({ type: "error", message: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // PARSE GOOGLE MAPS LINK OR COORDINATES
  const handleParseGoogleMapsInput = () => {
    if (!pasteInput.trim()) return;

    const input = pasteInput.trim();

    // Pattern 1: URL with @lat,lng e.g. https://www.google.com/maps/@1.591234,99.278912,15z
    const matchAt = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (matchAt) {
      const pLat = parseFloat(matchAt[1]).toFixed(6);
      const pLng = parseFloat(matchAt[2]).toFixed(6);
      applyParsedCoords(pLat, pLng);
      return;
    }

    // Pattern 2: URL with ?q=lat,lng or /place/lat,lng
    const matchQ = input.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || input.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (matchQ) {
      const pLat = parseFloat(matchQ[1]).toFixed(6);
      const pLng = parseFloat(matchQ[2]).toFixed(6);
      applyParsedCoords(pLat, pLng);
      return;
    }

    // Pattern 3: Simple "lat, lng" text or "lat,lng"
    const matchSimple = input.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
    if (matchSimple) {
      const pLat = parseFloat(matchSimple[1]).toFixed(6);
      const pLng = parseFloat(matchSimple[2]).toFixed(6);
      applyParsedCoords(pLat, pLng);
      return;
    }

    setNotification({
      type: "error",
      message: "Format koordinat atau link Google Maps tidak dikenali. Contoh yang valid: 1.5917, 99.2789",
    });
  };

  const applyParsedCoords = (pLat: string, pLng: string) => {
    onChange(pLat, pLng);
    setTempLat(parseFloat(pLat));
    setTempLng(parseFloat(pLng));
    setPasteInput("");
    setNotification({
      type: "success",
      message: `Koordinat berhasil diterapkan: ${pLat}, ${pLng}`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const hasCoords = Boolean(lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)));
  const googleMapsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div className="space-y-2.5">
      {/* Label and Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block font-bold text-slate-700 text-xs flex items-center gap-1.5">
          <MapPin size={14} className={theme.accentText} />
          <span>Titik Koordinat Lokasi (GPS & Peta)</span>
        </label>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGetGPSLocation}
            disabled={gpsLoading}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs border cursor-pointer ${theme.btnLight}`}
            title="Ambil koordinat akurat dari GPS perangkat saat ini"
          >
            <Compass size={14} className={gpsLoading ? "animate-spin text-emerald-600" : ""} />
            <span>{gpsLoading ? "Mencari GPS..." : "Ambil Lokasi GPS"}</span>
          </button>

          <button
            type="button"
            onClick={() => setMapModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${theme.btn}`}
            title="Pilih titik lokasi langsung di peta interaktif"
          >
            <Navigation size={14} />
            <span>Pilih di Peta</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-2.5 px-3 rounded-xl text-xs flex items-center justify-between font-medium animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : notification.type === "error"
              ? "bg-rose-50 text-rose-900 border border-rose-200"
              : "bg-blue-50 text-blue-900 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            ) : (
              <RefreshCw size={15} className="animate-spin text-blue-600 shrink-0" />
            )}
            <span className="leading-tight">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Inputs Lat & Lng */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">Latitude (Garis Lintang)</span>
            {lat && <span className="text-[10px] text-emerald-600 font-mono font-bold">Terisi</span>}
          </div>
          <input
            type="text"
            value={lat}
            onChange={(e) => onChange(e.target.value, lng)}
            placeholder="Contoh: 1.591234"
            className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 bg-white ${theme.focus} focus:outline-none`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">Longitude (Garis Bujur)</span>
            {lng && <span className="text-[10px] text-emerald-600 font-mono font-bold">Terisi</span>}
          </div>
          <input
            type="text"
            value={lng}
            onChange={(e) => onChange(lat, e.target.value)}
            placeholder="Contoh: 99.278912"
            className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 bg-white ${theme.focus} focus:outline-none`}
          />
        </div>
      </div>

      {/* Google Maps External Link & Tooltip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
        <p className="text-slate-400">
          {helperText || "Titik koordinat digunakan untuk pemetaan geospasial pada peta dashboard."}
        </p>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
            title="Lihat titik ini di Google Maps Satelit"
          >
            <span>Verifikasi di Google Maps</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* MODAL PETA INTERAKTIF / GOOGLE MAP PICKER */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.btnLight}`}>
                  <MapPin size={20} className={theme.accentText} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Pilih Titik Koordinat di Peta
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {unitName ? `Lokasi untuk: ${unitName}` : "Klik peta atau geser pin ke titik lokasi usaha"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Action toolbar inside modal: GPS & Paste */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Paste link Google Maps / koordinat (misal: 1.5917, 99.2789)..."
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleParseGoogleMapsInput}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>

              <button
                type="button"
                onClick={handleGetGPSLocation}
                disabled={gpsLoading}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border cursor-pointer shrink-0 ${theme.btnLight}`}
              >
                <Compass size={13} className={gpsLoading ? "animate-spin" : ""} />
                <span>{gpsLoading ? "GPS..." : "Deteksi GPS Saya"}</span>
              </button>
            </div>

            {/* Interactive Map Canvas */}
            <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <DynamicLeafletPickerMap
                currentLat={tempLat}
                currentLng={tempLng}
                onPickCoordinate={(newLat, newLng) => {
                  setTempLat(newLat);
                  setTempLng(newLng);
                }}
                pinColor={theme.hex}
              />

              {/* Floating coordinates indicator on top of map */}
              <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-mono text-slate-800 flex items-center gap-2">
                <MapPin size={13} className={theme.accentText} />
                <span>
                  {tempLat.toFixed(6)}, {tempLng.toFixed(6)}
                </span>
              </div>
            </div>

            {/* Modal Footer with Confirmation */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tip:</span> Anda dapat menggeser penanda merah pada peta untuk menyempurnakan titik.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(tempLat.toFixed(6), tempLng.toFixed(6));
                    setMapModalOpen(false);
                    setNotification({
                      type: "success",
                      message: `Koordinat ${tempLat.toFixed(6)}, ${tempLng.toFixed(6)} berhasil disimpan ke form!`,
                    });
                    setTimeout(() => setNotification(null), 4000);
                  }}
                  className={`px-5 py-2 rounded-xl font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer ${theme.btn}`}
                >
                  <Check size={15} />
                  <span>Gunakan Koordinat Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
