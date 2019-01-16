const chai = require('chai');

const secp256k1 = require('../../secp256k1/secp256k1');
const note = require('../../note/note');
const abiEncoder = require('../../abiEncoder/joinSplit');
const { K_MAX } = require('../../params');

const { expect } = chai;

function randomNoteValue() {
    return Math.floor(Math.random() * Math.floor(K_MAX));
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

describe.only('abiEncioder.joinSplit tests', () => {
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

    it('encodeMetadata works', () => {
        const { data, length } = abiEncoder.encodeMetadata(notes.slice(0, 4));
        const result = new HexString(data);
        expect(length).to.equal(result.hexLength());
        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(4);
        for (let i = 0; i < 4; i += 1) {
            const offset = parseInt(result.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
            expect(metadataLength).to.equal(0x21);
            const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
            expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
        }
    });
});
