const chai = require('chai');
const { padLeft } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const secp256k1 = require('../../../src/secp256k1');
const note = require('../../../src/note');
const joinSplit = require('../../../src/abiEncoder/joinSplit');
const { K_MAX } = require('../../../src/params');

const { expect } = chai;

function randomNoteValue() {
    return Math.floor(Math.random() * Math.floor(K_MAX));
}

function clean(input) {
    return input.replace(/^0+/, '');
}

function isHex(input) {
    return input.match(new RegExp('^[0-9a-fA-F]+$')) !== null;
}

class HexString extends String {
    slice(a, b = null) {
        if (b) {
            return (super.slice(a * 2, b * 2));
        }
        return (super.slice(a * 2));
    }

    hexLength() {
        return this.length / 2;
    }
}

describe('abiEncoder.outputCoder tests', () => {
    let accounts = [];
    let notes = [];
    beforeEach(() => {
        accounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        notes = accounts.map(({ publicKey }) => {
            return note.create(publicKey, randomNoteValue());
        });
    });

    afterEach(() => {
    });

    it('isHex works', () => {
        expect(isHex('0123456789abcdefABCDEF')).to.equal(true);
        expect(isHex('x1234')).to.equal(false);
    });

    it('outputCoder can encode output note', () => {
        const encoded = new HexString(joinSplit.outputCoder.encodeOutputNote(notes[0]));
        expect(isHex(encoded)).to.equal(true);
        expect(encoded.hexLength()).to.equal(0xe1);

        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(0xe1 - 0x20);
        expect(encoded.slice(0x20, 0x40)).to.equal(padLeft(notes[0].owner.slice(2), 64));
        expect(encoded.slice(0x40, 0x60)).to.equal(padLeft(notes[0].noteHash.slice(2), 64));
        expect(clean(encoded.slice(0x60, 0x80))).to.equal('61');
        expect(bn128.decompressHex(encoded.slice(0x80, 0xa0)).eq(notes[0].gamma)).to.equal(true);
        expect(bn128.decompressHex(encoded.slice(0xa0, 0xc0)).eq(notes[0].sigma)).to.equal(true);
        expect(secp256k1.decompressHex(encoded.slice(0xc0)).eq(notes[0].ephemeral.getPublic())).to.equal(true);
    });

    it('outputCoder can encode input note', () => {
        const encoded = new HexString(joinSplit.outputCoder.encodeInputNote(notes[0]));
        expect(isHex(encoded)).to.equal(true);
        expect(encoded.hexLength()).to.equal(0xc0);

        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(0xc0 - 0x20);
        expect((encoded.slice(0x20, 0x40))).to.equal(padLeft(notes[0].owner.slice(2), 64));
        expect(encoded.slice(0x40, 0x60)).to.equal(padLeft(notes[0].noteHash.slice(2), 64));
        expect(clean(encoded.slice(0x60, 0x80))).to.equal('40');
        expect(bn128.decompressHex(encoded.slice(0x80, 0xa0)).eq(notes[0].gamma)).to.equal(true);
        expect(bn128.decompressHex(encoded.slice(0xa0, 0xc0)).eq(notes[0].sigma)).to.equal(true);
    });

    it('outputCoder can encode notes', () => {
        const inputNotes = [notes[0], notes[2], notes[5]];
        const encoded = new HexString(joinSplit.outputCoder.encodeNotes(inputNotes, true));

        expect(isHex(encoded)).to.equal(true);
        const length = parseInt(encoded.slice(0x20, 0x40), 16);
        expect(length).to.equal(inputNotes.length);

        let sum = 0x40;
        for (let i = 0; i < length; i += 1) {
            const location = parseInt(encoded.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const encodedNote = encoded.slice(location, location + 0x20 + byteLength);
            sum += (byteLength + 0x40);
            expect(encodedNote).to.equal(joinSplit.outputCoder.encodeOutputNote(inputNotes[i]));
        }
        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(sum - 0x20);
        expect(encoded.hexLength()).to.equal(sum);
    });

    it('outputCoder can encode a proof output', () => {
        const inputNotes = [notes[0], notes[1]];
        const outputNotes = [notes[2], notes[3], notes[4]];
        const publicOwner = accounts[5].address;
        const publicValue = randomNoteValue();
        const encoded = new HexString(joinSplit.outputCoder.encodeProofOutput({
            inputNotes,
            outputNotes,
            publicOwner,
            publicValue,
        }));
        expect(isHex(encoded)).to.equal(true);
        const encodedLength = parseInt(encoded.slice(0x00, 0x20), 16);
        const inputsLocation = parseInt(encoded.slice(0x20, 0x40), 16);
        const outputsLocation = parseInt(encoded.slice(0x40, 0x60), 16);
        const recoveredOwner = encoded.slice(0x60, 0x80);
        const recoveredValue = parseInt(encoded.slice(0x80, 0xa0), 16);
        const inputsLength = parseInt(encoded.slice(inputsLocation, inputsLocation + 0x20), 16);
        const outputsLength = parseInt(encoded.slice(outputsLocation, outputsLocation + 0x20), 16);
        const encodedInputNotes = new HexString(encoded.slice(inputsLocation, inputsLocation + 0x20 + inputsLength));
        const encodedOutputNotes = new HexString(encoded.slice(outputsLocation, outputsLocation + 0x20 + outputsLength));
        const totalLength = encodedInputNotes.hexLength() + encodedOutputNotes.hexLength() + 0xa0;

        expect(encodedLength).to.equal(encoded.hexLength() - 0x20);
        expect(recoveredOwner).to.equal(padLeft(publicOwner.slice(2), 64));
        expect(recoveredValue).to.equal(publicValue);
        expect(parseInt(encoded.slice(inputsLocation + 0x20, inputsLocation + 0x40), 16)).to.equal(inputNotes.length);
        expect(parseInt(encoded.slice(outputsLocation + 0x20, outputsLocation + 0x40), 16)).to.equal(outputNotes.length);
        expect(String(encodedInputNotes)).to.equal(joinSplit.outputCoder.encodeNotes(inputNotes, false));
        expect(String(encodedOutputNotes)).to.equal(joinSplit.outputCoder.encodeNotes(outputNotes, true));
        expect(encoded.hexLength()).to.equal(totalLength);
    });

    it('outputCoder can encode proof outputs', () => {
        const proofs = [{
            inputNotes: [notes[0], notes[1]],
            outputNotes: [notes[2], notes[3]],
            publicOwner: accounts[4].address,
            publicValue: randomNoteValue(),
        }, {
            inputNotes: [notes[5], notes[6]],
            outputNotes: [notes[7], notes[8]],
            publicOwner: accounts[9].address,
            publicValue: randomNoteValue(),
        }];
        const encoded = new HexString(joinSplit.outputCoder.encodeProofOutputs(proofs).slice(2));
        expect(isHex(encoded)).to.equal(true);

        const encodedLength = parseInt(encoded.slice(0x00, 0x20), 16);
        const numProofs = parseInt(encoded.slice(0x20, 0x40), 16);

        expect(numProofs).to.equal(2);
        let sum = 0x40;
        for (let i = 0; i < numProofs; i += 1) {
            const location = parseInt(encoded.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const proofOutput = encoded.slice(location, location + 0x20 + byteLength);
            expect(proofOutput).to.equal(joinSplit.outputCoder.encodeProofOutput(proofs[i]).toLowerCase());
            sum += (byteLength + 0x40);
        }
        expect(encodedLength).to.equal(sum - 0x20);
        expect(encoded.hexLength()).to.equal(sum);
    });

    it('outputCoder can decode an encoded output note', () => {
        const encoded = joinSplit.outputCoder.encodeOutputNote(notes[0]);
        const result = joinSplit.outputCoder.decodeOutputNote(encoded);
        expect(result.gamma.eq(notes[0].gamma)).to.equal(true);
        expect(result.sigma.eq(notes[0].sigma)).to.equal(true);
        expect(result.ephemeral.eq(notes[0].ephemeral.getPublic())).to.equal(true);
        expect(result.owner).to.equal(notes[0].owner);
        expect(result.noteHash).to.equal(notes[0].noteHash);
    });

    it('outputCoder can decode an encoded input note', () => {
        const encoded = joinSplit.outputCoder.encodeInputNote(notes[0]);
        const result = joinSplit.outputCoder.decodeInputNote(encoded);
        expect(result.gamma.eq(notes[0].gamma)).to.equal(true);
        expect(result.sigma.eq(notes[0].sigma)).to.equal(true);
        expect(result.owner).to.equal(notes[0].owner);
        expect(result.noteHash).to.equal(notes[0].noteHash);
    });

    it('outputCoder can decode encoded input notes', () => {
        const encoded = joinSplit.outputCoder.encodeNotes([notes[0], notes[1]], true);
        const result = joinSplit.outputCoder.decodeNotes(encoded, true);
        expect(result.length).to.equal(2);
        for (let i = 0; i < result.length; i += 1) {
            expect(result[i].gamma.eq(notes[i].gamma)).to.equal(true);
            expect(result[i].sigma.eq(notes[i].sigma)).to.equal(true);
            expect(result[i].ephemeral.eq(notes[i].ephemeral.getPublic())).to.equal(true);
            expect(result[i].owner).to.equal(notes[i].owner);
            expect(result[i].noteHash).to.equal(notes[i].noteHash);
        }
    });

    it('outputCoder can decode a proof output', () => {
        const encoded = joinSplit.outputCoder.encodeProofOutput({
            inputNotes: [notes[0], notes[1]],
            outputNotes: [notes[2], notes[3]],
            publicOwner: notes[3].owner,
            publicValue: 123456789,
        });
        const result = joinSplit.outputCoder.decodeProofOutput(encoded);

        expect(result.publicOwner).to.equal(notes[3].owner);
        expect(result.publicValue).to.equal(123456789);
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
            expect(result.outputNotes[i].ephemeral.eq(notes[i + 2].ephemeral.getPublic())).to.equal(true);
            expect(result.outputNotes[i].owner).to.equal(notes[i + 2].owner);
            expect(result.outputNotes[i].noteHash).to.equal(notes[i + 2].noteHash);
        }
    });


    it('outputCoder can decode proof outputs', () => {
        const proofOutputs = [{
            inputNotes: [notes[0], notes[1]],
            outputNotes: [notes[2], notes[3]],
            publicOwner: notes[3].owner,
            publicValue: 123456789,
        }, {
            inputNotes: [notes[4], notes[5]],
            outputNotes: [notes[7], notes[6]],
            publicOwner: notes[8].owner,
            publicValue: 987654321,
        }];
        const encoded = joinSplit.outputCoder.encodeProofOutputs(proofOutputs);
        const result = joinSplit.outputCoder.decodeProofOutputs(encoded);
        expect(result.length).to.equal(proofOutputs.length);
        for (let i = 0; i < result.length; i += 1) {
            expect(result[i].publicOwner).to.equal(proofOutputs[i].publicOwner.toLowerCase());
            expect(result[i].publicValue).to.equal(proofOutputs[i].publicValue);
            expect(result[i].inputNotes.length).to.equal(proofOutputs[i].inputNotes.length);
            expect(result[i].outputNotes.length).to.equal(proofOutputs[i].outputNotes.length);
            for (let j = 0; j < result[i].inputNotes.length; j += 1) {
                expect(result[i].inputNotes[j].gamma.eq(proofOutputs[i].inputNotes[j].gamma)).to.equal(true);
                expect(result[i].inputNotes[j].sigma.eq(proofOutputs[i].inputNotes[j].sigma)).to.equal(true);
                expect(result[i].inputNotes[j].owner).to.equal(proofOutputs[i].inputNotes[j].owner.toLowerCase());
                expect(result[i].inputNotes[j].noteHash).to.equal(proofOutputs[i].inputNotes[j].noteHash);
            }
            for (let j = 0; j < result[i].outputNotes.length; j += 1) {
                expect(result[i].outputNotes[j].ephemeral.eq(proofOutputs[i].outputNotes[j].ephemeral.getPublic()))
                    .to.equal(true);
                expect(result[i].outputNotes[j].gamma.eq(proofOutputs[i].outputNotes[j].gamma)).to.equal(true);
                expect(result[i].outputNotes[j].sigma.eq(proofOutputs[i].outputNotes[j].sigma)).to.equal(true);
                expect(result[i].outputNotes[j].owner).to.equal(proofOutputs[i].outputNotes[j].owner.toLowerCase());
                expect(result[i].outputNotes[j].noteHash).to.equal(proofOutputs[i].outputNotes[j].noteHash);
            }
        }
    });
});
