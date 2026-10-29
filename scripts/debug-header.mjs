import puppeteer from "puppeteer-core";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  console.log("Waiting 1s...");
  await new Promise((r) => setTimeout(r, 1000));
  let state = await page.evaluate(() => {
    const h = document.querySelector("header");
    return {
      headerOpacity: h ? window.getComputedStyle(h).opacity : null,
      headerVisible: h ? window.getComputedStyle(h).visibility : null,
      preloaderCount: document.querySelectorAll("div.fixed").length,
    };
  });
  console.log("State at 1s:", state);

  console.log("Waiting 3.5s total...");
  await new Promise((r) => setTimeout(r, 2500));
  state = await page.evaluate(() => {
    const h = document.querySelector("header");
    return {
      headerOpacity: h ? window.getComputedStyle(h).opacity : null,
      headerTransform: h ? window.getComputedStyle(h).transform : null,
      preloaderCount: document.querySelectorAll("div.fixed").length,
      bodyTextSnippet: document.body.innerText.slice(0, 100),
    };
  });
  console.log("State at 3.5s:", state);

  await page.screenshot({ path: "public/assets/screenshots/debug-full.png" });
  console.log("debug-full.png captured");

  await browser.close();
}

run().catch(console.error);
