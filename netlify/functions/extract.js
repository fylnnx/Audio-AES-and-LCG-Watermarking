const fs = require('fs').promises;
const path = require('path');
const { decryptECB } = require('../../ECB');
const { extract } = require('../../LCG');

exports.handler = async (event, context) => {
  const { stegoAudio, key } = JSON.parse(event.body);

  const stegoAudioData = Buffer.from(stegoAudio, 'base64');
  const extractedPath = path.join(__dirname, 'uploads', 'extracted.txt');
  const decryptedPath = path.join(__dirname, 'uploads', 'decrypted.txt');

  try {
    const cipherText = extract(stegoAudioData, key);
    await fs.writeFile(extractedPath, cipherText, 'utf8');
    await decryptECB(extractedPath, decryptedPath, key);

    const plainText = await fs.readFile(decryptedPath, 'utf8');

    return {
      statusCode: 200,
      body: JSON.stringify({ cipherText, plainText })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error extracting audio' })
    };
  }
};
