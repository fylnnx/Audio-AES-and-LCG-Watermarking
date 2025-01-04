const fs = require('fs').promises;
const path = require('path');
const { encryptECB, decryptECB } = require('../../ECB');
const { embed, extract } = require('../../LCG');

exports.handler = async function (event, context) {
  const formData = new URLSearchParams(await event.body);
  const key = formData.get('key');
  const stegoAudioPath = formData.get('stegoAudio');

  const extractedPath = path.join(__dirname, '../../uploads', 'extracted.txt');
  const decryptedPath = path.join(__dirname, '../../uploads', 'decrypted.txt');

  try {
    const cipherText = extract(stegoAudioPath, key);
    await fs.writeFile(extractedPath, cipherText, 'utf8');
    await decryptECB(extractedPath, decryptedPath, key);

    const plainText = await fs.readFile(decryptedPath, 'utf8');
    return {
      statusCode: 200,
      body: JSON.stringify({ cipherText, plainText }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Error extracting audio' };
  }
};
