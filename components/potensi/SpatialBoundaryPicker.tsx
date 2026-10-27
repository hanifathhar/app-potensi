"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  MapPin,
  Layers,
  X,
  Check,
  RefreshCw,
  Trash2,
  Undo2,
  Maximize2,
  FileCode,
  Info,
  CheckCircle2,
  Sparkles,
  Palette,
  Crosshair,
  Globe,
  Move,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface SpatialBoundaryPickerProps {
  value: any; // GeoJSON object or null
  onChange: (geojson: any, estimatedAreaHa?: number) => void;
  centerLat?: number;
  centerLng?: number;
  warnaPolygon?: string;
  onChangeWarna?: (color: string) => void;
  unitName?: string;
  onApplyAreaHa?: (ha: string) => void;
}

// Helper: Calculate polygon area in Hectares (Spherical approximation)
export function calculatePolygonAreaHa(points: [number, number][]): number {
  if (!points || points.length < 3) return 0;
  const radius = 6378137; // Earth radius in meters
  let area = 0;
  const rad = Math.PI / 180;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];
    if (!p1 || !p2 || isNaN(p1[0]) || isNaN(p1[1]) || isNaN(p2[0]) || isNaN(p2[1])) continue;
    area += (p2[1] * rad - p1[1] * rad) * (2 + Math.sin(p1[0] * rad) + Math.sin(p2[0] * rad));
  }
  area = Math.abs((area * radius * radius) / 2);
  const ha = area / 10000;
  return Number(ha.toFixed(2));
}

// Helper: Extract [lat, lng][] array from various GeoJSON formats
export function extractPointsFromGeoJson(geojson: any): [number, number][] {
  if (!geojson) return [];
  try {
    const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (Array.isArray(data)) {
      return data
        .map((pt: any) => {
          const lat = Number(pt[0] !== undefined ? pt[0] : pt.lat);
          const lng = Number(pt[1] !== undefined ? pt[1] : pt.lng);
          return [lat, lng] as [number, number];
        })
        .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && pt[0] !== 0 && pt[1] !== 0);
    }
    if (data.type === "Feature" && data.geometry) {
      return extractPointsFromGeoJson(data.geometry);
    }
    if (data.type === "Polygon" && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
      // GeoJSON Polygon uses [lng, lat]
      const ring = data.coordinates[0];
      return ring
        .map((coord: any) => [Number(coord[1]), Number(coord[0])] as [number, number])
        .filter((pt: [number, number]) => !isNaN(pt[0]) && !isNaN(pt[1]));
    }
    if (data.type === "MultiPolygon" && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
      const ring = data.coordinates[0][0];
      return ring
        .map((coord: any) => [Number(coord[1]), Number(coord[0])] as [number, number])
        .filter((pt: [number, number]) => !isNaN(pt[0]) && !isNaN(pt[1]));
    }
  } catch (e) {
    console.warn("Gagal mengekstrak koordinat dari GeoJSON:", e);
  }
  return [];
}

// Helper: Convert [lat, lng][] array to standard GeoJSON Polygon format
export function pointsToGeoJsonPolygon(points: [number, number][]): any {
  if (!points || points.length < 3) return null;
  const validPoints = points.filter((p) => !isNaN(p[0]) && !isNaN(p[1]));
  if (validPoints.length < 3) return null;

  // Ensure closed ring: first point == last point
  const closed = [...validPoints];
  const first = validPoints[0];
  const last = validPoints[validPoints.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closed.push([first[0], first[1]]);
  }

  // GeoJSON uses [lng, lat]
  const coordinates = [closed.map((p) => [Number(p[1]), Number(p[0])])];

  return {
    type: "Polygon",
    coordinates,
  };
}

// Preset Warna Poligon GIS
const PRESET_COLORS = [
  { label: "Hijau Kebun", hex: "#16a34a" },
  { label: "Kuning Jagung", hex: "#f59e0b" },
  { label: "Cokelat Kopi", hex: "#78350f" },
  { label: "Hijau Sawit", hex: "#14532d" },
  { label: "Merah Cabai", hex: "#dc2626" },
  { label: "Biru Terang", hex: "#0284c7" },
  { label: "Ungu Violet", hex: "#9333ea" },
];

// Inner Leaflet Map for Polygon Editor Modal
const LeafletPolygonEditorInner = ({
  center,
  markerPos,
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  color,
  layerType,
}: {
  center: [number, number];
  markerPos?: [number, number] | null;
  points: [number, number][];
  onAddPoint: (lat: number, lng: number) => void;
  onUpdatePoint: (index: number, lat: number, lng: number) => void;
  onDeletePoint: (index: number) => void;
  color: string;
  layerType: "satellite" | "osm";
}) => {
  const { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMapEvents, useMap } =
    require("react-leaflet");
  const L = require("leaflet");

  // Invalidate size on mount & initial bounds fitting
  function MapInitController() {
    const map = useMap();
    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          if (points && points.length >= 3) {
            const poly = L.polygon(points);
            const b = poly.getBounds();
            if (b.isValid()) {
              map.fitBounds(b, { padding: [50, 50], maxZoom: 17 });
              return;
            }
          }
          map.setView(center, 16);
        } catch (e) {
          console.warn("Leaflet init error:", e);
        }
      }, 250);
      return () => clearTimeout(timer);
    }, [map]);
    return null;
  }

  // Handle map click to continuously add subsequent points
  function MapClickEvent() {
    useMapEvents({
      click(e: any) {
        if (!e || !e.latlng) return;
        const lat = Number(e.latlng.lat);
        const lng = Number(e.latlng.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
        onAddPoint(lat, lng);
      },
    });
    return null;
  }

  // Recenter button control inside map
  function MapRecenterControl() {
    const map = useMap();
    return (
      <div className="leaflet-top leaflet-right" style={{ marginTop: "12px", marginRight: "12px", zIndex: 1000 }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (points && points.length >= 3) {
              const poly = L.polygon(points);
              const b = poly.getBounds();
              if (b.isValid()) {
                map.fitBounds(b, { padding: [40, 40], maxZoom: 18 });
                return;
              }
            }
            if (center) {
              map.setView(center, 16);
            }
          }}
          className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 transition cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
          title="Pusatkan Peta ke Lokasi Batas Lahan"
        >
          <Crosshair size={17} className="text-emerald-700" />
        </button>
      </div>
    );
  }

  // Center Plant Marker Icon (Titik Centroid Kebun)
  const centerIcon = L.divIcon({
    className: "custom-marker-center",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      ">
        <span style="transform: rotate(45deg); font-size: 13px;">🌱</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

  // Numbered Vertex Icon for polygon corners (#1, #2, #3, #4...)
  const createVertexIcon = (num: number) => {
    return L.divIcon({
      className: "custom-polygon-vertex",
      html: `
        <div style="
          background-color: ${color};
          color: #ffffff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 7px rgba(0,0,0,0.45);
          cursor: grab;
        ">
          ${num}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  const hasValidMarker = Boolean(
    markerPos &&
    Array.isArray(markerPos) &&
    markerPos.length >= 2 &&
    !isNaN(Number(markerPos[0])) &&
    !isNaN(Number(markerPos[1])) &&
    Number(markerPos[0]) !== 0
  );

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 10 }}
    >
      <MapInitController />
      <MapClickEvent />
      <MapRecenterControl />

      {/* Tile Layer: Satellite (Citra Udara Esri) vs OSM (Peta Jalan) */}
      {layerType === "satellite" ? (
        <TileLayer
          key="satellite"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      ) : (
        <TileLayer
          key="osm"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
      )}

      {/* Titik Lokasi Utama Marker (Centroid Kebun) */}
      {hasValidMarker ? (
        <Marker position={markerPos as [number, number]} icon={centerIcon}>
          <Popup>
            <div className="p-1 text-center font-sans">
              <span className="font-bold text-xs text-slate-800 block">Titik Centroid Kebun</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {Number(markerPos![0]).toFixed(6)}, {Number(markerPos![1]).toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>
      ) : null}

      {/* Render Garis Penghubung Titik-Titik Sudut */}
      {points && points.length >= 2 ? (
        <Polyline
          positions={points}
          pathOptions={{
            color: color,
            weight: 3,
            interactive: false,
          }}
        />
      ) : null}

      {/* Render Area Poligon saat titik >= 3 (interactive: false agar klik peta tetap bisa menambah titik ke-4, ke-5, dst) */}
      {points && points.length >= 3 ? (
        <Polygon
          positions={points}
          pathOptions={{
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.28,
            dashArray: "4, 4",
            interactive: false,
          }}
        />
      ) : null}

      {/* Render Vertex Titik Sudut Bernomor (#1, #2, #3, ...) yang dapat digeser (Draggable) */}
      {points &&
        points.map((pt, idx) => (
          <Marker
            key={`vertex-${idx}-${points.length}`}
            position={pt}
            icon={createVertexIcon(idx + 1)}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                try {
                  const latlng = e.target.getLatLng();
                  if (latlng && !isNaN(latlng.lat) && !isNaN(latlng.lng)) {
                    onUpdatePoint(idx, latlng.lat, latlng.lng);
                  }
                } catch (err) {
                  console.warn("Drag error:", err);
                }
              },
            }}
          >
            <Popup>
              <div className="p-1 text-center font-sans space-y-1.5 min-w-[150px]">
                <div className="font-extrabold text-xs text-slate-800 flex items-center justify-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>Titik Sudut #{idx + 1}</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono bg-slate-100 py-1 px-1.5 rounded">
                  {pt[0].toFixed(6)}, {pt[1].toFixed(6)}
                </div>
                <div className="text-[10px] text-emerald-700 leading-tight">
                  💡 Geser/tarik titik ini di peta untuk mengatur posisi sudut batas lahan.
                </div>
                <button
                  type="button"
                  onClick={() => onDeletePoint(idx)}
                  className="w-full mt-1 py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] border border-red-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>Hapus Titik #{idx + 1}</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

const DynamicLeafletPolygonEditor = dynamic(() => Promise.resolve(LeafletPolygonEditorInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
      <RefreshCw className="animate-spin text-emerald-600" size={24} />
      <span className="text-xs font-semibold">Memuat Peta Pemetaan Batas...</span>
    </div>
  ),
});

export default function SpatialBoundaryPicker({
  value,
  onChange,
  centerLat = 1.5917,
  centerLng = 99.2789,
  warnaPolygon = "#16a34a",
  onChangeWarna,
  unitName = "Kebun",
  onApplyAreaHa,
}: SpatialBoundaryPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [activeTab, setActiveTab] = useState<"draw" | "geojson">("draw");
  const [mapLayerType, setMapLayerType] = useState<"satellite" | "osm">("satellite");
  const [geoJsonInput, setGeoJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState(warnaPolygon || "#16a34a");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal points from prop value safely
  useEffect(() => {
    const extracted = extractPointsFromGeoJson(value);
    setPoints(extracted);
    if (value) {
      setGeoJsonInput(typeof value === "string" ? value : JSON.stringify(value, null, 2));
    } else {
      setGeoJsonInput("");
    }
  }, [value]);

  useEffect(() => {
    if (warnaPolygon) {
      setCurrentColor(warnaPolygon);
    }
  }, [warnaPolygon]);

  // Safe numeric center coordinates
  const safeLat = typeof centerLat === "number" && !isNaN(centerLat) && centerLat !== 0 ? centerLat : 1.5917;
  const safeLng = typeof centerLng === "number" && !isNaN(centerLng) && centerLng !== 0 ? centerLng : 99.2789;

  // Open Editor Modal
  const handleOpenModal = () => {
    const extracted = extractPointsFromGeoJson(value);
    setPoints(extracted);
    setGeoJsonInput(value ? (typeof value === "string" ? value : JSON.stringify(value, null, 2)) : "");
    setParseError(null);
    setModalOpen(true);
  };

  // Add a point by clicking on map (supports indefinite number of points)
  const handleAddPoint = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;
    setPoints((prev) => [...prev, [lat, lng]]);
  };

  // Update existing point position by dragging
  const handleUpdatePoint = (index: number, lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;
    setPoints((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = [lat, lng];
      }
      return next;
    });
  };

  // Delete a specific point
  const handleDeletePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Undo last point
  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  // Clear all points
  const handleClear = () => {
    setPoints([]);
    setGeoJsonInput("");
    setParseError(null);
  };

  // Save changes from modal
  const handleSaveModal = () => {
    if (activeTab === "geojson") {
      try {
        if (!geoJsonInput.trim()) {
          onChange(null, 0);
          setModalOpen(false);
          return;
        }
        const parsed = JSON.parse(geoJsonInput);
        const pts = extractPointsFromGeoJson(parsed);
        const areaHa = calculatePolygonAreaHa(pts);
        onChange(parsed, areaHa);
        if (onChangeWarna) {
          onChangeWarna(currentColor);
        }
        setModalOpen(false);
      } catch (e: any) {
        setParseError(`Format GeoJSON tidak valid: ${e.message}`);
      }
      return;
    }

    if (points.length < 3) {
      if (points.length === 0) {
        onChange(null, 0);
        setModalOpen(false);
        return;
      }
      setParseError("Batas poligon minimal membutuhkan 3 titik sudut untuk membentuk area lahan. Silakan klik peta untuk menambah titik lagi.");
      return;
    }

    const geojson = pointsToGeoJsonPolygon(points);
    const areaHa = calculatePolygonAreaHa(points);
    onChange(geojson, areaHa);
    if (onChangeWarna) {
      onChangeWarna(currentColor);
    }
    setModalOpen(false);
  };

  const calculatedAreaHa = calculatePolygonAreaHa(points);
  const hasBoundary = points.length >= 3;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Layers size={17} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-slate-800">
              Data Spasial Batas Lahan (GIS Poligon)
            </h5>
            <p className="text-[11px] text-slate-500">
              Menampilkan batas perimeter dan luas bidang lahan pada peta GIS
            </p>
          </div>
        </div>

        {/* Status Badge & Trigger Button */}
        <div className="flex items-center gap-2">
          {hasBoundary ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>{points.length} Titik Sudut ({calculatedAreaHa} Ha)</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              Belum dipetakan
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Maximize2 size={13} />
            <span>{hasBoundary ? "Ubah Batas Lahan" : "Gambar Batas Lahan"}</span>
          </button>
        </div>
      </div>

      {/* Mini Summary / Preview Bar */}
      {hasBoundary ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-xs shrink-0"
              style={{ backgroundColor: currentColor }}
              title="Warna Poligon"
            />
            <div className="text-slate-700">
              <span>Luas Geometris Terhitung: </span>
              <strong className="text-emerald-900 font-extrabold">{calculatedAreaHa} Hektar</strong>
              <span className="text-slate-400 text-[10px] ml-1.5">
                ({(calculatedAreaHa * 10000).toLocaleString("id-ID")} m²)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onApplyAreaHa && (
              <button
                type="button"
                onClick={() => onApplyAreaHa(String(calculatedAreaHa))}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                title="Gunakan nilai luas terhitung ini pada kolom Luas Lahan (Ha)"
              >
                Gunakan Luas Ini
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("Hapus data batas lahan poligon unit kebun ini?")) {
                  onChange(null, 0);
                  setPoints([]);
                }
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition cursor-pointer"
              title="Hapus Poligon"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>
              Klik tombol <strong>Gambar Batas Lahan</strong> untuk menandai titik-titik batas perimeter lahan kebun pada peta atau menempelkan file GeoJSON.
            </span>
          </div>
        </div>
      )}

      {/* MODAL DIALOG EDITOR BATAS LAHAN (Rendered via React Portal directly to body) */}
      {modalOpen && mounted && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
              <div className="bg-white rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                      <Layers size={20} className="text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                        <span>Editor Spasial Batas Lahan GIS</span>
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                          Tapanuli Selatan
                        </span>
                      </h3>
                      <p className="text-xs text-emerald-100/80">
                        Unit Kebun: <strong>{unitName}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Mode Tabs, Layer Switcher, & Toolbar */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("draw")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "draw"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <MapPin size={13} />
                      <span>Mode Gambar ({points.length} Titik)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("geojson");
                        if (points.length >= 3) {
                          setGeoJsonInput(JSON.stringify(pointsToGeoJsonPolygon(points), null, 2));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "geojson"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FileCode size={13} />
                      <span>Input / Paste GeoJSON</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Layer Switcher (Citra Satelit vs Peta Jalan) */}
                    {activeTab === "draw" && (
                      <div className="flex items-center rounded-xl bg-slate-200/90 p-0.5 border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setMapLayerType("satellite")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            mapLayerType === "satellite"
                              ? "bg-white text-emerald-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="Tampilkan Citra Satelit Udara Esri (sangat cocok untuk melihat vegetasi kebun)"
                        >
                          <Globe size={12} />
                          <span>Citra Satelit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapLayerType("osm")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            mapLayerType === "osm"
                              ? "bg-white text-emerald-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="Tampilkan Peta Jalan OpenStreetMap"
                        >
                          <Layers size={12} />
                          <span>Peta Jalan</span>
                        </button>
                      </div>
                    )}

                    {/* Color Preset Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Palette size={12} /> Warna:
                      </span>
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              setCurrentColor(c.hex);
                              if (onChangeWarna) onChangeWarna(c.hex);
                            }}
                            className={`w-5 h-5 rounded-full border-2 transition ${
                              currentColor === c.hex ? "border-slate-800 scale-110 shadow-xs" : "border-white opacity-80"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 relative overflow-hidden bg-slate-100 min-h-[400px]">
                  {activeTab === "draw" ? (
                    <>
                      <DynamicLeafletPolygonEditor
                        center={[safeLat, safeLng]}
                        markerPos={[safeLat, safeLng]}
                        points={points}
                        onAddPoint={handleAddPoint}
                        onUpdatePoint={handleUpdatePoint}
                        onDeletePoint={handleDeletePoint}
                        color={currentColor}
                        layerType={mapLayerType}
                      />

                      {/* Floating Drawing Instructions & Controls */}
                      <div className="absolute top-3 left-3 z-20 max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2.5 pointer-events-auto">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-extrabold text-slate-800 text-xs">
                              Mode Gambar Batas Lahan
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {points.length} Titik Sudut
                          </span>
                        </div>

                        {/* Interactive dynamic step status */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 leading-snug">
                          {points.length === 0 ? (
                            <div>
                              👉 <strong>Klik pada peta</strong> untuk mulai menandai <strong>Titik #1</strong> batas lahan kebun.
                            </div>
                          ) : points.length === 1 ? (
                            <div>
                              👉 <strong>Klik pada peta</strong> untuk menandai <strong>Titik #2</strong>.
                            </div>
                          ) : points.length === 2 ? (
                            <div>
                              👉 <strong>Klik pada peta</strong> untuk menandai <strong>Titik #3</strong> (minimal 3 titik untuk bidang poligon dasar).
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div>
                                👉 <strong>Klik pada peta</strong> untuk menambah <strong>Titik #{points.length + 1}</strong>, ke-{points.length + 2}, dst. sampai seluruh keliling kebun terpetakan.
                              </div>
                              <div className="text-[10px] text-emerald-800 font-medium">
                                💡 Anda dapat menambahkan titik sebanyak yang dibutuhkan. Klik tombol <strong>&apos;Selesai &amp; Terapkan&apos;</strong> di bawah jika seluruh batas sudah pas.
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-1 leading-tight">
                          <Move size={12} className="text-slate-400 shrink-0" />
                          <span>Titik sudut bernomor (#1, #2, dst.) dapat digeser langsung di peta.</span>
                        </div>

                        {points.length >= 3 && (
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                            <span className="text-slate-500">Luas Terhitung:</span>
                            <span className="font-extrabold text-emerald-800">
                              {calculatedAreaHa} Ha ({(calculatedAreaHa * 10000).toLocaleString("id-ID")} m²)
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={points.length === 0}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Batalkan titik terakhir yang ditambahkan"
                          >
                            <Undo2 size={13} />
                            <span>Undo #{points.length}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleClear}
                            disabled={points.length === 0}
                            className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Hapus semua titik dan mulai ulang"
                          >
                            <Trash2 size={13} />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 h-full overflow-y-auto space-y-4 bg-white">
                      <div>
                        <label className="block font-bold text-xs text-slate-800 mb-1">
                          Format GeoJSON Polygon / MultiPolygon
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Anda dapat mengekspor batas lahan dari QGIS, Google Earth (KML dikonversi ke GeoJSON), atau aplikasi GPS surveyor, lalu tempelkan teks GeoJSON ke dalam kotak teks di bawah:
                        </p>
                        <textarea
                          value={geoJsonInput}
                          onChange={(e) => {
                            setGeoJsonInput(e.target.value);
                            setParseError(null);
                          }}
                          rows={14}
                          placeholder='{ "type": "Polygon", "coordinates": [[[99.25, 1.45], [99.26, 1.45], [99.26, 1.46], [99.25, 1.45]]] }'
                          className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50"
                        />
                      </div>

                      {parseError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                          {parseError}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(geoJsonInput);
                              const pts = extractPointsFromGeoJson(parsed);
                              if (pts.length < 3) {
                                setParseError("GeoJSON harus memiliki minimal 3 koordinat batas poligon.");
                                return;
                              }
                              setPoints(pts);
                              setActiveTab("draw");
                              setParseError(null);
                            } catch (e: any) {
                              setParseError(`JSON Error: ${e.message}`);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>Validasi & Pratinjau di Peta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="text-xs text-slate-500">
                    {points.length >= 3 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={15} />
                        <span>{points.length} titik sudut terhubung ({calculatedAreaHa} Ha) &mdash; Masih bisa tambah titik ke-{points.length + 1}</span>
                      </span>
                    ) : points.length > 0 ? (
                      <span className="text-amber-700 font-medium">
                        🟡 Terpasang {points.length} titik &mdash; tambahkan minimal {3 - points.length} titik lagi di peta
                      </span>
                    ) : (
                      <span>Klik pada peta untuk mulai menandai titik sudut</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModal}
                      disabled={points.length > 0 && points.length < 3}
                      className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>{points.length >= 3 ? `Selesai & Terapkan (${points.length} Titik)` : "Terapkan Batas Lahan"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
