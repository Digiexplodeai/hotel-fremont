import sharp from 'sharp';

async function scan() {
  const input = sharp('public/assets/raw_user_logo.jpeg');
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let x = 0; x < 200; x += 10) {
    let redCount = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > 100 && r - g > 30 && r - b > 30) redCount++;
    }
    if (redCount > 0) console.log(`x=${x}, redCount=${redCount}`);
  }
}
scan();
