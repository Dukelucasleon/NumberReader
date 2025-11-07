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

  // Step 1: Draw grayscale + contrast + invert for dark backgrounds
  ctx.filter = 'invert(100%) grayscale(100%) brightness(150%) contrast(185%)';
  ctx.drawImage(img, 0, 0);

  // Step 2: Apply basic edge detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const gx =
        -data[i - 4 - width * 4] - 2 * data[i - 4] - data[i - 4 + width * 4] +
        data[i + 4 - width * 4] + 2 * data[i + 4] + data[i + 4 + width * 4];

      const gy =
        -data[i - 4 - width * 4] - 2 * data[i - width * 4] - data[i + 4 - width * 4] +
        data[i - 4 + width * 4] + 2 * data[i + width * 4] + data[i + 4 + width * 4];

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edge = magnitude > 128 ? 0 : 255;

      out[i] = out[i + 1] = out[i + 2] = edge;
      out[i + 3] = 255;
    }
  }

  ctx.putImageData(outputData, 0, 0);
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

  const safeText = data.text.replace(/,/g, '%%');
  const lines = safeText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const merged = mergeSplitNumbers(lines);

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
      i++;
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function formatThousands(numStr) {
  if (numStr.includes(',') || numStr.includes('.')) return numStr;
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
