const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const { padLeft } = require('web3-utils');

const note = require('../../src/note');
const metaData = require('../../src/metaData');
const HexString = require('../encoder/HexString');

describe('Metadata', () => {
    const account = secp256k1.generateAccount();
    const noteValue = 10;
    describe('Success states', async () => {
        it('should create metadata for multiple notes when metadata has been set', async () => {
            // customData is an examole of an IES encrypted viewing kewy
            const numNotes = 2;
            const testNoteA = await note.create(account.publicKey, noteValue);
            const testNoteB = await note.create(account.publicKey, noteValue);
            const customData =
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            // set the note metadata (this is done in the extension)
            testNoteA.setMetadata(customData);
            testNoteB.setMetadata(customData);

            const testNotes = [testNoteA, testNoteB];
            const metadata = metaData.extractNoteMetadata(testNotes);
            const result = new HexString(metadata);

            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);

            for (let i = 0; i < numNotes; i += 1) {
                const offsetDataStart = 0x40 + i * 0x20;
                const offsetDataFinish = 0x60 + i * 0x20;

                // this is the start position of the data for one note
                const offset = parseInt(result.slice(offsetDataStart, offsetDataFinish), 16);
                const customDataLength = 0x116;
                // this is the length of the metadata for that note
                const ephemeralKeyLength = 0x21;
                // this is extracting the ephemeral key and checking it is as expected
                // go to the location of the metadata for this note. Jump over the length of the metadata
                // take the first 0x21
                const ephemeralKey = result.slice(offset + 0x20, offset + 0x20 + ephemeralKeyLength);
                expect(secp256k1.decompressHex(ephemeralKey).eq(testNotes[i].ephemeral.getPublic()));

                const recoveredCustomData = result.slice(
                    offset + 0x20 + ephemeralKeyLength,
                    offset + 0x20 + ephemeralKeyLength + customDataLength,
                );
                expect(recoveredCustomData).to.equal(padLeft(customData, 64));
            }
        });
    });
});
