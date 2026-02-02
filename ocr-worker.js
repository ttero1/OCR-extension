// ocr-worker.js (Tesseract.js v5+)
let TesseractLoaded = false;
let tWorker = null;
let currentLang = null;

function sendError(err, context) {
  const msg =
    (context ? `[${context}] ` : "") +
    (err?.message ?? String(err)) +
    (err?.stack ? `\n${err.stack}` : "");
  self.postMessage({ type: "error", error: msg });
}

self.addEventListener("error", (e) => {
  sendError(
    new Error(`Worker runtime error: ${e.message || "unknown"} (${e.filename || "?"}:${e.lineno || "?"})`),
    "error"
  );
});

self.addEventListener("unhandledrejection", (e) => {
  sendError(e.reason, "unhandledrejection");
});

async function ensureTesseract(paths, lang) {
  if (!TesseractLoaded) {
    try {
      importScripts(paths.tesseractScript);
      TesseractLoaded = true;
      
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract object not found after importScripts');
      }
    } catch (e) {
      throw new Error(`importScripts failed: ${e?.message ?? String(e)}`);
    }
  }

  if (!tWorker) {
    try {
      tWorker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m?.status) {
            self.postMessage({
              type: "progress",
              status: m.status,
              progress: typeof m.progress === "number" ? m.progress : 0
            });
          }
        },
        workerPath: paths.workerPath,
        corePath: paths.corePath,
        langPath: paths.langPath
      });
      currentLang = lang;
    } catch (e) {
      throw new Error(`createWorker failed: ${e?.message ?? String(e)} | Stack: ${e?.stack ?? 'no stack'}`);
    }
  } else if (currentLang !== lang) {
    await tWorker.reinitialize(lang);
    currentLang = lang;
  }
}

async function bufferToImageData(imageBuffer, mime) {
  try {
    const blob = new Blob([imageBuffer], { type: mime || "image/png" });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  } catch (e) {
    throw new Error(`bufferToImageData failed: ${e?.message ?? String(e)}`);
  }
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (!msg || msg.type !== "ocr") return;
  
  try {
    const { imageBuffer, mime, lang, paths } = msg;
    
    if (!imageBuffer) {
      throw new Error('No imageBuffer provided');
    }
    
    if (!paths?.tesseractScript || !paths?.workerPath || !paths?.corePath || !paths?.langPath) {
      throw new Error(`Missing paths: ${JSON.stringify(paths)}`);
    }
    
    const useLang = lang || "eng";
    
    self.postMessage({ type: "progress", status: "Initializing OCR…", progress: 0 });
    await ensureTesseract(paths, useLang);
    
    self.postMessage({ type: "progress", status: "Decoding image…", progress: 0 });
    const imageData = await bufferToImageData(imageBuffer, mime);
    
    self.postMessage({ type: "progress", status: "Recognizing text…", progress: 0 });
    const result = await tWorker.recognize(imageData);
    
    self.postMessage({ type: "result", text: result?.data?.text || "" });
  } catch (err) {
    sendError(err, "ocr");
  }
};