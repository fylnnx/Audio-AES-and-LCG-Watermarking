const fs = require('fs').promises;
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event) => {
  try {
    // Log untuk melihat isi request body
    console.log('Received event body:', event.body);

    if (!event.body) {
      return { statusCode: 400, body: 'Request body is empty' };
    }

    // Parsing data dari event body
    const { key, stegoAudio } = JSON.parse(event.body);

    if (!key || !stegoAudio) {
      return { statusCode: 400, body: 'Missing required fields: key or stegoAudio' };
    }

    // Path sementara untuk file hasil ekstraksi dan dekripsi
    const extractedPath = `/tmp/extracted_${Date.now()}.txt`;
    const decryptedPath = `/tmp/decrypted_${Date.now()}.txt`;
    const stegoAudioPath = `/tmp/stego_audio_${Date.now()}.wav`;

    // Simpan stego audio ke file sementara di /tmp
    await fs.writeFile(stegoAudioPath, Buffer.from(stegoAudio, 'base64'));

    // Ekstraksi cipher text dari stego audio
    const cipherText = extract(stegoAudioPath, key);

    // Simpan cipher text ke file sementara
    await fs.writeFile(extractedPath, cipherText, 'utf8');

    // Dekripsi cipher text ke plain text
    await decryptECB(extractedPath, decryptedPath, key);

    // Baca plain text hasil dekripsi
    const plainText = await fs.readFile(decryptedPath, 'utf8');

    // Kirim hasil ekstraksi dan dekripsi ke frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cipherText, plainText }),
    };
  } catch (error) {
    console.error('Error extracting audio:', error);
    return { statusCode: 500, body: 'Error extracting audio' };
  }
};
