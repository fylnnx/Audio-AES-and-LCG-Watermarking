// Fungsi untuk mendapatkan seed dari kunci
function getSeedFromKey(key) {
    let seed = key.charCodeAt(0);
    for (let i = 1; i < key.length; i++) {
        seed ^= key.charCodeAt(i);
    }
    return seed;
}

// Fungsi untuk menghasilkan PN Code
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
    return pnCode;
}

// Fungsi untuk mengubah pesan menjadi biner
function messageToBinary(message) {
    return message.split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
}

// Fungsi untuk embedding pesan ke audio
function embed(audioBuffer, message, key) {
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

    return modifiedBuffer.toString('base64');  // Kembalikan sebagai Base64
}

// Fungsi untuk ekstrak pesan dari audio
function extract(audioBuffer, key) {
    const seed = getSeedFromKey(key);
    const lengthPnCode = generatePnCode(16, seed, audioBuffer.length);

    let messageLengthBits = '';
    for (let i = 0; i < 16; i++) {
        const byteIndex = lengthPnCode[i];
        const bit = audioBuffer[byteIndex] & 0b1;
        messageLengthBits += bit;
    }

    const messageLength = parseInt(messageLengthBits, 2); // Panjang pesan dalam bit

    const messagePnCode = generatePnCode(messageLength, seed + 1, audioBuffer.length); // Gunakan seed berbeda untuk pesan

    let messageBits = '';
    for (let i = 0; i < messageLength; i++) {
        const byteIndex = messagePnCode[i];
        const bit = audioBuffer[byteIndex] & 0b1;
        messageBits += bit;
    }

    let message = '';
    for (let i = 0; i < messageBits.length; i += 8) {
        const byte = messageBits.slice(i, i + 8);
        message += String.fromCharCode(parseInt(byte, 2));
    }

    return message;
}

export default { embed, extract };
