"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Map,
  MapPin,
  Sprout,
  Fish,
  Beef,
  ArrowRight,
  Plus,
  Minus,
  Home,
  ChevronDown,
} from "lucide-react";

interface MapPinItem {
  id: string;
  nama: string;
  jenisUsaha: "KEBUN" | "KOLAM" | "PETERNAKAN";
  lat: number;
  lng: number;
  kecamatan?: string;
  komoditas?: string;
}

interface Props {
  pins: MapPinItem[];
  kecamatanList: { kd_kecamatan: string; nm_kecamatan: string }[];
  ringkasan: {
    kebun: number;
    kolam: number;
    ternak: number;
    total: number;
  };
  topKecamatan: { nama: string; total: number }[];
}

const TAPSEL_CENTER: [number, number] = [1.4484, 99.2681];
const TAPSEL_ZOOM = 10;

// Inner Leaflet Map Component (Client Only)
function LeafletMapCanvas({
  filteredPins,
  center,
  zoom,
}: {
  filteredPins: MapPinItem[];
  center: [number, number];
  zoom: number;
}) {
  const { MapContainer, TileLayer, Marker, Popup, useMap } = require("react-leaflet");
  const L = require("leaflet");

  function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, zoom, { duration: 0.8 });
    }, [center, zoom, map]);
    return null;
  }

  const getPinIcon = (jenis: "KEBUN" | "KOLAM" | "PETERNAKAN") => {
    let color = "#16a34a"; // green
    if (jenis === "KOLAM") color = "#0284c7"; // blue
    if (jenis === "PETERNAKAN") color = "#ea580c"; // orange

    return L.divIcon({
      className: "custom-portal-pin",
      html: `
        <div style="
          width: 18px;
          height: 18px;
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-50%, -50%);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={false}
      className="w-full h-full rounded-xl z-0"
    >
      <ChangeView center={center} zoom={zoom} />
      {/* Esri World Imagery (High Resolution Satellite) */}
      <TileLayer
        attribution="&copy; Esri, Maxar, Earthstar"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      {filteredPins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={getPinIcon(pin.jenisUsaha)}
        >
          <Popup className="custom-portal-popup">
            <div className="text-xs p-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white mb-1 ${
                  pin.jenisUsaha === "KEBUN"
                    ? "bg-emerald-600"
                    : pin.jenisUsaha === "KOLAM"
                    ? "bg-sky-600"
                    : "bg-orange-600"
                }`}
              >
                {pin.jenisUsaha === "KEBUN"
                  ? "Pertanian"
                  : pin.jenisUsaha === "KOLAM"
                  ? "Perikanan"
                  : "Peternakan"}
              </span>
              <p className="font-bold text-slate-900">{pin.nama}</p>
              <p className="text-[11px] text-slate-500">Kec. {pin.kecamatan || "-"}</p>
              {pin.komoditas && (
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                  Komoditas: {pin.komoditas}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(LeafletMapCanvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a261c] flex items-center justify-center text-emerald-200 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Memuat Peta Satelit Tapsel...</span>
      </div>
    </div>
  ),
});

export default function PortalMapSection({
  pins,
  kecamatanList,
  ringkasan,
  topKecamatan,
}: Props) {
  const [selectedSektor, setSelectedSektor] = useState("semua");
  const [selectedKec, setSelectedKec] = useState("semua");
  const [mapCenter, setMapCenter] = useState<[number, number]>(TAPSEL_CENTER);
  const [mapZoom, setMapZoom] = useState(TAPSEL_ZOOM);

  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      if (selectedSektor !== "semua" && p.jenisUsaha !== selectedSektor) return false;
      if (
        selectedKec !== "semua" &&
        p.kecamatan?.toLowerCase().trim() !== selectedKec.toLowerCase().trim()
      ) {
        return false;
      }
      return true;
    });
  }, [pins, selectedSektor, selectedKec]);

  const kebunPct = ringkasan.total > 0 ? ((ringkasan.kebun / ringkasan.total) * 100).toFixed(1) : "0";
  const kolamPct = ringkasan.total > 0 ? ((ringkasan.kolam / ringkasan.total) * 100).toFixed(1) : "0";
  const ternakPct = ringkasan.total > 0 ? ((ringkasan.ternak / ringkasan.total) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Map size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Peta Potensi Wilayah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jelajahi sebaran potensi pertanian, perikanan dan peternakan di seluruh wilayah Tapanuli Selatan.
            </p>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSektor}
            onChange={(e) => setSelectedSektor(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50/70 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="semua">Semua Sektor</option>
            <option value="KEBUN">Pertanian & Perkebunan</option>
            <option value="KOLAM">Perikanan Budidaya</option>
            <option value="PETERNAKAN">Peternakan Rakyat</option>
          </select>

          <select
            value={selectedKec}
            onChange={(e) => {
              setSelectedKec(e.target.value);
              if (e.target.value === "semua") {
                setMapCenter(TAPSEL_CENTER);
                setMapZoom(TAPSEL_ZOOM);
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50/70 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[150px] truncate"
          >
            <option value="semua">Semua Kecamatan</option>
            {kecamatanList.map((k) => (
              <option key={k.kd_kecamatan} value={k.nm_kecamatan}>
                {k.nm_kecamatan}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Map on Left (approx 65%), Breakdown on Right (approx 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Map Canvas */}
        <div className="lg:col-span-7 xl:col-span-8 relative h-[360px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-200/90 shadow-inner">
          <DynamicMap filteredPins={filteredPins} center={mapCenter} zoom={mapZoom} />

          {/* Floating Map Controls Top-Left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 p-1">
            <button
              type="button"
              onClick={() => setMapZoom((prev) => Math.min(prev + 1, 18))}
              className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded font-bold text-sm"
              title="Perbesar"
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={() => setMapZoom((prev) => Math.max(prev - 1, 9))}
              className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded font-bold text-sm"
              title="Perkecil"
            >
              <Minus size={15} />
            </button>
            <div className="h-px bg-slate-200 my-0.5"></div>
            <button
              type="button"
              onClick={() => {
                setMapCenter(TAPSEL_CENTER);
                setMapZoom(TAPSEL_ZOOM);
                setSelectedKec("semua");
                setSelectedSektor("semua");
              }}
              className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 rounded"
              title="Pusatkan Peta Tapsel"
            >
              <Home size={14} />
            </button>
          </div>

          {/* Label Wilayah Overlay */}
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/20 pointer-events-none">
            <span>Tapanuli Selatan</span>
          </div>

          {/* Map Legend Overlay Bottom-Left */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-medium rounded-lg p-2.5 border border-white/10 shadow-lg space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
              <span>Pertanian</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 ring-2 ring-lime-400/30"></span>
              <span>Perkebunan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-500/30"></span>
              <span>Perikanan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-500/30"></span>
              <span>Peternakan</span>
            </div>
          </div>
        </div>

        {/* Right Info Breakdown Panel */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between space-y-4">
          {/* Ringkasan Potensi */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Ringkasan Potensi Wilayah
            </h4>

            {/* Pertanian Bar */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sprout size={13} />
                  </div>
                  <span className="font-semibold text-slate-800">Pertanian & Perkebunan</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900">{ringkasan.kebun}</span>{" "}
                  <span className="text-[10px] text-slate-500">Unit</span>
                  <span className="text-[10px] text-emerald-600 font-bold ml-1.5">({kebunPct}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${kebunPct}%` }}
                ></div>
              </div>
            </div>

            {/* Perikanan Bar */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Fish size={13} />
                  </div>
                  <span className="font-semibold text-slate-800">Perikanan Budidaya</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900">{ringkasan.kolam}</span>{" "}
                  <span className="text-[10px] text-slate-500">Unit</span>
                  <span className="text-[10px] text-sky-600 font-bold ml-1.5">({kolamPct}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${kolamPct}%` }}
                ></div>
              </div>
            </div>

            {/* Peternakan Bar */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    <Beef size={13} />
                  </div>
                  <span className="font-semibold text-slate-800">Peternakan Rakyat</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900">{ringkasan.ternak}</span>{" "}
                  <span className="text-[10px] text-slate-500">Unit</span>
                  <span className="text-[10px] text-orange-600 font-bold ml-1.5">({ternakPct}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${ternakPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Kecamatan Terbanyak Ranking */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Kecamatan Terbanyak
            </h4>
            <div className="space-y-1.5 text-xs">
              {topKecamatan.map((item, idx) => (
                <div
                  key={item.nama}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-semibold truncate capitalize">
                      {item.nama.toLowerCase()}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">{item.total} Unit</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Button */}
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition shadow-xs hover:shadow"
          >
            <Map size={14} />
            <span>Lihat Detail Peta</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
