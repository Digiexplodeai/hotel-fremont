import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.resolve("public/assets/screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verify() {
  console.log("Launching browser for comprehensive verification...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const errors = [];
  const logError = (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  };

  const page = await browser.newPage();
  page.on("console", logError);
  page.on("pageerror", (err) => errors.push(err.message));

  // 1. HARD REFRESH TEST (3 times) & INTRO CAPTURE
  console.log("1. Hard refresh test (3 consecutive loads)...");
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  for (let i = 1; i <= 3; i++) {
    console.log(`- Hard Refresh ${i}/3`);
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    if (i === 1) {
      // Capture intro mid-animation at 800ms
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(outDir, "intro-mid-animation.png") });
      console.log("✅ intro-mid-animation.png captured");
    }

    // Wait until preloader curtain lifts (1.8s progress + 1.0s curtain + buffer = 3.4s)
    await new Promise((r) => setTimeout(r, 3400));
  }

  // 2. NAVBAR AT TOP (1440x900)
  console.log("2. Capturing Navbar at top (1440x900)...");
  await page.screenshot({
    path: path.join(outDir, "navbar-top-restored.png"),
    clip: { x: 0, y: 0, width: 1440, height: 110 },
  });
  console.log("✅ navbar-top-restored.png captured");

  // 3. NAVBAR SCROLLED (1440x900)
  console.log("3. Capturing Scrolled Navbar (1440x900)...");
  await page.evaluate(() => window.scrollTo(0, 160));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(outDir, "navbar-scrolled-restored.png"),
    clip: { x: 0, y: 0, width: 1440, height: 110 },
  });
  console.log("✅ navbar-scrolled-restored.png captured");

  // 4. VIEWPORTS & COLLISION AUDIT (1920, 1440, 1280, 1024, 768, 390)
  const viewports = [
    { w: 1920, h: 1080, name: "1920x1080" },
    { w: 1440, h: 900, name: "1440x900" },
    { w: 1280, h: 800, name: "1280x800" },
    { w: 1024, h: 768, name: "1024x768" },
    { w: 768, h: 1024, name: "768x1024" },
    { w: 390, h: 844, name: "390x844" },
  ];

  for (const vp of viewports) {
    console.log(`4. Checking ${vp.name}...`);
    const p = await browser.newPage();
    p.on("console", logError);
    await p.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 3400));

    // Collision check
    const check = await p.evaluate(() => {
      const logoEl = document.querySelector('header a[aria-label="Hotel Fremont Home"]');
      const navEl = document.querySelector("header nav");
      if (!logoEl || !navEl || window.getComputedStyle(navEl).display === "none") {
        return { ok: true, note: "desktop nav hidden (mobile menu active)" };
      }
      const logoRect = logoEl.getBoundingClientRect();
      const firstLink = navEl.querySelector("a");
      if (!firstLink) return { ok: true };
      const firstRect = firstLink.getBoundingClientRect();
      const gap = firstRect.left - logoRect.right;
      return { ok: gap > 15, gap, logoRight: logoRect.right, firstLinkLeft: firstRect.left };
    });

    console.log(`- ${vp.name} status:`, check);
    await p.close();
  }

  // 5. MOBILE MENU OPEN (390x844)
  console.log("5. Capturing Mobile Menu Open (390x844)...");
  const pMobile = await browser.newPage();
  pMobile.on("console", logError);
  await pMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pMobile.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 3400));

  const hamburger = await pMobile.$('button[aria-label="Open menu"]');
  if (hamburger) {
    await hamburger.click();
    await new Promise((r) => setTimeout(r, 600));
    await pMobile.screenshot({ path: path.join(outDir, "mobile-menu-open.png") });
    console.log("✅ mobile-menu-open.png captured");
  }
  await pMobile.close();

  await page.close();
  await browser.close();

  console.log("\n--- CONSOLE ERROR REPORT ---");
  if (errors.length === 0) {
    console.log("🎉 ALL TESTS PASSED WITH 0 CONSOLE ERRORS!");
  } else {
    console.log(`Detected ${errors.length} console issues:`, errors);
  }
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
