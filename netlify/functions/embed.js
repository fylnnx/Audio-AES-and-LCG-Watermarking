// netlify/functions/embed.js
const fs = require('fs').promises;
const path = require('path');
const { encryptECB, decryptECB } = require('../../ECB');
const { embed, extract } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Import uji.js

exports.handler = async (event, context) => {
  // Memastikan bahwa permintaan adalah POST
  if (event.httpMethod === 'POST') {
    try {
      const { key, plainTextFile, audioFile } = JSON.parse(event.body);

      // Proses enkripsi dan embedding
      const encryptedPath = path.join(__dirname, 'uploads', 'encrypted.txt');
      const stegoPath = path.join(__dirname, 'uploads', 'stego_audio.wav');

      // Enkripsi pesan
      await encryptECB(plainTextFile, encryptedPath, key);

      // Baca pesan terenkripsi
      const message = await fs.readFile(encryptedPath, 'utf8');

      // Embedding ke audio
      embed(audioFile, message, key, stegoPath);

      // Uji MSE dan PSNR
      const { mse, psnr } = testPSNRandMSE(audioFile, stegoPath);

      // Mengembalikan hasil ke frontend
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

  // Jika metode HTTP bukan POST
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
