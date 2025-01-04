const fs = require('fs').promises;
const path = require('path');
const busboy = require('busboy');  // Gunakan busboy untuk parsing form-data
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  const form = new busboy({ headers: event.headers });
  const fileData = {};
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
      const stegoAudioPath = fileData.stegoAudio;

      const extractedPath = path.join(tempDir, 'extracted.txt');
      const decryptedPath = path.join(tempDir, 'decrypted.txt');

      try {
        // Ekstraksi cipher text dari file audio stego
        const cipherText = await extract(stegoAudioPath, key);

        // Simpan cipher text dalam file sementara
        await fs.writeFile(extractedPath, cipherText, 'utf8');

        // Dekripsi cipher text menggunakan AES ECB
        await decryptECB(extractedPath, decryptedPath, key);

        // Baca hasil dekripsi dan kirimkan ke frontend
        const plainText = await fs.readFile(decryptedPath, 'utf8');

        resolve({
          statusCode: 200,
          body: JSON.stringify({ cipherText, plainText }),
        });
      } catch (error) {
        reject({ statusCode: 500, body: JSON.stringify({ message: 'Error extracting audio', error }) });
      }
    });

    // Proses form-data
    form.end(event.body);
  });
};
