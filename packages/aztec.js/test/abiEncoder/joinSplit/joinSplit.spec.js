const chai = require('chai');
const { padLeft } = require('web3-utils');

const HexString = require('../HexString');
const aztecProof = require('../../../src/proof/joinSplit');
const secp256k1 = require('../../../src/secp256k1');
const sign = require('../../../src/sign');
const note = require('../../../src/note');
const joinSplit = require('../../../src/abiEncoder/joinSplit');
const { K_MAX } = require('../../../src/params');

const { expect } = chai;

function randomNoteValue() {
    return Math.floor(Math.random() * Math.floor(K_MAX));
}

function randomBytes(numBytes) {
    return [...new Array(numBytes * 2)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function fakeSignature() {
    return [
        `0x${padLeft(randomBytes(1), 64)}`,
        `0x${randomBytes(32)}`,
        `0x${randomBytes(32)}`,
    ];
}

describe('abiEncoder.joinSplit tests', () => {
    it('encodeMetadata works', () => {
        // Setup
        const accounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        const notes = accounts.map(({ publicKey }) => {
            return note.create(publicKey, randomNoteValue());
        });
        const numNotes = 4;

        // Main
        const { data, length } = joinSplit.encodeMetadata(notes.slice(0, 4));
        const result = new HexString(data);
        expect(length).to.equal(result.hexLength());
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
        expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(4);
        for (let i = 0; i < numNotes; i += 1) {
            const offset = parseInt(result.slice(0x40 + (i * 0x20), 0x60 + (i * 0x20)), 16);
            const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
            expect(metadataLength).to.equal(0x21);
            const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
            expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
        }
    });

    it('encodeInputSignatures works', () => {
        const input = [
            fakeSignature(),
            fakeSignature(),
            fakeSignature(),
        ];
        const { data, length } = joinSplit.encodeInputSignatures(input);
        const result = new HexString(data);
        expect(result.hexLength()).to.equal((0x60 * input.length) + 0x20);
        expect(result.hexLength()).to.equal(length);
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(input.length);
        for (let i = 0; i < input.length; i += 1) {
            expect(result.slice(0x20 + (i * 0x60), 0x40 + (i * 0x60))).to.equal(input[i][0].slice(2));
            expect(result.slice(0x40 + (i * 0x60), 0x60 + (i * 0x60))).to.equal(input[i][1].slice(2));
            expect(result.slice(0x60 + (i * 0x60), 0x80 + (i * 0x60))).to.equal(input[i][2].slice(2));
        }
    });

    it('joinSplit is correctly formatted', () => {
        // Setup
        const accounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        const notes = accounts.map(({ publicKey }) => {
            return note.create(publicKey, randomNoteValue());
        });
        const numNotes = 4;
        const m = 2;
        const inputNotes = notes.slice(0, 2);
        const outputNotes = notes.slice(2, 4);
        const senderAddress = accounts[0].address;
        const contractAddress = accounts[1].address;

        // Main
        const {
            proofData,
            challenge,
        } = aztecProof.constructJoinSplit([...inputNotes, ...outputNotes], m, senderAddress, 0);

        const inputSignatures = inputNotes.map((inputNote, index) => {
            const { privateKey } = accounts[index];
            return sign.signNote(proofData[index], challenge, senderAddress, contractAddress, privateKey, 100);
        });
        const publicOwner = accounts[0].address;
        const outputOwners = outputNotes.map(n => n.owner);

        const result = new HexString(joinSplit.encode(
            proofData,
            m,
            challenge,
            publicOwner,
            inputSignatures,
            outputOwners,
            outputNotes
        ).slice(2));
        expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(2);
        expect(result.slice(0x20, 0x40)).to.equal(padLeft(challenge.slice(2), 64));
        expect(result.slice(0x40, 0x60)).to.equal(padLeft(publicOwner.slice(2).toLowerCase(), 64));

        const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
        expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4);
        const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + (4 * 0xc0)));
        for (let i = 0; i < numNotes; i += 1) {
            const recoveredNote = recoveredProofData.slice((i * 0xc0), ((i * 0xc0) + 0xc0));
            expect(recoveredNote).to.equal(proofData[i].map(p => p.slice(2)).join(''));
        }

        const offsetToSignatures = parseInt(result.slice(0x80, 0xa0), 16);
        expect(parseInt(result.slice(offsetToSignatures - 0x20, offsetToSignatures), 16)).to.equal(2);
        const recoveredSignatures = new HexString(result.slice(offsetToSignatures, offsetToSignatures + 3 * 0x60));
        for (let i = 0; i < 2; i += 1) {
            const recoveredSignature = recoveredSignatures.slice(i * 0x60, (i * 0x60) + 0x60);
            expect(recoveredSignature).to.equal(inputSignatures[i].map(s => s.slice(2)).join(''));
        }

        const offsetToOwners = parseInt(result.slice(0xa0, 0xc0), 16);
        expect(parseInt(result.slice(offsetToOwners - 0x20, offsetToOwners), 16)).to.equal(2);
        const recoveredOwners = new HexString(result.slice(offsetToOwners, offsetToOwners + (2 * 0x20)));
        expect(recoveredOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
        expect(recoveredOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

        const offsetToMetadata = parseInt(result.slice(0xc0, 0xe0), 16);
        const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
        expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

        const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
        expect(recoveredMetadata).to.equal(joinSplit.encodeMetadata(outputNotes).data);
    });
});
