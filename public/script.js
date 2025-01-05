import uji from './uji.js';  
import ecb from './ECB.js';   
import lcg from './LCG.js';    

document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('[data-page]');

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = button.getAttribute('data-page');
      
      // Aktifkan halaman sesuai data-page
      document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
      document.getElementById(pageId).classList.add('active');
    });
  });

  // Embed Form Submission
  document.getElementById('embedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const plainTextFile = document.getElementById('plainTextFile').files[0];
    const audioFile = document.getElementById('audioFile').files[0];
    const key = document.getElementById('embedKey').value;

    if (plainTextFile && audioFile && key) {
      const embedProcess = document.getElementById('embedProcess');
      embedProcess.style.display = 'block';
      const formData = new FormData();
      formData.append('plainText', plainTextFile);
      formData.append('audio', audioFile);
      formData.append('key', key);

      try {
        // Baca file teks dan enkripsi
        const reader = new FileReader();
        reader.onload = async () => {
          const encryptedText = await ecb.encryptECB(reader.result, key);  // Enkripsi isi teks

          // Simulasi proses embedding pesan terenkripsi ke dalam audio
          const stegoAudio = lcg.embed(audioFile.name, encryptedText, key);

          // Menghitung MSE dan PSNR
          const originalSamples = await uji.readAudioFile(audioFile);
          const stegoSamples = await uji.readAudioFile(stegoAudio);
          
          const mse = uji.calculateMSE(originalSamples, stegoSamples);
          const psnr = uji.calculatePSNR(mse);

          // Tampilkan hasilnya
          document.getElementById('mseValue').textContent = `MSE: ${mse}`;
          document.getElementById('psnrValue').textContent = `PSNR: ${psnr}`;

          const link = document.getElementById('downloadStego');
          link.href = stegoAudio;  // Path ke stego audio
          link.style.display = 'block';
          document.getElementById('embedOutput').style.display = 'block';

          embedProcess.style.display = 'none';
        };
        reader.readAsText(plainTextFile);  // Baca file sebagai teks
      } catch (error) {
        console.error('Error during embedding:', error);
        alert('Terjadi kesalahan saat proses embed.');
      }
    } else {
      alert('Lengkapi semua input sebelum submit!');
    }
  });

  // Extract Form Submission
  document.getElementById('extractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const stegoAudioFile = document.getElementById('stegoAudioFile').files[0];
    const key = document.getElementById('extractKey').value;

    if (stegoAudioFile && key) {
      const extractProcess = document.getElementById('extractProcess');
      extractProcess.style.display = 'block';

      const formData = new FormData();
      formData.append('stegoAudio', stegoAudioFile);
      formData.append('key', key);

      try {
        // Simulasi ekstraksi pesan dari stego audio
        const extractedMessage = await lcg.extract(stegoAudioFile.name, key);

        // Simulasi dekripsi pesan yang diekstrak
        const decryptedMessage = await ecb.decryptECB(extractedMessage, key);

        // Tampilkan hasil ekstraksi dan dekripsi
        document.getElementById('encryptedText').value = extractedMessage;
        document.getElementById('extractedText').value = decryptedMessage;

        const link = document.getElementById('downloadText');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(decryptedMessage);
        link.download = 'extracted_message.txt';
        link.style.display = 'block';
        document.getElementById('extractOutput').style.display = 'block';
      } catch (error) {
        console.error('Error during extraction:', error);
        alert('Terjadi kesalahan saat proses extract.');
      }

      extractProcess.style.display = 'none';
    } else {
      alert('Lengkapi semua input sebelum submit!');
    }
  });
});
