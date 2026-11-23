// ScrubPic lossless metadata stripper.
// Removes metadata blocks from JPEG, PNG and WebP files without re-encoding the image.
// Works on a Uint8Array and returns { bytes, removed: [labels] }.

(function (root) {
  "use strict";

  function stripJpeg(b) {
    if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error("Not a JPEG file");
    const out = [b.subarray(0, 2)];
    const removed = [];
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) throw new Error("Damaged JPEG");
      const marker = b[i + 1];
      // Fill bytes
      if (marker === 0xff) { i++; continue; }
      // Start of scan: copy the rest as is (image data + EOI)
      if (marker === 0xda) { out.push(b.subarray(i)); break; }
      // Markers without length
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        out.push(b.subarray(i, i + 2)); i += 2; continue;
      }
      const len = (b[i + 2] << 8) | b[i + 3];
      const seg = b.subarray(i, i + 2 + len);
      const label = jpegLabel(marker, seg);
      if (label) removed.push(label); else out.push(seg);
      i += 2 + len;
    }
    return { bytes: concat(out), removed };
  }

  function ascii(seg, start, n) {
    let s = "";
    for (let k = start; k < Math.min(seg.length, start + n); k++) s += String.fromCharCode(seg[k]);
    return s;
  }

  // Returns a label if the segment is metadata to drop, or null to keep it.
  function jpegLabel(marker, seg) {
    const id = ascii(seg, 4, 30);
    if (marker === 0xe1) {
      if (id.startsWith("Exif")) return "EXIF (camera, date, GPS location)";
      if (id.startsWith("http://ns.adobe.com/xap")) return "XMP (edit history, AI tags)";
      return "APP1 data";
    }
    if (marker === 0xe2) {
      if (id.startsWith("ICC_PROFILE")) return null; // keep colours correct
      return "APP2 data";
    }
    if (marker === 0xeb) return "C2PA / Content Credentials";
    if (marker === 0xed) return "IPTC / Photoshop data";
    if (marker === 0xfe) return "Comment";
    if (marker >= 0xe3 && marker <= 0xef && marker !== 0xee) return "APP" + (marker - 0xe0) + " data";
    return null; // APP0 (JFIF), APP14 (Adobe colour), tables, frame header: keep
  }

  const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  const PNG_DROP = {
    eXIf: "EXIF (camera, date, GPS location)",
    tEXt: "Text data", iTXt: "Text / XMP data", zTXt: "Text data",
    tIME: "Edit time", caBX: "C2PA / Content Credentials"
  };

  function stripPng(b) {
    for (let k = 0; k < 8; k++) if (b[k] !== PNG_SIG[k]) throw new Error("Not a PNG file");
    const out = [b.subarray(0, 8)];
    const removed = [];
    let i = 8;
    while (i + 8 <= b.length) {
      const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
      const type = ascii(b, i + 4, 4);
      const end = i + 12 + len;
      const label = PNG_DROP[type];
      if (label) removed.push(label); else out.push(b.subarray(i, end));
      i = end;
      if (type === "IEND") break;
    }
    return { bytes: concat(out), removed };
  }

  function stripWebp(b) {
    if (ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") throw new Error("Not a WebP file");
    const chunks = [];
    const removed = [];
    let i = 12;
    while (i + 8 <= b.length) {
      const type = ascii(b, i, 4);
      const len = b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24);
      const end = i + 8 + len + (len & 1);
      if (type === "EXIF") removed.push("EXIF (camera, date, GPS location)");
      else if (type === "XMP ") removed.push("XMP (edit history, AI tags)");
      else if (type === "C2PA") removed.push("C2PA / Content Credentials");
      else chunks.push(b.slice(i, Math.min(end, b.length)));
      i = end;
    }
    // Clear EXIF and XMP flags in the VP8X header
    for (const c of chunks) {
      if (ascii(c, 0, 4) === "VP8X") c[8] &= ~(0x08 | 0x04);
    }
    const body = concat(chunks);
    const head = new Uint8Array(12);
    head.set(b.subarray(0, 12));
    const size = body.length + 4;
    head[4] = size & 255; head[5] = (size >> 8) & 255; head[6] = (size >> 16) & 255; head[7] = (size >>> 24) & 255;
    return { bytes: concat([head, body]), removed };
  }

  function concat(parts) {
    let n = 0;
    for (const p of parts) n += p.length;
    const r = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { r.set(p, o); o += p.length; }
    return r;
  }

  function detect(b) {
    if (b[0] === 0xff && b[1] === 0xd8) return "jpeg";
    if (b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) return "png";
    if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
    return null;
  }

  function strip(bytes) {
    const type = detect(bytes);
    if (type === "jpeg") return Object.assign(stripJpeg(bytes), { type });
    if (type === "png") return Object.assign(stripPng(bytes), { type });
    if (type === "webp") return Object.assign(stripWebp(bytes), { type });
    throw new Error("Only JPEG, PNG and WebP are supported here. For HEIC and videos, use scrubpic.com.");
  }

  const api = { strip, detect };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ScrubPic = api;
})(typeof self !== "undefined" ? self : this);
