const chai = require('chai');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128/bn128');
const secp256k1 = require('../../secp256k1/secp256k1');
const note = require('../../note/note');
const outputCoder = require('../../abiEncoder/outputCoder');
const { K_MAX } = require('../../params');

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

describe.only('abiEncioder.outputCoder tests', () => {
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

    it('outputCoder can encode note', () => {
        const encoded = new HexString(outputCoder.encodeNote(notes[0]));
        expect(isHex(encoded)).to.equal(true);
        expect(encoded.hexLength()).to.equal(0xe1);

        expect(clean(encoded.slice(0x00, 0x20))).to.equal('e1');
        expect((encoded.slice(0x20, 0x40))).to.equal(padLeft(notes[0].owner.slice(2), 64));
        expect(clean(encoded.slice(0x40, 0x60))).to.equal(notes[0].noteHash.slice(2));
        expect(clean(encoded.slice(0x60, 0x80))).to.equal('61');
        expect(bn128.decompressHex(encoded.slice(0x80, 0xa0)).eq(notes[0].gamma)).to.equal(true);
        expect(bn128.decompressHex(encoded.slice(0xa0, 0xc0)).eq(notes[0].sigma)).to.equal(true);
        expect(secp256k1.decompressHex(encoded.slice(0xc0)).eq(notes[0].ephemeral.getPublic())).to.equal(true);
    });

    it('outputCoder can encode notes', () => {
        const inputNotes = [notes[0], notes[2], notes[5]];
        const encoded = new HexString(outputCoder.encodeNotes(inputNotes));

        expect(isHex(encoded)).to.equal(true);
        const length = parseInt(encoded.slice(0x20, 0x40), 16);
        expect(length).to.equal(inputNotes.length);

        let sum = 0x40;
        for (let i = 0; i < length; i += 1) {
            const location = parseInt(encoded.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const encodedNote = encoded.slice(location, location + byteLength);
            sum += (byteLength + 0x20);
            expect(encodedNote).to.equal(outputCoder.encodeNote(inputNotes[i]));
        }
        expect(parseInt(encoded.slice(0x00, 0x20), 16)).to.equal(sum);
    });

    it('outputCoder can encode a proof output', () => {
        const inputNotes = [notes[0], notes[1]];
        const outputNotes = [notes[2], notes[3], notes[4]];
        const publicOwner = accounts[5].address;
        const publicValue = randomNoteValue();
        const encoded = new HexString(outputCoder.encodeProofOutput({
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
        const encodedInputNotes = new HexString(encoded.slice(inputsLocation, inputsLocation + inputsLength));
        const encodedOutputNotes = new HexString(encoded.slice(outputsLocation, outputsLocation + outputsLength));
        const totalLength = encodedInputNotes.hexLength() + encodedOutputNotes.hexLength() + 0xa0;

        expect(encodedLength).to.equal(encoded.hexLength());
        expect(recoveredOwner).to.equal(padLeft(publicOwner.slice(2), 64));
        expect(recoveredValue).to.equal(publicValue);
        expect(parseInt(encoded.slice(inputsLocation + 0x20, inputsLocation + 0x40), 16)).to.equal(inputNotes.length);
        expect(parseInt(encoded.slice(outputsLocation + 0x20, outputsLocation + 0x40), 16)).to.equal(outputNotes.length);
        expect(String(encodedInputNotes)).to.equal(outputCoder.encodeNotes(inputNotes));
        expect(String(encodedOutputNotes)).to.equal(outputCoder.encodeNotes(outputNotes));
        expect(encoded.hexLength()).to.equal(totalLength);
    });

    it('outputCoder can encode proof otputs', () => {
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
        const encoded = new HexString(outputCoder.encodeProofOutputs(proofs));
        expect(isHex(encoded)).to.equal(true);

        const encodedLength = parseInt(encoded.slice(0x00, 0x20), 16);
        const numProofs = parseInt(encoded.slice(0x20, 0x40), 16);

        expect(numProofs).to.equal(2);
        let sum = 0x40;
        for (let i = 0; i < numProofs; i += 1) {
            const location = parseInt(encoded.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const byteLength = parseInt(encoded.slice(location, location + 0x20), 16);
            const proofOutput = encoded.slice(location, location + byteLength);
            expect(proofOutput).to.equal(outputCoder.encodeProofOutput(proofs[i]));
            sum += (byteLength + 0x20);
        }
        expect(encodedLength).to.equal(sum);
    });
});
