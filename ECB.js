const { encrypt, decrypt } = require('./AES');

const fs = require('fs');

// Fungsi membaca file dan memisahkan menjadi blok 16 karakter
function readFileAndSplit(filePath, blockSize = 16) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject('Gagal membaca file: ' + err);
                return;
            }

            // Tambahkan padding jika panjang data bukan kelipatan 16
            if (data.length % blockSize !== 0) {
                const paddingLength = blockSize - (data.length % blockSize);
                data += ' '.repeat(paddingLength); // Tambahkan spasi sebagai padding
            }

            // Pisahkan data menjadi blok-blok 16 karakter
            const blocks = [];
            for (let i = 0; i < data.length; i += blockSize) {
                blocks.push(data.slice(i, i + blockSize));
            }

            console.log('blocks:',blocks)

            resolve(blocks);
        });
    });
}

//write file
function writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, 'utf8', (err) => {
            if (err) {
                reject('Failed to write file ' + err);
                return;
            }
            resolve('File successfully written at ' + filePath);
        });
    });
}

//encrypt ecb
async function encryptECB(inputFile, outputFile, key) {
    try {
        const blocks = await readFileAndSplit(inputFile);
        console.log('Blok data asli:', blocks);

        const encryptedBlocks = blocks.map(block => encrypt(block, key));
        console.log('Blok terenkripsi:', encryptedBlocks);

        const encryptedString = encryptedBlocks.join('');

        const result = await writeFile(outputFile, encryptedString);
        console.log(result);
    } catch (err) {
        console.error(err);
    }
}

async function decryptECB(inputFile, outputFile, key) {
    try {
        // Baca file yang telah terenkripsi
        const blocks = await readFileAndSplit(inputFile);
        console.log('Blok data terenkripsi:', blocks);

        // Dekripsi setiap blok
        const decryptedBlocks = blocks.map(block => decrypt(block, key));
        console.log('Blok terdekripsi:', decryptedBlocks);

        // Gabungkan blok-blok terdekripsi menjadi string
        const decryptedString = decryptedBlocks.join('').trimEnd(); // Hapus padding di akhir

        // Simpan hasil ke file
        const result = await writeFile(outputFile, decryptedString);
        console.log(result);
    } catch (err) {
        console.error(err);
    }
}

// Contoh penggunaan
// const inputFile = 'file.txt';
// const encryptedFile = 'encrypted.txt';
// const decryptedFile = 'decrypted.txt';
// const key = 'my_secret_key123'; // Kunci AES (harus panjang 16 karakter)

// // Enkripsi
// encryptECB(inputFile, encryptedFile, key);

// // Dekripsi
// decryptECB(encryptedFile, decryptedFile, key);

module.exports = {encryptECB, decryptECB};

