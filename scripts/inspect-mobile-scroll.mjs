import puppeteer from 'puppeteer-core';

async function inspectMobile() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3009', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.textContent && (b.textContent.includes('Book Now') || b.textContent.includes('Book Your Stay') || b.textContent.includes('Book'))) {
        b.click();
        break;
      }
    }
  });
  await page.waitForSelector('[role="dialog"]');
  await new Promise(r => setTimeout(r, 600));

  const info = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const outer = dialog.parentElement;
    const inner = dialog.querySelector('div[data-lenis-prevent-wheel]');
    return {
      outer: {
        scrollTop: outer.scrollTop,
        scrollHeight: outer.scrollHeight,
        clientHeight: outer.clientHeight,
        overflowY: window.getComputedStyle(outer).overflowY
      },
      inner: {
        scrollTop: inner.scrollTop,
        scrollHeight: inner.scrollHeight,
        clientHeight: inner.clientHeight,
        overflowY: window.getComputedStyle(inner).overflowY
      }
    };
  });
  console.log('Mobile scroll info:', JSON.stringify(info, null, 2));
  await browser.close();
}
inspectMobile();
