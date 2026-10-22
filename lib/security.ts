/**
 * Keamanan Form & Pemindaian File Pengaduan SPM
 * 1. Pencegahan SQL Injection & Sanitasi Input
 * 2. Pemindaian File & Pencegahan Executable / File Berbahaya
 */

// Ekstensi file yang dilarang keras (executable, script, library sistem)
export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".php",
  ".phtml",
  ".php3",
  ".php4",
  ".php5",
  ".phps",
  ".js",
  ".vbs",
  ".vbe",
  ".wsf",
  ".wsh",
  ".msi",
  ".msp",
  ".dll",
  ".com",
  ".scr",
  ".pif",
  ".jar",
  ".apk",
  ".bin",
  ".iso",
  ".dmg",
  ".sys",
  ".drv",
  ".cpl",
  ".reg",
  ".ps1",
  ".psm1",
  ".hta",
  ".py",
  ".rb",
  ".pl",
  ".cgi",
  ".asp",
  ".aspx",
  ".jsp",
  ".jspx",
  ".war",
];

// Whitelist ekstensi yang diizinkan untuk dokumen pengaduan
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

// Batas ukuran file: 5 MB
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Pola SQL Injection umum untuk deteksi payload berbahaya
const SQL_INJECTION_PATTERNS = [
  /(\bunion\b\s+(all\s+)?select\b)/i,
  /(\bselect\b.+\bfrom\b)/i,
  /(\binsert\b\s+into\b)/i,
  /(\bdelete\b\s+from\b)/i,
  /(\bupdate\b.+\bset\b)/i,
  /(\bdrop\b\s+(table|database|view|procedure|function|index)\b)/i,
  /(\balter\b\s+(table|database|view)\b)/i,
  /(\btruncate\b\s+table\b)/i,
  /(\bexec(ute)?\b\s*\()/i,
  /(;\s*--)/,
  /(;\s*drop\b)/i,
  /(;\s*select\b)/i,
  /(;\s*delete\b)/i,
  /(\bdeclare\b\s+@)/i,
  /(\bbenchmark\s*\(\s*\d+)/i,
  /(\bsleep\s*\(\s*\d+)/i,
  /(['"]\s*or\s+['"]?1['"]?\s*=\s*['"]?1)/i,
  /(['"]\s*or\s+1\s*=\s*1)/i,
  /(['"]\s*or\s+['"]a['"]\s*=\s*['"]a)/i,
  /(\/\*[\s\S]*?\*\/)/, // komentar blok SQL
];

/**
 * Memeriksa apakah suatu teks mengandung payload SQL Injection
 */
export function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const normalized = input.trim();
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Membersihkan input teks dari karakter berbahaya & null bytes
 */
export function sanitizeString(input: string | undefined | null, maxLength = 255): string {
  if (!input || typeof input !== "string") return "";
  // Hapus null byte dan kontrol karakter tak tampak
  let cleaned = input.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Hapus tag HTML script berbahaya
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
}

/**
 * Validasi NIK (Nomor Induk Kependudukan): harus 16 digit angka
 */
export function validateNik(nik: string | undefined | null): {
  isValid: boolean;
  cleaned: string | null;
  error?: string;
} {
  if (!nik || !nik.trim()) {
    return { isValid: true, cleaned: null };
  }
  const cleaned = nik.trim();
  if (!/^\d{16}$/.test(cleaned)) {
    return {
      isValid: false,
      cleaned: null,
      error: "NIK harus berupa 16 digit angka valid.",
    };
  }
  return { isValid: true, cleaned };
}

/**
 * Validasi Nomor HP Indonesia
 */
export function validatePhone(phone: string | undefined | null): {
  isValid: boolean;
  cleaned: string;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    return { isValid: false, cleaned: "", error: "Nomor WhatsApp/HP wajib diisi." };
  }
  let cleaned = phone.trim().replace(/[\s-]/g, "");
  // Format Indonesia: 08..., 628..., +628...
  if (!/^(\+?62|0)[0-9]{8,15}$/.test(cleaned)) {
    return {
      isValid: false,
      cleaned: "",
      error: "Nomor HP tidak valid. Gunakan format yang benar (contoh: 081234567890).",
    };
  }
  return { isValid: true, cleaned };
}

/**
 * Validasi ID / Kode Wilayah (alphanumeric CUID / ID)
 */
export function validateIdFormat(id: string | undefined | null, fieldName: string): {
  isValid: boolean;
  error?: string;
} {
  if (!id || typeof id !== "string") {
    return { isValid: false, error: `${fieldName} tidak boleh kosong.` };
  }
  const trimmed = id.trim();
  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(trimmed)) {
    return { isValid: false, error: `Format ${fieldName} tidak valid.` };
  }
  return { isValid: true };
}

/**
 * Memindai nama file untuk mencegah directory traversal, double extension, dan file berbahaya
 */
export function scanFileName(fileName: string): {
  isSafe: boolean;
  reason?: string;
  sanitizedName: string;
} {
  if (!fileName || typeof fileName !== "string") {
    return { isSafe: false, reason: "Nama file tidak valid.", sanitizedName: "" };
  }

  // 1. Cek null byte & path traversal
  if (fileName.includes("\0") || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return {
      isSafe: false,
      reason: "Nama file mengandung karakter berbahaya (path traversal).",
      sanitizedName: "",
    };
  }

  const lowerName = fileName.toLowerCase().trim();

  // 2. Cek apakah mengandung ekstensi berbahaya (termasuk double extension seperti foto.jpg.exe)
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerName.endsWith(ext) || lowerName.includes(`${ext}.`)) {
      return {
        isSafe: false,
        reason: `File dengan ekstensi '${ext}' dilarang demi keamanan sistem (terdeteksi file executable/script berbahaya).`,
        sanitizedName: "",
      };
    }
  }

  // 3. Cek apakah ekstensi akhir ada di whitelist
  const lastDotIndex = lowerName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return {
      isSafe: false,
      reason: "File wajib memiliki ekstensi yang valid (.jpg, .jpeg, .png, .webp, .pdf).",
      sanitizedName: "",
    };
  }

  const ext = lowerName.substring(lastDotIndex);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isSafe: false,
      reason: `Format file '${ext}' tidak didukung. Hanya diizinkan: JPG, PNG, WEBP, atau PDF.`,
      sanitizedName: "",
    };
  }

  // Sanitasi nama file agar hanya memuat huruf, angka, underscore, hyphen, dan titik
  const sanitized = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

  return { isSafe: true, sanitizedName: sanitized };
}

/**
 * Memindai konten buffer biner menggunakan Magic Bytes (File Signature)
 * untuk mendeteksi file executable atau file berbahaya yang disamarkan
 */
export function scanFileBuffer(
  buffer: Buffer | Uint8Array,
  declaredMime?: string
): {
  isSafe: boolean;
  detectedType?: "JPEG" | "PNG" | "WEBP" | "PDF";
  reason?: string;
} {
  if (!buffer || buffer.length < 4) {
    return { isSafe: false, reason: "Ukuran file terlalu kecil atau rusak." };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { isSafe: false, reason: "Ukuran file melebihi batas maksimum 5MB." };
  }

  const b0 = buffer[0];
  const b1 = buffer[1];
  const b2 = buffer[2];
  const b3 = buffer[3];

  // 1. CEK SIGNATURE EXECUTABLE BERBAHAYA
  // DOS / Windows PE Executable (MZ): 0x4D 0x5A
  if (b0 === 0x4d && b1 === 0x5a) {
    return {
      isSafe: false,
      reason: "File terdeteksi sebagai Windows Executable (.exe/.dll/.com/.sys). Dilarang keras diunggah!",
    };
  }

  // Linux ELF Executable: 0x7F 0x45 0x4C 0x46 (\x7fELF)
  if (b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46) {
    return {
      isSafe: false,
      reason: "File terdeteksi sebagai Linux Executable (ELF Binary). Dilarang keras diunggah!",
    };
  }

  // Java Class / Bytecode: 0xCA 0xFE 0xBA 0xBE
  if (b0 === 0xca && b1 === 0xfe && b2 === 0xba && b3 === 0xbe) {
    return {
      isSafe: false,
      reason: "File terdeteksi sebagai Java Bytecode / Applet. Dilarang keras diunggah!",
    };
  }

  // Unix Script (#!)
  if (b0 === 0x23 && b1 === 0x21) {
    return {
      isSafe: false,
      reason: "File terdeteksi sebagai script shell (#!). Dilarang keras diunggah!",
    };
  }

  // 2. CEK ISI AWAL UNTUK WEB SCRIPT (PHP, HTML/JS)
  const previewSlice = buffer.slice(0, Math.min(buffer.length, 512));
  let previewText = "";
  try {
    previewText = new TextDecoder("utf-8").decode(previewSlice).toLowerCase();
  } catch (e) {
    if (typeof Buffer !== "undefined") {
      previewText = Buffer.from(previewSlice).toString("utf-8").toLowerCase();
    }
  }

  if (
    previewText.includes("<?php") ||
    previewText.includes("<?=") ||
    previewText.includes("<script") ||
    previewText.includes("<%@") ||
    previewText.includes("wscript.") ||
    previewText.includes("eval(")
  ) {
    return {
      isSafe: false,
      reason: "File mengandung script kode berbahaya (PHP/JS/Script payload). Dilarang diunggah!",
    };
  }

  // 3. COCOKKAN DENGAN MAGIC BYTES FORMAT AMAN
  // JPEG: FF D8 FF
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
    return { isSafe: true, detectedType: "JPEG" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    b0 === 0x89 &&
    b1 === 0x50 &&
    b2 === 0x4e &&
    b3 === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isSafe: true, detectedType: "PNG" };
  }

  // WebP: RIFF (bytes 0-3: 0x52 0x49 0x46 0x46) and WEBP (bytes 8-11: 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    b0 === 0x52 &&
    b1 === 0x49 &&
    b2 === 0x46 &&
    b3 === 0x43 ||
    (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50)
  ) {
    return { isSafe: true, detectedType: "WEBP" };
  }

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) {
    return { isSafe: true, detectedType: "PDF" };
  }

  // Jika tidak cocok dengan signature foto/PDF yang diizinkan
  return {
    isSafe: false,
    reason: "Header biner file tidak sesuai dengan format foto (JPG, PNG, WEBP) atau PDF yang valid.",
  };
}

/**
 * Memindai file DataURL Base64 lengkap (nama + isi binary)
 */
export function scanBase64Upload(
  dataUrl: string,
  fileName: string
): {
  isSafe: boolean;
  reason?: string;
  sanitizedName?: string;
  mimeType?: string;
  bufferSize?: number;
} {
  // 1. Pindai nama file
  const nameCheck = scanFileName(fileName);
  if (!nameCheck.isSafe) {
    return { isSafe: false, reason: nameCheck.reason };
  }

  if (!dataUrl || typeof dataUrl !== "string") {
    return { isSafe: false, reason: "Data dokumen kosong atau tidak valid." };
  }

  // 2. Parse Base64 Data URL
  let base64Content = dataUrl;
  let declaredMime = "";

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    declaredMime = match[1].toLowerCase();
    base64Content = match[2];
  }

  // 3. Decode base64 ke buffer
  let buffer: Buffer | Uint8Array;
  try {
    if (typeof Buffer !== "undefined") {
      buffer = Buffer.from(base64Content, "base64");
    } else {
      const binaryString = atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes;
    }
  } catch (err) {
    return { isSafe: false, reason: "Gagal mendecode data file base64." };
  }

  // 4. Pindai magic bytes isi file
  const bufferCheck = scanFileBuffer(buffer, declaredMime);
  if (!bufferCheck.isSafe) {
    return { isSafe: false, reason: bufferCheck.reason };
  }

  let finalMime = declaredMime;
  if (!finalMime) {
    if (bufferCheck.detectedType === "JPEG") finalMime = "image/jpeg";
    else if (bufferCheck.detectedType === "PNG") finalMime = "image/png";
    else if (bufferCheck.detectedType === "WEBP") finalMime = "image/webp";
    else if (bufferCheck.detectedType === "PDF") finalMime = "application/pdf";
  }

  return {
    isSafe: true,
    sanitizedName: nameCheck.sanitizedName,
    mimeType: finalMime,
    bufferSize: buffer.length,
  };
}
