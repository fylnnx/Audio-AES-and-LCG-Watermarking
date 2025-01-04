const fs = require('fs').promises;
const path = require('path');
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  const formData = new URLSearchParams(event.body);
  const key = formData.get('key'); // Get decryption key

  // Get the file from event
  const files = event.files;
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
};
