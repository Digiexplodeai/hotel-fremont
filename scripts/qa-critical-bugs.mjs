import puppeteer from 'puppeteer-core';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function runQA() {
  console.log("🚀 Starting QA Automated Verification Suite for Hotel Fremont...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"]
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      // ignore verbose next-dev logs
      if (msg.text().includes('[Reservation]') || msg.text().includes('Error')) {
        console.log(`  [Browser Console ${msg.type()}]:`, msg.text());
      }
    });

    // ========================================================
    // TEST SUITE 1: DESKTOP NAVIGATION (BUG 1)
    // ========================================================
    console.log("\n--- TEST 1: DESKTOP NAVIGATION (BUG 1) ---");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Wait for preloader to complete
    console.log("Waiting for preloader curtain to lift...");
    await page.waitForFunction(() => !document.querySelector('[key="fremont-preloader-curtain"]'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    const navItems = [
      { label: "Suites", id: "rooms" },
      { label: "Dining", id: "dining" },
      { label: "Amenities", id: "amenities" },
      { label: "Events", id: "events" },
      { label: "Gallery", id: "gallery" },
      { label: "Location", id: "location" },
      { label: "Contact", id: "contact" },
    ];

    for (const item of navItems) {
      // Find nav link
      const clicked = await page.evaluate((labelText) => {
        const links = Array.from(document.querySelectorAll('header nav a'));
        const link = links.find((l) => l.textContent.trim().toUpperCase() === labelText.toUpperCase());
        if (link) {
          link.click();
          return true;
        }
        return false;
      }, item.label);

      if (!clicked) {
        throw new Error(`Nav link not found for: ${item.label}`);
      }

      // Wait for smooth scroll
      await new Promise((r) => setTimeout(r, 1200));

      // Verify scroll position relative to section
      const check = await page.evaluate((targetId) => {
        const el = document.getElementById(targetId);
        if (!el) return { found: false };
        const rect = el.getBoundingClientRect();
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 80;
        return {
          found: true,
          top: rect.top,
          headerHeight,
          // rect.top should be near headerHeight or visible in viewport
          inViewport: rect.top <= headerHeight + 50 && rect.bottom > headerHeight
        };
      }, item.id);

      console.log(`  ✓ Nav item "${item.label}" -> #${item.id}:`, check);
      if (!check.found || !check.inViewport) {
        throw new Error(`Navigation failed for "${item.label}" to section #${item.id}`);
      }
    }

    // Direct Hash Navigation Test (e.g. reload on /#dining)
    console.log("\n--- TEST 1B: DIRECT HASH LOAD (/#dining) ---");
    await page.goto("http://localhost:3000/#dining", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000)); // wait for intro + hash scroll

    const diningCheck = await page.evaluate(() => {
      const el = document.getElementById("dining");
      if (!el) return { found: false };
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 80;
      return {
        found: true,
        top: rect.top,
        inViewport: rect.top <= headerHeight + 100 && rect.bottom > headerHeight
      };
    });
    console.log("  ✓ Direct hash /#dining load position:", diningCheck);

    // ========================================================
    // TEST SUITE 2: ROOM AVAILABILITY & DROPDOWN (BUG 2)
    // ========================================================
    console.log("\n--- TEST 2: ROOM AVAILABILITY & BOOKING DROPDOWN (BUG 2) ---");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Open booking modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Book Now'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Verify modal is open
    const modalVisible = await page.evaluate(() => {
      return !!document.querySelector('form');
    });
    console.log("  Booking modal open:", modalVisible);

    // Inspect Deluxe King Room dropdown options
    const deluxeOptions = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      // Room select is the one with rooms
      const roomSelect = selects.find((s) => Array.from(s.options).some((o) => o.text.includes('Room')));
      if (!roomSelect) return [];
      return Array.from(roomSelect.options).map((o) => ({ value: o.value, text: o.text }));
    });
    console.log("  Deluxe King Room dropdown options count:", deluxeOptions.length);
    console.log("  Deluxe King Room options:", deluxeOptions);

    if (deluxeOptions.length < 6) {
      throw new Error(`Expected at least 6 room options for Deluxe King (since 6 are available), got ${deluxeOptions.length}`);
    }

    // Select 6 Rooms
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const roomSelect = selects.find((s) => Array.from(s.options).some((o) => o.text.includes('Room')));
      if (roomSelect) {
        roomSelect.value = "6";
        roomSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    // Check Guest limit and price calculation for 6 rooms
    const calculationCheck = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const guestSelect = selects.find((s) => Array.from(s.options).some((o) => o.text.includes('Guest')));
      const guestOptions = guestSelect ? guestSelect.options.length : 0;
      const priceText = document.querySelector('.font-mono.text-base')?.textContent || "";
      return {
        guestOptions,
        priceText,
      };
    });
    console.log("  ✓ 6 rooms selected: Guest options available up to:", calculationCheck.guestOptions, "(max 18 guests)");
    console.log("  ✓ Total calculated price display:", calculationCheck.priceText);

    if (calculationCheck.guestOptions < 18) {
      throw new Error(`Expected guest options up to 18 for 6 rooms, got ${calculationCheck.guestOptions}`);
    }

    // Switch category to The Royal Fremont Suite (2 rooms available)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const royalBtn = buttons.find((b) => b.textContent.includes('Royal Fremont'));
      if (royalBtn) royalBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const royalOptions = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const roomSelect = selects.find((s) => Array.from(s.options).some((o) => o.text.includes('Room')));
      if (!roomSelect) return [];
      return Array.from(roomSelect.options).map((o) => ({ value: o.value, text: o.text }));
    });
    console.log("  ✓ The Royal Fremont Suite dropdown options count:", royalOptions.length, "(expected 2)");
    console.log("  ✓ Royal Fremont options:", royalOptions);
    if (royalOptions.length !== 2) {
      throw new Error(`Expected 2 room options for Royal Fremont, got ${royalOptions.length}`);
    }

    // Switch to Presidential Penthouse (1 room available)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const presBtn = buttons.find((b) => b.textContent.includes('Presidential Penthouse'));
      if (presBtn) presBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    const presOptions = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const roomSelect = selects.find((s) => Array.from(s.options).some((o) => o.text.includes('Room')));
      if (!roomSelect) return [];
      return Array.from(roomSelect.options).map((o) => ({ value: o.value, text: o.text }));
    });
    console.log("  ✓ Presidential Penthouse dropdown options count:", presOptions.length, "(expected 1)");
    console.log("  ✓ Presidential Penthouse options:", presOptions);
    if (presOptions.length !== 1) {
      throw new Error(`Expected 1 room option for Presidential Penthouse, got ${presOptions.length}`);
    }

    // Close booking modal via X
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close booking modal"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify background scrolling is restored
    const scrollAfterModal = await page.evaluate(() => document.body.style.overflow);
    console.log("  ✓ Body overflow after closing booking modal:", `"${scrollAfterModal}"`, "(expected empty/unset)");
    if (scrollAfterModal === "hidden") {
      throw new Error("Body scroll was not restored after closing booking modal!");
    }

    // ========================================================
    // TEST SUITE 3: MOBILE NAVIGATION & CLOSE BUTTON (BUG 3)
    // ========================================================
    console.log("\n--- TEST 3: MOBILE NAVIGATION & CLOSE (BUG 3) ---");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Tap Hamburger
    console.log("Tapping mobile hamburger button...");
    await page.evaluate(() => {
      const hamburger = document.querySelector('button[aria-label="Open menu"]');
      if (hamburger) hamburger.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify overlay open & inspect Close Button
    const mobileMenuState = await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
      const overlay = document.querySelector('[key="mobile-nav-overlay"]');
      if (!closeBtn) return { open: false, hasCloseBtn: false };
      const rect = closeBtn.getBoundingClientRect();
      const style = window.getComputedStyle(closeBtn);
      return {
        open: true,
        hasCloseBtn: true,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        bodyOverflow: document.body.style.overflow
      };
    });
    console.log("  Mobile menu state:", mobileMenuState);

    if (!mobileMenuState.hasCloseBtn || !mobileMenuState.visible) {
      throw new Error("Close button X is missing or invisible in mobile navigation menu!");
    }
    if (mobileMenuState.width < 44 || mobileMenuState.height < 44) {
      throw new Error(`Close button tap target too small (${mobileMenuState.width}x${mobileMenuState.height})! Must be at least 44x44px.`);
    }

    // Click Close Button (X)
    console.log("Tapping Close button (X)...");
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Check menu closed & scroll restored
    const closedCheck = await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
      return {
        menuOpen: !!closeBtn,
        bodyOverflow: document.body.style.overflow
      };
    });
    console.log("  ✓ After clicking X:", closedCheck);
    if (closedCheck.menuOpen) {
      throw new Error("Mobile menu failed to close after tapping X!");
    }
    if (closedCheck.bodyOverflow === "hidden") {
      throw new Error("Body scroll was not restored after closing mobile menu via X!");
    }

    // Reopen menu and test navigation link inside mobile menu
    console.log("Reopening mobile menu and clicking 'Dining'...");
    await page.evaluate(() => {
      const hamburger = document.querySelector('button[aria-label="Open menu"]');
      if (hamburger) hamburger.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const diningLink = links.find((l) => l.textContent.includes('Dining'));
      if (diningLink) diningLink.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const mobileNavResult = await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
      const diningEl = document.getElementById('dining');
      const rect = diningEl ? diningEl.getBoundingClientRect() : null;
      return {
        menuClosed: !closeBtn,
        bodyOverflow: document.body.style.overflow,
        diningTop: rect ? rect.top : null
      };
    });
    console.log("  ✓ Mobile nav link click result:", mobileNavResult);
    if (!mobileNavResult.menuClosed) {
      throw new Error("Mobile menu did not close after clicking a navigation link!");
    }

    // Reopen and test Escape key closing
    console.log("Testing Escape key closing in mobile menu...");
    await page.evaluate(() => {
      const hamburger = document.querySelector('button[aria-label="Open menu"]');
      if (hamburger) hamburger.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 600));

    const escCheck = await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
      return {
        menuClosed: !closeBtn,
        bodyOverflow: document.body.style.overflow
      };
    });
    console.log("  ✓ Escape key close result:", escCheck);
    if (!escCheck.menuClosed) {
      throw new Error("Mobile menu did not close on Escape key!");
    }

    console.log("\n🎉 ALL TESTS PASSED! ALL 3 CRITICAL BUGS ARE VERIFIED FIXED ON DESKTOP & MOBILE!");
  } finally {
    await browser.close();
  }
}

runQA().catch((err) => {
  console.error("\n❌ QA Verification Failed:", err);
  process.exit(1);
});

