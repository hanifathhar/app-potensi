const puppeteer = require("puppeteer-core");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(__dirname, "../docs/manual-book/screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate valid JWT token for superadmin (ADMIN_KABUPATEN)
const token = jwt.sign(
  {
    id: "cmvgos0nl001aulmc3jxvfp2q",
    nama: "Administrator SIDALIHAN",
    username: "superadmin",
    role: "ADMIN_KABUPATEN",
    peran: "ADMIN_KABUPATEN",
    kd_kecamatan: null,
    kd_desa: null,
    kd_desa_list: [],
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureAll() {
  console.log("🚀 Meluncurkan browser untuk mengambil screenshot...");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,960",
    ],
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1.5,
    },
  });

  const page = await browser.newPage();

  // Set auth cookie
  await page.setCookie({
    name: "token",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
  });

  // 1. Landing Page / Beranda Publik
  console.log("📸 Mengambil screenshot 01_beranda_publik.png...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "01_beranda_publik.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 2. Halaman Login
  console.log("📸 Mengambil screenshot 02_halaman_login.png...");
  const loginPage = await browser.newPage();
  // Clear cookie for login page demo
  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await sleep(1500);
  await loginPage.screenshot({
    path: path.join(OUTPUT_DIR, "02_halaman_login.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });
  await loginPage.close();

  // 3. Dashboard Ringkasan Utama
  console.log("📸 Mengambil screenshot 03_dashboard_ringkasan.png...");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
  await sleep(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "03_dashboard_ringkasan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 4. Peta GIS Sebaran (Scroll down to map)
  console.log("📸 Mengambil screenshot 04_dashboard_peta_gis.png...");
  await page.evaluate(() => {
    window.scrollTo({ top: 720, behavior: "instant" });
  });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "04_dashboard_peta_gis.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 5. Dashboard Tab Perikanan
  console.log("📸 Mengambil screenshot 05_dashboard_perikanan.png...");
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await sleep(500);
  // Klik tab perikanan
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btnPerikanan = buttons.find((b) => b.textContent && b.textContent.includes("Perikanan"));
    if (btnPerikanan) btnPerikanan.click();
  });
  await sleep(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "05_dashboard_perikanan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 6. Dashboard Tab Peternakan
  console.log("📸 Mengambil screenshot 06_dashboard_peternakan.png...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btnPeternakan = buttons.find((b) => b.textContent && b.textContent.includes("Peternakan"));
    if (btnPeternakan) btnPeternakan.click();
  });
  await sleep(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "06_dashboard_peternakan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 7. Dashboard Tab Pertanian
  console.log("📸 Mengambil screenshot 07_dashboard_pertanian.png...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btnPertanian = buttons.find((b) => b.textContent && b.textContent.includes("Pertanian"));
    if (btnPertanian) btnPertanian.click();
  });
  await sleep(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "07_dashboard_pertanian.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 8. Menu Pertanian (Lahan/Kebun)
  console.log("📸 Mengambil screenshot 08_menu_pertanian.png...");
  await page.goto(`${BASE_URL}/pertanian`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "08_menu_pertanian.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 9. Menu Perikanan (Kolam)
  console.log("📸 Mengambil screenshot 09_menu_perikanan.png...");
  await page.goto(`${BASE_URL}/perikanan`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "09_menu_perikanan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 10. Menu Peternakan
  console.log("📸 Mengambil screenshot 10_menu_peternakan.png...");
  await page.goto(`${BASE_URL}/peternakan`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "10_menu_peternakan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 11. Menu Kelompok Tani
  console.log("📸 Mengambil screenshot 11_menu_kelompok_tani.png...");
  await page.goto(`${BASE_URL}/kelompok-tani`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "11_menu_kelompok_tani.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  // 12. Menu Pendanaan
  console.log("📸 Mengambil screenshot 12_menu_pendanaan.png...");
  await page.goto(`${BASE_URL}/pendanaan`, { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "12_menu_pendanaan.png"),
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });

  await browser.close();
  console.log("✅ Seluruh screenshot berhasil disimpan di:", OUTPUT_DIR);
}

captureAll().catch((err) => {
  console.error("❌ Error capturing screenshots:", err);
  process.exit(1);
});
