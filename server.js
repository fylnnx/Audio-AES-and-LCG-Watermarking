const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { encryptECB, decryptECB } = require('./ECB');
const { embed, extract } = require('./LCG');
const { testPSNRandMSE } = require('./uji'); // Import uji.js

const app = express();
const upload = multer({ dest: 'uploads/' });

// Menambahkan middleware untuk menyajikan folder uploads sebagai static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static('public'));  // Make sure static files can be accessed

// Endpoint untuk embedding
app.post('/embed', upload.fields([{ name: 'plainText' }, { name: 'audio' }]), async (req, res) => {
  const { key } = req.body;
  const plainTextPath = req.files.plainText[0].path;
  const audioPath = req.files.audio[0].path;

  const encryptedPath = path.join(__dirname, 'uploads', 'encrypted.txt');
  const stegoPath = path.join(__dirname, 'uploads', 'stego_audio.wav');

  try {
    // Enkripsi pesan
    await encryptECB(plainTextPath, encryptedPath, key);

    // Baca pesan terenkripsi
    const message = await fs.readFile(encryptedPath, 'utf8');

    // Embedding ke audio
    embed(audioPath, message, key, stegoPath);

    // Uji MSE dan PSNR
    const { mse, psnr } = testPSNRandMSE(audioPath, stegoPath);

    // Cek apakah file stego audio sudah ada setelah proses embedding
    try {
      await fs.access(stegoPath, fs.constants.F_OK);
      console.log('File stego_audio.wav sudah tersedia');
    } catch (err) {
      console.error('File stego_audio.wav tidak ditemukan');
      return res.status(500).send('File stego_audio.wav tidak tersedia');
    }

    // Kirim file audio dan hasil uji ke frontend
    const stegoAudioUrl = `/uploads/stego_audio.wav`;  // Path yang benar untuk file audio
    res.json({ mse, psnr, stegoAudioPath: stegoAudioUrl });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error embedding audio');
  }
});

// Endpoint untuk extract
app.post('/extract', upload.single('stegoAudio'), async (req, res) => {
  const { key } = req.body;
  const stegoAudioPath = req.file.path;

  const extractedPath = path.join(__dirname, 'uploads', 'extracted.txt');
  const decryptedPath = path.join(__dirname, 'uploads', 'decrypted.txt');

  try {
    const cipherText = extract(stegoAudioPath, key);
    await fs.writeFile(extractedPath, cipherText, 'utf8');
    await decryptECB(extractedPath, decryptedPath, key);

    const plainText = await fs.readFile(decryptedPath, 'utf8');
    res.json({ cipherText, plainText });
  } catch (error) {
    res.status(500).send('Error extracting audio');
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
