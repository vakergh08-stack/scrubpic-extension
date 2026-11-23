# ScrubPic for Chrome

Remove hidden data from photos before you share them: EXIF (camera, date, GPS location), XMP, IPTC and C2PA / Content Credentials. Works for JPEG, PNG and WebP.

- **Offline.** Everything runs on your computer. No network requests, no uploads, no analytics.
- **No quality loss.** The image is not re-encoded. Only the metadata blocks are cut out; the picture data stays byte-for-byte the same.
- **Keeps colours right.** ICC colour profiles are kept.
- **Small and readable.** About 200 lines of plain JavaScript, no dependencies, no permissions.

## What it removes

| Format | Removed | Kept |
|---|---|---|
| JPEG | APP1 (EXIF, XMP), APP11 (C2PA/JUMBF), APP13 (IPTC/Photoshop), other APPn, comments | JFIF, ICC profile, Adobe colour marker, image data |
| PNG | eXIf, tEXt, iTXt, zTXt, tIME, caBX (C2PA) | everything needed to display the image, including iCCP |
| WebP | EXIF, XMP, C2PA chunks (and their VP8X flags) | image data, ICC, animation |

## Limits

- Removing metadata does not remove visible watermarks or invisible ones (such as Google SynthID) that are part of the pixels.
- Platforms can detect AI images in other ways, and their rules on labelling still apply. Images made by AI should stay labelled.
- HEIC photos and videos are not supported here. For those, and for a full metadata viewer, use [scrubpic.com](https://scrubpic.com/), which also runs in the browser without uploading.

## Install from source

1. Download this repository (Code > Download ZIP) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**.
3. Click **Load unpacked** and choose the folder.
4. Click the ScrubPic icon, then choose or drop photos.

## Files

- `strip.js`: the metadata remover (JPEG, PNG and WebP parsers).
- `clean.html`, `clean.js`: the page that opens when you click the icon.
- `background.js`: opens that page.

## License

MIT. Made by the author of [ScrubPic](https://scrubpic.com/). Written with AI assistance.
