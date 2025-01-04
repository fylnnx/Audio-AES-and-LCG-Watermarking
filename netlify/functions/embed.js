const fs = require('fs').promises;
const path = require('path');
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji');

exports.handler = async (event, context) => {
  try {
    // Mengecek apakah body berupa form-data
    const formData = new URLSearchParams(event.body);
    const key = formData.get('key'); // Ambil kunci enkripsi dari form-data

    // Ambil file audio dan plain text dari event.body (Netlify mengonversinya menjadi base64)
    const audioFile = event.files.audio[0];
    const plainTextFile = event.files.plainText[0];

    // Tentukan path untuk menyimpan file sementara
    const audioFilePath = path.join('/tmp', 'audio.wav');
    const plainTextFilePath = path.join('/tmp', 'message.txt');
    const encryptedPath = path.join('/tmp', 'encrypted.txt');
    const stegoPath = path.join('/tmp', 'stego_audio.wav');

    // Simpan file audio dan plaintext sementara
    await fs.writeFile(audioFilePath, audioFile, 'base64');
    await fs.writeFile(plainTextFilePath, plainTextFile, 'base64');

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
