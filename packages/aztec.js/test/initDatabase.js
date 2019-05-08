
const BN = require('bn.js');
const path = require('path');
const fs = require('fs');
const { constants } = require('@aztec/dev-utils');

const setup = require('../src/setup');

const partialPath = path.posix.resolve(__dirname, 'localSetupDatabase');

setup.fetchPoint = async (inputValue) => {
    const value = Number(inputValue);

    return new Promise((resolve, reject) => {
        const fileNum = Math.ceil(Number(value + 1) / constants.SIGNATURES_PER_FILE);
        console.log({ fileNum });

        const fileName = path.posix.resolve(partialPath, `data${fileNum * constants.SIGNATURES_PER_FILE - 1}.dat`);
        console.log({ fileName });

        fs.readFile(fileName, (err, data) => {
            if (err) {
                return reject(err);
            }
            // each file starts at 0 (0, 1024, 2048 etc)
            const min = (fileNum - 1) * constants.SIGNATURES_PER_FILE;
            const bytePosition = (value - min) * 32;
            // eslint-disable-next-line new-cap
            const signatureBuf = new Buffer.alloc(32);
            data.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

            const x = new BN(signatureBuf);
            return resolve(setup.decompress(x));
        });
    });
};

