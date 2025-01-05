const Sbox = [
    [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76],
    [0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0],
    [0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15],
    [0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75],
    [0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84],
    [0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf],
    [0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8],
    [0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2],
    [0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73],
    [0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb],
    [0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79],
    [0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08],
    [0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a],
    [0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e],
    [0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf],
    [0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16]
];

const invSbox = Array.from({ length: 16 }, () => Array(16).fill(0));
Sbox.forEach((row, i) => {
    row.forEach((value, j) => {
        const x = Math.floor(value / 16);
        const y = value % 16;
        invSbox[x][y] = i * 16 + j;
    });
});

const rcon = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36
];

function XOR(a, b) {
    return a.map((val, i) => val ^ b[i]);
}

function stringToByteArray(str) {
    return Array.from(str).map(char => char.charCodeAt(0));
}

function expand_key(key) {
    const expandedKeys = [];
    const formattedKeys = [];

    // Convert string key to byte array (assuming ASCII characters)
    let keyBytes = stringToByteArray(key);
    //console.log("Key in Bytes:", keyBytes);

    // Ensure key is 16 bytes (128 bits)
    for (let i = 0; i < 4; i++) {
        expandedKeys[i] = [keyBytes[4 * i], keyBytes[4 * i + 1], keyBytes[4 * i + 2], keyBytes[4 * i + 3]];
    }

    //console.log("Initial Expanded Keys:", expandedKeys);

    // Perform the key schedule
    for (let i = 4; i < 44; i++) {
        let temp = expandedKeys[i - 1].slice();
        // //console.log(`Processing round ${i}:`, temp);

        if (i % 4 === 0) {
            // Rotate and apply S-box
            temp = [
                Sbox[temp[1] >> 4][temp[1] & 0x0F] ^ rcon[Math.floor(i / 4) - 1],
                Sbox[temp[2] >> 4][temp[2] & 0x0F],
                Sbox[temp[3] >> 4][temp[3] & 0x0F],
                Sbox[temp[0] >> 4][temp[0] & 0x0F]
            ];
            // //console.log(`After S-box and RCON at round ${i}:`, temp);
        }

        // XOR with the previous block (4 bytes before)
        expandedKeys[i] = XOR(expandedKeys[i - 4], temp);
        // //console.log(`Expanded key ${i}:`, expandedKeys[i]);
    }

    // Format the expanded keys into 4x4 matrices for each expanded key
    for (let i = 0; i < 11; i++) { // 11 sub-keys for AES-128
        formattedKeys.push(expandedKeys.slice(i * 4, i * 4 + 4));
    }
    formattedKeys.forEach((expandedKey, index) => {
        // //console.log(`expandedKey${index + 1} = [`);
        expandedKey.forEach(row => {
            // //console.log(`  [${row.join(', ')}],`);
        });
        // //console.log(']');
    });

    return formattedKeys;
}
function addRoundKey(state, key) {
    let result = [];
    for (let i = 0; i < state.length; i++) {
        result[i] = [];
        for (let j = 0; j < state[i].length; j++) {
            result[i][j] = state[i][j] ^ key[i][j]; // XOR state dengan key
        }
    }
    return result;
}
// // Add round key
// function addRoundKey(state, round_key) {
//     return XOR(state, round_key);
// }


function subBytes(state) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            state[r][c] = Sbox[state[r][c] >> 4][state[r][c] & 0x0F];
        }
    }
    return state;
}

function invSubBytes(state) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            state[r][c] = invSbox[state[r][c] >> 4][state[r][c] & 0x0F];
        }
    }
    return state;
}

//shiftrows
function shiftRows(state) {
    for (let i = 1; i < 4; i++) {
        let shiftCount = i;
        for (let j = 0; j < shiftCount; j++) {
            const temp = state[i].shift();
            state[i].push(temp); 
        }
    }
    return state; 
}

function invShiftRows(state) {
    for (let i = 1; i < 4; i++) {
        let shiftCount = i;
        for (let j = 0; j < shiftCount; j++) {
            const temp = state[i].pop();
            state[i].unshift(temp);
        }
    }
    return state;
}

function multiplyGF(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
        if (b & 1) p ^= a;
        let hi = a & 0x80;
        a <<= 1;
        if (hi) a ^= 0x1b;
        b >>= 1;
    }
    return p;
}

// Mix columns
function mixColumns(state) {
    const mixColumnsMatrix = [
        [2, 3, 1, 1],
        [1, 2, 3, 1],
        [1, 1, 2, 3],
        [3, 1, 1, 2]
    ];

    let result = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i][j] =
                (multiplyGF(mixColumnsMatrix[i][0], state[0][j]) ^
                multiplyGF(mixColumnsMatrix[i][1], state[1][j]) ^
                multiplyGF(mixColumnsMatrix[i][2], state[2][j]) ^
                multiplyGF(mixColumnsMatrix[i][3], state[3][j])) & 0xff; // Mask untuk memastikan tetap dalam rentang byte
        }
    }

    return result;
}

// Inverse Mix Columns
function invMixColumns(state) {
    const invMixColumnsMatrix = [
        [14, 11, 13, 9],
        [9, 14, 11, 13],
        [13, 9, 14, 11],
        [11, 13, 9, 14]
    ];

    let result = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i][j] =
                (multiplyGF(invMixColumnsMatrix[i][0], state[0][j]) ^
                multiplyGF(invMixColumnsMatrix[i][1], state[1][j]) ^
                multiplyGF(invMixColumnsMatrix[i][2], state[2][j]) ^
                multiplyGF(invMixColumnsMatrix[i][3], state[3][j])) & 0xff; // Mask to keep within byte range
        }
    }

    return result;
}


function encrypt(plaintext, key) {
    if (plaintext.length > 16) {
        //console.log("Input text maksimal 16 karakter");
        return;
    }
    
    const plaintexthex = plaintext.padEnd(16, '\0').split('').map(char => char.charCodeAt(0));
    //console.log("Input Bytes (Padded):", plaintexthex);

    let state = [];

    // Convert plain text to 2D array (4x4 matrix)
    for (let i = 0; i < 4; i++) {
        state[i] = [plaintexthex[i], plaintexthex[i + 4], plaintexthex[i + 8], plaintexthex[i + 12]];
    }

    const generateKey = expand_key(key);

    //console.log('Initial state =', state);

    // Round 0
    state = addRoundKey(state, generateKey[0]); // Access key for round 0
    //console.log(`after addroundkey-0`, state);

    // Round 1-9
    for (let round = 1; round < 10; round++) {
        state = subBytes(state);
        //console.log(`after subbytes-${round}`, state);
        state = shiftRows(state);
        //console.log(`after shiftrows-${round}`, state);
        state = mixColumns(state);
        //console.log(`after mixcolumns-${round}`, state);
        state = addRoundKey(state, generateKey[round]);
        //console.log(`after addroundkey-${round}`, state);
    }

    // Round 10
    state = subBytes(state);
    //console.log(`after subbytes-10`, state);
    state = shiftRows(state);
    //console.log(`after shiftrows-10`, state);
    state = addRoundKey(state, generateKey[10]);
    //console.log(`after addroundkey-10`, state);

    //console.log('Final State =', state);

    // Convert final state back to a string
    const finalBytes = state.flat(); // Flatten the 2D array into 1D array
    //console.log(finalBytes);
    const finalString = finalBytes.map(byte => String.fromCharCode(byte)).join('');
    console.log('Final String (Decoded):', finalString);

    return finalString;
}


function decrypt(plaintext, key) {
    if (plaintext.length > 16) {
        //console.log("input text maksimal 16 karakter");
        return;
    }
    const plaintexthex = plaintext.padEnd(16, '\0').split('').map(char => char.charCodeAt(0));
    //console.log("Input Bytes (Padded):", plaintexthex);

    let state = [[], [], [], []];
    
    for (let i = 0; i < 16; i++) {
        state[Math.floor(i / 4)].push(plaintexthex[i]);
    }
    //console.log(state);
    
    const generateKey = expand_key(key);

    //console.log('Initial state =', state);

    // Round 10
    state = addRoundKey(state, generateKey[10]); // Access key for round 0
    //console.log(`after addroundkey-10`, state);

    //round 9->1
    for (let round = 9; round >= 1; round--) {
        state = invShiftRows(state);
        //console.log(`after invshiftrow-${round}`, state);
        state = invSubBytes(state);
        //console.log(`after invsubbytes-${round}`, state);
        state = addRoundKey(state, generateKey[round]);
        //console.log(`after addroundkey-${round}`, state);
        state = invMixColumns(state);
        //console.log(`after invmixcolumns-${round}`, state);
    }
    
    // Final round (round 0)
    state = invShiftRows(state);
    //console.log(`after invshiftrow-0`, state);
    state = invSubBytes(state);
    ////console.log(`after invsubbytes-0`, state);
    state = addRoundKey(state, generateKey[0]);
    //console.log(`after addroundkey-0`, state);

    let finalBytes = [];
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
        finalBytes.push(state[row][col]);
        }
    }
    const finalString = finalBytes.map(byte => String.fromCharCode(byte)).join('');
    console.log('Final String (Decoded):', finalString);

    return finalString;
}

// const plaintext = 'hi how are youuu'
// const key ='123457'
// const encrypted = encrypt (plaintext, key);
// decrypt(encrypted, key);

module.exports = { encrypt, decrypt };
