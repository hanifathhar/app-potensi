"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, ExternalLink, RefreshCw, Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface SingleLocationMapProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  title: string;
  subtitle?: string;
  address?: string;
  color?: string;
  category?: "KOLAM" | "PETERNAKAN" | "KEBUN" | string;
  batasLahan?: any;
  warnaPolygon?: string | null;
}

const LeafletSingleMapInner = ({
  lat,
  lng,
  title,
  subtitle,
  address,
  color = "#0284c7",
  category = "KOLAM",
  batasLahan,
  warnaPolygon,
}: SingleLocationMapProps & { lat: number; lng: number }) => {
  const { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } = require("react-leaflet");
  const L = require("leaflet");

  let parsedGeoJson: any = null;
  if (batasLahan) {
    try {
      parsedGeoJson = typeof batasLahan === "string" ? JSON.parse(batasLahan) : batasLahan;
      if (Array.isArray(parsedGeoJson)) {
        parsedGeoJson = {
          type: "Polygon",
          coordinates: [
            parsedGeoJson.map((pt: any) => [
              Number(pt[1] !== undefined ? pt[1] : pt.lng),
              Number(pt[0] !== undefined ? pt[0] : pt.lat),
            ]),
          ],
        };
      }
    } catch (e) {
      console.warn("Gagal parse batasLahan GeoJSON:", e);
    }
  }

  function ChangeView({ center, geojson }: { center: [number, number]; geojson: any }) {
    const map = useMap();
    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          if (geojson) {
            const geoLayer = L.geoJSON(geojson);
            const bounds = geoLayer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
              return;
            }
          }
          map.setView(center, 14);
        } catch (e) {}
      }, 150);
      return () => clearTimeout(timer);
    }, [center, geojson, map]);
    return null;
  }

  let symbol = "🐟";
  if (category === "PETERNAKAN") symbol = "🐄";
  if (category === "KEBUN") symbol = "🌱";

  const polygonStrokeColor = warnaPolygon || color || "#16a34a";

  const customIcon = L.divIcon({
    className: "custom-single-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${symbol}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 10 }}
    >
      <ChangeView center={[lat, lng]} geojson={parsedGeoJson} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render Batas Poligon GIS jika tersedia */}
      {parsedGeoJson && (
        <GeoJSON
          key={JSON.stringify(parsedGeoJson)}
          data={parsedGeoJson}
          style={{
            color: polygonStrokeColor,
            weight: 2.5,
            fillColor: polygonStrokeColor,
            fillOpacity: 0.28,
            dashArray: "4, 4",
          }}
        />
      )}

      {/* Titik Lokasi Marker */}
      <Marker position={[lat, lng]} icon={customIcon}>
        <Popup>
          <div className="p-1 min-w-[180px]">
            <h4 className="font-bold text-sm text-slate-900">{title}</h4>
            {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
            {address && <p className="text-[11px] text-slate-500 mt-1">{address}</p>}
            {parsedGeoJson && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Batas Lahan Terpetakan</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

const DynamicLeafletSingleMap = dynamic(
  () => Promise.resolve(LeafletSingleMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
        <RefreshCw className="animate-spin text-emerald-600" size={24} />
        <span className="text-xs font-semibold">Memuat Peta Lokasi...</span>
      </div>
    ),
  }
);

export default function SingleLocationMap(props: SingleLocationMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasValidCoordinates =
    props.lat !== null &&
    props.lat !== undefined &&
    props.lng !== null &&
    props.lng !== undefined &&
    !isNaN(Number(props.lat)) &&
    !isNaN(Number(props.lng)) &&
    Number(props.lat) !== 0 &&
    Number(props.lng) !== 0;

  if (!hasValidCoordinates) {
    return (
      <div className="h-64 w-full rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <MapPin size={32} className="text-slate-300 mb-2" />
        <p className="text-xs font-bold text-slate-600">Koordinat GPS Belum Terdata</p>
        <p className="text-[11px] text-slate-400 max-w-xs mt-1">
          Titik latitude dan longitude unit ini belum ditentukan atau belum terekam dalam survei lapangan.
        </p>
      </div>
    );
  }

  const validLat = Number(props.lat);
  const validLng = Number(props.lng);
  const googleMapsUrl = `https://www.google.com/maps?q=${validLat},${validLng}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs h-72 w-full bg-slate-100">
      {/* Badge jika memiliki batas polygon */}
      {props.batasLahan && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-500/30 text-[11px] font-semibold shadow-xs">
          <Layers size={13} className="text-emerald-400" />
          <span>Batas Lahan Aktif</span>
        </div>
      )}

      {mounted && (
        <DynamicLeafletSingleMap
          {...props}
          lat={validLat}
          lng={validLng}
        />
      )}

      {/* Floating Action Button: Open Google Maps */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md text-xs font-bold hover:bg-white transition"
      >
        <Navigation size={13} className="text-sky-600" />
        <span>Buka Google Maps</span>
        <ExternalLink size={11} className="text-slate-400" />
      </a>
    </div>
  );
}
