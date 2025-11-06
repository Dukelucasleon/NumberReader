document.getElementById('imageInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const output = document.getElementById('output');
  output.textContent = 'Processing...';

  const { data: { text } } = await Tesseract.recognize(file, 'eng', {
    logger: m => console.log(m)
  });

  const cleaned = extractFormattedNumbers(text);
  output.textContent = cleaned;
});

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
  }).join(', ');
}

function formatThousands(numStr) {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
