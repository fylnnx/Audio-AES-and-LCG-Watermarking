const fs = require('fs').promises;
const path = require('path');
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  try {
    // Mengecek apakah body berupa form-data
    const formData = new URLSearchParams(event.body);
    const key = formData.get('key'); // Ambil kunci dekripsi dari form-data

    // Ambil file stego audio dari event.body (Netlify mengonversinya menjadi base64)
    const stegoAudioFile = event.files.stegoAudio[0];

    // Tentukan path untuk menyimpan file sementara
    const stegoAudioPath = path.join('/tmp', 'stego_audio.wav');
    const extractedPath = path.join('/tmp', 'extracted.txt');
    const decryptedPath = path.join('/tmp', 'decrypted.txt');

    // Simpan file stego audio sementara
    await fs.writeFile(stegoAudioPath, stegoAudioFile, 'base64');

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
