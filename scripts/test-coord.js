function parseCoord(raw) {
  if (!raw || typeof raw !== 'string') return { lat: null, lng: null };
  const str = raw.trim();
  // Regex format DMS: e.g. 1,18'12.669N 99,19'23.244E
  const dmsMatch = str.match(/([0-9]+)[,\.]([0-9]+)['’]([0-9\.]+)"?\s*N\s+([0-9]+)[,\.]([0-9]+)['’]([0-9\.]+)"?\s*E/i);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const lat = latDeg + (latMin / 60) + (latSec / 3600);

    const lngDeg = parseFloat(dmsMatch[4]);
    const lngMin = parseFloat(dmsMatch[5]);
    const lngSec = parseFloat(dmsMatch[6]);
    const lng = lngDeg + (lngMin / 60) + (lngSec / 3600);
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  // Regex format Decimal: e.g. 1,2747N 99,1841E or 1.220184N 99.38012E
  const decMatch = str.match(/([0-9]+)[,\.]([0-9]+)\s*N\s+([0-9]+)[,\.]([0-9]+)\s*E/i);
  if (decMatch) {
    const lat = parseFloat(decMatch[1] + '.' + decMatch[2]);
    const lng = parseFloat(decMatch[3] + '.' + decMatch[4]);
    return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
  }

  return { lat: null, lng: null };
}

const tests = [
  '1,2747N      99,1841E',
  "1,18'12.669N     99,19'23.244E",
  '1.220184N   99.38012E',
  '1,25660N 99,357820E',
  "1,12'30.226N     99,22'15.859E"
];
tests.forEach(t => console.log(t, '=>', parseCoord(t)));
