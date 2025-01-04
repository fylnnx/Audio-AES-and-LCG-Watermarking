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
        const response = await fetch('/.netlify/functions/embed', { method: 'POST', body: formData });

        if (!response.ok) {
          throw new Error(`Failed to embed. Status: ${response.status}`);
        }

        const blob = await response.blob(); // Mengambil file hasil embedding
        const url = URL.createObjectURL(blob);

        const link = document.getElementById('downloadStego');
        link.href = url;
        link.download = 'stego_audio.wav';
        link.style.display = 'block';
        document.getElementById('embedOutput').style.display = 'block';

        embedProcess.style.display = 'none';
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
        const response = await fetch('/.netlify/functions/extract', { method: 'POST', body: formData });

        if (!response.ok) {
          throw new Error(`Failed to extract. Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('result:', result);

        document.getElementById('encryptedText').value = result.cipherText;
        document.getElementById('extractedText').value = result.plainText;

        const link = document.getElementById('downloadText');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result.plainText);
        link.download = 'extracted_text.txt';
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
