// Pixel size of a WebP file in public/ (build time only), for srcset width descriptors. No dependencies.
// Handles the three WebP layouts: VP8X (extended), VP8 (lossy), VP8L (lossless). Returns null if unreadable.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The build runs from the project root; import.meta.url would point into Astro's bundled output instead.
const PUBLIC = join(process.cwd(), 'public');

export function webpSize(path) {
  try {
    const b = readFileSync(join(PUBLIC, path));
    if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
  } catch (e) { /* missing file: the caller falls back to a plain src */ }
  return null;
}
