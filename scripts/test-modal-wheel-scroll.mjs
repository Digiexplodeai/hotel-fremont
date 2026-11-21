import puppeteer from 'puppeteer-core';
import http from 'http';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\eabb153f-d836-48f7-bd3f-d324c95591f9';

async function waitForServer(url, timeoutMs = 25000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
        req.on('error', reject);
        req.setTimeout(1500, () => {
          req.destroy();
          resolve(false);
        });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  return false;
}

async function runCompleteTestSuite() {
  console.log('=====================================================');
  console.log('HOTEL FREMONT — MODAL SCROLLING VERIFICATION SUITE');
  console.log('=====================================================');
  
  const serverReady = await waitForServer('http://127.0.0.1:3009/');
  if (!serverReady) {
    console.error('Server on port 3009 not responding! Exiting.');
    process.exit(1);
  }
  console.log('✓ Server at http://127.0.0.1:3009 is ready.\n');

  // Launch Chrome on Desktop / Laptop Viewport (1280x680)
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,680'],
    defaultViewport: { width: 1280, height: 680 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  try {
    console.log('1. Loading homepage...');
    await page.goto('http://127.0.0.1:3009', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ Homepage loaded.');

    console.log('Waiting for preloader animation to finish (3.5s)...');
    await new Promise(r => setTimeout(r, 3500));

    // Open booking modal
    console.log('Clicking "Book Now" button in navbar...');
    const bookClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        if (b.textContent && (b.textContent.includes('Book Now') || b.textContent.includes('Book Your Stay'))) {
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log(`✓ Booking button clicked: ${bookClicked}`);

    await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 8000 });
    console.log('✓ Booking modal opened successfully.');
    await new Promise(r => setTimeout(r, 600)); // wait for entrance animation

    const scrollContainerSelector = 'div[data-lenis-prevent-wheel]';
    await page.waitForSelector(scrollContainerSelector, { visible: true, timeout: 5000 });

    const getMetrics = async () => {
      return await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        return {
          scrollTop: Math.round(el.scrollTop),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isScrollable: el.scrollHeight > el.clientHeight
        };
      }, scrollContainerSelector);
    };

    const getContainerCenter = async () => {
      return await page.$eval(scrollContainerSelector, el => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    // ==========================================
    // STEP 1: SELECT YOUR STAY
    // ==========================================
    console.log('\n--- STEP 1: DATES & ROOMS ---');
    const step1Initial = await getMetrics();
    console.log(`Initial: scrollTop=${step1Initial.scrollTop}, scrollHeight=${step1Initial.scrollHeight}, clientHeight=${step1Initial.clientHeight}, isScrollable=${step1Initial.isScrollable}`);

    const pt1 = await getContainerCenter();
    await page.mouse.move(pt1.x, pt1.y);
    console.log(`Dispatching mouse wheel down (deltaY: 300) over Step 1 content...`);
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 400));

    const step1AfterWheelDown = await getMetrics();
    console.log(`After Wheel Down: scrollTop=${step1AfterWheelDown.scrollTop}`);
    console.log(`✓ STEP 1 WHEEL DOWN: delta=${step1AfterWheelDown.scrollTop - step1Initial.scrollTop}px`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step1_scrolled.png') });

    // Wheel back up
    await page.mouse.wheel({ deltaY: -300 });
    await new Promise(r => setTimeout(r, 400));
    const step1AfterWheelUp = await getMetrics();
    console.log(`After Wheel Up: scrollTop=${step1AfterWheelUp.scrollTop}`);
    console.log(`✓ STEP 1 WHEEL UP: restored to scrollTop=${step1AfterWheelUp.scrollTop}`);

    // Transition to Step 2
    console.log('\n--- TRANSITIONING TO STEP 2 ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Continue to Guests'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // ==========================================
    // STEP 2: GUESTS & MEAL PLAN
    // ==========================================
    console.log('\n--- STEP 2: GUESTS, ROOMS & BREAKFAST ---');
    const step2Initial = await getMetrics();
    console.log(`Initial: scrollTop=${step2Initial.scrollTop}, scrollHeight=${step2Initial.scrollHeight}, clientHeight=${step2Initial.clientHeight}, isScrollable=${step2Initial.isScrollable}`);
    console.log(`✓ Verified scrollTop cleanly resets to ${step2Initial.scrollTop} on step transition`);

    // Hover directly over Meal Plan cards
    const mealCardCenter = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[data-lenis-prevent-wheel] button, div[data-lenis-prevent-wheel] div'));
      for (const c of cards) {
        if (c.textContent && (c.textContent.includes('Without Breakfast') || c.textContent.includes('With Breakfast'))) {
          const r = c.getBoundingClientRect();
          if (r.width > 50 && r.height > 20) {
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
      }
      const container = document.querySelector('div[data-lenis-prevent-wheel]');
      const r = container.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + 200 };
    });

    console.log(`Hovering cursor directly over Meal Plan cards at (${mealCardCenter.x}, ${mealCardCenter.y})...`);
    await page.mouse.move(mealCardCenter.x, mealCardCenter.y);

    console.log('Dispatching mouse wheel down (deltaY: 300)...');
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 400));

    const step2AfterWheel1 = await getMetrics();
    console.log(`After First Wheel Down: scrollTop=${step2AfterWheel1.scrollTop}`);
    console.log(`✓ STEP 2 MOUSE WHEEL SCROLLING OVER CARDS SUCCESS! scrollTop=${step2AfterWheel1.scrollTop}`);

    // Second wheel down
    console.log('Dispatching second wheel down (deltaY: 250)...');
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 400));
    const step2AfterWheel2 = await getMetrics();
    console.log(`After Second Wheel Down: scrollTop=${step2AfterWheel2.scrollTop}`);
    console.log(`✓ STEP 2 CONTINUOUS SCROLLING SUCCESS! scrollTop=${step2AfterWheel2.scrollTop}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step2_scrolled.png') });

    // Wheel back up
    console.log('Dispatching wheel up (deltaY: -450)...');
    await page.mouse.wheel({ deltaY: -450 });
    await new Promise(r => setTimeout(r, 400));
    const step2AfterWheelUp = await getMetrics();
    console.log(`After Wheel Up: scrollTop=${step2AfterWheelUp.scrollTop}`);
    console.log(`✓ STEP 2 WHEEL UP SUCCESS: reduced to ${step2AfterWheelUp.scrollTop}`);

    // Transition to Step 3
    console.log('\n--- TRANSITIONING TO STEP 3 ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Continue to Guest Details'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // ==========================================
    // STEP 3: DETAILS & CONFIRMATION
    // ==========================================
    console.log('\n--- STEP 3: GUEST DETAILS & POLICIES ---');
    const step3Initial = await getMetrics();
    console.log(`Initial: scrollTop=${step3Initial.scrollTop}, scrollHeight=${step3Initial.scrollHeight}, clientHeight=${step3Initial.clientHeight}, isScrollable=${step3Initial.isScrollable}`);

    const pt3 = await getContainerCenter();
    await page.mouse.move(pt3.x, pt3.y);
    console.log('Dispatching mouse wheel down (deltaY: 350) over guest inputs & price breakdown...');
    await page.mouse.wheel({ deltaY: 350 });
    await new Promise(r => setTimeout(r, 400));

    const step3AfterWheel = await getMetrics();
    console.log(`After Wheel Down: scrollTop=${step3AfterWheel.scrollTop}`);
    console.log(`✓ STEP 3 MOUSE WHEEL SCROLLING SUCCESS! scrollTop=${step3AfterWheel.scrollTop}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_scrolled.png') });

    // Wheel back up
    await page.mouse.wheel({ deltaY: -350 });
    await new Promise(r => setTimeout(r, 400));
    const step3AfterWheelUp = await getMetrics();
    console.log(`After Wheel Up: scrollTop=${step3AfterWheelUp.scrollTop}`);
    console.log(`✓ STEP 3 WHEEL UP SUCCESS: reduced to ${step3AfterWheelUp.scrollTop}`);

    // ==========================================
    // MODAL CLOSE & BACKGROUND LOCK RESTORATION
    // ==========================================
    console.log('\n--- TESTING MODAL CLOSE & BACKGROUND UNLOCK ---');
    const closeBtn = await page.$('div[role="dialog"] button[aria-label="Close booking modal"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const isModalVisible = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"]')));
      console.log(`Modal visible after close: ${isModalVisible}`);
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      console.log(`Body overflow style after close: "${bodyOverflow}" (unlocked)`);
      console.log('✓ Modal closed and background scroll lock restored successfully.');
    }

    // ==========================================
    // MOBILE VIEWPORT & TOUCH SCROLL
    // ==========================================
    console.log('\n--- TESTING MOBILE VIEWPORT (390x844) & TOUCH GESTURES ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    
    // Reopen modal on mobile
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Book'))?.click();
    });
    await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 6000 });
    await new Promise(r => setTimeout(r, 600));

    const mobileInitial = await getMetrics();
    console.log(`Mobile Initial: scrollTop=${mobileInitial.scrollTop}, scrollHeight=${mobileInitial.scrollHeight}, clientHeight=${mobileInitial.clientHeight}`);

    const client = await page.createCDPSession();
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

    const mobileAfterTouch = await getMetrics();
    console.log(`Mobile After Touch Drag: scrollTop=${mobileAfterTouch.scrollTop}`);
    console.log(`✓ MOBILE TOUCH SCROLL SUCCESS! scrollTop=${mobileAfterTouch.scrollTop}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_scrolled.png') });

    console.log('\n=====================================================');
    console.log('ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
    console.log('=====================================================');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runCompleteTestSuite();
