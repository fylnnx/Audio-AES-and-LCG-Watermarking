const fs = require('fs').promises;
const path = require('path');
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Import fungsi uji.js

exports.handler = async (event) => {
  try {
    // Log untuk melihat isi request body
    console.log('Received event body:', event.body);

    if (!event.body) {
      return { statusCode: 400, body: 'Request body is empty' };
    }

    // Parsing data dari event body
    const { key, plainText, audio } = JSON.parse(event.body);

    if (!key || !plainText || !audio) {
      return { statusCode: 400, body: 'Missing required fields: key, plainText, or audio' };
    }

    // Path sementara untuk output file di /tmp
    const encryptedPath = `/tmp/encrypted_${Date.now()}.txt`;
    const stegoPath = `/tmp/stego_audio_${Date.now()}.wav`;
    const plainTextPath = `/tmp/plain_text_${Date.now()}.txt`;
    const audioPath = `/tmp/audio_${Date.now()}.wav`;

    // Simpan plain text dan audio ke file sementara
    await fs.writeFile(plainTextPath, Buffer.from(plainText, 'base64').toString('utf8'), 'utf8');
    await fs.writeFile(audioPath, Buffer.from(audio, 'base64'));

    // Enkripsi pesan
    await encryptECB(plainTextPath, encryptedPath, key);

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding pesan ke dalam audio
    embed(audioPath, message, key, stegoPath);

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioPath, stegoPath);

    // Baca file stego audio sebagai buffer
    const fileBuffer = await fs.readFile(stegoPath);

    // Kirim response dalam bentuk base64 encoded audio file
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stegoAudio: fileBuffer.toString('base64'),
        mse,
        psnr,
      }),
    };
  } catch (error) {
    console.error('Error embedding audio:', error);
    return { statusCode: 500, body: 'Error embedding audio' };
  }
};
