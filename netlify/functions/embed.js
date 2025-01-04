const fs = require('fs').promises;
const path = require('path');
const busboy = require('busboy'); // Import busboy
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji'); // Menggunakan uji.js

exports.handler = async (event, context) => {
  // Gunakan Busboy untuk menangani form data
  const bb = busboy({ headers: event.headers });

  const fields = {};
  const files = {};

  // Menyimpan file ke dalam folder sementara /tmp
  bb.on('field', (name, value) => {
    fields[name] = value;
  });

  bb.on('file', (name, file, info) => {
    const filePath = path.join(__dirname, '/tmp', info.filename);
    files[name] = { file, path: filePath };
    file.pipe(fs.createWriteStream(filePath)); // Menyimpan file
  });

  bb.on('finish', async () => {
    const { key } = fields;
    const audioFilePath = files.audio.path;
    const plainTextFilePath = files.plainText.path;

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
  });

  // Parsing event.body
  bb.end(event.body);
};
