(() => {
  const drop = document.getElementById("drop");
  const out = document.getElementById("out");
  const statusEl = document.getElementById("status");
  const copyBtn = document.getElementById("copy");
  const clearBtn = document.getElementById("clear");

  let worker = null;

  function setStatus(s) {
    statusEl.textContent = s || "";
  }

  async function initWorker() {
    if (worker) return worker;

    setStatus("Loading OCR engine...");
    
    worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setStatus(`Recognizing... ${Math.round(m.progress * 100)}%`);
        } else {
          setStatus(m.status);
        }
      },
      workerPath: browser.runtime.getURL('lib/worker.min.js'),
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: browser.runtime.getURL('lib/tesseract-core.wasm.js'),
    });

    return worker;
  }

  drop.addEventListener("click", () => drop.focus());
  
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(out.value || "");
      setStatus("Copied!");
    } catch (err) {
      setStatus(`Copy failed: ${err?.message ?? String(err)}`);
    }
  });

  clearBtn?.addEventListener("click", () => {
    out.value = "";
    setStatus("");
  });

  async function handleImageBlob(blob) {
    if (!blob) {
      setStatus("No image received.");
      return;
    }

    try {
      out.value = "";
      const w = await initWorker();
      
      const { data: { text } } = await w.recognize(blob);
      out.value = text;
      setStatus("Done!");
    } catch (err) {
      setStatus(`Error: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  drop.addEventListener("paste", async (event) => {
    try {
      const dt = event.clipboardData;
      const items = dt?.items ? Array.from(dt.items) : [];
      
      if (items.length === 0) {
        setStatus("Clipboard is empty.");
        return;
      }

      const imgItem = items.find((it) => it.type && it.type.startsWith("image/"));
      
      if (!imgItem) {
        const files = dt?.files ? Array.from(dt.files) : [];
        const imgFile = files.find((f) => f.type && f.type.startsWith("image/"));
        
        if (!imgFile) {
          setStatus("No image in clipboard.");
          return;
        }
        
        await handleImageBlob(imgFile);
        return;
      }

      const blob = imgItem.getAsFile();
      if (!blob) {
        setStatus("Could not read clipboard image.");
        return;
      }

      await handleImageBlob(blob);
    } catch (err) {
      setStatus(`Error: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  });
})();