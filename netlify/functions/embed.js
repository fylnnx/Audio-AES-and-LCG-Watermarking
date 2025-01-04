const fs = require('fs').promises;
const path = require('path');
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji');

exports.handler = async (event, context) => {
  // Parse the form data (files will be in the event)
  const formData = new URLSearchParams(event.body);
  const key = formData.get('key'); // Get encryption key from the form

  // Assume files are in the event object (Netlify automatically handles multipart)
  const files = event.files;

  const audioFilePath = files.audio[0].path; // Path file audio yang di-upload
  const plainTextFilePath = files.plainText[0].path; // Path file teks yang di-upload

  const encryptedPath = path.join('/tmp', 'encrypted.txt');
  const stegoPath = path.join('/tmp', 'stego_audio.wav');

  try {
    // Enkripsi pesan
    await encryptECB(plainTextFilePath, encryptedPath, key);

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding ke audio
    await embed(audioFilePath, message, key, stegoPath);

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioFilePath, stegoPath);

    return {
      statusCode: 200,
      body: JSON.stringify({ mse, psnr, stegoAudioPath: '/uploads/stego_audio.wav' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error embedding audio', error }),
    };
  }
};
