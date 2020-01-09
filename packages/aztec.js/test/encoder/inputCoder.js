import secp256k1 from '@aztec/secp256k1';
import { expect } from 'chai';
import { padLeft } from 'web3-utils';
import { inputCoder } from '../../src/encoder';
import note from '../../src/note';
import HexString from '../encoder/HexString';

const { customMetaData } = note.utils;

describe('Input coder', () => {
    const account = secp256k1.generateAccount();
    const noteValue = 10;
    describe('encodeMetaData()', async () => {
        it('should encode the metaData of multiple notes, when customData set', async () => {
            const numNotes = 2;
            const testNoteA = await note.create(account.publicKey, noteValue);
            const testNoteB = await note.create(account.publicKey, noteValue);
            testNoteA.setMetaData(customMetaData);
            testNoteB.setMetaData(customMetaData);
            const testNotes = [testNoteA, testNoteB];

            const encodedMetaData = inputCoder.encodeMetaData(testNotes);
            const result = new HexString(encodedMetaData);
            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);

            const expectedEphemeralKey = secp256k1.compress(testNoteA.ephemeralFromMetaData().getPublic());
            const expectedEphemeralKeyLength = expectedEphemeralKey.slice(2).length / 2;
            const customDataLength = new HexString(customMetaData.slice(2)).hexLength();
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
                expect(recoveredCustomData).to.equal(padLeft(customMetaData.slice(2), 64));
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
