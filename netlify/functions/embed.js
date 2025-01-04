const fs = require('fs').promises;
const path = require('path');
const busboy = require('busboy');  // Gunakan busboy untuk parsing form-data
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Menggunakan uji.js

exports.handler = async (event, context) => {
  const form = new busboy({ headers: event.headers });
  const fileData = {
    audio: null,
    plainText: null,
  };
  const fields = {};

  // Tempat untuk menyimpan file sementara
  const tempDir = '/tmp/';

  return new Promise((resolve, reject) => {
    form.on('field', (name, value) => {
      fields[name] = value;  // Menangkap fields dari form-data
    });

    form.on('file', (fieldname, file, filename, encoding, mimetype) => {
      // Menyimpan file ke dalam path sementara di Netlify Functions
      const filePath = path.join(tempDir, filename);
      file.pipe(fs.createWriteStream(filePath));

      file.on('end', () => {
        // Setelah file selesai disimpan, kita tentukan path-nya
        fileData[fieldname] = filePath;
      });
    });

    form.on('finish', async () => {
      const { key } = fields;
      const audioFilePath = fileData.audio;
      const plainTextFilePath = fileData.plainText;

      const encryptedPath = path.join(tempDir, 'encrypted.txt');
      const stegoPath = path.join(tempDir, 'stego_audio.wav');

      try {
        // Enkripsi pesan
        await encryptECB(plainTextFilePath, encryptedPath, key);

        // Baca pesan terenkripsi
        const message = await fs.readFile(encryptedPath, 'utf8');

        // Embedding ke audio
        await embed(audioFilePath, message, key, stegoPath);

        // Uji MSE dan PSNR
        const { mse, psnr } = testPSNRandMSE(audioFilePath, stegoPath);

        // Cek apakah file stego audio sudah ada setelah proses embedding
        try {
          await fs.access(stegoPath, fs.constants.F_OK);
          console.log('File stego_audio.wav sudah tersedia');
        } catch (err) {
          console.error('File stego_audio.wav tidak ditemukan');
          return reject({ statusCode: 500, body: JSON.stringify({ message: 'File stego_audio.wav tidak tersedia' }) });
        }

        // Kirim file audio dan hasil uji ke frontend
        const stegoAudioUrl = `/uploads/stego_audio.wav`;  // Path yang benar untuk file audio
        resolve({
          statusCode: 200,
          body: JSON.stringify({ mse, psnr, stegoAudioPath: stegoAudioUrl }),
        });
      } catch (error) {
        reject({ statusCode: 500, body: JSON.stringify({ message: 'Error embedding audio', error }) });
      }
    });

    // Proses form-data
    form.end(event.body);
  });
};
