import sharp from 'sharp';

async function cropIcon() {
  const image = sharp('public/assets/logo.png');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const colAlpha = [];
  for (let x = 0; x < info.width; x++) {
    let sum = 0;
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > 0) sum++;
    }
    colAlpha.push(sum);
  }

  // Find first gap of 0s after x > 40
  let gapStart = -1, gapEnd = -1;
  for (let x = 40; x < 300; x++) {
    if (colAlpha[x] === 0 && gapStart === -1) gapStart = x;
    if (colAlpha[x] > 0 && gapStart !== -1 && gapEnd === -1) {
      gapEnd = x;
      break;
    }
  }

  console.log(`F ends at ${gapStart}, H starts at ${gapEnd}, total width: ${info.width}`);

  // The F icon is from x: 0 to gapStart
  // Find top and bottom bounds of F icon
  let topY = info.height, botY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x <= gapStart; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 0) {
        if (y < topY) topY = y;
        if (y > botY) botY = y;
      }
    }
  }

  const iconW = gapStart;
  const iconH = botY - topY;
  console.log(`F bounds: width=${iconW}, height=${iconH}`);

  // Extract F icon with square padding and rounded dark background
  const maxDim = Math.max(iconW, iconH);
  const pad = 24;

  await sharp('public/assets/logo.png')
    .extract({ left: 0, top: topY, width: iconW, height: iconH })
    .extend({
      top: Math.floor((maxDim - iconH) / 2) + pad,
      bottom: Math.ceil((maxDim - iconH) / 2) + pad,
      left: Math.floor((maxDim - iconW) / 2) + pad,
      right: Math.ceil((maxDim - iconW) / 2) + pad,
      background: { r: 14, g: 14, b: 16, alpha: 1 } // #0E0E10
    })
    .resize(512, 512)
    .png()
    .toFile('public/assets/f-icon.png');

  // Transparent standalone F icon
  await sharp('public/assets/logo.png')
    .extract({ left: 0, top: topY, width: iconW, height: iconH })
    .png()
    .toFile('public/assets/f-icon-trans.png');

  // App icon & favicon
  await sharp('public/assets/f-icon.png')
    .resize(64, 64)
    .png()
    .toFile('src/app/icon.png');

  console.log('✅ Cropped complete F icon successfully!');
}

cropIcon().catch(console.error);
