const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    output.textContent = 'Processing...';
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });
      output.textContent = data.text;
    } catch (error) {
      console.error('OCR error:', error);
      output.textContent = 'Failed to read text from image.';
    }
  }
});
