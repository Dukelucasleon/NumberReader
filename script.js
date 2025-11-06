const imageInput = document.getElementById('imageInput');
const pasteZone = document.getElementById('pasteZone');
const output = document.getElementById('output');

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    await processImage(file);
  }
});

pasteZone.addEventListener('paste', async (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      await processImage(blob);
      break;
    }
  }
});

async function processImage(imageBlob) {
  output.textContent = 'Processing...';

  const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng', {
    logger: m => console.log(m)
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
