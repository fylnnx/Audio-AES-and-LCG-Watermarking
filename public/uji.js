const fs = require('fs');

// Fungsi untuk menghitung MSE
function calculateMSE(originalSamples, modifiedSamples) {
    let sum = 0;
    for (let i = 0; i < originalSamples.length; i++) {
        sum += Math.pow(originalSamples[i] - modifiedSamples[i], 2);
    }
    return sum / originalSamples.length;
}

// Fungsi untuk menghitung PSNR
function calculatePSNR(mse) {
    const MAX_I = 32767; // Maksimum nilai untuk 16-bit audio
    return 10 * Math.log10(Math.pow(MAX_I, 2) / mse);
}

// Fungsi untuk membaca audio sebagai array of Int16
function readAudioFile(fileName) {
    const audioBuffer = fs.readFileSync(fileName);
    const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);
    return audioSamples;
}

// Uji PSNR dan MSE
function testPSNRandMSE(originalFile, modifiedFile) {
    const originalSamples = readAudioFile(originalFile);
    const modifiedSamples = readAudioFile(modifiedFile);

    const mse = calculateMSE(originalSamples, modifiedSamples);
    const psnr = calculatePSNR(mse);
    
    console.log(mse,psnr)

    return { mse, psnr };
}

// const originalFile = 'audio.wav'
// const modifiedFile = 'stego_audio.wav'
// testPSNRandMSE(originalFile, modifiedFile)


module.exports = { calculateMSE, calculatePSNR, readAudioFile, testPSNRandMSE };
