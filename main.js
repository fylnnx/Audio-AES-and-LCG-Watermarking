const { encryptECB, decryptECB } = require('./ECB');
const { embed, extract } = require('./LCG');
const fs = require('fs').promises;

// Initialize value
// const key = '1234567890123456';
// const inputFile = 'file.txt';
// const encryptedFile = 'encrypted.txt';
// const decryptedFile = 'decrypted.txt';

// const coverAudio = 'audio.wav';
// const stegoAudio = 'output.wav';

(async () => {
  try {
    // Encrypt file
    await encryptECB(inputFile, encryptedFile, key);

    // Read encrypted message from file
    const message = await fs.readFile(encryptedFile, 'utf8');

    // Embed encrypted message into audio
    embed(coverAudio, message, key, stegoAudio);

    // Extract message from stego audio
    const extractedMessage = extract(stegoAudio, key);

    // Save extracted message to temporary file
    const extractedFile = 'extracted.txt';
    await fs.writeFile(extractedFile, extractedMessage, 'utf8');

    // Decrypt extracted message
    await decryptECB(extractedFile, decryptedFile, key);

    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
})();