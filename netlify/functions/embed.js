const fs = require('fs').promises;
const path = require('path');
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji');

exports.handler = async (event, context) => {
  try {
    const formData = new URLSearchParams(event.body);
    const key = formData.get('key'); // Ambil kunci enkripsi dari form-data

    const audioFile = event.files.audio[0];
    const plainTextFile = event.files.plainText[0];

    const audioFilePath = path.join('/tmp', 'audio.wav');
    const plainTextFilePath = path.join('/tmp', 'message.txt');
    const encryptedPath = path.join('/tmp', 'encrypted.txt');
    const stegoPath = path.join('/tmp', 'stego_audio.wav');

    // Menyimpan file audio dan plaintext sementara
    await fs.writeFile(audioFilePath, audioFile, 'base64');
    await fs.writeFile(plainTextFilePath, plainTextFile, 'base64');

    // Enkripsi pesan
    console.log('Mulai proses enkripsi...');
    await encryptECB(plainTextFilePath, encryptedPath, key);
    console.log('Enkripsi selesai.');

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding ke audio
    console.log('Mulai proses embedding...');
    await embed(audioFilePath, message, key, stegoPath);
    console.log('Embedding selesai.');

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioFilePath, stegoPath);

    return {
      statusCode: 200,
      body: JSON.stringify({ mse, psnr, stegoAudioPath: '/uploads/stego_audio.wav' }),
    };
  } catch (error) {
    console.error('Error terjadi:', error); // Menampilkan detail error
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error embedding audio', error: error.message || error }),
    };
  }
};
