const fs = require('fs').promises;
const multiparty = require('multiparty');
const path = require('path');
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error parsing form', error: err }) });
      }

      const key = fields.key[0];
      const stegoAudioPath = files.stegoAudio[0].path;

      const extractedPath = path.join('/tmp', 'extracted.txt');
      const decryptedPath = path.join('/tmp', 'decrypted.txt');

      try {
        // Ekstraksi cipher text dari stego audio
        const cipherText = await extract(stegoAudioPath, key);
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
        console.error(error);
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error extracting audio', error }) });
      }
    });
  });
};
