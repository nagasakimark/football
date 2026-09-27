// ============================================================
//  Tiny animated-GIF decoder so goalkeeper GIFs animate on canvas
//  (canvas drawImage() only ever shows a GIF's first frame).
// ============================================================
'use strict';

const GifDecoder = (() => {
  function lzwDecode(minCodeSize, data, pixelCount) {
    const out = new Uint8Array(pixelCount);
    const clear = 1 << minCodeSize;
    const eoi = clear + 1;
    const prefix = new Int16Array(4096);
    const suffix = new Uint8Array(4096);
    const stack = new Uint8Array(4097);
    for (let i = 0; i < clear; i++) { prefix[i] = -1; suffix[i] = i; }

    let codeSize = minCodeSize + 1;
    let codeMask = (1 << codeSize) - 1;
    let next = eoi + 1;
    let old = -1, first = 0, datum = 0, bits = 0, pos = 0, op = 0, sp = 0;

    while (op < pixelCount) {
      if (sp === 0) {
        while (bits < codeSize) {
          if (pos >= data.length) return out;
          datum |= data[pos++] << bits;
          bits += 8;
        }
        let code = datum & codeMask;
        datum >>= codeSize;
        bits -= codeSize;

        if (code === clear) {
          codeSize = minCodeSize + 1;
          codeMask = (1 << codeSize) - 1;
          next = eoi + 1;
          old = -1;
          continue;
        }
        if (code === eoi) break;
        if (old === -1) {
          stack[sp++] = suffix[code];
          old = code;
          first = code;
          continue;
        }
        const inCode = code;
        if (code >= next) { stack[sp++] = first; code = old; }
        while (code > clear) { stack[sp++] = suffix[code]; code = prefix[code]; }
        first = suffix[code];
        stack[sp++] = first;
        if (next < 4096) {
          prefix[next] = old;
          suffix[next] = first;
          next++;
          if ((next & codeMask) === 0 && next < 4096) { codeSize++; codeMask += next; }
        }
        old = inCode;
      }
      out[op++] = stack[--sp];
    }
    return out;
  }

  function readColorTable(bytes, p, size) {
    const t = new Uint8Array(size * 3);
    t.set(bytes.subarray(p, p + size * 3));
    return t;
  }

  function readSubBlocks(bytes, p) {
    const chunks = [];
    let total = 0;
    while (p < bytes.length) {
      const len = bytes[p++];
      if (len === 0) break;
      chunks.push(bytes.subarray(p, p + len));
      total += len;
      p += len;
    }
    const data = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) { data.set(c, o); o += c.length; }
    return { data, next: p };
  }

  function deinterlace(pixels, w, h) {
    const out = new Uint8Array(pixels.length);
    const passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
    let src = 0;
    for (const [start, step] of passes) {
      for (let y = start; y < h; y += step) {
        out.set(pixels.subarray(src, src + w), y * w);
        src += w;
      }
    }
    return out;
  }

  // Returns { width, height, frames: [canvas], delays: [ms] } with frames scaled to fit maxSize.
  async function decode(buffer, maxSize) {
    const bytes = new Uint8Array(buffer);
    const sig = String.fromCharCode(...bytes.subarray(0, 3));
    if (sig !== 'GIF') throw new Error('Not a GIF');
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    const packed = bytes[10];
    let p = 13;
    let gct = null;
    if (packed & 0x80) {
      const size = 1 << ((packed & 7) + 1);
      gct = readColorTable(bytes, p, size);
      p += size * 3;
    }

    const scale = Math.min(1, maxSize / Math.max(width, height));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const work = document.createElement('canvas');
    work.width = width; work.height = height;
    const wctx = work.getContext('2d');
    const image = wctx.createImageData(width, height);
    const buf = image.data;
    let saved = null;

    const frames = [];
    const delays = [];
    let gce = { disposal: 0, delay: 0, transparent: -1 };
    let prev = null; // { disposal, x, y, w, h }

    while (p < bytes.length) {
      const block = bytes[p++];
      if (block === 0x3B) break;
      if (block === 0x21) {
        const label = bytes[p++];
        if (label === 0xF9) {
          const len = bytes[p];
          const flags = bytes[p + 1];
          gce = {
            disposal: (flags >> 2) & 7,
            delay: (bytes[p + 2] | (bytes[p + 3] << 8)) * 10,
            transparent: (flags & 1) ? bytes[p + 4] : -1
          };
          p += len + 1;
          p = readSubBlocks(bytes, p).next;
        } else {
          p = readSubBlocks(bytes, p).next;
        }
        continue;
      }
      if (block !== 0x2C) break;

      const fx = bytes[p] | (bytes[p + 1] << 8);
      const fy = bytes[p + 2] | (bytes[p + 3] << 8);
      const fw = bytes[p + 4] | (bytes[p + 5] << 8);
      const fh = bytes[p + 6] | (bytes[p + 7] << 8);
      const fpacked = bytes[p + 8];
      p += 9;
      let table = gct;
      if (fpacked & 0x80) {
        const size = 1 << ((fpacked & 7) + 1);
        table = readColorTable(bytes, p, size);
        p += size * 3;
      }
      const interlaced = !!(fpacked & 0x40);
      const minCode = bytes[p++];
      const sub = readSubBlocks(bytes, p);
      p = sub.next;

      // Dispose of the previous frame
      if (prev) {
        if (prev.disposal === 2) {
          for (let y = prev.y; y < prev.y + prev.h && y < height; y++) {
            const row = y * width;
            for (let x = prev.x; x < prev.x + prev.w && x < width; x++) {
              const i = (row + x) * 4;
              buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
            }
          }
        } else if (prev.disposal === 3 && saved) {
          buf.set(saved);
        }
      }
      if (gce.disposal === 3) saved = new Uint8ClampedArray(buf);

      let pixels = lzwDecode(minCode, sub.data, fw * fh);
      if (interlaced) pixels = deinterlace(pixels, fw, fh);
      const tr = gce.transparent;
      if (table) {
        for (let y = 0; y < fh; y++) {
          const dy = fy + y;
          if (dy >= height) break;
          for (let x = 0; x < fw; x++) {
            const dx = fx + x;
            if (dx >= width) continue;
            const ci = pixels[y * fw + x];
            if (ci === tr) continue;
            const i = (dy * width + dx) * 4;
            buf[i] = table[ci * 3];
            buf[i + 1] = table[ci * 3 + 1];
            buf[i + 2] = table[ci * 3 + 2];
            buf[i + 3] = 255;
          }
        }
      }

      wctx.putImageData(image, 0, 0);
      const fc = document.createElement('canvas');
      fc.width = outW; fc.height = outH;
      const fctx = fc.getContext('2d');
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(work, 0, 0, outW, outH);
      frames.push(fc);
      delays.push(gce.delay >= 20 ? gce.delay : 100);

      prev = { disposal: gce.disposal, x: fx, y: fy, w: fw, h: fh };
      gce = { disposal: 0, delay: 0, transparent: -1 };

      // Keep the game smooth while decoding big GIFs
      if (frames.length % 6 === 0) await new Promise(r => setTimeout(r, 0));
    }

    return { width: outW, height: outH, frames, delays };
  }

  return { decode };
})();
