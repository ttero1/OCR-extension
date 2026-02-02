# Clipboard OCR Extension

A lightweight browser extension that turns clipboard images into text using Tesseract.js. Open the popup, paste an image, and copy the recognized text.

## Features

- Paste images directly from the clipboard (Ctrl/Cmd + V).
- Real-time OCR progress updates in the popup.
- One-click copy and clear actions for extracted text.
- Uses hosted language data from `tessdata.projectnaptha.com` to avoid bundling large files.

## Installation (Unpacked)

> **Note:** The extension uses the `browser.*` API and is tested in Firefox. If you use Chromium-based browsers, ensure `browser` APIs are supported (for example via a polyfill).

1. Clone or download this repository.
2. Open your browser’s extensions page.
   - Firefox: `about:debugging#/runtime/this-firefox`
   - Chromium: `chrome://extensions`
3. Enable **Developer mode** (Chromium) or **This Firefox** (Firefox).
4. Click **Load Temporary Add-on** (Firefox) or **Load unpacked** (Chromium).
5. Select the project folder.

## Usage

1. Click the **Clipboard OCR** extension icon.
2. Click inside the dashed drop area.
3. Paste an image from your clipboard (Ctrl/Cmd + V).
4. Wait for the OCR to finish; text appears in the textarea.
5. Use **Copy text** to copy results or **Clear** to reset.

## Permissions

- `https://tessdata.projectnaptha.com/*` — downloads OCR language data.

## Project Structure

- `popup.html` / `popup.js` — extension UI and OCR flow.
- `lib/` — bundled Tesseract.js assets.
- `ocr-worker.js` — worker-based OCR helper (available for alternate flows).

## Troubleshooting

- If the OCR hangs at loading, check network access to `tessdata.projectnaptha.com`.
- If the clipboard doesn’t paste, ensure you clicked inside the drop area before pasting.

## License

No license has been specified yet.
