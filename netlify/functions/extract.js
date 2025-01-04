const fs = require('fs').promises;
const path = require('path');
const busboy = require('busboy'); // Import busboy
const { extract } = require('../../LCG'); // Fungsi extract untuk mengambil cipher text
const { decryptECB } = require('../../ECB'); // Fungsi decrypt untuk AES ECB

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
    const stegoAudioPath = files.stegoAudio.path; // Path file stego yang di-upload

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

      return {
        statusCode: 200,
        body: JSON.stringify({ cipherText, plainText }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error extracting audio', error }),
      };
    }
  });

  // Parsing event.body
  bb.end(event.body);
};
