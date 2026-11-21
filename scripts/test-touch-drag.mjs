import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3009', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3500));
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Book'))?.click();
  });
  await page.waitForSelector('[role="dialog"]');
  await new Promise(r => setTimeout(r, 600));

  const rect = await page.$eval('div[data-lenis-prevent-wheel]', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, width: r.width };
  });
  console.log('Inner container rect:', rect);

  const client = await page.createCDPSession();
  const startX = Math.round(rect.left + rect.width / 2);
  const startY = Math.round(rect.top + rect.height * 0.75);
  console.log(`Starting touch scroll gesture from (${startX}, ${startY}) with yDistance: -250...`);
  
  await client.send('Input.synthesizeScrollGesture', {
    x: startX,
    y: startY,
    yDistance: -250,
    speed: 800,
    gestureSourceType: 'touch'
  });
  await new Promise(r => setTimeout(r, 600));

  const after = await page.$eval('div[data-lenis-prevent-wheel]', el => Math.round(el.scrollTop));
  console.log('scrollTop after touch drag:', after);
  if (after > 0) {
    console.log('✓ MOBILE TOUCH DRAG SUCCESS! scrollTop=' + after);
  } else {
    // Test with mouse drag (fallback touch emulation)
    console.log('Testing mouse drag fallback...');
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 250, { steps: 10 });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 400));
    const afterMouseDrag = await page.$eval('div[data-lenis-prevent-wheel]', el => Math.round(el.scrollTop));
    console.log('scrollTop after mouse drag:', afterMouseDrag);
  }

  await browser.close();
}
run();
