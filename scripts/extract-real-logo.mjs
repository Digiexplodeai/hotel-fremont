import sharp from 'sharp';
import fs from 'node:fs';

async function extractLogo() {
  const input = sharp('public/assets/raw_user_logo.jpeg');
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // We want to create an RGBA buffer
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  let minX = width, maxX = 0, minY = height, maxY = 0;
  // Also track F icon bounds (leftmost part of the logo before the word "HOTEL")
  let iconMinX = width, iconMaxX = 0, iconMinY = height, iconMaxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const outIdx = (y * width + x) * 4;

      // Identify red logo pixels (The red color of the logo)
      // Usually R is around 180-230, G is 20-50, B is 20-50
      const isRed = r > 120 && (r - g > 50) && (r - b > 50);

      if (isRed) {
        rgbaBuffer[outIdx] = r;
        rgbaBuffer[outIdx + 1] = g;
        rgbaBuffer[outIdx + 2] = b;
        rgbaBuffer[outIdx + 3] = 255;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // F icon is approximately in the first 250 pixels
        if (x < 300) {
          if (x < iconMinX) iconMinX = x;
          if (x > iconMaxX) iconMaxX = x;
          if (y < iconMinY) iconMinY = y;
          if (y > iconMaxY) iconMaxY = y;
        }
      } else {
        // Transparent
        rgbaBuffer[outIdx] = 0;
        rgbaBuffer[outIdx + 1] = 0;
        rgbaBuffer[outIdx + 2] = 0;
        rgbaBuffer[outIdx + 3] = 0;
      }
    }
  }

  console.log(`Logo bounds: x=[${minX}, ${maxX}] (${maxX - minX}px), y=[${minY}, ${maxY}] (${maxY - minY}px)`);
  console.log(`Icon bounds: x=[${iconMinX}, ${iconMaxX}] (${iconMaxX - iconMinX}px), y=[${iconMinY}, ${iconMaxY}] (${iconMaxY - iconMinY}px)`);

  const fullTransparent = sharp(rgbaBuffer, {
    raw: { width, height, channels: 4 }
  });

  // Add a small padding (10px) around bounds
  const pad = 12;
  const cropLeft = Math.max(0, minX - pad);
  const cropTop = Math.max(0, minY - pad);
  const cropWidth = Math.min(width - cropLeft, (maxX - minX) + pad * 2);
  const cropHeight = Math.min(height - cropTop, (maxY - minY) + pad * 2);

  // Crop full logo
  await fullTransparent
    .clone()
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .png()
    .toFile('public/assets/logo.png');

  // Copy to root /assets/logo.png
  await fullTransparent
    .clone()
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .png()
    .toFile('assets/logo.png');

  // Crop F-icon with square padding for favicon and monogram
  const iconPad = 10;
  const iconCropLeft = Math.max(0, iconMinX - iconPad);
  const iconCropTop = Math.max(0, iconMinY - iconPad);
  const iconCropWidth = (iconMaxX - iconMinX) + iconPad * 2;
  const iconCropHeight = (iconMaxY - iconMinY) + iconPad * 2;

  const maxDim = Math.max(iconCropWidth, iconCropHeight);

  await fullTransparent
    .clone()
    .extract({ left: iconCropLeft, top: iconCropTop, width: iconCropWidth, height: iconCropHeight })
    .extend({
      top: Math.floor((maxDim - iconCropHeight) / 2) + 12,
      bottom: Math.ceil((maxDim - iconCropHeight) / 2) + 12,
      left: Math.floor((maxDim - iconCropWidth) / 2) + 12,
      right: Math.ceil((maxDim - iconCropWidth) / 2) + 12,
      background: { r: 14, g: 14, b: 16, alpha: 1 } // Obsidian background for square app icon
    })
    .resize(512, 512)
    .png()
    .toFile('public/assets/f-icon.png');

  // Also make a transparent version of the F icon
  await fullTransparent
    .clone()
    .extract({ left: iconCropLeft, top: iconCropTop, width: iconCropWidth, height: iconCropHeight })
    .png()
    .toFile('public/assets/f-icon-trans.png');

  // Favicon
  await sharp('public/assets/f-icon.png')
    .resize(64, 64)
    .png()
    .toFile('src/app/icon.png');

  console.log('✅ Real Hotel Fremont logo extracted and saved successfully!');
}

extractLogo().catch(console.error);
