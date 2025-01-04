// const { log } = require('console');
// const fs = require('fs');

// function getSeedFromKey(key) {
//     let seed = key.charCodeAt(0);
//     for (let i = 1; i < key.length; i++) {
//         seed ^= key.charCodeAt(i);
//     }
//     return seed;
// }

// function generatePnCode(length, seed) {
//     const modulus = 70000;
//     const multiplier = 2;
//     const increment = 5;
//     const pnCode = [];

//     let k = 0;
//     while (k < length) {
//         seed = (multiplier * seed + increment) % modulus;
//         if (seed % 16 != 1 && seed > 369) {
//             pnCode.push(seed);
//             k++;
//         }
//     }
//     console.log('Bit Index:', pnCode);
//     return pnCode;
// }

// function messageToBinary(message) {
//     return message.split('')
//         .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
//         .join('');
// }

// function audioSamplesToBinaryString(audioSamples) {
//     return Array.from(audioSamples).map(sample => {
//         let binary = (sample & 0xFFFF).toString(2);
//         return binary.padStart(16, '0');
//     }).join('');
// }

// function embed(AudioFileName, message, key, OutputFileName) {
//     const audioBuffer = fs.readFileSync(AudioFileName);
//     const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);

//     let audioBits = audioSamplesToBinaryString(audioSamples);
//     const messageBits = messageToBinary(message);

//     const seed = getSeedFromKey(key);
//     const pnCode = generatePnCode(messageBits.length, seed);

//     // Encode message length in the first 16 bits (353 to 368)
//     const messageLengthBits = messageBits.length.toString(2).padStart(16, '0');
//     let audioBitsArray = audioBits.split('');
//     for (let i = 0; i < 16; i++) {
//         audioBitsArray[353 + i] = messageLengthBits[i]; // Map length bits directly
//     }

//     // Embed the actual message using PN code
//     for (let i = 0; i < messageBits.length; i++) {
//         const position = pnCode[i];
//         audioBitsArray[position] = messageBits[i];
//     }

//     // Convert modified bits back to samples
//     for (let i = 0; i < audioSamples.length; i++) {
//         audioSamples[i] = parseInt(audioBitsArray.slice(i * 16, (i + 1) * 16).join(''), 2);
//     }

//     const outputBuffer = Buffer.from(audioSamples.buffer);
//     fs.writeFileSync(OutputFileName, outputBuffer);
//     console.log("Embed Stego Audio:", OutputFileName);
// }

// function extract(AudioFileName, key) {
//     const audioBuffer = fs.readFileSync(AudioFileName);
//     const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);

//     const audioBits = audioSamplesToBinaryString(audioSamples);

//     // Extract message length from bits 353 to 368
//     const lengthBits = audioBits.slice(353, 369); // Correct 16-bit range
//     const messageLength = parseInt(lengthBits, 2);

//     const seed = getSeedFromKey(key);
//     const pnCode = generatePnCode(messageLength, seed);

//     // Extract message bits using PN code
//     let messageBits = '';
//     for (let i = 0; i < messageLength; i++) {
//         const position = pnCode[i];
//         messageBits += audioBits[position];
//     }

//     // Convert binary message to text
//     let message = '';
//     for (let i = 0; i < messageBits.length; i += 8) {
//         const byte = messageBits.slice(i, i + 8);
//         message += String.fromCharCode(parseInt(byte, 2));
//     }

//     return message;
// }


// // Contoh penggunaan
// // embed('sample.wav', 'Pesan ini bisa lebih panjang sekarang!', '12345678901234567890123456789012', 'output3.wav');
// // extract('output3.wav', '12345678901234567890123456789012');

// module.exports = {
//     embed,
//     extract,
// };

const fs = require('fs');

function getSeedFromKey(key) {
    let seed = key.charCodeAt(0);
    for (let i = 1; i < key.length; i++) {
        seed ^= key.charCodeAt(i);
    }
    return seed;
}

function generatePnCode(length, seed, maxIndex) {
    const modulus = maxIndex; // Sesuaikan dengan jumlah byte yang valid
    const multiplier = 1103515245;
    const increment = 12345;
    const pnCode = [];

    let k = 0;
    while (k < length) {
        seed = (multiplier * seed + increment) % modulus;
        if (seed > 45) { // Lewati header WAV (44 byte)
            pnCode.push(seed);
            k++;
        }
    }
    console.log('BitIndex:', pnCode);
    return pnCode;
}

function messageToBinary(message) {
    return message.split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
}

function embed(AudioFileName, message, key, OutputFileName) {
    const audioBuffer = fs.readFileSync(AudioFileName);
    const messageBits = messageToBinary(message);

    // Konversi panjang pesan menjadi biner 16-bit
    const messageLengthBits = messageBits.length.toString(2).padStart(16, '0');

    const modifiedBuffer = Buffer.from(audioBuffer); // Salin buffer

    // Gunakan LCG untuk menentukan posisi byte panjang pesan
    const seed = getSeedFromKey(key);
    const lengthPnCode = generatePnCode(16, seed, audioBuffer.length);

    // Sisipkan panjang pesan menggunakan PN Code
    for (let i = 0; i < 16; i++) {
        const byteIndex = lengthPnCode[i];
        const originalByte = modifiedBuffer[byteIndex];
        const modifiedByte = (originalByte & 0b11111110) | parseInt(messageLengthBits[i], 2);
        modifiedBuffer[byteIndex] = modifiedByte;
    }

    // Gunakan LCG untuk menentukan posisi byte pesan
    const messagePnCode = generatePnCode(messageBits.length, seed + 1, audioBuffer.length); // Gunakan seed berbeda untuk pesan

    // Sisipkan pesan menggunakan PN Code
    for (let i = 0; i < messageBits.length; i++) {
        const byteIndex = messagePnCode[i];
        const originalByte = modifiedBuffer[byteIndex];

        // Ubah hanya LSB byte
        const modifiedByte = (originalByte & 0b11111110) | parseInt(messageBits[i], 2);
        modifiedBuffer[byteIndex] = modifiedByte;
    }

    fs.writeFileSync(OutputFileName, modifiedBuffer);
    console.log('Embed Stego Audio:', OutputFileName);
}

function extract(AudioFileName, key) {
    const audioBuffer = fs.readFileSync(AudioFileName);

    // Gunakan LCG untuk menentukan posisi byte panjang pesan
    const seed = getSeedFromKey(key);
    const lengthPnCode = generatePnCode(16, seed, audioBuffer.length);

    // Baca panjang pesan dari posisi yang ditentukan oleh PN Code
    let messageLengthBits = '';
    for (let i = 0; i < 16; i++) {
        const byteIndex = lengthPnCode[i];
        const bit = audioBuffer[byteIndex] & 0b1;
        messageLengthBits += bit;
    }

    const messageLength = parseInt(messageLengthBits, 2); // Panjang pesan dalam bit

    // Gunakan LCG untuk menentukan posisi byte pesan
    const messagePnCode = generatePnCode(messageLength, seed + 1, audioBuffer.length); // Gunakan seed berbeda untuk pesan

    // Ekstrak pesan asli dari LSB
    let messageBits = '';
    for (let i = 0; i < messageLength; i++) {
        const byteIndex = messagePnCode[i];
        const bit = audioBuffer[byteIndex] & 0b1;
        messageBits += bit;
    }

    // Konversi bit ke teks
    let message = '';
    for (let i = 0; i < messageBits.length; i += 8) {
        const byte = messageBits.slice(i, i + 8);
        message += String.fromCharCode(parseInt(byte, 2));
    }

    return message;
}

// Contoh penggunaan
// embed('audio.wav', 'Pesan rahasia', 'my-secret-key', 'stego_audio.wav');
// const extractedMessage = extract('stego_audio.wav', 'my-secret-key');
// console.log('Extracted Message:', extractedMessage);

module.exports = {
    embed,
    extract,
};
