import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public/assets/screenshots/room-count-verification');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });

  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  // 1. Booking bar default
  const bookingBar = await page.$('form');
  if (bookingBar) {
    const box = await page.evaluateHandle(el => el.closest('.rounded-2xl'), bookingBar);
    await box.asElement().screenshot({ path: path.join(outDir, 'booking-bar-desktop.png') });
    console.log('✅ Captured booking-bar-desktop.png');
  }

  // 2. Booking bar with overcapacity warning: pick Deluxe King + 4 guests
  await page.evaluate(() => {
    const selects = document.querySelectorAll('form select');
    selects[0].value = 'deluxe-king';
    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    selects[1].value = '4';
    selects[1].dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));
  if (bookingBar) {
    const box = await page.evaluateHandle(el => el.closest('.rounded-2xl'), bookingBar);
    await box.asElement().screenshot({ path: path.join(outDir, 'booking-bar-warning-desktop.png') });
    console.log('✅ Captured booking-bar-warning-desktop.png');
  }

  // 3. Stats strip
  await page.evaluate(() => {
    const el = document.querySelector('div.grid.grid-cols-2.md\\:grid-cols-4');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const statsEl = await page.$('div.grid.grid-cols-2.md\\:grid-cols-4');
  if (statsEl) {
    await statsEl.screenshot({ path: path.join(outDir, 'stats-strip-desktop.png') });
    console.log('✅ Captured stats-strip-desktop.png');
  }

  // 4. Rooms section
  await page.evaluate(() => {
    const el = document.getElementById('rooms');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1200));
  const roomsCardsGrid = await page.$('#rooms .grid.grid-cols-1.md\\:grid-cols-2');
  if (roomsCardsGrid) {
    await roomsCardsGrid.screenshot({ path: path.join(outDir, 'room-cards-grid-desktop.png') });
    console.log('✅ Captured room-cards-grid-desktop.png');
  }

  // 5. Mobile booking bar and stats
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  const bookingBarMob = await pageMobile.$('form');
  if (bookingBarMob) {
    const boxMob = await pageMobile.evaluateHandle(el => el.closest('.rounded-2xl'), bookingBarMob);
    await boxMob.asElement().screenshot({ path: path.join(outDir, 'booking-bar-mobile.png') });
    console.log('✅ Captured booking-bar-mobile.png');
  }

  await pageMobile.evaluate(() => {
    const el = document.querySelector('div.grid.grid-cols-2.md\\:grid-cols-4');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const statsMob = await pageMobile.$('div.grid.grid-cols-2.md\\:grid-cols-4');
  if (statsMob) {
    await statsMob.screenshot({ path: path.join(outDir, 'stats-strip-mobile.png') });
    console.log('✅ Captured stats-strip-mobile.png');
  }

  await browser.close();
  console.log('🎉 All screenshots captured cleanly!');
}

run().catch(console.error);

