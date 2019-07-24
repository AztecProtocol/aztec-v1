/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const fs = require('fs');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */

describe.only('Verify inherritance of behaviour contracts', (accounts) => {

    before(async () => {
        const path =`/Users/arnaudschenk/dev/AZTEC/packages/protocol/contracts/ACE/noteRegistry/epochs`
        const epochs = await fs.readdirSync(path);
        const epochInts = epochs.map(e => parseInt(e, 10));
    });

    describe('Success States', async () => {
        it('', () => {
            console.log('hey');
        })
    });

    describe('Failure States', async () => {

    });
});
