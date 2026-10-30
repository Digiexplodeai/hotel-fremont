import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public/assets/screenshots/room-count-verification');

async function snap() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  // Re-capture booking bar to check "2 Guests"
  const bookingBox = await page.$('form');
  if (bookingBox) {
    const box = await page.evaluateHandle(el => el.closest('.rounded-2xl'), bookingBox);
    await box.asElement().screenshot({ path: path.join(outDir, 'booking-bar-desktop-fixed.png') });
    console.log('✅ Captured booking-bar-desktop-fixed.png');
  }

  // Scroll down to cards 3 & 4
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#rooms .group.relative.rounded-2xl');
    if (cards.length >= 3) {
      cards[2].scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 800));

  const cards = await page.$$('#rooms .group.relative.rounded-2xl');
  if (cards.length >= 4) {
    await cards[2].screenshot({ path: path.join(outDir, 'card-royal-fremont.png') });
    await cards[3].screenshot({ path: path.join(outDir, 'card-presidential-penthouse.png') });
    console.log('✅ Captured card-royal-fremont.png & card-presidential-penthouse.png');
  }

  await browser.close();
}

snap().catch(console.error);

