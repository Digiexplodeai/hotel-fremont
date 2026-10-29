import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function findHugeImage() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const info = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    const list = [];
    for (const img of imgs) {
      const rect = img.getBoundingClientRect();
      const parent = img.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;
      list.push({
        src: img.src ? img.src.substring(0, 80) : '',
        alt: img.alt,
        imgH: rect.height,
        imgW: rect.width,
        parentTag: parent ? parent.tagName : '',
        parentClass: parent ? parent.className : '',
        parentH: parentRect ? parentRect.height : 0,
        parentW: parentRect ? parentRect.width : 0,
        parentComputedH: parent ? window.getComputedStyle(parent).height : '',
        parentComputedPos: parent ? window.getComputedStyle(parent).position : '',
      });
    }
    return list;
  });

  console.log('ALL IMAGES ON PAGE:\n', JSON.stringify(info, null, 2));

  await browser.close();
}

findHugeImage().catch(console.error);
