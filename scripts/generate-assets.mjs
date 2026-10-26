import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicAssetsDir = path.resolve('public/assets');
const rootAssetsDir = path.resolve('assets');
const appDir = path.resolve('src/app');

fs.mkdirSync(publicAssetsDir, { recursive: true });
fs.mkdirSync(rootAssetsDir, { recursive: true });
fs.mkdirSync(appDir, { recursive: true });

// SVG for the full Hotel Fremont Logo: Red stylised "F" icon + bold wide red "HOTEL FREMONT" wordmark
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200" fill="none">
  <!-- Stylised Architectural F Icon -->
  <g transform="translate(40, 25)">
    <!-- Primary vertical spine -->
    <path d="M 15 15 L 45 15 L 45 135 L 15 135 Z" fill="#E02B1D" />
    
    <!-- Top horizontal flourish with angled cut -->
    <path d="M 45 15 L 125 15 L 110 45 L 45 45 Z" fill="#E02B1D" />
    
    <!-- Mid horizontal bar with geometric notch -->
    <path d="M 45 65 L 105 65 L 92 92 L 45 92 Z" fill="#E02B1D" />

    <!-- Accent floating geometric diamond/finial representing 5-star pinnacle -->
    <polygon points="120,40 135,15 145,28 130,52" fill="#E02B1D" opacity="0.9" />

    <!-- Subtle champagne gold fine accent line -->
    <line x1="15" y1="145" x2="135" y2="145" stroke="#C9A96E" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Wordmark: Bold Wide Red "HOTEL FREMONT" -->
  <text x="210" y="96" 
        font-family="'Playfair Display', 'Cinzel', 'Times New Roman', Georgia, serif" 
        font-size="44" 
        font-weight="800" 
        letter-spacing="9" 
        fill="#E02B1D">HOTEL FREMONT</text>
        
  <!-- Sub-caption: Luxury Boutique Hospitality Mohali -->
  <text x="215" y="132" 
        font-family="'Inter', -apple-system, sans-serif" 
        font-size="14" 
        font-weight="500" 
        letter-spacing="7" 
        fill="#C9A96E">LUXURY BOUTIQUE &#8226; MOHALI</text>
</svg>`;

// Cropped F-Icon for Favicon and App Icon
const fIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" fill="none">
  <rect width="200" height="200" rx="36" fill="#0E0E10" />
  <g transform="translate(32, 26)">
    <!-- Vertical spine -->
    <path d="M 15 15 L 45 15 L 45 135 L 15 135 Z" fill="#E02B1D" />
    <!-- Top bar -->
    <path d="M 45 15 L 125 15 L 110 45 L 45 45 Z" fill="#E02B1D" />
    <!-- Mid bar -->
    <path d="M 45 65 L 105 65 L 92 92 L 45 92 Z" fill="#E02B1D" />
    <!-- Accent finial -->
    <polygon points="120,40 135,15 145,28 130,52" fill="#E02B1D" opacity="0.9" />
    <!-- Fine gold line -->
    <line x1="15" y1="145" x2="135" y2="145" stroke="#C9A96E" stroke-width="3" stroke-linecap="round" />
  </g>
</svg>`;

// Write SVGs
fs.writeFileSync(path.join(publicAssetsDir, 'logo.svg'), logoSvg);
fs.writeFileSync(path.join(publicAssetsDir, 'f-icon.svg'), fIconSvg);

// Generate high-resolution PNGs
async function generatePngs() {
  const logoBuffer = Buffer.from(logoSvg);
  const fIconBuffer = Buffer.from(fIconSvg);

  await sharp(logoBuffer)
    .resize(1600, 400)
    .png()
    .toFile(path.join(publicAssetsDir, 'logo.png'));

  // Copy to root /assets/logo.png as required
  await sharp(logoBuffer)
    .resize(1600, 400)
    .png()
    .toFile(path.join(rootAssetsDir, 'logo.png'));

  // F-icon PNG
  await sharp(fIconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicAssetsDir, 'f-icon.png'));

  // Next.js app icon
  await sharp(fIconBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(appDir, 'icon.png'));

  // Also public favicon
  await sharp(fIconBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicAssetsDir, 'favicon.ico'));

  console.log('✅ Hotel Fremont branding assets generated successfully!');
}

generatePngs().catch(console.error);
