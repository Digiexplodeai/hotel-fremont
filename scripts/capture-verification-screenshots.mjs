import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public/assets/screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Capturing Desktop 1440x900 (Hero, Rooms, Footer)...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait 2.8s for preloader lift
  await new Promise(r => setTimeout(r, 2800));

  // Hero Screenshot
  await page.screenshot({ path: path.join(outDir, 'hero_1440x900.png') });
  console.log('✅ hero_1440x900.png captured');

  // Rooms Screenshot
  await page.evaluate(() => {
    const el = document.getElementById('rooms');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'rooms_1440x900.png') });
  console.log('✅ rooms_1440x900.png captured');

  // Footer Screenshot
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'footer_1440x900.png') });
  console.log('✅ footer_1440x900.png captured');

  // 2. Mobile 360x800
  console.log('2. Capturing Mobile 360x800...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 360, height: 800 });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await mobilePage.screenshot({ path: path.join(outDir, 'mobile_360x800.png') });
  console.log('✅ mobile_360x800.png captured');
  await mobilePage.close();

  // 3. Tablet 768x1024
  console.log('3. Capturing Tablet 768x1024...');
  const tabletPage = await browser.newPage();
  await tabletPage.setViewport({ width: 768, height: 1024 });
  await tabletPage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await tabletPage.screenshot({ path: path.join(outDir, 'tablet_768x1024.png') });
  console.log('✅ tablet_768x1024.png captured');
  await tabletPage.close();

  // 4. Wide-Short 1600x500
  console.log('4. Capturing Wide-Short 1600x500...');
  const widePage = await browser.newPage();
  await widePage.setViewport({ width: 1600, height: 500 });
  await widePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await widePage.screenshot({ path: path.join(outDir, 'wideshort_1600x500.png') });
  console.log('✅ wideshort_1600x500.png captured');
  await widePage.close();

  // 5. Desktop 1920x1080
  console.log('5. Capturing Desktop 1920x1080...');
  const fhdPage = await browser.newPage();
  await fhdPage.setViewport({ width: 1920, height: 1080 });
  await fhdPage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await fhdPage.screenshot({ path: path.join(outDir, 'desktop_1920x1080.png') });
  console.log('✅ desktop_1920x1080.png captured');
  await fhdPage.close();

  await browser.close();

  console.log('\n--- BROWSER CONSOLE VERIFICATION ---');
  if (consoleErrors.length === 0) {
    console.log('✅ ZERO CONSOLE ERRORS DETECTED!');
  } else {
    console.log('Console Errors:', consoleErrors);
  }
}

run().catch(console.error);
