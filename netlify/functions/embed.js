const { encryptECB } = require('../../ECB');
const { embed } = require('../../LCG');

exports.handler = async (event, context) => {
  const { plainText, audio, key } = JSON.parse(event.body);

  // Konversi Base64 ke file teks dan audio
  const plainTextData = Buffer.from(plainText, 'base64').toString('utf8');
  const audioData = Buffer.from(audio, 'base64');

  try {
    // Enkripsi pesan
    const encryptedMessage = encryptECB(plainTextData, key);

    // Embed pesan terenkripsi ke audio
    const stegoAudioBase64 = embed(audioData, encryptedMessage, key);

    return {
      statusCode: 200,
      body: JSON.stringify({ stegoAudio: stegoAudioBase64 })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error embedding audio' })
    };
  }
};
