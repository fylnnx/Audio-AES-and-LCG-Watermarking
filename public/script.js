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
      if (audioFile.type !== 'audio/wav') {
        alert('File audio harus berformat WAV!');
        return;
      }

      if (key.length < 16) {
        alert('Key harus minimal 16 karakter!');
        return;
      }

      const embedProcess = document.getElementById('embedProcess');
      embedProcess.style.display = 'block'; // Menampilkan proses loading

      try {
        // Baca file sebagai base64
        const plainTextBase64 = await toBase64(plainTextFile);
        const audioBase64 = await toBase64(audioFile);

        const requestBody = {
          plainText: plainTextBase64,
          audio: audioBase64,
          key: key
        };

        const response = await fetchWithTimeout('/.netlify/functions/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`Failed to embed. Status: ${response.status}`);
        }

        const result = await response.json();
        const stegoAudioBase64 = result.stegoAudio;

        // Buat URL untuk audio hasil embedding
        const blob = base64ToBlob(stegoAudioBase64, 'audio/wav');
        const url = URL.createObjectURL(blob);

        // Menampilkan link download
        const link = document.getElementById('downloadStego');
        link.href = url;
        link.download = 'stego_audio.wav';
        link.style.display = 'block';
        link.addEventListener('click', () => {
          setTimeout(() => URL.revokeObjectURL(url), 1000); // Hapus URL setelah 1 detik
        });
        document.getElementById('embedOutput').style.display = 'block'; // Menampilkan hasil output

      } catch (error) {
        console.error('Error during embedding:', error);
        alert(`Terjadi kesalahan saat proses embed: ${error.message}`);
      } finally {
        embedProcess.style.display = 'none'; // Menyembunyikan proses loading
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
      if (stegoAudioFile.type !== 'audio/wav') {
        alert('File audio harus berformat WAV!');
        return;
      }

      if (key.length < 16) {
        alert('Key harus minimal 16 karakter!');
        return;
      }

      const extractProcess = document.getElementById('extractProcess');
      extractProcess.style.display = 'block'; // Menampilkan proses loading

      try {
        // Baca file audio sebagai base64
        const stegoAudioBase64 = await toBase64(stegoAudioFile);

        const requestBody = {
          stegoAudio: stegoAudioBase64,
          key: key
        };

        const response = await fetchWithTimeout('/.netlify/functions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`Failed to extract. Status: ${response.status}`);
        }

        const result = await response.json();

        // Menampilkan hasil extract
        document.getElementById('encryptedText').value = result.cipherText;
        document.getElementById('extractedText').value = result.plainText;

        // Membuat link download untuk file teks yang diekstrak
        const link = document.getElementById('downloadText');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result.plainText);
        link.download = 'extracted_text.txt';
        link.style.display = 'block';
        document.getElementById('extractOutput').style.display = 'block';

      } catch (error) {
        console.error('Error during extraction:', error);
        alert(`Terjadi kesalahan saat proses extract: ${error.message}`);
      } finally {
        extractProcess.style.display = 'none'; // Menyembunyikan proses loading
      }
    } else {
      alert('Lengkapi semua input sebelum submit!');
    }
  });
});

// Fungsi untuk membaca file sebagai base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Fungsi untuk mengubah base64 menjadi Blob
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: mimeType });
}

// Fungsi fetch dengan timeout
async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Permintaan timeout. Silakan coba lagi.');
    }
    throw error;
  }
}
