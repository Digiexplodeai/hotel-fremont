import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public/assets/screenshots/contact-verification');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verifyContact() {
  console.log('Launching browser for contact audit...');
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });

  // 1. Desktop (1440x900)
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  // Header Phone Link
  const headerPhone = await page.evaluate(() => {
    const link = document.querySelector('header a[href^="tel:"]');
    return link ? { href: link.href, text: link.textContent?.trim(), visible: link.offsetParent !== null } : null;
  });
  console.log('Desktop Header Phone:', headerPhone);

  // Capture Header
  const header = await page.$('header');
  if (header) {
    await header.screenshot({ path: path.join(outDir, 'header-desktop.png') });
    console.log('✅ Captured header-desktop.png');
  }

  // Location / Contact Section
  await page.evaluate(() => {
    const el = document.getElementById('location');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const locationPhone = await page.evaluate(() => {
    const link = document.querySelector('#location a[href^="tel:"]');
    return link ? { href: link.href, text: link.textContent?.trim() } : null;
  });
  console.log('Location Section Phone Link:', locationPhone);

  const locationCard = await page.$('#location');
  if (locationCard) {
    await locationCard.screenshot({ path: path.join(outDir, 'location-section-desktop.png') });
    console.log('✅ Captured location-section-desktop.png');
  }

  // Final CTA Section
  await page.evaluate(() => {
    const link = document.querySelector('a[href^="tel:"][class*="glass-panel"]');
    if (link) link.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const finalCtaPhone = await page.evaluate(() => {
    const link = document.querySelector('a[href^="tel:"][class*="glass-panel"]');
    return link ? { href: link.href, text: link.textContent?.trim() } : null;
  });
  console.log('Final CTA Phone Link:', finalCtaPhone);

  // Footer Section
  await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const footerPhone = await page.evaluate(() => {
    const link = document.querySelector('footer a[href^="tel:"]');
    return link ? { href: link.href, text: link.textContent?.trim() } : null;
  });
  console.log('Footer Phone Link:', footerPhone);

  const footer = await page.$('footer');
  if (footer) {
    await footer.screenshot({ path: path.join(outDir, 'footer-desktop.png') });
    console.log('✅ Captured footer-desktop.png');
  }

  // JSON-LD structured data check
  const jsonLdTel = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return null;
    try {
      const data = JSON.parse(script.textContent || '{}');
      return data.telephone;
    } catch {
      return null;
    }
  });
  console.log('JSON-LD Hotel telephone:', jsonLdTel);

  await page.close();

  // 2. Mobile (390x844)
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3400));

  // Floating mobile bottom bar links
  const mobileBar = await pageMobile.evaluate(() => {
    const callBtn = document.querySelector('div.fixed.bottom-0 a[aria-label="Call Hotel Fremont"]');
    const waBtn = document.querySelector('div.fixed.bottom-0 a[aria-label="WhatsApp Hotel Fremont"]');
    return {
      callHref: callBtn?.getAttribute('href'),
      waHref: waBtn?.getAttribute('href'),
    };
  });
  console.log('Floating Mobile Bottom Bar:', mobileBar);

  const floatingBar = await pageMobile.$('div.fixed.bottom-0');
  if (floatingBar) {
    await floatingBar.screenshot({ path: path.join(outDir, 'floating-bottom-bar-mobile.png') });
    console.log('✅ Captured floating-bottom-bar-mobile.png');
  }

  // Open mobile menu
  const menuBtn = await pageMobile.$('button[aria-label="Open menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const mobileMenuPhone = await pageMobile.evaluate(() => {
      const link = document.querySelector('div.fixed.z-\\[60\\] a[href^="tel:"]');
      return link ? { href: link.href, text: link.textContent?.trim() } : null;
    });
    console.log('Mobile Menu Phone Link:', mobileMenuPhone);
    await pageMobile.screenshot({ path: path.join(outDir, 'mobile-menu-phone.png') });
    console.log('✅ Captured mobile-menu-phone.png');
  }

  await pageMobile.close();
  await browser.close();
  console.log('🎉 Contact verification finished successfully!');
}

verifyContact().catch(console.error);

