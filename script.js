const imageInput = document.getElementById('imageInput');
const pasteZone = document.getElementById('pasteZone');
const output = document.getElementById('output');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    await handleImage(file);
  }
});

pasteZone.addEventListener('paste', async (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      await handleImage(blob);
      break;
    }
  }
});

async function handleImage(blob) {
  const img = await createImageBitmap(blob);
  preprocessImage(img);
  const processedBlob = await canvasToBlob(canvas);
  await runOCR(processedBlob);
}

function preprocessImage(img) {
  canvas.width = img.width;
  canvas.height = img.height;

  // Invert + grayscale + enhance contrast for better OCR on dark backgrounds
  ctx.filter = 'invert(100%) grayscale(100%) brightness(150%) contrast(185%)';
  ctx.drawImage(img, 0, 0);
}

async function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function runOCR(imageBlob) {
  output.textContent = 'Processing...';

  const { data } = await Tesseract.recognize(imageBlob, 'eng', {
    logger: m => console.log(m),
    config: {
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: '0123456789.,'
    }
  });

  // Replace commas with placeholder to preserve them through line splitting
  const safeText = data.text.replace(/,/g, '%%');

  // Split into lines and clean
  const lines = safeText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  // Merge split numbers like "1" + "024" into "1,024"
  const merged = mergeSplitNumbers(lines);

  // Restore commas and format
  const formatted = merged.map(num => {
    const restored = num.replace(/%%/g, ',');
    return formatThousands(restored);
  });

  output.textContent = formatted.join('\n');
}

function mergeSplitNumbers(lines) {
  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];
    if (/^\d+$/.test(current) && /^\d{3}$/.test(next)) {
      merged.push(`${current},${next}`);
      i++; // skip next
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function formatThousands(numStr) {
  // Skip reformatting if already contains commas or decimals
  if (numStr.includes(',') || numStr.includes('.')) return numStr;
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
