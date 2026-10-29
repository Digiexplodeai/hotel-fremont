import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function diagnose() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  const report = await page.evaluate(() => {
    const results = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cs = window.getComputedStyle(el);
      const tag = el.tagName;
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 3).join('.')}` : '';
      const name = `${tag}${id}${cls}`;

      // Check transform
      if (cs.transform && cs.transform !== 'none') {
        results.push({ name, transform: cs.transform });
      }

      // Check crazy heights
      const rect = el.getBoundingClientRect();
      if (rect.height > 5000) {
        results.push({ name, hugeHeight: rect.height, rect });
      }

      if (cs.zoom && cs.zoom !== '1') {
        results.push({ name, zoom: cs.zoom });
      }
    }

    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);

    return {
      windowInner: { w: window.innerWidth, h: window.innerHeight },
      scroll: { scrollX: window.scrollX, scrollY: window.scrollY },
      bodyRect: document.body.getBoundingClientRect(),
      htmlTransform: htmlStyle.transform,
      htmlZoom: htmlStyle.zoom,
      htmlFontSize: htmlStyle.fontSize,
      bodyTransform: bodyStyle.transform,
      bodyZoom: bodyStyle.zoom,
      bodyFontSize: bodyStyle.fontSize,
      elementsWithTransformOrHuge: results.slice(0, 30)
    };
  });

  console.log('DIAGNOSIS REPORT:\n', JSON.stringify(report, null, 2));

  await browser.close();
}

diagnose().catch(console.error);
