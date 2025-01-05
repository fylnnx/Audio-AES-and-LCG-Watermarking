const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { encryptECB, decryptECB } = require('../../ECB');
const { embed, extract } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Import uji.js

exports.handler = async (event, context) => {
  if (event.httpMethod === 'POST') {
    // Parsing data dari request
    const { key, plainTextFile, audioFile } = JSON.parse(event.body);

    const encryptedPath = path.join(__dirname, 'uploads', 'encrypted.txt');
    const stegoPath = path.join(__dirname, 'uploads', 'stego_audio.wav');

    try {
      // Enkripsi pesan
      await encryptECB(plainTextFile, encryptedPath, key);

      // Baca pesan terenkripsi
      const message = await fs.readFile(encryptedPath, 'utf8');

      // Embedding ke audio
      embed(audioFile, message, key, stegoPath);

      // Uji MSE dan PSNR
      const { mse, psnr } = testPSNRandMSE(audioFile, stegoPath);

      // Kirim hasil ke frontend
      const stegoAudioUrl = `/uploads/stego_audio.wav`;  // Path yang benar untuk file audio
      return {
        statusCode: 200,
        body: JSON.stringify({ mse, psnr, stegoAudioPath: stegoAudioUrl }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error embedding audio' }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
