document.addEventListener('DOMContentLoaded', () => {
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

  // Handle embed form submission
  document.getElementById('embedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const plainTextFile = document.getElementById('plainTextFile').files[0];
    const audioFile = document.getElementById('audioFile').files[0];
    const key = document.getElementById('embedKey').value;

    if (plainTextFile && audioFile && key) {
      try {
        const plainTextBase64 = await toBase64(plainTextFile);
        const audioBase64 = await toBase64(audioFile);

        const requestBody = { plainText: plainTextBase64, audio: audioBase64, key };
        console.log('Sending request body:', requestBody);

        const response = await fetch('/.netlify/functions/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to embed. Status: ${response.status}`);
        }

        const result = await response.json();
        const stegoAudioBase64 = result.stegoAudio;
        const blob = base64ToBlob(stegoAudioBase64, 'audio/wav');
        const url = URL.createObjectURL(blob);

        const link = document.getElementById('downloadStego');
        link.href = url;
        link.download = 'stego_audio.wav';
        link.style.display = 'block';
      } catch (error) {
        console.error('Error during embedding:', error);
        alert('Terjadi kesalahan saat proses embed.');
      }
    } else {
      alert('Lengkapi semua input sebelum submit!');
    }
  });

  // Handle extract form submission
  document.getElementById('extractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const stegoAudioFile = document.getElementById('stegoAudioFile').files[0];
    const key = document.getElementById('extractKey').value;

    if (stegoAudioFile && key) {
      try {
        const stegoAudioBase64 = await toBase64(stegoAudioFile);
        const requestBody = { stegoAudio: stegoAudioBase64, key };

        const response = await fetch('/.netlify/functions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to extract. Status: ${response.status}`);
        }

        const result = await response.json();
        document.getElementById('encryptedText').value = result.cipherText;
        document.getElementById('extractedText').value = result.plainText;
      } catch (error) {
        console.error('Error during extraction:', error);
        alert('Terjadi kesalahan saat proses extract.');
      }
    } else {
      alert('Lengkapi semua input sebelum submit!');
    }
  });
});
