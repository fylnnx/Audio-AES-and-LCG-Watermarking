import AES from './AES.js';

const { encrypt, decrypt } = AES;

function encryptECB(inputData, key) {
    const blockSize = 16;
    let blocks = [];

    if (inputData.length % blockSize !== 0) {
        const paddingLength = blockSize - (inputData.length % blockSize);
        inputData += ' '.repeat(paddingLength);
    }

    for (let i = 0; i < inputData.length; i += blockSize) {
        blocks.push(inputData.slice(i, i + blockSize));
    }

    const encryptedBlocks = blocks.map(block => AES.encrypt(block, key));
    return encryptedBlocks.join('');
}

function decryptECB(encryptedData, key) {
    const blockSize = 16;
    let blocks = [];

    for (let i = 0; i < encryptedData.length; i += blockSize) {
        blocks.push(encryptedData.slice(i, i + blockSize));
    }

    const decryptedBlocks = blocks.map(block => AES.decrypt(block, key));
    return decryptedBlocks.join('').trimEnd();
}

export default { encryptECB, decryptECB };
