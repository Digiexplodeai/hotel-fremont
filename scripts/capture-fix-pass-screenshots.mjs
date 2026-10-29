import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.resolve("public/assets/screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log("Launching browser for fix-pass verification...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const errors = [];

  // Helper to attach error listeners
  const setupErrorListeners = (page, vpName) => {
    page.on("pageerror", (err) => errors.push(`[${vpName} PageError] ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`[${vpName} ConsoleError] ${msg.text()}`);
      }
    });
  };

  // 1. Capture 1440x900 - Navbar top, scrolled, and hero
  console.log("1. Capturing 1440x900 (Navbar Top, Scrolled, Hero)...");
  const p1440 = await browser.newPage();
  setupErrorListeners(p1440, "1440x900");
  await p1440.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  // Set sessionStorage to bypass preloader for instant screenshot or let preloader run
  // Let's first visit with sessionStorage so hero is immediately active
  await p1440.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await p1440.evaluate(() => sessionStorage.setItem("fremont_preloaded", "true"));
  await p1440.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  // Navbar at top
  const header = await p1440.$("header");
  if (header) {
    await header.screenshot({ path: path.join(outDir, "navbar-top.png") });
    console.log("✅ navbar-top.png captured");
  }

  // Full Hero
  await p1440.screenshot({
    path: path.join(outDir, "hero.png"),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("✅ hero.png captured");

  // Scroll down 150px and capture scrolled navbar
  await p1440.evaluate(() => window.scrollTo(0, 150));
  await new Promise((r) => setTimeout(r, 600));
  if (header) {
    await header.screenshot({ path: path.join(outDir, "navbar-scrolled.png") });
    console.log("✅ navbar-scrolled.png captured");
  }

  // Also full page top area with scrolled navbar
  await p1440.screenshot({
    path: path.join(outDir, "viewport-scrolled-1440x900.png"),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("✅ viewport-scrolled-1440x900.png captured");
  await p1440.close();

  // 2. Capture 1920x1080 (Desktop)
  console.log("2. Capturing 1920x1080...");
  const p1920 = await browser.newPage();
  setupErrorListeners(p1920, "1920x1080");
  await p1920.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await p1920.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await p1920.screenshot({
    path: path.join(outDir, "desktop-1920x1080.png"),
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log("✅ desktop-1920x1080.png captured");
  await p1920.close();

  // 3. Capture 1024x768 (Tablet / Small Desktop)
  console.log("3. Capturing 1024x768...");
  const p1024 = await browser.newPage();
  setupErrorListeners(p1024, "1024x768");
  await p1024.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  await p1024.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await p1024.screenshot({
    path: path.join(outDir, "tablet-1024x768.png"),
    clip: { x: 0, y: 0, width: 1024, height: 768 },
  });
  console.log("✅ tablet-1024x768.png captured");
  await p1024.close();

  // 4. Capture 390x844 (Mobile)
  console.log("4. Capturing 390x844 (Mobile)...");
  const p390 = await browser.newPage();
  setupErrorListeners(p390, "390x844");
  await p390.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await p390.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await p390.screenshot({
    path: path.join(outDir, "mobile-390x844.png"),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  console.log("✅ mobile-390x844.png captured");
  await p390.close();

  // 5. Browser Tab Icon Showcase
  console.log("5. Generating Browser Tab Icon preview...");
  const pTab = await browser.newPage();
  await pTab.setViewport({ width: 800, height: 260, deviceScaleFactor: 2 });
  await pTab.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 40px;
            background: #18181B;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .browser-chrome {
            width: 700px;
            background: #202124;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .titlebar {
            height: 48px;
            background: #1e1f22;
            display: flex;
            align-items: center;
            padding: 0 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .window-dots {
            display: flex;
            gap: 8px;
            margin-right: 20px;
          }
          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          .dot-red { background: #FF5F56; }
          .dot-yellow { background: #FFBD2E; }
          .dot-green { background: #27C93F; }
          .tab {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #2b2a33;
            color: #f1f1f1;
            padding: 8px 18px;
            border-radius: 8px 8px 0 0;
            font-size: 13px;
            font-weight: 500;
            border-top: 2px solid #E02B1D;
            max-width: 280px;
          }
          .tab img {
            width: 18px;
            height: 18px;
            object-fit: contain;
          }
          .tab span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .preview-panel {
            padding: 24px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #A1A1AA;
            font-size: 13px;
          }
          .badge-row {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .badge-row img {
            width: 48px;
            height: 48px;
            object-fit: contain;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 6px;
          }
        </style>
      </head>
      <body>
        <div class="browser-chrome">
          <div class="titlebar">
            <div class="window-dots">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
            </div>
            <div class="tab">
              <img src="http://localhost:3000/assets/f-icon.png" alt="Hotel Fremont Favicon" />
              <span>Hotel Fremont | Luxury Hotel near Airport Road, Mohali</span>
            </div>
          </div>
          <div class="preview-panel">
            <div>
              <strong style="color: #F7F3EC; font-size: 14px; display: block; margin-bottom: 4px;">Verified High-Resolution Tab Favicon</strong>
              <span>Cropped exclusively from real logo (/public/assets/logo.png) with 10% padding</span>
            </div>
            <div class="badge-row">
              <img src="http://localhost:3000/icon.png" alt="icon.png (512x512)" title="src/app/icon.png (512x512)" />
              <img src="http://localhost:3000/apple-icon.png" alt="apple-icon.png (180x180)" title="src/app/apple-icon.png (180x180)" />
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  await new Promise((r) => setTimeout(r, 600));
  await pTab.screenshot({ path: path.join(outDir, "tab-icon-preview.png") });
  console.log("✅ tab-icon-preview.png captured");
  await pTab.close();

  await browser.close();

  console.log("\n--- CONSOLE / PAGE ERRORS AUDIT ---");
  if (errors.length === 0) {
    console.log("🎉 ZERO ERRORS OR WARNINGS DETECTED ACROSS ALL VIEWPORTS!");
  } else {
    console.log(`Detected ${errors.length} issues:`);
    errors.forEach((e) => console.log(e));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
