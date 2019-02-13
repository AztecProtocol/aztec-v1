const chai = require('chai');
const { padLeft } = require('web3-utils');

const HexString = require('../HexString');
const dividendComputation = require('../../../src/proof/dividendComputation');
const secp256k1 = require('../../../src/secp256k1');
const note = require('../../../src/note');
const abiEncoder = require('../../../src/abiEncoder/dividendComputation');

const { expect } = chai;

describe('abiEncioder.dividendComputation tests', () => {
    let accounts = [];
    let notes = [];
    let za;
    let zb;

    it('encodeMetadata works', () => {
        // Setup
        const numNotes = 3;
        const noteValues = [90, 4, 50];
        accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
        notes = accounts.map(({ publicKey }, i) => {
            return note.create(publicKey, noteValues[i]);
        });

        za = 100;
        zb = 5;

        // Main
        const { data, length } = abiEncoder.encodeMetadata(notes);
        const result = new HexString(data);
        expect(length).to.equal(result.hexLength());
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);
        for (let i = 0; i < numNotes; i += 1) {
            const offset = parseInt(result.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
            expect(metadataLength).to.equal(0x21);
            const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
            expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
        }
    });

    it('dividendComputation is correctly formatted', () => {
        // Setup
        const numNotes = 3;
        const noteValues = [90, 4, 50];
        accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
        notes = accounts.map(({ publicKey }, i) => {
            return note.create(publicKey, noteValues[i]);
        });

        za = 100;
        zb = 5;

        const inputNotes = notes.slice(0, 1);
        const outputNotes = notes.slice(1, 3);

        const senderAddress = accounts[0].address;

        // Main
        const {
            proofData,
            challenge,
        } = dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, senderAddress);

        const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12)], [proofData.slice(12, 18)]);

        const inputOwners = inputNotes.map(m => m.owner);
        const outputOwners = outputNotes.map(n => n.owner);

        const result = new HexString(abiEncoder.encode(
            proofDataFormatted,
            challenge,
            za,
            zb,
            inputOwners,
            outputOwners,
            outputNotes
        ).slice(2));
        expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(za);
        expect(parseInt(result.slice(0x40, 0x60), 16)).to.equal(zb);

        const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
        expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(3);
        const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + (4 * 0xc0)));
        for (let i = 0; i < numNotes; i += 1) {
            const recoveredNote = recoveredProofData.slice((i * 0xc0), ((i * 0xc0) + 0xc0));
            expect(recoveredNote).to.equal(proofDataFormatted[i].map(p => p.slice(2)).join(''));
        }

        const offsetToInputOwners = parseInt(result.slice(0x80, 0xa0), 16);
        expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(1);
        const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
        expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

        const offsetToOutputOwners = parseInt(result.slice(0xa0, 0xc0), 16);
        expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(2);
        const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + (2 * 0x20)));
        expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
        expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

        const offsetToMetadata = parseInt(result.slice(0xc0, 0xe0), 16);
        const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
        expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

        const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
        expect(recoveredMetadata).to.equal(abiEncoder.encodeMetadata(outputNotes).data);
    });
});
