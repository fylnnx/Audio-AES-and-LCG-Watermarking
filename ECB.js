const { encrypt, decrypt } = require('./AES');

// Fungsi untuk mengenkripsi data
function encryptECB(inputData, key) {
    // Pisahkan inputData menjadi blok 16 karakter
    const blockSize = 16;
    let blocks = [];

    // Tambahkan padding jika panjang data bukan kelipatan 16
    if (inputData.length % blockSize !== 0) {
        const paddingLength = blockSize - (inputData.length % blockSize);
        inputData += ' '.repeat(paddingLength); // Tambahkan spasi sebagai padding
    }

    // Pisahkan data menjadi blok-blok 16 karakter
    for (let i = 0; i < inputData.length; i += blockSize) {
        blocks.push(inputData.slice(i, i + blockSize));
    }

    // Enkripsi setiap blok
    const encryptedBlocks = blocks.map(block => encrypt(block, key));
    const encryptedString = encryptedBlocks.join('');

    return encryptedString;
}

// Fungsi untuk mendekripsi data
function decryptECB(encryptedData, key) {
    // Pisahkan data terenkripsi menjadi blok 16 karakter
    const blockSize = 16;
    let blocks = [];

    for (let i = 0; i < encryptedData.length; i += blockSize) {
        blocks.push(encryptedData.slice(i, i + blockSize));
    }

    // Dekripsi setiap blok
    const decryptedBlocks = blocks.map(block => decrypt(block, key));
    const decryptedString = decryptedBlocks.join('').trimEnd(); // Hapus padding di akhir

    return decryptedString;
}

module.exports = { encryptECB, decryptECB };
