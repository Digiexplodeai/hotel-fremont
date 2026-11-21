import puppeteer from 'puppeteer-core';

async function testTouchEvents() {
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

  const client = await page.createCDPSession();
  
  // Dispatch touch events directly
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: 650 }]
  });
  
  for (let i = 1; i <= 10; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 650 - i * 25 }]
    });
    await new Promise(r => setTimeout(r, 20));
  }
  
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });

  await new Promise(r => setTimeout(r, 400));

  const scrollTop = await page.$eval('div[data-lenis-prevent-wheel]', el => Math.round(el.scrollTop));
  console.log('scrollTop after Input.dispatchTouchEvent:', scrollTop);
  
  await browser.close();
}
testTouchEvents();
