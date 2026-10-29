import sharp from 'sharp';

async function extractExactFromRaw() {
  const input = sharp('public/assets/raw_user_logo.jpeg');
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const rgba = Buffer.alloc(width * height * 4);

  let fullMinX = width, fullMaxX = 0, fullMinY = height, fullMaxY = 0;
  let iconMinX = width, iconMaxX = 0, iconMinY = height, iconMaxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const outIdx = (y * width + x) * 4;

      const isRed = r > 105 && (r - g > 40) && (r - b > 40);

      if (isRed) {
        rgba[outIdx] = r;
        rgba[outIdx + 1] = g;
        rgba[outIdx + 2] = b;
        rgba[outIdx + 3] = 255;

        if (x < fullMinX) fullMinX = x;
        if (x > fullMaxX) fullMaxX = x;
        if (y < fullMinY) fullMinY = y;
        if (y > fullMaxY) fullMaxY = y;

        // F icon is strictly x < 240!
        if (x < 240) {
          if (x < iconMinX) iconMinX = x;
          if (x > iconMaxX) iconMaxX = x;
          if (y < iconMinY) iconMinY = y;
          if (y > iconMaxY) iconMaxY = y;
        }
      } else {
        rgba[outIdx] = 0;
        rgba[outIdx + 1] = 0;
        rgba[outIdx + 2] = 0;
        rgba[outIdx + 3] = 0;
      }
    }
  }

  console.log(`FULL LOGO: X: ${fullMinX} to ${fullMaxX} (w=${fullMaxX - fullMinX}), Y: ${fullMinY} to ${fullMaxY} (h=${fullMaxY - fullMinY})`);
  console.log(`F ICON: X: ${iconMinX} to ${iconMaxX} (w=${iconMaxX - iconMinX}), Y: ${iconMinY} to ${iconMaxY} (h=${iconMaxY - iconMinY})`);

  const fullRaw = sharp(rgba, { raw: { width, height, channels: 4 } });

  // 1. Full logo with transparent padding
  const pad = 12;
  const lX = Math.max(0, fullMinX - pad);
  const lY = Math.max(0, fullMinY - pad);
  const lW = Math.min(width - lX, (fullMaxX - fullMinX) + pad * 2);
  const lH = Math.min(height - lY, (fullMaxY - fullMinY) + pad * 2);

  await fullRaw
    .clone()
    .extract({ left: lX, top: lY, width: lW, height: lH })
    .png()
    .toFile('public/assets/logo.png');

  await fullRaw
    .clone()
    .extract({ left: lX, top: lY, width: lW, height: lH })
    .png()
    .toFile('assets/logo.png');

  // 2. F icon with transparent padding
  const iPad = 12;
  const iX = Math.max(0, iconMinX - iPad);
  const iY = Math.max(0, iconMinY - iPad);
  const iW = (iconMaxX - iconMinX) + iPad * 2;
  const iH = (iconMaxY - iconMinY) + iPad * 2;

  // Standalone transparent F icon
  await fullRaw
    .clone()
    .extract({ left: iX, top: iY, width: iW, height: iH })
    .png()
    .toFile('public/assets/f-icon-trans.png');

  // Square app icon with elegant obsidian background and centered F icon
  const iMax = Math.max(iW, iH);
  await fullRaw
    .clone()
    .extract({ left: iX, top: iY, width: iW, height: iH })
    .extend({
      top: Math.floor((iMax - iH) / 2) + 20,
      bottom: Math.ceil((iMax - iH) / 2) + 20,
      left: Math.floor((iMax - iW) / 2) + 20,
      right: Math.ceil((iMax - iW) / 2) + 20,
      background: { r: 14, g: 14, b: 16, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile('public/assets/f-icon.png');

  await sharp('public/assets/f-icon.png')
    .resize(64, 64)
    .png()
    .toFile('src/app/icon.png');

  console.log('✅ Extracted full logo and exact F icon cleanly!');
}

extractExactFromRaw().catch(console.error);
