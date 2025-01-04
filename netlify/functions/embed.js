const fs = require('fs').promises;
const path = require('path');
const formidable = require('formidable'); // Untuk menangani form-data
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Menggunakan uji.js

exports.handler = async (event, context) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/tmp'); // Tempat file akan disimpan sementara
  form.keepExtensions = true; // Menjaga ekstensi file

  // Mengembalikan promise untuk menunggu proses file upload
  return new Promise((resolve, reject) => {
    form.parse(event, async (err, fields, files) => {
      if (err) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error parsing form', error: err }) });
      }

      const { key } = fields;
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

        return resolve({
          statusCode: 200,
          body: JSON.stringify({ mse, psnr, stegoAudioPath: '/uploads/stego_audio.wav' }),
        });
      } catch (error) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error embedding audio', error }) });
      }
    });
  });
};
