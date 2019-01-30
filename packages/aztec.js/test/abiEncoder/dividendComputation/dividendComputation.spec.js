const chai = require('chai');
const { padLeft } = require('web3-utils');

const dividendComputation = require('../../../src/proof/dividendComputation');
const secp256k1 = require('../../../src/secp256k1');
const sign = require('../../../src/sign');
const note = require('../../../src/note');
const abiEncoder = require('../../../src/abiEncoder/dividendComputation');
const { K_MAX } = require('../../../src/params');

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

describe('abiEncioder.dividendComputation tests', () => {
    let accounts = [];
    let notes = [];
    let za;
    let zb;

    beforeEach(() => {
        const noteValues = [90, 4, 50];
        accounts = [...new Array(3)].map(() => secp256k1.generateAccount());
        notes = accounts.map(({ publicKey }, i) => {
            return note.create(publicKey, noteValues[i]);
        });

        za = 100;
        zb = 5;
    });

    afterEach(() => {
    });

    it('encodeMetadata works', () => {
        const { data, length } = abiEncoder.encodeMetadata(notes);
        const result = new HexString(data);
        expect(length).to.equal(result.hexLength());
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(3);
        for (let i = 0; i < 3; i += 1) { // this stuff will change, depending on encoding setup
            const offset = parseInt(result.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
            expect(metadataLength).to.equal(0x21);
            const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
            expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
        }
    });

    it('dividendComputation is correctly formatted', () => {
        const inputNotes = notes.slice(0, 1);
        const outputNotes = notes.slice(1, 3);

        const senderAddress = accounts[0].address;
        const contractAddress = accounts[1].address;
        let {
            proofData,
            challenge,
        } = dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, senderAddress);
        
        // Putting into format required by ABI input encoder 
        // (expects note data to be seperated out into arrays for each note)
        proofData = [proofData.slice(0, 6)].concat([proofData.slice(6, 12)], [proofData.slice(12, 18)]);

        const inputOwners = inputNotes.map(m => m.owner);
        const outputOwners = outputNotes.map(n => n.owner);

        const result = new HexString(abiEncoder.encode(
            proofData,
            challenge,
            inputOwners,
            outputOwners,
            outputNotes
        ).slice(2));
        expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

        const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
        expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(3);
        const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + (4 * 0xc0)));
        for (let i = 0; i < 3; i += 1) {
            const recoveredNote = recoveredProofData.slice((i * 0xc0), ((i * 0xc0) + 0xc0));
            expect(recoveredNote).to.equal(proofData[i].map(p => p.slice(2)).join(''));
        }

        const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
        expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(1); // one piece of data in the element
        const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60)); // why are we doing 3 + 0x60
        expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

        const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
        expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(2);
        const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + (2 * 0x20)));
        expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
        expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

        const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);
        const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
        expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

        const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
        expect(recoveredMetadata).to.equal(abiEncoder.encodeMetadata(outputNotes).data);
    });
});
