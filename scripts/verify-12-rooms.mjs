import { roomCategories, TOTAL_ROOMS, HOTEL_REPUTATION } from '../src/data/rooms.ts';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

console.log('=== ROOM DATA AUDIT ===');
console.log('TOTAL_ROOMS:', TOTAL_ROOMS);
console.log('TOTAL_ROOMS === 12:', TOTAL_ROOMS === 12);
console.log('Categories count:', roomCategories.length);
roomCategories.forEach(c => {
  console.log(` - ${c.name} (${c.slug}): ${c.totalRooms} rooms [${c.inventoryLabel}], maxGuests=${c.maxGuests}, occupancy="${c.occupancy}"`);
});

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public/assets/screenshots/room-count-verification');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verifyScreens() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });

  // 1. Desktop 1440x900
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  // Capture stats section
  const statsEl = await page.$('div.grid.grid-cols-2.md\\:grid-cols-4');
  if (statsEl) {
    await statsEl.screenshot({ path: path.join(outDir, 'stats-strip-desktop.png') });
    console.log('✅ Captured stats-strip-desktop.png');
  }

  // Capture booking bar
  const bookingBox = await page.$('div.max-w-5xl.mx-auto');
  if (bookingBox) {
    await bookingBox.screenshot({ path: path.join(outDir, 'booking-bar-desktop.png') });
    console.log('✅ Captured booking-bar-desktop.png');
  }

  // Capture rooms section
  const roomsSec = await page.$('#rooms');
  if (roomsSec) {
    await roomsSec.screenshot({ path: path.join(outDir, 'rooms-section-desktop.png') });
    console.log('✅ Captured rooms-section-desktop.png');
  }

  // Verify text values on desktop
  const statsData = await page.evaluate(() => {
    const statCards = Array.from(document.querySelectorAll('div.grid.grid-cols-2.md\\:grid-cols-4 > div'));
    return statCards.map(c => ({
      value: c.querySelector('div:first-child')?.textContent?.trim(),
      label: c.querySelector('div:nth-child(2)')?.textContent?.trim(),
      sub: c.querySelector('div:nth-child(3)')?.textContent?.trim(),
    }));
  });
  console.log('Rendered stats data:', statsData);

  const roomCardsData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#rooms .group.relative.rounded-2xl'));
    return cards.map(c => ({
      title: c.querySelector('h3')?.textContent?.trim(),
      badge: c.querySelector('div.absolute.top-4 > div:first-child')?.textContent?.trim(),
      inventory: c.querySelector('div.absolute.top-4 > div:nth-child(2)')?.textContent?.trim(),
      specs: Array.from(c.querySelectorAll('div.grid.grid-cols-3 > div')).map(s => s.textContent?.trim()),
    }));
  });
  console.log('Rendered room cards data:', roomCardsData);

  // Test guest capacity inline warning in booking bar
  await page.evaluate(() => {
    const selects = document.querySelectorAll('form select');
    if (selects.length >= 2) {
      const roomSelect = selects[0];
      const guestSelect = selects[1];
      roomSelect.value = 'deluxe-king';
      roomSelect.dispatchEvent(new Event('change', { bubbles: true }));
      guestSelect.value = '4';
      guestSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const bookingBoxWarning = await page.$('div.max-w-5xl.mx-auto');
  if (bookingBoxWarning) {
    await bookingBoxWarning.screenshot({ path: path.join(outDir, 'booking-bar-overcapacity-warning.png') });
    console.log('✅ Captured booking-bar-overcapacity-warning.png');
  }
  await page.close();

  // 2. Mobile 390x844
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  const statsMobile = await pageMobile.$('div.grid.grid-cols-2.md\\:grid-cols-4');
  if (statsMobile) {
    await statsMobile.screenshot({ path: path.join(outDir, 'stats-strip-mobile.png') });
    console.log('✅ Captured stats-strip-mobile.png');
  }

  const bookingBoxMobile = await pageMobile.$('div.max-w-5xl.mx-auto');
  if (bookingBoxMobile) {
    await bookingBoxMobile.screenshot({ path: path.join(outDir, 'booking-bar-mobile.png') });
    console.log('✅ Captured booking-bar-mobile.png');
  }
  await pageMobile.close();

  await browser.close();
  console.log('🎉 Verification finished successfully!');
}

verifyScreens().catch(console.error);
