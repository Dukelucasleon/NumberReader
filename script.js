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

  // Draw grayscale image
  ctx.filter = 'grayscale(100%) brightness(150%) contrast(185%)';
  ctx.drawImage(img, 0, 0);

  // Simulate edge enhancement (basic sharpening)
  // This is limited in browser — advanced filters require WebGL or WASM
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

  const cleaned = extractFormattedNumbers(text);
  output.textContent = cleaned.filter(Boolean).join('\n');
}

function extractFormattedNumbers(rawText) {
  const matches = rawText.match(/\d+(\.\d{1,2})?/g) || [];

  return matches.map(num => {
    if (num.includes('.')) {
      const [whole, decimal] = num.split('.');
      const formattedWhole = formatThousands(whole);
      return `${formattedWhole}.${decimal}`;
    } else {
      return formatThousands(num);
    }
  });
}

function formatThousands(numStr) {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
