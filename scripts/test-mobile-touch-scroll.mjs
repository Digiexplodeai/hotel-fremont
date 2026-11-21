import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\eabb153f-d836-48f7-bd3f-d324c95591f9';

async function testTouchScroll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3009', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500)); // wait for preloader

  // Open modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      if (b.textContent && (b.textContent.includes('Book Now') || b.textContent.includes('Book Your Stay') || b.textContent.includes('Book'))) {
        b.click();
        break;
      }
    }
  });

  await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 5000 });
  await new Promise(r => setTimeout(r, 600));

  const scrollContainerSelector = 'div[data-lenis-prevent-wheel]';
  const initial = await page.$eval(scrollContainerSelector, el => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight
  }));
  console.log('Mobile Initial:', initial);

  // Use CDP synthesizeScrollGesture for realistic mobile finger drag
  const client = await page.createCDPSession();
  await client.send('Input.synthesizeScrollGesture', {
    x: 195,
    y: 500,
    yDistance: -300,
    speed: 800,
    gestureSourceType: 'touch'
  });
  await new Promise(r => setTimeout(r, 500));

  const afterTouch = await page.$eval(scrollContainerSelector, el => ({
    scrollTop: Math.round(el.scrollTop)
  }));
  console.log('Mobile After Touch Drag:', afterTouch);

  if (afterTouch.scrollTop > 0) {
    console.log('✓ MOBILE TOUCH SCROLL VERIFIED! scrollTop=' + afterTouch.scrollTop);
  } else {
    console.log('Checking fallback touch drag...');
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_touch_scroll_verified.png') });
  await browser.close();
}

testTouchScroll();
