const fs = require('fs').promises;
const path = require('path');
const formidable = require('formidable'); // Untuk menangani form-data
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/tmp'); // Tempat file akan disimpan sementara
  form.keepExtensions = true; // Menjaga ekstensi file

  return new Promise((resolve, reject) => {
    form.parse(event, async (err, fields, files) => {
      if (err) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error parsing form', error: err }) });
      }

      const { key } = fields;
      const stegoAudioPath = files.stegoAudio[0].path; // Path file stego audio yang di-upload

      const extractedPath = path.join('/tmp', 'extracted.txt');
      const decryptedPath = path.join('/tmp', 'decrypted.txt');

      try {
        // Ekstraksi cipher text dari file audio stego
        const cipherText = await extract(stegoAudioPath, key);

        // Simpan cipher text dalam file sementara
        await fs.writeFile(extractedPath, cipherText, 'utf8');

        // Dekripsi cipher text menggunakan AES ECB
        await decryptECB(extractedPath, decryptedPath, key);

        // Baca hasil dekripsi dan kirimkan ke frontend
        const plainText = await fs.readFile(decryptedPath, 'utf8');

        return resolve({
          statusCode: 200,
          body: JSON.stringify({ cipherText, plainText }),
        });
      } catch (error) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error extracting audio', error }) });
      }
    });
  });
};
