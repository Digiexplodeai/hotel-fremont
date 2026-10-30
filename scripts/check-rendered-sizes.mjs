import puppeteer from 'puppeteer-core';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkSizes() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  
  // 1. Desktop Header
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1440, height: 900 });
  await p1.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 3400));
  const desktopLogo = await p1.evaluate(() => {
    const img = document.querySelector('header img');
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return { width: rect.width, height: rect.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
  });
  console.log('Desktop header logo (1440x900):', desktopLogo);

  // 2. Mobile Header
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 390, height: 844 });
  await p2.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 3400));
  const mobileLogo = await p2.evaluate(() => {
    const img = document.querySelector('header img');
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return { width: rect.width, height: rect.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
  });
  console.log('Mobile header logo (390x844):', mobileLogo);

  // 3. Intro Screen Logo (Desktop)
  const p3 = await browser.newPage();
  await p3.setViewport({ width: 1440, height: 900 });
  await p3.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 600));
  const introDesktop = await p3.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const introImg = imgs.find(img => img.alt === 'HOTEL FREMONT' || img.alt === 'Hotel Fremont');
    if (!introImg) return null;
    const rect = introImg.getBoundingClientRect();
    return { width: rect.width, height: rect.height, naturalWidth: introImg.naturalWidth, naturalHeight: introImg.naturalHeight };
  });
  console.log('Intro logo (1440x900):', introDesktop);

  // 4. Intro Screen Logo (Mobile)
  const p4 = await browser.newPage();
  await p4.setViewport({ width: 390, height: 844 });
  await p4.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 600));
  const introMobile = await p4.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const introImg = imgs.find(img => img.alt === 'HOTEL FREMONT' || img.alt === 'Hotel Fremont');
    if (!introImg) return null;
    const rect = introImg.getBoundingClientRect();
    return { width: rect.width, height: rect.height, naturalWidth: introImg.naturalWidth, naturalHeight: introImg.naturalHeight };
  });
  console.log('Intro logo (390x844):', introMobile);

  await browser.close();
}

checkSizes().catch(console.error);

