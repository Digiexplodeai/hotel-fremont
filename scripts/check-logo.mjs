import sharp from 'sharp';

async function check() {
  const image = sharp('public/assets/raw_user_logo.jpeg');
  const meta = await image.metadata();
  console.log('Image dimensions:', meta.width, 'x', meta.height, 'channels:', meta.channels);
}

check();
