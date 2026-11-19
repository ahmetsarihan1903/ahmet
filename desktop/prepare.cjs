const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootDist = path.join(rootDir, 'dist');
const desktopDist = path.join(__dirname, 'dist');
const svgPath = path.join(rootDir, 'public', 'beta-logo.svg');
const pngOutPath = path.join(__dirname, 'icon.png');
const icoOutPath = path.join(__dirname, 'icon.ico');

// 1. Copy built dist/ into desktop/dist/
if (!fs.existsSync(rootDist)) {
  console.error('HATA: Root dist/ klasoru bulunamadi. Once ana dizinde "npm run build" calistirin.');
  process.exit(1);
}

fs.rmSync(desktopDist, { recursive: true, force: true });
fs.cpSync(rootDist, desktopDist, { recursive: true });
console.log('dist/ klasoru desktop/dist/ icine kopyalandi.');

// 2. Generate 256x256 PNG and valid Windows .ico from public/beta-logo.svg using sharp (from root node_modules)
async function buildIcons() {
  if (!fs.existsSync(svgPath)) {
    console.warn('Uyari: public/beta-logo.svg bulunamadi, ikon olusturma atlandi.');
    return;
  }

  let sharp;
  try {
    sharp = require(path.join(rootDir, 'node_modules', 'sharp'));
  } catch {
    try {
      sharp = require('sharp');
    } catch {
      console.warn('Uyari: sharp paketi bulunamadi. Ikon olusturma atlandi.');
      return;
    }
  }

  const pngBuffer = await sharp(svgPath)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 136, b: 206, alpha: 1 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(pngOutPath, pngBuffer);

  // Build single-image 256x256 PNG-compressed .ico file (supported by Windows Vista+ & electron-builder)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Image count: 1

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width: 0 means 256px
  dirEntry.writeUInt8(0, 1); // Height: 0 means 256px
  dirEntry.writeUInt8(0, 2); // Color palette: 0
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of PNG data
  dirEntry.writeUInt32LE(22, 12); // Offset = 6 + 16 = 22

  const icoBuffer = Buffer.concat([header, dirEntry, pngBuffer]);
  fs.writeFileSync(icoOutPath, icoBuffer);
  console.log('Windows icon.png ve icon.ico basariyla olusturuldu.');
}

buildIcons().catch((err) => {
  console.error('Ikon olusturma hatasi:', err);
  process.exit(1);
});
