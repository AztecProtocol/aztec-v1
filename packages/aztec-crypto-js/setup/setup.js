const BN = require('bn.js');
const fs = require('fs');
const path = require('path');

const setup = {};
const { SIGNATURES_PER_FILE } = require('../params');
const bn128 = require('../bn128/bn128');

const partialPath = path.posix.resolve(__dirname, '../setupDatabase');
const compressionMask = new BN('8000000000000000000000000000000000000000000000000000000000000000', 16);

// @param compressed: 32-byte representation of a bn128 G1 element in BN.js form
setup.decompress = (compressed) => {
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.red);
    const y2 = x.redSqr().redMul(x).redIAdd(bn128.b);
    const yRoot = y2.redSqrt();
    if (yRoot.redSqr().redSub(y2).fromRed().cmpn(0) !== 0) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit)) {
        y = bn128.p.sub(y);
    }
    return { x: x.fromRed(), y };
};

setup.compress = (x, y) => {
    let compressed = x;
    if (y.testn(0)) {
        compressed = compressed.or(compressionMask);
    }
    return compressed;
};

setup.readSignature = (inputValue) => {
    const value = Number(inputValue);
    return new Promise((resolve, reject) => {
        const fileNum = Math.ceil(Number(value + 1) / SIGNATURES_PER_FILE);

        const fileName = path.posix.resolve(partialPath, `data${(((fileNum) * SIGNATURES_PER_FILE) - 1)}.dat`);
        fs.readFile(fileName, (err, data) => {
            if (err) {
                return reject(err);
            }
            // each file starts at 0 (0, 1024, 2048 etc)
            const min = ((fileNum - 1) * SIGNATURES_PER_FILE);
            const bytePosition = ((value - min) * 32);
            // eslint-disable-next-line new-cap
            const signatureBuf = new Buffer.alloc(32);
            data.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

            const x = new BN(signatureBuf);
            return resolve(setup.decompress(x));
        });
    });
};

setup.readSignatureSync = (inputValue) => {
    const value = Number(inputValue);
    const fileNum = Math.ceil(Number(value + 1) / SIGNATURES_PER_FILE);

    const fileName = path.posix.resolve(partialPath, `data${(((fileNum) * SIGNATURES_PER_FILE) - 1)}.dat`);
    const data = fs.readFileSync(fileName);

    // each file starts at 0 (0, 1024, 2048 etc)
    const min = ((fileNum - 1) * SIGNATURES_PER_FILE);
    const bytePosition = ((value - min) * 32);
    // eslint-disable-next-line new-cap
    const signatureBuf = new Buffer.alloc(32);
    data.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

    const x = new BN(signatureBuf);
    return setup.decompress(x);
};

module.exports = setup;
