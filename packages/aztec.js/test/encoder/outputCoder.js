import * as bn128 from '@aztec/bn128';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { expect } from 'chai';
import { padLeft } from 'web3-utils';
import HexString from './HexString';
import note from '../../src/note';
import outputCoder from '../../src/encoder/outputCoder';
import { randomNoteValue } from '../helpers/note';

const clean = (input) => {
    return input.replace(/^0+/, '');
};

const isHex = (input) => {
    return input.match(new RegExp('^[0-9a-fA-F]+$')) !== null;
};

describe('Output Coder', () => {
    let accounts = [];
    let notes = [];
    let challenges = [];

    beforeEach(async () => {
        accounts = Array(10)
            .fill()
            .map(() => secp256k1.generateAccount());
        notes = await Promise.all(
            accounts.map(({ publicKey }) => {
                return note.create(publicKey, randomNoteValue());
            }),
        );
        challenges = [
            '0x00112233445566778899aabbccddeeffffeeddccbbaa99887766554433221100',
            '0xff112233445566778899aabbccddeeffffeeddccbbaa998877662544332211de',
        ];
    });

    afterEach(() => {});

    it('should validate that isHex works', () => {
        expect(isHex('0123456789abcdefABCDEF')).to.equal(true);
        expect(isHex('x1234')).to.equal(false);
    });

    it('should encode output note', async () => {
        const encoded = new HexString(outputCoder.encodeNote(notes[0], true));
        expect(isHex(encoded)).to.equal(true);
        expect(encoded.hexLength()).to.equal(0x101);
        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(0xe1);
        expect(clean(encoded.slice(0x20, 0x40))).to.equal('1');
        expect(encoded.slice(0x40, 0x60)).to.equal(padLeft(notes[0].owner.slice(2), 64));
        expect(encoded.slice(0x60, 0x80)).to.equal(padLeft(notes[0].noteHash.slice(2), 64));
        expect(clean(encoded.slice(0x80, 0xa0))).to.equal('61');
        expect(bn128.decompressHex(encoded.slice(0xa0, 0xc0)).eq(notes[0].gamma)).to.equal(true);
        expect(bn128.decompressHex(encoded.slice(0xc0, 0xe0)).eq(notes[0].sigma)).to.equal(true);

        // 1st 0x21 of metaData is the ephemeralKey
        expect(secp256k1.decompressHex(encoded.slice(0xe0, 0x101)).eq(notes[0].ephemeralFromMetaData().getPublic())).to.equal(
            true,
        );
    });

    it('should encode input note', () => {
        const encoded = new HexString(outputCoder.encodeNote(notes[0], false));
        expect(isHex(encoded)).to.equal(true);
        expect(encoded.hexLength()).to.equal(0xe0);

        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(0xc0);
        expect(clean(encoded.slice(0x20, 0x40))).to.equal('1');
        expect(encoded.slice(0x40, 0x60)).to.equal(padLeft(notes[0].owner.slice(2), 64));
        expect(encoded.slice(0x60, 0x80)).to.equal(padLeft(notes[0].noteHash.slice(2), 64));
        expect(clean(encoded.slice(0x80, 0xa0))).to.equal('40');
        expect(bn128.decompressHex(encoded.slice(0xa0, 0xc0)).eq(notes[0].gamma)).to.equal(true);
        expect(bn128.decompressHex(encoded.slice(0xc0, 0xe0)).eq(notes[0].sigma)).to.equal(true);
    });

    it('should encode notes inputnotes', () => {
        const inputNotes = [notes[0], notes[2], notes[5]];
        const encoded = new HexString(outputCoder.encodeNotes(inputNotes, false));

        expect(isHex(encoded)).to.equal(true);
        const length = parseInt(encoded.slice(0x20, 0x40), 16);
        expect(length).to.equal(inputNotes.length);

        let sum = 0x40;
        for (let i = 0; i < length; i += 1) {
            const location = parseInt(encoded.slice(0x40 + i * 0x20, 0x60 + i * 0x20), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const encodedNote = encoded.slice(location, location + 0x20 + byteLength);
            sum += byteLength + 0x40;
            expect(encodedNote).to.equal(outputCoder.encodeNote(inputNotes[i], false));
        }
        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(sum - 0x20);
        expect(encoded.hexLength()).to.equal(sum);
    });

    it('should encode a proof output', () => {
        const inputNotes = [notes[0], notes[1]];
        const outputNotes = [notes[2], notes[3], notes[4]];
        const publicOwner = accounts[5].address;
        const publicValue = new BN(randomNoteValue());
        const encoded = new HexString(
            outputCoder.encodeProofOutput({
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue,
                challenge: challenges[0],
            }),
        );
        expect(isHex(encoded)).to.equal(true);
        const encodedLength = parseInt(encoded.slice(0x00, 0x20), 16);
        const inputsLocation = parseInt(encoded.slice(0x20, 0x40), 16);
        const outputsLocation = parseInt(encoded.slice(0x40, 0x60), 16);
        const recoveredOwner = encoded.slice(0x60, 0x80);
        const recoveredValue = parseInt(encoded.slice(0x80, 0xa0), 16);
        const recoveredChallenge = encoded.slice(0xa0, 0xc0);
        const inputsLength = parseInt(encoded.slice(inputsLocation, inputsLocation + 0x20), 16);
        const outputsLength = parseInt(encoded.slice(outputsLocation, outputsLocation + 0x20), 16);
        const encodedInputNotes = new HexString(encoded.slice(inputsLocation, inputsLocation + 0x20 + inputsLength));
        const encodedOutputNotes = new HexString(encoded.slice(outputsLocation, outputsLocation + 0x20 + outputsLength));
        const totalLength = encodedInputNotes.hexLength() + encodedOutputNotes.hexLength() + 0xc0;

        expect(encodedLength).to.equal(encoded.hexLength() - 0x20);
        expect(recoveredOwner).to.equal(padLeft(publicOwner.slice(2), 64));
        expect(recoveredValue).to.equal(publicValue.toNumber());
        expect(recoveredChallenge).to.equal(challenges[0].slice(2));
        expect(parseInt(encoded.slice(inputsLocation + 0x20, inputsLocation + 0x40), 16)).to.equal(inputNotes.length);
        expect(parseInt(encoded.slice(outputsLocation + 0x20, outputsLocation + 0x40), 16)).to.equal(outputNotes.length);
        expect(String(encodedInputNotes)).to.equal(outputCoder.encodeNotes(inputNotes, false));
        expect(String(encodedOutputNotes)).to.equal(outputCoder.encodeNotes(outputNotes, true));
        expect(encoded.hexLength()).to.equal(totalLength);
    });

    it('should encode proof outputs', () => {
        const proofs = [
            {
                inputNotes: [notes[0], notes[1]],
                outputNotes: [notes[2], notes[3]],
                publicOwner: accounts[4].address,
                publicValue: new BN(randomNoteValue()),
                challenge: challenges[0],
            },
            {
                inputNotes: [notes[5], notes[6]],
                outputNotes: [notes[7], notes[8]],
                publicOwner: accounts[9].address,
                publicValue: new BN(randomNoteValue()),
                challenge: challenges[1],
            },
        ];
        const encoded = new HexString(outputCoder.encodeProofOutputs(proofs).slice(2));
        expect(isHex(encoded)).to.equal(true);

        const encodedLength = parseInt(encoded.slice(0x00, 0x20), 16);
        const numProofs = parseInt(encoded.slice(0x20, 0x40), 16);

        expect(numProofs).to.equal(2);
        let sum = 0x40;
        for (let i = 0; i < numProofs; i += 1) {
            const location = parseInt(encoded.slice(0x40 + i * 0x20, 0x60 + i * 0x20), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const proofOutput = encoded.slice(location, location + 0x20 + byteLength);
            expect(proofOutput).to.equal(outputCoder.encodeProofOutput(proofs[i]).toLowerCase());
            sum += byteLength + 0x40;
        }
        expect(encodedLength).to.equal(sum - 0x20);
        expect(encoded.hexLength()).to.equal(sum);
    });

    it('should decode an encoded output note', () => {
        const encoded = outputCoder.encodeNote(notes[0], true);
        const result = outputCoder.decodeNote(encoded);
        expect(result.gamma.eq(notes[0].gamma)).to.equal(true);
        expect(result.sigma.eq(notes[0].sigma)).to.equal(true);
        expect(result.ephemeral.eq(notes[0].ephemeralFromMetaData().getPublic())).to.equal(true);
        expect(result.owner).to.equal(notes[0].owner);
        expect(result.noteHash).to.equal(notes[0].noteHash);
        // TODO: expect(result.noteType).to.equal(notes[0].noteType);
    });

    it('should decode an encoded input note', () => {
        const encoded = outputCoder.encodeNote(notes[0], false);
        const result = outputCoder.decodeNote(encoded);
        expect(result.gamma.eq(notes[0].gamma)).to.equal(true);
        expect(result.sigma.eq(notes[0].sigma)).to.equal(true);
        expect(result.owner).to.equal(notes[0].owner);
        expect(result.noteHash).to.equal(notes[0].noteHash);
        // TODO: expect(result.noteType).to.equal(notes[0].noteType);
    });

    it('should decode encoded input notes', () => {
        const encoded = outputCoder.encodeNotes([notes[0], notes[1]], false);
        const result = outputCoder.decodeNotes(encoded, false);
        expect(result.length).to.equal(2);
        for (let i = 0; i < result.length; i += 1) {
            expect(result[i].gamma.eq(notes[i].gamma)).to.equal(true);
            expect(result[i].sigma.eq(notes[i].sigma)).to.equal(true);
            expect(result[i].owner).to.equal(notes[i].owner);
            expect(result[i].noteHash).to.equal(notes[i].noteHash);
        }
    });

    it('should decode encoded output notes', () => {
        const encoded = outputCoder.encodeNotes([notes[0], notes[1]], true); // setting to be output notes
        const result = outputCoder.decodeNotes(encoded, true);
        expect(result.length).to.equal(2);
        for (let i = 0; i < result.length; i += 1) {
            expect(result[i].gamma.eq(notes[i].gamma)).to.equal(true);
            expect(result[i].sigma.eq(notes[i].sigma)).to.equal(true);
            expect(result[i].owner).to.equal(notes[i].owner);
            expect(result[i].noteHash).to.equal(notes[i].noteHash);
            expect(result[i].ephemeral.eq(notes[i].ephemeralFromMetaData().getPublic())).to.equal(true);
        }
    });

    it('should decode a proof output', () => {
        const publicValue = new BN(123456789);
        const encoded = outputCoder.encodeProofOutput({
            inputNotes: [notes[0], notes[1]],
            outputNotes: [notes[2], notes[3]],
            publicOwner: notes[3].owner,
            publicValue,
            challenge: challenges[0],
        });
        const result = outputCoder.decodeProofOutput(encoded);

        expect(result.publicOwner).to.equal(notes[3].owner);
        expect(result.publicValue).to.equal(publicValue.toNumber());
        expect(result.challenge).to.equal(challenges[0]);
        expect(result.inputNotes.length).to.equal(2);
        expect(result.outputNotes.length).to.equal(2);
        for (let i = 0; i < result.inputNotes.length; i += 1) {
            expect(result.inputNotes[i].gamma.eq(notes[i].gamma)).to.equal(true);
            expect(result.inputNotes[i].sigma.eq(notes[i].sigma)).to.equal(true);
            expect(result.inputNotes[i].owner).to.equal(notes[i].owner);
            expect(result.inputNotes[i].noteHash).to.equal(notes[i].noteHash);
        }
        for (let i = 0; i < result.outputNotes.length; i += 1) {
            expect(result.outputNotes[i].gamma.eq(notes[i + 2].gamma)).to.equal(true);
            expect(result.outputNotes[i].sigma.eq(notes[i + 2].sigma)).to.equal(true);
            expect(result.outputNotes[i].ephemeral.eq(notes[i + 2].ephemeralFromMetaData().getPublic())).to.equal(true);
            expect(result.outputNotes[i].owner).to.equal(notes[i + 2].owner);
            expect(result.outputNotes[i].noteHash).to.equal(notes[i + 2].noteHash);
        }
    });

    it('should decode proof outputs', () => {
        const proofOutputs = [
            {
                inputNotes: [notes[0], notes[1]],
                outputNotes: [notes[2], notes[3]],
                publicOwner: notes[3].owner,
                publicValue: new BN(123456789),
                challenge: challenges[0],
            },
            {
                inputNotes: [notes[4], notes[5]],
                outputNotes: [notes[7], notes[6]],
                publicOwner: notes[8].owner,
                publicValue: new BN(987654321),
                challenge: challenges[1],
            },
        ];
        const encoded = outputCoder.encodeProofOutputs(proofOutputs);
        const result = outputCoder.decodeProofOutputs(encoded);
        expect(result.length).to.equal(proofOutputs.length);
        for (let i = 0; i < result.length; i += 1) {
            expect(result[i].publicOwner).to.equal(proofOutputs[i].publicOwner.toLowerCase());
            expect(result[i].publicValue).to.equal(proofOutputs[i].publicValue.toNumber());
            expect(result[i].challenge).to.equal(challenges[i]);
            expect(result[i].inputNotes.length).to.equal(proofOutputs[i].inputNotes.length);
            expect(result[i].outputNotes.length).to.equal(proofOutputs[i].outputNotes.length);
            for (let j = 0; j < result[i].inputNotes.length; j += 1) {
                expect(result[i].inputNotes[j].gamma.eq(proofOutputs[i].inputNotes[j].gamma)).to.equal(true);
                expect(result[i].inputNotes[j].sigma.eq(proofOutputs[i].inputNotes[j].sigma)).to.equal(true);
                expect(result[i].inputNotes[j].owner).to.equal(proofOutputs[i].inputNotes[j].owner.toLowerCase());
                expect(result[i].inputNotes[j].noteHash).to.equal(proofOutputs[i].inputNotes[j].noteHash);
            }
            for (let j = 0; j < result[i].outputNotes.length; j += 1) {
                expect(
                    result[i].outputNotes[j].ephemeral.eq(proofOutputs[i].outputNotes[j].ephemeralFromMetaData().getPublic()),
                ).to.equal(true);
                expect(result[i].outputNotes[j].gamma.eq(proofOutputs[i].outputNotes[j].gamma)).to.equal(true);
                expect(result[i].outputNotes[j].sigma.eq(proofOutputs[i].outputNotes[j].sigma)).to.equal(true);
                expect(result[i].outputNotes[j].owner).to.equal(proofOutputs[i].outputNotes[j].owner.toLowerCase());
                expect(result[i].outputNotes[j].noteHash).to.equal(proofOutputs[i].outputNotes[j].noteHash);
            }
        }
    });
});
