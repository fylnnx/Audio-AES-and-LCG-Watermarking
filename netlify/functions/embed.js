const fs = require('fs').promises;
const path = require('path');
const { encryptECB} = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Import fungsi uji.js

exports.handler = async (event) => {
  try {
    const { key, plainText, audioFilePath } = JSON.parse(event.body);

    // Path output file di /tmp
    const encryptedPath = `/tmp/encrypted_${Date.now()}.txt`;
    const stegoPath = `/tmp/stego_audio_${Date.now()}.wav`;

    // Simpan plain text ke file sementara
    const plainTextPath = `/tmp/plain_text_${Date.now()}.txt`;
    await fs.writeFile(plainTextPath, plainText, 'utf8');

    // Enkripsi pesan
    await encryptECB(plainTextPath, encryptedPath, key);

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding ke audio
    embed(audioFilePath, message, key, stegoPath);

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioFilePath, stegoPath);

    // Baca file stego audio sebagai buffer
    const fileBuffer = await fs.readFile(stegoPath);

    // Kirim response dalam bentuk base64 encoded audio file
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true,
      mse,
      psnr,
    };
  } catch (error) {
    console.error('Error embedding audio:', error);
    return { statusCode: 500, body: 'Error embedding audio' };
  }
};
