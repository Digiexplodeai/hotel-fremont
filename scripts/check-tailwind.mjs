import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkCSS() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const cssRules = await page.evaluate(() => {
    const testDiv = document.createElement('div');
    testDiv.className = 'relative absolute inset-0 w-full aspect-[16/9] flex grid';
    document.body.appendChild(testDiv);
    const cs = window.getComputedStyle(testDiv);
    const result = {
      position: cs.position,
      width: cs.width,
      display: cs.display,
      aspectRatio: cs.aspectRatio
    };
    testDiv.remove();
    return result;
  });

  console.log('TAILWIND UTILITY TEST ON DYNAMIC ELEMENT:\n', cssRules);
  await browser.close();
}

checkCSS();
