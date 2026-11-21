import puppeteer from 'puppeteer-core';

async function testPoint() {
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

  const pointInfo = await page.evaluate(() => {
    const el = document.elementFromPoint(195, 664);
    const scrollContainer = document.querySelector('div[data-lenis-prevent-wheel]');
    let cur = el;
    const path = [];
    while (cur && cur !== document.body) {
      path.push(`${cur.tagName}.${Array.from(cur.classList).join('.')}`);
      cur = cur.parentElement;
    }
    return {
      element: el ? `${el.tagName}.${Array.from(el.classList).join('.')}` : null,
      isDescendant: scrollContainer ? scrollContainer.contains(el) : false,
      scrollContainerScrollHeight: scrollContainer ? scrollContainer.scrollHeight : 0,
      scrollContainerClientHeight: scrollContainer ? scrollContainer.clientHeight : 0,
      path: path
    };
  });
  console.log('Point Info:', pointInfo);

  // Check what happens if we directly set scrollTop
  const canSetScrollTop = await page.evaluate(() => {
    const el = document.querySelector('div[data-lenis-prevent-wheel]');
    el.scrollTop = 100;
    return el.scrollTop;
  });
  console.log('Can set scrollTop programmatically:', canSetScrollTop);

  await browser.close();
}
testPoint();
