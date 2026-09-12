/**
 * Gera os icones placeholder do app: PNGs (janela/tray) e um .ico multi-resolucao
 * (necessario pelo electron-builder para o instalador NSIS do Windows).
 * Ver Fase 7 do planejamento - trocar por um icone definitivo quando houver um desenhado.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(zlib.crc32(crcInput) >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = chunk('IHDR', ihdrData);

  const center = size / 2;
  const radius = size * 0.46;
  const raw = Buffer.alloc(size * (1 + size * 4));

  for (let pixelY = 0; pixelY < size; pixelY++) {
    const rowStart = pixelY * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let pixelX = 0; pixelX < size; pixelX++) {
      const deltaX = pixelX - center + 0.5;
      const deltaY = pixelY - center + 0.5;
      const inCircle = deltaX * deltaX + deltaY * deltaY <= radius * radius;
      const offset = rowStart + 1 + pixelX * 4;
      if (inCircle) {
        raw[offset] = 37; // R
        raw[offset + 1] = 99; // G
        raw[offset + 2] = 235; // B
        raw[offset + 3] = 255; // A
      } else {
        raw[offset] = 0;
        raw[offset + 1] = 0;
        raw[offset + 2] = 0;
        raw[offset + 3] = 0;
      }
    }
  }

  const idatData = zlib.deflateSync(raw);
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Monta um .ico contendo varios frames PNG (formato moderno suportado desde Windows Vista).
 */
function buildIco(sizes) {
  const images = sizes.map((size) => ({ size, data: generatePng(size) }));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffsetStart = headerSize + dirEntrySize * images.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = dataOffsetStart;
  const dirEntries = [];
  images.forEach(({ size, data }) => {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += data.length;
  });

  return Buffer.concat([header, ...dirEntries, ...images.map((image) => image.data)]);
}

const outDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon.png'), generatePng(256));
fs.writeFileSync(path.join(outDir, 'tray-icon.png'), generatePng(32));
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco([16, 32, 48, 64, 128, 256]));

console.log('Icones gerados em assets/icons/ (icon.png, tray-icon.png, icon.ico)');
