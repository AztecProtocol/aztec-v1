const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const { padLeft } = require('web3-utils');

const { inputCoder } = require('../../src/encoder');
const note = require('../../src/note');
const HexString = require('../encoder/HexString');

describe('Input coder', () => {
    const account = secp256k1.generateAccount();
    const noteValue = 10;
    describe('encodeMetaData()', async () => {
        it('should encode the metaData of multiple notes, when customData set', async () => {
            const numNotes = 2;
            const testNoteA = await note.create(account.publicKey, noteValue);
            const testNoteB = await note.create(account.publicKey, noteValue);
            const customData =
                '0x00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            testNoteA.setMetaData(customData);
            testNoteB.setMetaData(customData);
            const testNotes = [testNoteA, testNoteB];

            const encodedMetaData = inputCoder.encodeMetaData(testNotes);
            const result = new HexString(encodedMetaData);
            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);

            const expectedEphemeralKey = secp256k1.compress(testNoteA.ephemeralFromMetaData().getPublic());
            const expectedEphemeralKeyLength = expectedEphemeralKey.slice(2).length / 2;
            const customDataLength = new HexString(customData.slice(2)).hexLength();
            const expectedMetaDataLength = expectedEphemeralKeyLength + customDataLength;

            for (let i = 0; i < numNotes; i += 1) {
                const offsetDataStart = 0x40 + i * 0x20;
                const offsetDataFinish = 0x60 + i * 0x20;

                // start position of the data for one note
                const offset = parseInt(result.slice(offsetDataStart, offsetDataFinish), 16);

                // 1st word at start pos is the length of that note's metaData
                const noteAMetaDataLength = parseInt(result.slice(offset, offset + 0x20), 16);
                expect(noteAMetaDataLength).to.equal(expectedMetaDataLength);

                // check ephemeralKey is correctly recovered
                const ephemeralKey = result.slice(offset + 0x20, offset + 0x20 + expectedEphemeralKeyLength);
                expect(secp256k1.decompressHex(ephemeralKey).eq(testNoteA.ephemeralFromMetaData().getPublic()));

                // check metaData is correctly recovered
                const recoveredCustomData = result.slice(
                    offset + 0x20 + expectedEphemeralKeyLength,
                    offset + 0x20 + expectedEphemeralKeyLength + customDataLength,
                );
                expect(recoveredCustomData).to.equal(padLeft(customData.slice(2), 64));
            }
        });

        it('should encode the metaData of multiple notes, when customData is not set', async () => {
            // metaData of notes will just contain ephemeralKeys
            const numNotes = 2;
            const testNoteA = await note.create(account.publicKey, noteValue);
            const testNoteB = await note.create(account.publicKey, noteValue);
            const testNotes = [testNoteA, testNoteB];

            const encodedMetaData = inputCoder.encodeMetaData(testNotes);
            const result = new HexString(encodedMetaData);
            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);

            const expectedEphemeralKey = secp256k1.compress(testNoteA.ephemeralFromMetaData().getPublic());
            const expectedEphemeralKeyLength = expectedEphemeralKey.slice(2).length / 2;
            const expectedMetaDataLength = expectedEphemeralKeyLength;

            for (let i = 0; i < numNotes; i += 1) {
                const offsetDataStart = 0x40 + i * 0x20;
                const offsetDataFinish = 0x60 + i * 0x20;

                // start position of the data for one note
                const offset = parseInt(result.slice(offsetDataStart, offsetDataFinish), 16);

                // 1st word at start pos is the length of that note's metaData
                const noteAMetaDataLength = parseInt(result.slice(offset, offset + 0x20), 16);
                expect(noteAMetaDataLength).to.equal(expectedMetaDataLength);

                // check ephemeralKey is correctly recovered
                const ephemeralKey = result.slice(offset + 0x20, offset + 0x20 + expectedEphemeralKeyLength);
                expect(secp256k1.decompressHex(ephemeralKey).eq(testNoteA.ephemeralFromMetaData().getPublic()));
            }
        });
    });
});
