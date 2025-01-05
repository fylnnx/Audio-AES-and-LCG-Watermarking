const fs = require('fs').promises;
const path = require('path');
const { extract } = require('../../LCG');
const { decryptECB } = require('../../ECB');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'POST') {
    try {
      const { key, stegoAudioFile } = JSON.parse(event.body);

      const extractedPath = path.join(__dirname, 'uploads', 'extracted.txt');
      const decryptedPath = path.join(__dirname, 'uploads', 'decrypted.txt');

      const cipherText = extract(stegoAudioFile, key);
      await fs.writeFile(extractedPath, cipherText, 'utf8');
      await decryptECB(extractedPath, decryptedPath, key);

      const plainText = await fs.readFile(decryptedPath, 'utf8');
      return {
        statusCode: 200,
        body: JSON.stringify({ cipherText, plainText }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error extracting audio' }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
