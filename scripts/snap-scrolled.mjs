import puppeteer from "puppeteer-core";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function snap() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 3400));
  await page.evaluate(() => window.scrollTo(0, 100));
  await new Promise((r) => setTimeout(r, 600));

  const header = await page.waitForSelector("header");
  await header.screenshot({ path: "public/assets/screenshots/navbar-scrolled-restored.png" });
  console.log("Captured navbar-scrolled-restored.png successfully!");

  await browser.close();
}

snap().catch(console.error);
