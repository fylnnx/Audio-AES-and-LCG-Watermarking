const { log } = require('console');
const fs = require('fs');

function getSeedFromKey(key) {
    let seed = key.charCodeAt(0);
    for (let i = 1; i < key.length; i++) {
        seed ^= key.charCodeAt(i);
    }
    return seed;
}

function generatePnCode(length, seed) {
    const modulus = 70000;
    const multiplier = 2;
    const increment = 5;
    const pnCode = [];

    let k = 0;
    while (k < length) {
        seed = (multiplier * seed + increment) % modulus;
        if (seed % 16 != 1 && seed > 369) {
            pnCode.push(seed);
            k++;
        }
    }
    console.log('Bit Index:', pnCode);
    return pnCode;
}

function messageToBinary(message) {
    return message.split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
}

function audioSamplesToBinaryString(audioSamples) {
    return Array.from(audioSamples).map(sample => {
        let binary = (sample & 0xFFFF).toString(2);
        return binary.padStart(16, '0');
    }).join('');
}

function embed(AudioFileName, message, key, OutputFileName) {
    const audioBuffer = fs.readFileSync(AudioFileName);
    const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);

    let audioBits = audioSamplesToBinaryString(audioSamples);
    const messageBits = messageToBinary(message);

    const seed = getSeedFromKey(key);
    const pnCode = generatePnCode(messageBits.length, seed);

    // Encode message length in the first 16 bits (353 to 368)
    const messageLengthBits = messageBits.length.toString(2).padStart(16, '0');
    let audioBitsArray = audioBits.split('');
    for (let i = 0; i < 16; i++) {
        audioBitsArray[353 + i] = messageLengthBits[i]; // Map length bits directly
    }

    // Embed the actual message using PN code
    for (let i = 0; i < messageBits.length; i++) {
        const position = pnCode[i];
        audioBitsArray[position] = messageBits[i];
    }

    // Convert modified bits back to samples
    for (let i = 0; i < audioSamples.length; i++) {
        audioSamples[i] = parseInt(audioBitsArray.slice(i * 16, (i + 1) * 16).join(''), 2);
    }

    const outputBuffer = Buffer.from(audioSamples.buffer);
    fs.writeFileSync(OutputFileName, outputBuffer);
    console.log("Embed Stego Audio:", OutputFileName);
}

function extract(AudioFileName, key) {
    const audioBuffer = fs.readFileSync(AudioFileName);
    const audioSamples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / Int16Array.BYTES_PER_ELEMENT);

    const audioBits = audioSamplesToBinaryString(audioSamples);

    // Extract message length from bits 353 to 368
    const lengthBits = audioBits.slice(353, 369); // Correct 16-bit range
    const messageLength = parseInt(lengthBits, 2);

    const seed = getSeedFromKey(key);
    const pnCode = generatePnCode(messageLength, seed);

    // Extract message bits using PN code
    let messageBits = '';
    for (let i = 0; i < messageLength; i++) {
        const position = pnCode[i];
        messageBits += audioBits[position];
    }

    // Convert binary message to text
    let message = '';
    for (let i = 0; i < messageBits.length; i += 8) {
        const byte = messageBits.slice(i, i + 8);
        message += String.fromCharCode(parseInt(byte, 2));
    }

    return message;
}


// Contoh penggunaan
// embed('sample.wav', 'Pesan ini bisa lebih panjang sekarang!', '12345678901234567890123456789012', 'output3.wav');
// extract('output3.wav', '12345678901234567890123456789012');

export default {
    embed,
    extract,
};
