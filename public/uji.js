// Semua fungsi tetap sama
function calculateMSE(originalSamples, modifiedSamples) {
    let sum = 0;
    for (let i = 0; i < originalSamples.length; i++) {
        sum += Math.pow(originalSamples[i] - modifiedSamples[i], 2);
    }
    return sum / originalSamples.length;
}

function calculatePSNR(mse) {
    const MAX_I = 32767;
    return 10 * Math.log10(Math.pow(MAX_I, 2) / mse);
}

function readAudioFile(fileName) {
    const audioBuffer = fs.readFileSync(fileName);
    const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);
    return audioSamples;
}

function testPSNRandMSE(originalFile, modifiedFile) {
    const originalSamples = readAudioFile(originalFile);
    const modifiedSamples = readAudioFile(modifiedFile);

    const mse = calculateMSE(originalSamples, modifiedSamples);
    const psnr = calculatePSNR(mse);
    
    console.log(mse, psnr);

    return { mse, psnr };
}

// Export default sebagai objek berisi semua fungsi
export default { calculateMSE, calculatePSNR, readAudioFile, testPSNRandMSE };
