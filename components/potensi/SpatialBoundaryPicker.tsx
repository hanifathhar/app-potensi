"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Upload,
  FileUp,
  AlertCircle,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface SpatialBoundaryPickerProps {
  value: any; // GeoJSON object or null
  onChange: (
    geojson: any,
    estimatedAreaHa?: number,
    centroid?: { lat: number; lng: number } | null
  ) => void;
  centerLat?: number;
  centerLng?: number;
  warnaPolygon?: string;
  onChangeWarna?: (color: string) => void;
  unitName?: string;
  sectorType?: "KEBUN" | "KOLAM" | "PETERNAKAN";
  onApplyAreaHa?: (ha: string) => void;
  onApplyAreaM2?: (m2: string) => void;
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

// Helper: Calculate polygon centroid [lat, lng]
export function calculatePolygonCentroid(points: [number, number][]): { lat: number; lng: number } | null {
  if (!points || points.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  let validCount = 0;
  for (const pt of points) {
    if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
      sumLat += pt[0];
      sumLng += pt[1];
      validCount++;
    }
  }
  if (validCount === 0) return null;
  return {
    lat: Number((sumLat / validCount).toFixed(6)),
    lng: Number((sumLng / validCount).toFixed(6)),
  };
}

// Helper: Remove closing duplicate vertex if first == last
function stripClosingDuplicate(pts: [number, number][]): [number, number][] {
  if (
    pts.length > 3 &&
    Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 1e-9 &&
    Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-9
  ) {
    return pts.slice(0, -1);
  }
  return pts;
}

// Helper: Convert UTM (Zone 47N / 47S, WGS84) Easting/Northing in meters to [lat, lng]
function utmToLatLng(easting: number, northing: number, zone = 47, northernHemisphere = true): [number, number] | null {
  const a = 6378137.0;
  const eccSquared = 0.00669438;
  const k0 = 0.9996;
  const x = easting - 500000.0;
  const y = northernHemisphere ? northing : northing - 10000000.0;

  const eccPrimeSquared = eccSquared / (1 - eccSquared);
  const M = y / k0;
  const mu =
    M /
    (a *
      (1 -
        eccSquared / 4 -
        (3 * eccSquared * eccSquared) / 64 -
        (5 * eccSquared * eccSquared * eccSquared) / 256));
  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));

  const phi1Rad =
    mu +
    ((3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * Math.pow(e1, 3)) / 96) * Math.sin(6 * mu);

  const N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 = (a * (1 - eccSquared)) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * k0);

  let lat =
    phi1Rad -
    ((N1 * Math.tan(phi1Rad)) / R1) *
    ((D * D) / 2 -
      ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * Math.pow(D, 4)) / 24 +
      ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * Math.pow(D, 6)) / 720);
  lat = (lat * 180) / Math.PI;

  let lng =
    (D -
      ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * Math.pow(D, 5)) / 120) /
    Math.cos(phi1Rad);
  const lngOrigin = (zone - 1) * 6 - 180 + 3;
  lng = lngOrigin + (lng * 180) / Math.PI;

  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

// Helper: Normalize a pair of numeric coordinates (val1, val2) into [lat, lng]
function normalizeCoordinatePair(val1: number, val2: number): [number, number] | null {
  if (isNaN(val1) || isNaN(val2) || (val1 === 0 && val2 === 0)) return null;

  // 1. Standard KML order: (lng, lat) where |lng| > 90..180 and |lat| <= 90
  if (Math.abs(val1) > 90 && Math.abs(val1) <= 180 && Math.abs(val2) <= 90) {
    return [val2, val1];
  }
  // 2. Swapped order: (lat, lng) where |lat| <= 90 and |lng| > 90..180 (common in Indonesia where lng ~95-141)
  if (Math.abs(val2) > 90 && Math.abs(val2) <= 180 && Math.abs(val1) <= 90) {
    return [val1, val2];
  }
  // 3. Both <= 90: standard KML is (lng, lat) -> [val2, val1]
  if (Math.abs(val1) <= 90 && Math.abs(val2) <= 90) {
    return [val2, val1];
  }
  // 4. Projected UTM coordinates in meters (e.g., Easting 100,000..900,000, Northing 0..10,000,000)
  if (val1 >= 100000 && val1 <= 900000 && val2 >= 0 && val2 <= 10000000) {
    const isNorth = val2 < 5000000;
    return utmToLatLng(val1, val2, 47, isNorth);
  }
  if (val2 >= 100000 && val2 <= 900000 && val1 >= 0 && val1 <= 10000000) {
    const isNorth = val1 < 5000000;
    return utmToLatLng(val2, val1, 47, isNorth);
  }

  return null;
}

// Helper: Expand 1 or 2 points into a valid 4-corner polygon so single-Pin or 2-Point KML files still work
function expandPointsToPolygonIfNeeded(pts: [number, number][]): {
  points: [number, number][];
  autoExpanded?: boolean;
} {
  if (pts.length >= 3) {
    return { points: pts, autoExpanded: false };
  }
  if (pts.length === 1) {
    const [lat, lng] = pts[0];
    const d = 0.00045; // ~50m offset (~1.0 Ha square)
    return {
      points: [
        [Number((lat + d).toFixed(6)), Number((lng - d).toFixed(6))],
        [Number((lat + d).toFixed(6)), Number((lng + d).toFixed(6))],
        [Number((lat - d).toFixed(6)), Number((lng + d).toFixed(6))],
        [Number((lat - d).toFixed(6)), Number((lng - d).toFixed(6))],
      ],
      autoExpanded: true,
    };
  }
  if (pts.length === 2) {
    const [p1, p2] = pts;
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    const len = Math.sqrt(dLat * dLat + dLng * dLng);
    const width = Math.max(len * 0.4, 0.0004);
    const nx = len > 1e-8 ? (-dLng / len) * width : width;
    const ny = len > 1e-8 ? (dLat / len) * width : width;
    return {
      points: [
        [Number((p1[0] + nx / 2).toFixed(6)), Number((p1[1] + ny / 2).toFixed(6))],
        [Number((p2[0] + nx / 2).toFixed(6)), Number((p2[1] + ny / 2).toFixed(6))],
        [Number((p2[0] - nx / 2).toFixed(6)), Number((p2[1] - ny / 2).toFixed(6))],
        [Number((p1[0] - nx / 2).toFixed(6)), Number((p1[1] - ny / 2).toFixed(6))],
      ],
      autoExpanded: true,
    };
  }
  return { points: [], autoExpanded: false };
}

// Helper: Read text from a .kml, .kmz (ZIP), or .geojson file
export async function readSpatialFileText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Detect ZIP / KMZ archive (starts with PK\x03\x04 -> 0x50 0x4B 0x03 0x04)
  if (bytes.length > 30 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    try {
      const view = new DataView(buffer);
      let offset = 0;
      while (offset + 30 <= bytes.length) {
        if (view.getUint32(offset, true) !== 0x04034b50) break;
        const compressionMethod = view.getUint16(offset + 8, true);
        let compressedSize = view.getUint32(offset + 18, true);
        const fileNameLength = view.getUint16(offset + 26, true);
        const extraFieldLength = view.getUint16(offset + 28, true);
        const nameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
        const entryName = new TextDecoder("utf-8").decode(nameBytes).toLowerCase();
        const dataStart = offset + 30 + fileNameLength + extraFieldLength;

        if (compressedSize === 0) {
          let nextPk = dataStart;
          while (nextPk + 4 <= bytes.length) {
            if (
              bytes[nextPk] === 0x50 &&
              bytes[nextPk + 1] === 0x4b &&
              (bytes[nextPk + 2] === 0x01 ||
                bytes[nextPk + 2] === 0x03 ||
                bytes[nextPk + 2] === 0x05 ||
                bytes[nextPk + 2] === 0x07)
            ) {
              break;
            }
            nextPk++;
          }
          compressedSize = nextPk - dataStart;
        }

        if (entryName.endsWith(".kml") || entryName.endsWith(".xml") || offset === 0) {
          const compressedSlice = bytes.slice(dataStart, dataStart + compressedSize);
          if (compressionMethod === 0) {
            const text = new TextDecoder("utf-8").decode(compressedSlice);
            if (text.includes("<")) return text;
          } else if (compressionMethod === 8 && typeof DecompressionStream !== "undefined") {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(compressedSlice).catch(() => { });
            writer.close().catch(() => { });
            const decompressedBuf = await new Response(ds.readable).arrayBuffer();
            const text = new TextDecoder("utf-8").decode(decompressedBuf);
            if (text.includes("<")) return text;
          }
        }

        offset = dataStart + compressedSize;
      }
    } catch (e) {
      console.warn("Gagal mengekstrak arsip KMZ:", e);
    }
  }

  // Detect UTF-16 BOM
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }

  return new TextDecoder("utf-8").decode(buffer);
}

// Helper: Parse KML XML string into [lat, lng][] polygon coordinates & optional placemark name
export function parseKmlToPoints(kmlText: string): {
  points: [number, number][];
  placemarkName?: string;
  autoExpanded?: boolean;
} {
  if (!kmlText || typeof kmlText !== "string") {
    return { points: [] };
  }

  const trimmed = kmlText.replace(/^\uFEFF/, "").trim();

  // If the file is actually JSON / GeoJSON disguised as .kml
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      const pts = extractPointsFromGeoJson(parsedJson);
      const expanded = expandPointsToPolygonIfNeeded(pts);
      return { points: expanded.points, autoExpanded: expanded.autoExpanded };
    } catch { }
  }

  // Parse a raw <coordinates> block into [lat, lng][]
  const parseCoordText = (raw: string): [number, number][] => {
    const withoutCdata = raw.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    if (!withoutCdata) return [];

    // Strip trailing commas at the end of lines/semicolons without merging lines!
    const normalized = withoutCdata
      .replace(/,+\s*(?=[\r\n;]|$)/g, "")
      .replace(/[ \t]*,[ \t]*/g, ",");

    const tokens = normalized.split(/[\r\n\s;]+/);
    const pts: [number, number][] = [];

    for (const token of tokens) {
      if (!token) continue;
      const parts = token
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      if (parts.length === 2 || parts.length === 3) {
        const pair = normalizeCoordinatePair(parseFloat(parts[0]), parseFloat(parts[1]));
        if (pair) pts.push(pair);
      } else if (parts.length >= 4) {
        // Handle flat comma-separated list of tuples: e.g. lng1,lat1,alt1,lng2,lat2,alt2 or lng1,lat1,lng2,lat2
        const nums = parts.map((p) => parseFloat(p)).filter((n) => !isNaN(n));
        const isStride3 =
          nums.length % 3 === 0 &&
          nums.length >= 6 &&
          (nums[2] === 0 || Math.abs(nums[0] - nums[3]) < 5);
        const step = isStride3 ? 3 : 2;
        for (let i = 0; i + 1 < nums.length; i += step) {
          const pair = normalizeCoordinatePair(nums[i], nums[i + 1]);
          if (pair) pts.push(pair);
        }
      }
    }

    return stripClosingDuplicate(pts);
  };

  let placemarkName: string | undefined;
  const nameMatch = trimmed.match(/<(?:[\w-]+:)?name[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?name>/i);
  if (nameMatch && nameMatch[1]) {
    placemarkName = nameMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  }

  const candidateRings: [number, number][][] = [];
  const allCollectedPoints: [number, number][] = [];

  const getByLocalName = (root: Document | Element, localName: string): Element[] => {
    const all = root.getElementsByTagName("*");
    const lower = localName.toLowerCase();
    const matches: Element[] = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const elLocal = (el.localName || el.tagName.split(":").pop() || "").toLowerCase();
      if (elLocal === lower) {
        matches.push(el);
      }
    }
    return matches;
  };

  // Stage 1: DOMParser extraction (try text/xml, fallback to text/html if XML has strict namespace/entity issues)
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      let doc = parser.parseFromString(trimmed, "text/xml");
      if (doc.getElementsByTagName("parsererror").length > 0) {
        doc = parser.parseFromString(trimmed, "text/html");
      }

      const placemarks = getByLocalName(doc, "Placemark");
      for (const pm of placemarks) {
        const nameEl = getByLocalName(pm, "name")[0];
        if (nameEl && nameEl.textContent?.trim()) {
          placemarkName = nameEl.textContent.trim();
          break;
        }
      }

      // 1A. <Polygon>
      const polygons = getByLocalName(doc, "Polygon");
      for (const poly of polygons) {
        const outerBoundary = getByLocalName(poly, "outerBoundaryIs")[0];
        const targetNode = outerBoundary || poly;
        const coordNodes = getByLocalName(targetNode, "coordinates");
        for (const cNode of coordNodes) {
          if (cNode.textContent) {
            const pts = parseCoordText(cNode.textContent);
            if (pts.length >= 3) {
              candidateRings.push(pts);
            } else if (pts.length > 0) {
              allCollectedPoints.push(...pts);
            }
          }
        }
      }

      // 1B. All <coordinates> (covers <LinearRing>, <LineString>, <Point>, <MultiGeometry>)
      const allCoords = getByLocalName(doc, "coordinates");
      for (const cNode of allCoords) {
        if (cNode.textContent) {
          const pts = parseCoordText(cNode.textContent);
          if (pts.length >= 3) {
            candidateRings.push(pts);
          } else if (pts.length > 0) {
            allCollectedPoints.push(...pts);
          }
        }
      }

      // 1C. <gx:coord> inside <gx:Track>
      const gxCoords = getByLocalName(doc, "coord");
      if (gxCoords.length > 0) {
        const gxPts: [number, number][] = [];
        for (const gx of gxCoords) {
          const text = gx.textContent?.trim();
          if (text) {
            const parts = text.split(/[\s,]+/);
            if (parts.length >= 2) {
              const pair = normalizeCoordinatePair(parseFloat(parts[0]), parseFloat(parts[1]));
              if (pair) gxPts.push(pair);
            }
          }
        }
        const stripped = stripClosingDuplicate(gxPts);
        if (stripped.length >= 3) {
          candidateRings.push(stripped);
        } else if (stripped.length > 0) {
          allCollectedPoints.push(...stripped);
        }
      }

      // 1D. <LatLonBox> or <LatLonAltBox> (<north>, <south>, <east>, <west>)
      const boxes = [...getByLocalName(doc, "LatLonBox"), ...getByLocalName(doc, "LatLonAltBox")];
      for (const box of boxes) {
        const n = parseFloat(getByLocalName(box, "north")[0]?.textContent || "");
        const s = parseFloat(getByLocalName(box, "south")[0]?.textContent || "");
        const e = parseFloat(getByLocalName(box, "east")[0]?.textContent || "");
        const w = parseFloat(getByLocalName(box, "west")[0]?.textContent || "");
        if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
          candidateRings.push([
            [n, w],
            [n, e],
            [s, e],
            [s, w],
          ]);
        }
      }

      // 1E. <LookAt> or <Camera> (<longitude>, <latitude>) if no coordinates found yet
      if (candidateRings.length === 0 && allCollectedPoints.length === 0) {
        const views = [...getByLocalName(doc, "LookAt"), ...getByLocalName(doc, "Camera")];
        for (const v of views) {
          const lng = parseFloat(getByLocalName(v, "longitude")[0]?.textContent || "");
          const lat = parseFloat(getByLocalName(v, "latitude")[0]?.textContent || "");
          const pair = normalizeCoordinatePair(lng, lat);
          if (pair) allCollectedPoints.push(pair);
        }
      }
    } catch (e) {
      console.warn("DOMParser KML fallback:", e);
    }
  }

  // Stage 2: Direct Regex extraction on raw KML string (immune to broken XML / namespaces)
  if (candidateRings.length === 0) {
    const coordRegex = /<(?:[\w-]+:)?coordinates[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?coordinates>/gi;
    let match: RegExpExecArray | null;
    while ((match = coordRegex.exec(trimmed)) !== null) {
      const pts = parseCoordText(match[1]);
      if (pts.length >= 3) {
        candidateRings.push(pts);
      } else if (pts.length > 0) {
        allCollectedPoints.push(...pts);
      }
    }

    const gxCoordRegex = /<(?:[\w-]+:)?coord[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?coord>/gi;
    const gxPts: [number, number][] = [];
    while ((match = gxCoordRegex.exec(trimmed)) !== null) {
      const parts = match[1].trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        const pair = normalizeCoordinatePair(parseFloat(parts[0]), parseFloat(parts[1]));
        if (pair) gxPts.push(pair);
      }
    }
    const strippedGx = stripClosingDuplicate(gxPts);
    if (strippedGx.length >= 3) {
      candidateRings.push(strippedGx);
    } else if (strippedGx.length > 0) {
      allCollectedPoints.push(...strippedGx);
    }
  }

  // Stage 3: Return best polygon ring if we found one with >= 3 points
  if (candidateRings.length > 0) {
    candidateRings.sort((a, b) => {
      const areaB = calculatePolygonAreaHa(b);
      const areaA = calculatePolygonAreaHa(a);
      if (areaB !== areaA) return areaB - areaA;
      return b.length - a.length;
    });

    return {
      points: candidateRings[0],
      placemarkName,
      autoExpanded: false,
    };
  }

  // Stage 4: Combine multiple individual <Point> placemarks or 2-point <LineString> segments
  if (allCollectedPoints.length > 0) {
    // Deduplicate identical points
    const uniquePts: [number, number][] = [];
    for (const pt of allCollectedPoints) {
      const exists = uniquePts.some(
        (u) => Math.abs(u[0] - pt[0]) < 1e-7 && Math.abs(u[1] - pt[1]) < 1e-7
      );
      if (!exists) {
        uniquePts.push(pt);
      }
    }

    if (uniquePts.length >= 3) {
      // Sort vertices clockwise around centroid so separate Point placemarks form a clean non-intersecting polygon
      const c = calculatePolygonCentroid(uniquePts);
      if (c) {
        uniquePts.sort(
          (a, b) => Math.atan2(a[0] - c.lat, a[1] - c.lng) - Math.atan2(b[0] - c.lat, b[1] - c.lng)
        );
      }
      return {
        points: uniquePts,
        placemarkName,
        autoExpanded: false,
      };
    }

    // If the KML only had 1 Point (e.g. a Google Earth Pin Placemark) or 2 Points, expand to 4-corner polygon
    const expanded = expandPointsToPolygonIfNeeded(uniquePts);
    if (expanded.points.length >= 3) {
      return {
        points: expanded.points,
        placemarkName,
        autoExpanded: expanded.autoExpanded,
      };
    }
  }

  // Stage 5: Last-resort scan for WKT POLYGON((...)) or raw decimal coordinate pairs in text
  const rawPairRegex = /(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/g;
  const rawPts: [number, number][] = [];
  let rawMatch: RegExpExecArray | null;
  while ((rawMatch = rawPairRegex.exec(trimmed)) !== null) {
    const pair = normalizeCoordinatePair(parseFloat(rawMatch[1]), parseFloat(rawMatch[2]));
    if (pair) {
      const exists = rawPts.some(
        (u) => Math.abs(u[0] - pair[0]) < 1e-7 && Math.abs(u[1] - pair[1]) < 1e-7
      );
      if (!exists) rawPts.push(pair);
    }
  }
  if (rawPts.length > 0) {
    const expanded = expandPointsToPolygonIfNeeded(rawPts);
    return {
      points: expanded.points,
      placemarkName,
      autoExpanded: expanded.autoExpanded,
    };
  }

  return { points: [], placemarkName };
}

// Helper: Extract [lat, lng][] array from various GeoJSON formats (or KML string)
export function extractPointsFromGeoJson(geojson: any): [number, number][] {
  if (!geojson) return [];
  try {
    if (typeof geojson === "string" && geojson.trim().startsWith("<")) {
      return parseKmlToPoints(geojson).points;
    }
    const data = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (Array.isArray(data)) {
      const pts = data
        .map((pt: any) => {
          const lat = Number(pt[0] !== undefined ? pt[0] : pt.lat);
          const lng = Number(pt[1] !== undefined ? pt[1] : pt.lng);
          return [lat, lng] as [number, number];
        })
        .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && pt[0] !== 0 && pt[1] !== 0);
      return stripClosingDuplicate(pts);
    }
    if (data.type === "FeatureCollection" && Array.isArray(data.features) && data.features.length > 0) {
      for (const feat of data.features) {
        const pts = extractPointsFromGeoJson(feat);
        if (pts.length >= 3) return pts;
      }
    }
    if (data.type === "Feature" && data.geometry) {
      return extractPointsFromGeoJson(data.geometry);
    }
    if (data.type === "Polygon" && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
      // GeoJSON Polygon uses [lng, lat]
      const ring = data.coordinates[0];
      const pts = ring
        .map((coord: any) => [Number(coord[1]), Number(coord[0])] as [number, number])
        .filter((pt: [number, number]) => !isNaN(pt[0]) && !isNaN(pt[1]));
      return stripClosingDuplicate(pts);
    }
    if (data.type === "MultiPolygon" && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
      const ring = data.coordinates[0][0];
      const pts = ring
        .map((coord: any) => [Number(coord[1]), Number(coord[0])] as [number, number])
        .filter((pt: [number, number]) => !isNaN(pt[0]) && !isNaN(pt[1]));
      return stripClosingDuplicate(pts);
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
  fitBoundsTrigger,
  sectorType = "KEBUN",
}: {
  center: [number, number];
  markerPos?: [number, number] | null;
  points: [number, number][];
  onAddPoint: (lat: number, lng: number) => void;
  onUpdatePoint: (index: number, lat: number, lng: number) => void;
  onDeletePoint: (index: number) => void;
  color: string;
  layerType: "satellite" | "osm";
  fitBoundsTrigger?: number;
  sectorType?: "KEBUN" | "KOLAM" | "PETERNAKAN";
}) => {
  const { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMapEvents, useMap } =
    require("react-leaflet");
  const L = require("leaflet");

  // Invalidate size on mount & bounds fitting on KML/GeoJSON import
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
    }, [map, fitBoundsTrigger]);
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

  // Center Marker Icon (Titik Centroid Unit Usaha)
  const centerEmoji = sectorType === "KOLAM" ? "🐟" : sectorType === "PETERNAKAN" ? "🐄" : "🌱";
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
        <span style="transform: rotate(45deg); font-size: 13px;">${centerEmoji}</span>
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
  unitName = "Unit Usaha",
  sectorType = "KEBUN",
  onApplyAreaHa,
  onApplyAreaM2,
}: SpatialBoundaryPickerProps) {
  const unitLabel =
    sectorType === "KOLAM"
      ? "Unit Kolam"
      : sectorType === "PETERNAKAN"
        ? "Unit Peternakan"
        : "Unit Kebun";
  const [modalOpen, setModalOpen] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [activeTab, setActiveTab] = useState<"draw" | "geojson">("draw");
  const [mapLayerType, setMapLayerType] = useState<"satellite" | "osm">("satellite");
  const [geoJsonInput, setGeoJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [kmlFileInfo, setKmlFileInfo] = useState<{
    fileName: string;
    placemarkName?: string;
    vertexCount: number;
    areaHa: number;
    autoExpanded?: boolean;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  const [currentColor, setCurrentColor] = useState(warnaPolygon || "#16a34a");
  const [mounted, setMounted] = useState(false);

  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

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
      setKmlFileInfo(null);
    }
  }, [value]);

  useEffect(() => {
    if (warnaPolygon) {
      setCurrentColor(warnaPolygon);
    }
  }, [warnaPolygon]);

  // Safe numeric center coordinates
  const centroid = calculatePolygonCentroid(points);
  const safeLat =
    typeof centerLat === "number" && !isNaN(centerLat) && centerLat !== 0
      ? centerLat
      : centroid
        ? centroid.lat
        : 1.5917;
  const safeLng =
    typeof centerLng === "number" && !isNaN(centerLng) && centerLng !== 0
      ? centerLng
      : centroid
        ? centroid.lng
        : 99.2789;

  // Handle KML / KMZ / GeoJSON file upload (from card or modal)
  const processUploadedSpatialFile = async (file: File, applyImmediatelyToParent: boolean) => {
    setParseError(null);
    setCardError(null);

    const fileName = file.name || "batas-lahan.kml";
    const lowerName = fileName.toLowerCase();
    const isKml =
      lowerName.endsWith(".kml") ||
      lowerName.endsWith(".kmz") ||
      lowerName.endsWith(".xml") ||
      file.type.includes("kml") ||
      file.type.includes("kmz") ||
      file.type.includes("xml");
    const isJson =
      lowerName.endsWith(".geojson") ||
      lowerName.endsWith(".json") ||
      file.type.includes("json");

    if (!isKml && !isJson) {
      const msg = "Format file tidak didukung. Silakan unggah file dengan format .kml, .kmz, atau .geojson.";
      if (applyImmediatelyToParent) setCardError(msg);
      else setParseError(msg);
      return;
    }

    try {
      const text = await readSpatialFileText(file);
      let extractedPoints: [number, number][] = [];
      let placemarkName: string | undefined;
      let autoExpanded = false;

      if (isKml || text.trim().startsWith("<")) {
        const parsedKml = parseKmlToPoints(text);
        extractedPoints = parsedKml.points;
        placemarkName = parsedKml.placemarkName;
        autoExpanded = Boolean(parsedKml.autoExpanded);
      } else {
        const parsedJson = JSON.parse(text);
        const rawPts = extractPointsFromGeoJson(parsedJson);
        const exp = expandPointsToPolygonIfNeeded(rawPts);
        extractedPoints = exp.points;
        autoExpanded = Boolean(exp.autoExpanded);
      }

      if (extractedPoints.length < 3) {
        throw new Error(
          "Tidak ditemukan titik koordinat lokasi yang valid di dalam file KML tersebut. Pastikan file KML memiliki data koordinat."
        );
      }

      const geojsonObj = pointsToGeoJsonPolygon(extractedPoints);
      const areaHa = calculatePolygonAreaHa(extractedPoints);
      const polyCentroid = calculatePolygonCentroid(extractedPoints);

      setPoints(extractedPoints);
      setGeoJsonInput(JSON.stringify(geojsonObj, null, 2));
      setKmlFileInfo({
        fileName,
        placemarkName,
        vertexCount: extractedPoints.length,
        areaHa,
        autoExpanded,
      });
      setFitBoundsTrigger((prev) => prev + 1);

      if (applyImmediatelyToParent) {
        onChange(geojsonObj, areaHa, polyCentroid);
      } else {
        setActiveTab("draw");
      }
    } catch (err: any) {
      const msg = err?.message || "Gagal membaca file KML. Pastikan file KML berisi data koordinat lokasi.";
      if (applyImmediatelyToParent) setCardError(msg);
      else setParseError(msg);
    }
  };

  const handleCardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedSpatialFile(file, true);
    e.target.value = "";
  };

  const handleModalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedSpatialFile(file, false);
    e.target.value = "";
  };

  // Open Editor Modal
  const handleOpenModal = () => {
    const extracted = extractPointsFromGeoJson(value);
    setPoints(extracted);
    setGeoJsonInput(value ? (typeof value === "string" ? value : JSON.stringify(value, null, 2)) : "");
    setParseError(null);
    setCardError(null);
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
    setKmlFileInfo(null);
    setParseError(null);
  };

  // Save changes from modal
  const handleSaveModal = () => {
    if (activeTab === "geojson") {
      try {
        const trimmed = geoJsonInput.trim();
        if (!trimmed) {
          onChange(null, 0, null);
          setModalOpen(false);
          return;
        }
        let pts: [number, number][] = [];
        let finalGeoJson: any = null;
        if (trimmed.startsWith("<")) {
          pts = parseKmlToPoints(trimmed).points;
          if (pts.length < 3) {
            setParseError("Data KML harus memiliki minimal 3 koordinat sudut poligon.");
            return;
          }
          finalGeoJson = pointsToGeoJsonPolygon(pts);
        } else {
          const parsed = JSON.parse(trimmed);
          pts = extractPointsFromGeoJson(parsed);
          if (pts.length < 3) {
            setParseError("Format GeoJSON harus memiliki minimal 3 koordinat sudut poligon.");
            return;
          }
          finalGeoJson = pointsToGeoJsonPolygon(pts) || parsed;
        }
        const areaHa = calculatePolygonAreaHa(pts);
        const polyCentroid = calculatePolygonCentroid(pts);
        onChange(finalGeoJson, areaHa, polyCentroid);
        if (onChangeWarna) {
          onChangeWarna(currentColor);
        }
        setModalOpen(false);
      } catch (e: any) {
        setParseError(`Format KML / GeoJSON tidak valid: ${e.message}`);
      }
      return;
    }

    if (points.length < 3) {
      if (points.length === 0) {
        onChange(null, 0, null);
        setModalOpen(false);
        return;
      }
      setParseError("Batas poligon minimal membutuhkan 3 titik sudut untuk membentuk area lahan. Silakan klik peta untuk menambah titik lagi.");
      return;
    }

    const geojson = pointsToGeoJsonPolygon(points);
    const areaHa = calculatePolygonAreaHa(points);
    const polyCentroid = calculatePolygonCentroid(points);
    onChange(geojson, areaHa, polyCentroid);
    if (onChangeWarna) {
      onChangeWarna(currentColor);
    }
    setModalOpen(false);
  };

  const calculatedAreaHa = calculatePolygonAreaHa(points);
  const hasBoundary = points.length >= 3;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          await processUploadedSpatialFile(file, true);
        }
      }}
      className={`rounded-2xl border p-4 shadow-xs space-y-3 transition ${isDraggingOver
        ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
        : "border-slate-200 bg-white"
        }`}
    >
      {/* Hidden File Input for Direct KML Upload on Form Card */}
      <input
        ref={cardFileInputRef}
        type="file"
        accept=".kml,.kmz,.xml,.geojson,.json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz,text/xml,application/xml"
        onChange={handleCardFileChange}
        className="hidden"
      />

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
              Menampilkan batas perimeter dan luas bidang lahan pada peta GIS (Gambar manual atau Upload file <strong>.KML / .KMZ</strong>)
            </p>
          </div>
        </div>

        {/* Status Badge & Action Buttons (Upload KML & Gambar Batas Lahan) */}
        <div className="flex flex-wrap items-center gap-2">
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

      {/* KML File Uploaded Info Badge */}
      {kmlFileInfo && hasBoundary && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50/80 border border-sky-200 text-[11px] text-sky-900">
          <div className="flex items-center gap-2 min-w-0">
            <FileUp size={14} className="text-sky-600 shrink-0" />
            <span className="truncate">
              Data poligon dimuat dari file KML: <strong className="font-mono">{kmlFileInfo.fileName}</strong>
              {kmlFileInfo.placemarkName ? ` (${kmlFileInfo.placemarkName})` : ""} &bull;{" "}
              <strong>{kmlFileInfo.vertexCount} titik sudut</strong>
              {kmlFileInfo.autoExpanded ? " (dibentuk otomatis dari titik koordinat KML)" : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline shrink-0 cursor-pointer"
          >
            Pratinjau Peta
          </button>
        </div>
      )}

      {/* Card Error Alert (if invalid KML uploaded) */}
      {cardError && (
        <div className="p-2.5 px-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600 shrink-0" />
            <span>{cardError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCardError(null)}
            className="text-red-400 hover:text-red-600 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

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
            {(onApplyAreaHa || onApplyAreaM2) && (
              <button
                type="button"
                onClick={() => {
                  if (onApplyAreaM2) {
                    onApplyAreaM2(String(Math.round(calculatedAreaHa * 10000)));
                  } else if (onApplyAreaHa) {
                    onApplyAreaHa(String(calculatedAreaHa));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                title={
                  onApplyAreaM2
                    ? "Gunakan nilai luas terhitung ini pada kolom Luas Area (m²)"
                    : "Gunakan nilai luas terhitung ini pada kolom Luas Lahan (Ha)"
                }
              >
                Gunakan Luas Ini
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm(`Hapus data batas lahan poligon ${unitLabel.toLowerCase()} ini?`)) {
                  onChange(null, 0, null);
                  setPoints([]);
                  setKmlFileInfo(null);
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
        <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>
              Klik <strong>Upload KML</strong> (atau seret file <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700 font-mono">.kml</code> ke kotak ini) untuk mengimpor poligon batas lahan, atau klik <strong>Gambar Batas Lahan</strong> untuk memetakan manual di peta.
            </span>
          </div>
        </div>
      )}

      {/* MODAL DIALOG EDITOR BATAS LAHAN (Rendered via React Portal directly to body) */}
      {modalOpen && mounted && typeof document !== "undefined"
        ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Hidden File Input for Modal KML Upload */}
              <input
                ref={modalFileInputRef}
                type="file"
                accept=".kml,.kmz,.xml,.geojson,.json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz,text/xml,application/xml"
                onChange={handleModalFileChange}
                className="hidden"
              />

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
                      {unitLabel}: <strong>{unitName}</strong>
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("draw")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === "draw"
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === "geojson"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <FileCode size={13} />
                    <span>Upload KML / GeoJSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                    title="Pilih file .kml dari komputer/HP Anda untuk langsung ditampilkan pada peta"
                  >
                    <Upload size={13} />
                    <span>Pilih File</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Layer Switcher (Citra Satelit vs Peta Jalan) */}
                  {activeTab === "draw" && (
                    <div className="flex items-center rounded-xl bg-slate-200/90 p-0.5 border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setMapLayerType("satellite")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${mapLayerType === "satellite"
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${mapLayerType === "osm"
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
                          className={`w-5 h-5 rounded-full border-2 transition ${currentColor === c.hex ? "border-slate-800 scale-110 shadow-xs" : "border-white opacity-80"
                            }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Panduan & Kontrol Mode Gambar (Di Luar Peta agar Peta Bersih & Luas) */}
              {activeTab === "draw" && (
                <div className="px-4 py-2.5 bg-emerald-50/50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs shrink-0">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 shadow-2xs shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-extrabold text-slate-800 text-[11px]">
                        Mode Gambar Batas Lahan
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {points.length} Titik Sudut
                      </span>
                    </div>

                    {kmlFileInfo && points.length >= 3 && (
                      <div className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-800 flex items-center gap-1.5 shrink-0">
                        <FileUp size={12} className="text-sky-600 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          KML: <strong>{kmlFileInfo.fileName}</strong>
                        </span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-700 leading-snug">
                      {points.length === 0 ? (
                        <span>
                          <strong>Klik pada peta</strong> untuk menandai <strong>Titik #1</strong>, atau klik <strong>Pilih File .KML</strong>.
                        </span>
                      ) : points.length === 1 ? (
                        <span>
                          <strong>Klik pada peta</strong> untuk menandai <strong>Titik #2</strong>.
                        </span>
                      ) : points.length === 2 ? (
                        <span>
                          <strong>Klik pada peta</strong> untuk menandai <strong>Titik #3</strong> (minimal 3 titik untuk poligon).
                        </span>
                      ) : (
                        <span>
                          <strong>Klik peta</strong> untuk tambah <strong>Titik #{points.length + 1}</strong>, atau <strong>geser titik nomor</strong> untuk merapikan sudut.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
                    {points.length >= 3 && (
                      <div className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] flex items-center gap-1.5">
                        <span className="text-slate-500">Luas:</span>
                        <span className="font-extrabold text-emerald-800">
                          {calculatedAreaHa} Ha ({(calculatedAreaHa * 10000).toLocaleString("id-ID")} m²)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={points.length === 0}
                        className="py-1 px-2.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Batalkan titik terakhir yang ditambahkan"
                      >
                        <Undo2 size={12} />
                        <span>Undo #{points.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        disabled={points.length === 0}
                        className="py-1 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 border border-red-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="Hapus semua titik dan mulai ulang"
                      >
                        <Trash2 size={12} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 relative overflow-hidden bg-slate-100 min-h-[400px]">
                {activeTab === "draw" ? (
                  <DynamicLeafletPolygonEditor
                    center={[safeLat, safeLng]}
                    markerPos={[safeLat, safeLng]}
                    points={points}
                    onAddPoint={handleAddPoint}
                    onUpdatePoint={handleUpdatePoint}
                    onDeletePoint={handleDeletePoint}
                    color={currentColor}
                    layerType={mapLayerType}
                    fitBoundsTrigger={fitBoundsTrigger}
                    sectorType={sectorType}
                  />
                ) : (
                  <div className="p-5 h-full overflow-y-auto space-y-4 bg-white">
                    {/* Box Upload File KML / GeoJSON */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer?.files?.[0];
                        if (file) {
                          await processUploadedSpatialFile(file, false);
                        }
                      }}
                      onClick={() => modalFileInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80 transition cursor-pointer flex flex-col items-center justify-center text-center gap-2"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">
                          Klik untuk Upload File KML (.kml) atau Seret File ke Sini
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mendukung file <strong>.kml</strong> dari Google Earth, QGIS, ArcGIS, Avenza Maps, SW Maps, maupun file <strong>.geojson</strong>
                        </p>
                      </div>
                      <span className="mt-1 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-[11px] shadow-2xs">
                        Pilih File KML / GeoJSON dari Perangkat
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-xs text-slate-800 mb-1">
                        Atau Tempelkan (Paste) Teks KML / GeoJSON Polygon Secara Langsung
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Anda juga dapat menyalin isi teks dari file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.kml</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.geojson</code> lalu menempelkannya ke dalam kotak di bawah:
                      </p>
                      <textarea
                        value={geoJsonInput}
                        onChange={(e) => {
                          setGeoJsonInput(e.target.value);
                          setParseError(null);
                        }}
                        rows={10}
                        placeholder='{ "type": "Polygon", "coordinates": [[[99.25, 1.45], [99.26, 1.45], [99.26, 1.46], [99.25, 1.45]]] } atau tempelkan kode XML <kml>...</kml>'
                        className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50"
                      />
                    </div>

                    {parseError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-red-600" />
                        <span>{parseError}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const trimmed = geoJsonInput.trim();
                            if (!trimmed) {
                              setParseError("Silakan unggah file KML atau tempelkan teks KML/GeoJSON terlebih dahulu.");
                              return;
                            }
                            let pts: [number, number][] = [];
                            if (trimmed.startsWith("<")) {
                              const parsedKml = parseKmlToPoints(trimmed);
                              pts = parsedKml.points;
                            } else {
                              const parsed = JSON.parse(trimmed);
                              pts = extractPointsFromGeoJson(parsed);
                            }
                            if (pts.length < 3) {
                              setParseError("Data poligon harus memiliki minimal 3 koordinat sudut batas lahan.");
                              return;
                            }
                            setPoints(pts);
                            setGeoJsonInput(JSON.stringify(pointsToGeoJsonPolygon(pts), null, 2));
                            setFitBoundsTrigger((prev) => prev + 1);
                            setActiveTab("draw");
                            setParseError(null);
                          } catch (e: any) {
                            setParseError(`Gagal memproses data: ${e.message}`);
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
                    <span>Klik pada peta untuk menandai titik sudut atau upload file KML</span>
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
