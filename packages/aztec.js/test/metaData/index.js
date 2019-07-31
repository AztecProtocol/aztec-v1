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
            const numNotes = 2;
            const testNoteA = await note.create(account.publicKey, noteValue);
            const testNoteB = await note.create(account.publicKey, noteValue);
            const customData = '0123456789';
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

                // this is the length of the metadata for that note
                const ephemeralKeyLength = 0x21;
                const customDataLength = 0x20;
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
