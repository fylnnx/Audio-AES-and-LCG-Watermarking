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

  // Fungsi untuk mengubah file menjadi base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Embed Form Submission
  document.getElementById('embedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const plainTextFile = document.getElementById('plainTextFile').files[0];
    const audioFile = document.getElementById('audioFile').files[0];
    const key = document.getElementById('embedKey').value;

    if (plainTextFile && audioFile && key) {
      const embedProcess = document.getElementById('embedProcess');
      embedProcess.style.display = 'block';

      try {
        const plainTextBase64 = await toBase64(plainTextFile);  // Mengubah file menjadi base64
        const audioBase64 = await toBase64(audioFile);  // Mengubah audio file menjadi base64

        const requestData = {
          key: key,
          plainTextFile: plainTextBase64,  // Kirim file dalam bentuk base64
          audioFile: audioBase64  // Kirim audio dalam bentuk base64
        };

        const response = await fetch('/.netlify/functions/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`Failed to embed. Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('result:', result);
        document.getElementById('mseValue').textContent = `MSE: ${result.mse}`;
        document.getElementById('psnrValue').textContent = `PSNR: ${result.psnr}`;

        // Menampilkan link untuk download file stego audio
        const link = document.getElementById('downloadStego');
        link.href = result.stegoAudioPath;  // Update href to proper stego audio path (base64 or URL)
        link.style.display = 'block';
        document.getElementById('embedOutput').style.display = 'block';

      } catch (error) {
        console.error('Error during embedding:', error);
        alert('Terjadi kesalahan saat proses embed.');
      }
      embedProcess.style.display = 'none';
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

      try {
        const stegoAudioBase64 = await toBase64(stegoAudioFile);  // Mengubah file stego audio menjadi base64

        const requestData = {
          key: key,
          stegoAudioFile: stegoAudioBase64  // Kirim file stego dalam bentuk base64
        };

        const response = await fetch('/.netlify/functions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();

        document.getElementById('encryptedText').value = result.cipherText;
        document.getElementById('extractedText').value = result.plainText;

        // Menampilkan link untuk download hasil teks
        const link = document.getElementById('downloadText');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result.plainText);
        document.getElementById('extractOutput').style.display = 'block';

      } catch (error) {
        console.error('Error during extraction:', error);
        alert('Terjadi kesalahan saat proses extract.');
      }
      extractProcess.style.display = 'none';
    }
  });
});
