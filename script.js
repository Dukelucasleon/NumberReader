const imageInput = document.getElementById('imageInput');
const pasteZone = document.getElementById('pasteZone');
const output = document.getElementById('output');
const canvas = document.createElement('canvas');
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
  canvas.width = img.width;
  canvas.height = img.height;

  // Apply brightness and contrast
  ctx.filter = 'brightness(110%) contrast(128%)';
  ctx.drawImage(img, 0, 0);

  const processedBlob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/png')
  );

  await runOCR(processedBlob);
}

async function runOCR(imageBlob) {
  output.textContent = 'Processing...';

  try {
    const { data } = await Tesseract.recognize(imageBlob, 'eng', {
      logger: m => console.log(m),
      config: {
        tessedit_char_whitelist: '0123456789.-',
        preserve_interword_spaces: '1',
        psm: '6'
      }
    });

    // Extract only numeric-looking values, split by whitespace or commas
    const raw = data.text;
    const tokens = raw.split(/[\s,]+/);
    const numbersOnly = tokens
      .map(t => t.replace(/[^\d.-]/g, '')) // remove non-numeric characters including commas
      .filter(t => /^-?\d*\.?\d+$/.test(t)); // keep valid numbers

    output.textContent = numbersOnly.join('\n');
  } catch (error) {
    console.error('OCR error:', error);
    output.textContent = 'Failed to read text from image.';
  }
}
