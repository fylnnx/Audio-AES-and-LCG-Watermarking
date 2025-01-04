const fs = require('fs').promises;
const path = require('path');
const { encryptECB, decryptECB } = require('../../ECB');
const { embed, extract } = require(../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Import fungsi uji.js

exports.handler = async function (event, context) {
  const formData = new URLSearchParams(await event.body);
  const key = formData.get('key');
  const plainTextPath = formData.get('plainText');
  const audioPath = formData.get('audio');

  const encryptedPath = path.join(__dirname, '../../uploads', 'encrypted.txt');
  const stegoPath = path.join(__dirname, '../../uploads', 'stego_audio.wav');

  try {
    // Enkripsi pesan
    await encryptECB(plainTextPath, encryptedPath, key);

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding ke audio
    embed(audioPath, message, key, stegoPath);

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioPath, stegoPath);

    // Cek apakah file stego audio sudah ada setelah proses embedding
    try {
      await fs.access(stegoPath, fs.constants.F_OK);
      console.log('File stego_audio.wav sudah tersedia');
    } catch (err) {
      console.error('File stego_audio.wav tidak ditemukan');
      return { statusCode: 500, body: 'File stego_audio.wav tidak tersedia' };
    }

    // Kirim file audio dan hasil uji ke frontend
    const stegoAudioUrl = `/uploads/stego_audio.wav`;  // Path yang benar untuk file audio
    return {
      statusCode: 200,
      body: JSON.stringify({ mse, psnr, stegoAudioPath: stegoAudioUrl }),
    };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Error embedding audio' };
  }
};
