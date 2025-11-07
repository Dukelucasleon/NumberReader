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

  // Draw grayscale image with enhanced contrast
  ctx.filter = 'grayscale(100%) brightness(150%) contrast(185%)';
  ctx.drawImage(img, 0, 0);
}

async function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function runOCR(imageBlob) {
  output.textContent = 'Processing...';

  const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng', {
    logger: m => console.log(m),
    tessedit_char_whitelist: '0123456789.,'
  });

  // Replace commas with placeholder to preserve them through line splitting
  const safeText = text.replace(/,/g, '%%');

  const cleaned = extractFormattedNumbers(safeText);
  output.textContent = cleaned.filter(Boolean).join('\n');
}

function extractFormattedNumbers(rawText) {
  const matches = rawText.match(/\d+(%%\d{3})*(\.\d{1,2})?/g) || [];

  return matches.map(num => {
    // Restore commas from placeholder
    const restored = num.replace(/%%/g, ',');
    return formatThousands(restored);
  });
}

function formatThousands(numStr) {
  // Skip reformatting if already contains commas
  if (numStr.includes(',')) return numStr;
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
