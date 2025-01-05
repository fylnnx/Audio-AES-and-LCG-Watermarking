import { encrypt, decrypt } from './AES.js';

function stringToByteArray(str) {
    return Array.from(str).map(char => char.charCodeAt(0));
}

function byteArrayToString(byteArray) {
    return byteArray.map(byte => String.fromCharCode(byte)).join('');
}

function encryptECB(inputData, key) {
    const blockSize = 16;
    let blocks = [];

    // Padding if necessary
    if (inputData.length % blockSize !== 0) {
        const paddingLength = blockSize - (inputData.length % blockSize);
        inputData += ' '.repeat(paddingLength);
    }

    // Split the inputData into blocks
    for (let i = 0; i < inputData.length; i += blockSize) {
        blocks.push(inputData.slice(i, i + blockSize));
    }

    // Encrypt each block and convert back to a string
    const encryptedBlocks = blocks.map(block => {
        const byteArray = stringToByteArray(block);
        const encryptedBytes = encrypt(byteArray, key);  // Ensure encrypt works with byte arrays
        return byteArrayToString(encryptedBytes);
    });

    return encryptedBlocks.join('');
}

function decryptECB(encryptedData, key) {
    const blockSize = 16;
    let blocks = [];

    // Split the encryptedData into blocks
    for (let i = 0; i < encryptedData.length; i += blockSize) {
        blocks.push(encryptedData.slice(i, i + blockSize));
    }

    // Decrypt each block and convert back to a string
    const decryptedBlocks = blocks.map(block => {
        const byteArray = stringToByteArray(block);
        const decryptedBytes = decrypt(byteArray, key);  // Ensure decrypt works with byte arrays
        return byteArrayToString(decryptedBytes);
    });

    return decryptedBlocks.join('').trimEnd(); // Remove padding
}

export default { encryptECB, decryptECB };
