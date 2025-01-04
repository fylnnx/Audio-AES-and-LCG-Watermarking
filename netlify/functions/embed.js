const fs = require('fs').promises;
const multiparty = require('multiparty');
const path = require('path');
const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');
const { testPSNRandMSE } = require('../../uji');

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error parsing form', error: err }) });
      }

      const key = fields.key[0];
      const audioFilePath = files.audio[0].path;
      const plainTextFilePath = files.plainText[0].path;

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

        const stegoAudio = await fs.readFile(stegoPath);
        return resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Disposition': 'attachment; filename="stego_audio.wav"',
          },
          body: stegoAudio.toString('base64'),
          isBase64Encoded: true,
        });
      } catch (error) {
        console.error(error);
        return reject({ statusCode: 500, body: JSON.stringify({ message: 'Error embedding audio', error }) });
      }
    });
  });
};
