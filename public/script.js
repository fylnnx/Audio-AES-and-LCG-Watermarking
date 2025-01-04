// document.addEventListener('DOMContentLoaded', () => {
//   const navButtons = document.querySelectorAll('[data-page]');

//   navButtons.forEach(button => {
//     button.addEventListener('click', (e) => {
//       e.preventDefault();
//       const pageId = button.getAttribute('data-page');
      
//       // Aktifkan halaman sesuai data-page
//       document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
//       document.getElementById(pageId).classList.add('active');
//     });
//   });

//   // Embed Form Submission
//   document.getElementById('embedForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const plainTextFile = document.getElementById('plainTextFile').files[0];
//     const audioFile = document.getElementById('audioFile').files[0];
//     const key = document.getElementById('embedKey').value;

//     if (plainTextFile && audioFile && key) {
//       const embedProcess = document.getElementById('embedProcess');
//       embedProcess.style.display = 'block';
//       const formData = new FormData();
//       formData.append('plainText', plainTextFile);
//       formData.append('audio', audioFile);
//       formData.append('key', key);

//       try {
//         const response = await fetch('/embed', { method: 'POST', body: formData });

//         if (!response.ok) {
//           throw new Error(`Failed to embed. Status: ${response.status}`);
//         }

//         const contentType = response.headers.get('Content-Type');
//         if (contentType.includes('application/json')) {
//           // Parsing JSON response
//           const result = await response.json();
//           console.log('result:', result);
//           document.getElementById('mseValue').textContent = `MSE: ${result.mse}`;
//           document.getElementById('psnrValue').textContent = `PSNR: ${result.psnr}`;

//           const link = document.getElementById('downloadStego');
//           link.href = result.stegoAudioPath;  // Update href to proper stego audio path
//           link.style.display = 'block';
//           document.getElementById('embedOutput').style.display = 'block';
//         } else {
//           throw new Error('Unexpected response type');
//         }
//         embedProcess.style.display = 'none';
//       } catch (error) {
//         console.error('Error during embedding:', error);
//         alert('Terjadi kesalahan saat proses embed.');
//       }
//     } else {
//       alert('Lengkapi semua input sebelum submit!');
//     }
//   });

//   // Extract Form Submission
//   document.getElementById('extractForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const stegoAudioFile = document.getElementById('stegoAudioFile').files[0];
//     const key = document.getElementById('extractKey').value;

//     if (stegoAudioFile && key) {
//       const extractProcess = document.getElementById('extractProcess');
//       extractProcess.style.display = 'block';

//       const formData = new FormData();
//       formData.append('stegoAudio', stegoAudioFile);
//       formData.append('key', key);

//       const response = await fetch('/extract', { method: 'POST', body: formData });
//       const result = await response.json();

//       document.getElementById('encryptedText').value = result.cipherText;
//       document.getElementById('extractedText').value = result.plainText;

//       const link = document.getElementById('downloadText');
//       link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result.plainText);
//       document.getElementById('extractOutput').style.display = 'block';
//     }
//     extractProcess.style.display = 'none';
//   });
// });

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

        const contentType = response.headers.get('Content-Type');
        if (contentType.includes('application/json')) {
          // Parsing JSON response
          const result = await response.json();
          console.log('result:', result);
          document.getElementById('mseValue').textContent = `MSE: ${result.mse}`;
          document.getElementById('psnrValue').textContent = `PSNR: ${result.psnr}`;

          const link = document.getElementById('downloadStego');
          link.href = result.stegoAudioPath;  // Update href to proper stego audio path
          link.style.display = 'block';
          document.getElementById('embedOutput').style.display = 'block';
        } else {
          throw new Error('Unexpected response type');
        }
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