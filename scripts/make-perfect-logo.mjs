import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function makePerfectLogo() {
  const input = sharp('public/assets/raw_user_logo.jpeg');
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const rgba = Buffer.alloc(width * height * 4);

  let fullMinX = width, fullMaxX = 0, fullMinY = height, fullMaxY = 0;
  let iconMinX = width, iconMaxX = 0, iconMinY = height, iconMaxY = 0;

  // Exact solid red values from the original branding
  const targetR = 224;
  const targetG = 43;
  const targetB = 29;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const outIdx = (y * width + x) * 4;

      // Check if pixel is part of the red logo
      // In raw JPEG, red pixels have high R and significantly lower G and B
      const isRedCandidate = (r - g > 25) && (r - b > 25) && r > 90;

      if (isRedCandidate) {
        // Calculate smooth alpha based on how far G/B have dropped from background 255 towards target 43
        const avgGB = (g + b) / 2;
        // Background white has avgGB = 255. Solid red has avgGB ~ 43.
        const rawAlpha = (255 - avgGB) / (255 - 43);
        const alpha = Math.min(255, Math.max(0, Math.round(rawAlpha * 255)));

        // Set RGB to pristine red color, eliminating any JPEG white fringing
        rgba[outIdx] = targetR;
        rgba[outIdx + 1] = targetG;
        rgba[outIdx + 2] = targetB;
        rgba[outIdx + 3] = alpha;

        // Bounding box only counts pixels with non-trivial alpha
        if (alpha > 40) {
          if (x < fullMinX) fullMinX = x;
          if (x > fullMaxX) fullMaxX = x;
          if (y < fullMinY) fullMinY = y;
          if (y > fullMaxY) fullMaxY = y;

          // The 'F' icon is on the left (x < 240)
          if (x < 240) {
            if (x < iconMinX) iconMinX = x;
            if (x > iconMaxX) iconMaxX = x;
            if (y < iconMinY) iconMinY = y;
            if (y > iconMaxY) iconMaxY = y;
          }
        }
      } else {
        rgba[outIdx] = 0;
        rgba[outIdx + 1] = 0;
        rgba[outIdx + 2] = 0;
        rgba[outIdx + 3] = 0;
      }
    }
  }

  console.log(`FULL LOGO BOUNDS: X: ${fullMinX}..${fullMaxX} (w=${fullMaxX - fullMinX + 1}), Y: ${fullMinY}..${fullMaxY} (h=${fullMaxY - fullMinY + 1})`);
  console.log(`F ICON BOUNDS: X: ${iconMinX}..${iconMaxX} (w=${iconMaxX - iconMinX + 1}), Y: ${iconMinY}..${iconMaxY} (h=${iconMaxY - iconMinY + 1})`);

  const fullRaw = sharp(rgba, { raw: { width, height, channels: 4 } });

  // 1. Full horizontal logo (tight crop with small 4px padding for clean anti-aliasing)
  const pad = 4;
  const lX = Math.max(0, fullMinX - pad);
  const lY = Math.max(0, fullMinY - pad);
  const lW = Math.min(width - lX, (fullMaxX - fullMinX + 1) + pad * 2);
  const lH = Math.min(height - lY, (fullMaxY - fullMinY + 1) + pad * 2);

  const logoDir = path.resolve('public/assets/logo');
  if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

  const rootLogoDir = path.resolve('assets/logo');
  if (!fs.existsSync(rootLogoDir)) fs.mkdirSync(rootLogoDir, { recursive: true });

  // Save to all requested paths:
  // - public/assets/logo.png
  // - assets/logo.png
  // - public/assets/logo/hotel-fremont-logo.png
  // - assets/logo/hotel-fremont-logo.png
  const extractedLogo = fullRaw.clone().extract({ left: lX, top: lY, width: lW, height: lH });

  await extractedLogo.png().toFile('public/assets/logo.png');
  await extractedLogo.png().toFile('assets/logo.png');
  await extractedLogo.png().toFile('public/assets/logo/hotel-fremont-logo.png');
  await extractedLogo.png().toFile('assets/logo/hotel-fremont-logo.png');

  // 2. F Icon standalone transparent
  const iPad = 4;
  const iX = Math.max(0, iconMinX - iPad);
  const iY = Math.max(0, iconMinY - iPad);
  const iW = Math.min(width - iX, (iconMaxX - iconMinX + 1) + iPad * 2);
  const iH = Math.min(height - iY, (iconMaxY - iconMinY + 1) + iPad * 2);

  const extractedIcon = fullRaw.clone().extract({ left: iX, top: iY, width: iW, height: iH });
  await extractedIcon.png().toFile('public/assets/f-icon-trans.png');

  // 3. App icon (square 512x512 on #0E0E10 background with centered F icon)
  const iMax = Math.max(iW, iH);
  await fullRaw
    .clone()
    .extract({ left: iX, top: iY, width: iW, height: iH })
    .extend({
      top: Math.floor((iMax - iH) / 2) + 24,
      bottom: Math.ceil((iMax - iH) / 2) + 24,
      left: Math.floor((iMax - iW) / 2) + 24,
      right: Math.ceil((iMax - iW) / 2) + 24,
      background: { r: 14, g: 14, b: 16, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile('public/assets/f-icon.png');

  // Next.js app icons
  await sharp('public/assets/f-icon.png')
    .resize(64, 64)
    .png()
    .toFile('src/app/icon.png');

  await sharp('public/assets/f-icon.png')
    .resize(180, 180)
    .png()
    .toFile('src/app/apple-icon.png');

  await sharp('public/assets/f-icon.png')
    .resize(48, 48)
    .png()
    .toFile('public/favicon.ico');

  console.log('✅ Generated pristine logo and icons successfully!');
}

makePerfectLogo().catch(console.error);

