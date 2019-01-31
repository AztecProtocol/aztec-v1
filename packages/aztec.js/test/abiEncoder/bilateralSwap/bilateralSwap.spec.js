const chai = require('chai');
const { padLeft } = require('web3-utils');

// const bilateralProof = require('../../proof/bilateralProof');
const bilateralProof = require('../../../src/proof/bilateralSwap');
const bilateralSwap = require('../../../src/abiEncoder/bilateralSwap');
const secp256k1 = require('../../../src/secp256k1');
const note = require('../../../src/note');

const { expect } = chai;


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


describe('abiEncoder.bilateralSwap tests', () => {
    let accounts = [];
    let notes = [];
    beforeEach(() => {
        accounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        const noteValues = [10, 20, 10, 20, 5, 6, 7, 8, 9, 10];
        notes = accounts.map(({ publicKey }, i) => {
            return note.create(publicKey, noteValues[i]);
        });
    });

    afterEach(() => {
    });

    it('encodeMetadata works', () => {
        const { data, length } = bilateralSwap.encodeMetadata(notes.slice(0, 4));
        const result = new HexString(data);
        expect(length).to.equal(result.hexLength());
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(4);
        for (let i = 0; i < 4; i += 1) {
            const offset = parseInt(result.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
            expect(metadataLength).to.equal(0x21);
            const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
            expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
        }
    });

    it('bilateralSwap is correctly formatted', () => {
        const inputNotes = notes.slice(0, 2);
        const outputNotes = notes.slice(2, 4);
        const senderAddress = accounts[0].address;
        const {
            proofData,
            challenge,
        } = bilateralProof.constructBilateralSwap([...inputNotes, ...outputNotes], senderAddress);

        const inputOwners = inputNotes.map(m => m.owner);
        const outputOwners = outputNotes.map(n => n.owner);

        const result = new HexString(bilateralSwap.encode(
            proofData,
            challenge,
            inputOwners,
            outputOwners,
            outputNotes
        ).slice(2));
        expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

        const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
        expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4);
        const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + (4 * 0xc0)));
        for (let i = 0; i < 4; i += 1) {
            const recoveredNote = recoveredProofData.slice((i * 0xc0), ((i * 0xc0) + 0xc0));
            expect(recoveredNote).to.equal(proofData[i].map(p => p.slice(2)).join(''));
        }

        const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
        expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(2);
        const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + (2 * 0x20)));
        expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));
        expect(recoveredInputOwners.slice(0x20, 0x40)).to.equal(padLeft(inputOwners[1].slice(2).toLowerCase(), 64));

        const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
        expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(2);
        const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + (2 * 0x20)));
        expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
        expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

        const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);
        const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
        expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

        const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
        expect(recoveredMetadata).to.equal(bilateralSwap.encodeMetadata(outputNotes).data);
    });
});
