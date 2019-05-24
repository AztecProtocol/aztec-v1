<<<<<<< HEAD
const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const { padLeft } = require('web3-utils');

const HexString = require('./HexString');

const bilateralProof = require('../../src/proof/bilateralSwap');
const burnProof = require('../../src/proof/burn');
const dividendComputationProof = require('../../src/proof/dividendComputation');
const joinSplitProof = require('../../src/proof/joinSplit');
const mintProof = require('../../src/proof/mint');
const privateRangeProof = require('../../src/proof/privateRange');
const proofUtils = require('../../src/proof/proofUtils');

const abiEncoder = require('../../src/abiEncoder');
const note = require('../../src/note');

const randomBytes = (numBytes) => {
    return [...new Array(numBytes * 2)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

const fakeSignature = () => {
    return [`0x${padLeft(randomBytes(1), 64)}`, `0x${randomBytes(32)}`, `0x${randomBytes(32)}`];
};

describe.skip('Encoder Factory', () => {
    describe('General Functionality', () => {
        it('should validate that encodeMetadata works', async () => {
            // Setup
            const numNotes = 4;
            const accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20];
            const notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            // Body of test
            const { data, length } = abiEncoder.encoderFactory.encodeMetadata(notes.slice(0, numNotes));
            const result = new HexString(data);
            expect(length).to.equal(result.hexLength());
            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);
            for (let i = 0; i < numNotes; i += 1) {
                const offsetDataStart = 0x40 + i * 0x20;
                const offsetDataFinish = 0x60 + i * 0x20;

                const offset = parseInt(result.slice(offsetDataStart, offsetDataFinish), 16);
                const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
                expect(metadataLength).to.equal(0x21);
                const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
                expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
            }
        });

        it('should validate that encodeInputSignatures works', () => {
            // Setup
            const input = [fakeSignature(), fakeSignature(), fakeSignature()];
            const { data, length } = abiEncoder.encoderFactory.encodeInputSignatures(input);
            const result = new HexString(data);
            expect(result.hexLength()).to.equal(0x60 * input.length + 0x20);
            expect(result.hexLength()).to.equal(length);
            expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(input.length);

            for (let i = 0; i < input.length; i += 1) {
                expect(result.slice(0x20 + i * 0x60, 0x40 + i * 0x60)).to.equal(input[i][0].slice(2));
                expect(result.slice(0x40 + i * 0x60, 0x60 + i * 0x60)).to.equal(input[i][1].slice(2));
                expect(result.slice(0x60 + i * 0x60, 0x80 + i * 0x60)).to.equal(input[i][2].slice(2));
            }
        });
    });

    describe('Trade', () => {
        it('should format trade properly', async () => {
            // Setup
            const numNotes = 4;
            const accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20];
            const notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            // Body of test
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0].address;
            const { proofData, challenge } = bilateralProof.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((m) => m.owner);
            const owners = [...inputOwners, ...outputOwners];

            const result = new HexString(
                abiEncoder.inputCoder.trade(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
            );

            expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));
            const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(numNotes);
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + numNotes * 0xc0));
            for (let i = 0; i < numNotes; i += 1) {
                const noteDataStart = i * 0xc0;
                const noteDataFinish = i * 0xc0 + 0xc0;

                const recoveredNote = recoveredProofData.slice(noteDataStart, noteDataFinish);
                expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
            }

            const offsetToOwners = parseInt(result.slice(0x40, 0x60), 16);
            expect(parseInt(result.slice(offsetToOwners - 0x20, offsetToOwners), 16)).to.equal(4);
            const recoveredOwners = new HexString(result.slice(offsetToOwners, offsetToOwners + 4 * 0x20));
            expect(recoveredOwners.slice(0x00, 0x20)).to.equal(padLeft(owners[0].slice(2).toLowerCase(), 64));
            expect(recoveredOwners.slice(0x20, 0x40)).to.equal(padLeft(owners[1].slice(2).toLowerCase(), 64));
            expect(recoveredOwners.slice(0x40, 0x60)).to.equal(padLeft(owners[2].slice(2).toLowerCase(), 64));
            expect(recoveredOwners.slice(0x60, 0x80)).to.equal(padLeft(owners[3].slice(2).toLowerCase(), 64));

            const offsetToMetadata = parseInt(result.slice(0x60, 0x80), 16);
            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
        });
    });

    describe('Join-Split', () => {
        it('should format joinSplit properly', async () => {
            // Setup
            const accounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all(
                accounts.map(({ publicKey }) => {
                    return note.create(publicKey, proofUtils.randomNoteValue());
                }),
            );
            const numNotes = 4;
            const m = 2;
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0].address;

            // Main
            const { proofData, challenge } = joinSplitProof.constructProof([...inputNotes, ...outputNotes], m, senderAddress, 0);

            const publicOwner = accounts[0].address;
            const outputOwners = outputNotes.map((n) => n.owner);
            const inputOwners = inputNotes.map((n) => n.owner);

            const result = new HexString(
                abiEncoder.inputCoder
                    .joinSplit(proofData, m, challenge, publicOwner, inputOwners, outputOwners, outputNotes)
                    .slice(2),
            );

            const mDataStart = 0x00;
            const mDataFinish = 0x20;

            expect(parseInt(result.slice(mDataStart, mDataFinish), 16)).to.equal(m);
            expect(result.slice(0x20, 0x40)).to.equal(padLeft(challenge.slice(2), 64));
            expect(result.slice(0x40, 0x60)).to.equal(padLeft(publicOwner.slice(2).toLowerCase(), 64));

            const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4);
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

            for (let i = 0; i < numNotes; i += 1) {
                const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
                expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
            }

            const offsetToInputOwners = parseInt(result.slice(0x80, 0xa0), 16);
            const numInputOwners = 2;

            expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputOwners);
            const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 2 * 0x20));
            expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));
            expect(recoveredInputOwners.slice(0x20, 0x40)).to.equal(padLeft(inputOwners[1].slice(2).toLowerCase(), 64));

            const offsetToOutputOwners = parseInt(result.slice(0xa0, 0xc0), 16);
            const numOutputOwners = 2;

            expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputOwners);
            const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
            expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
            expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

            const offsetToMetadata = parseInt(result.slice(0xc0, 0xe0), 16);
            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
        });
    });

    describe('Mint', () => {
        it('should format mint properly', async () => {
            // Setup
            let accounts = [];
            let notes = [];

            const numNotes = 4;
            const noteValues = [50, 30, 10, 10];
            accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 4);

            const senderAddress = accounts[0].address;

            // Main
            const { proofData, challenge } = mintProof.constructProof([...inputNotes, ...outputNotes], senderAddress, 0);

            const inputOwners = inputNotes.map((n) => n.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const result = new HexString(
                abiEncoder.inputCoder.joinSplitFluid(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
            );

            expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

            const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4); // there are 4 notes in this test
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

            for (let i = 0; i < numNotes; i += 1) {
                const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
                expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
            }

            const numInputNotes = 1;
            const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
            expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputNotes); // 1 input note
            const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
            expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

            const numOutputNotes = 3;
            const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
            expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputNotes); // 3 output notes
            const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
            expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
            expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));
            const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);

            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(numOutputNotes);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
        });
    });

    describe('Burn', () => {
        it('should format burn properly', async () => {
            // Setup
            let accounts = [];
            let notes = [];

            const numNotes = 4;
            const noteValues = [50, 30, 10, 10];
            accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 4);

            const senderAddress = accounts[0].address;

            // Main
            const { proofData, challenge } = burnProof.constructProof([...inputNotes, ...outputNotes], senderAddress, 0);

            const inputOwners = inputNotes.map((n) => n.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const result = new HexString(
                abiEncoder.inputCoder.joinSplitFluid(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
            );

            expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

            const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4); // there are 4 notes in this test
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

            for (let i = 0; i < numNotes; i += 1) {
                const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
                expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
            }

            const numInputNotes = 1;
            const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
            expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputNotes); // 1 input note
            const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
            expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

            const numOutputNotes = 3;
            const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
            expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputNotes); // 3 output notes
            const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
            expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
            expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));
            const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);

            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(numOutputNotes);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
        });
    });

    describe('Dividend', () => {
        it('should format dividendComputation properly', async () => {
            // Setup
            let accounts = [];
            let notes = [];
            const za = 100;
            const zb = 5;

            const numNotes = 3;
            const noteValues = [90, 4, 50];
            accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);

            const senderAddress = accounts[0].address;

            // Main
            const { proofData, challenge } = dividendComputationProof.constructProof(
                [...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress,
            );

            const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12)], [proofData.slice(12, 18)]);

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const result = new HexString(
                abiEncoder.inputCoder
                    .dividend(proofDataFormatted, challenge, za, zb, inputOwners, outputOwners, outputNotes)
                    .slice(2),
            );
            expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

            expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(za);
            expect(parseInt(result.slice(0x40, 0x60), 16)).to.equal(zb);

            const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(3);
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));
            for (let i = 0; i < numNotes; i += 1) {
                const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
                expect(recoveredNote).to.equal(proofDataFormatted[i].map((p) => p.slice(2)).join(''));
            }

            const offsetToInputOwners = parseInt(result.slice(0x80, 0xa0), 16);
            expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(1);
            const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
            expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

            const offsetToOutputOwners = parseInt(result.slice(0xa0, 0xc0), 16);
            expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(2);
            const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
            expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
            expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

            const offsetToMetadata = parseInt(result.slice(0xc0, 0xe0), 16);
            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
        });
    });

    describe('Private range proof', () => {
        it('should format privateRange properly', async () => {
            // Setup
            let accounts = [];
            let notes = [];

            const numNotes = 3;
            const noteValues = [10, 4, 6];
            accounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            notes = await Promise.all(
                accounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNote = notes.slice(0, 1);
            const comparisonNote = notes.slice(1, 2);
            const outputNote = notes.slice(2, 3);
            const senderAddress = accounts[0].address;

            // Main
            const { proofData, challenge } = privateRangeProof.constructProof(
                [...inputNote, ...comparisonNote, ...outputNote],
                senderAddress,
            );
            const inputOwners = [inputNote[0].owner];
            const outputOwners = [outputNote[0].owner];

            const result = new HexString(
                abiEncoder.inputCoder.privateRange(proofData, challenge, inputOwners, outputOwners, outputNote).slice(2),
            );
            expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

            const numProofDataElements = 3;
            const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
            expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(numProofDataElements);
            const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));
            for (let i = 0; i < numNotes; i += 1) {
                const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
                expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
            }

            const numInputOwners = 1;
            const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
            expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputOwners);
            const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
            expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

            const numOutputOwners = 1;
            const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
            expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputOwners);
            const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
            expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));

            const numOutputNotes = 1;
            const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);
            const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
            expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(numOutputNotes);

            const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
            expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNote).data);
        });
    });
});
=======
// const { constants, proofs } = require('@aztec/dev-utils');
// const secp256k1 = require('@aztec/secp256k1');
// const { expect } = require('chai');
// const { padLeft } = require('web3-utils');

// const HexString = require('./HexString');

// const swapProof = require('../../src/proof/swapProof');
// const burnProof = require('../../src/proof/burn');
// const dividendComputationProof = require('../../src/proof/dividendComputation');
// const joinSplitProof = require('../../src/proof/joinSplit');
// const mintProof = require('../../src/proof/mint');

// const abiEncoder = require('../../src/abiEncoder');
// const note = require('../../src/note');
// const signer = require('../../src/signer');

// const randomBytes = (numBytes) => {
//     return Array(numBytes * 2).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
// };

// const randomNoteValue = () => {
//     return Math.floor(Math.random() * Math.floor(constants.K_MAX));
// };

// const fakeSignature = () => {
//     return [`0x${padLeft(randomBytes(1), 64)}`, `0x${randomBytes(32)}`, `0x${randomBytes(32)}`];
// };

// describe.skip('Encoder Factory', () => {
//     describe('General Functionality', () => {
//         it('should validate that encodeMetadata works', async () => {
//             // Setup
//             const numNotes = 4;
//             const accounts = Array(numNotes).fill().map(() => secp256k1.generateAccount());
//             const noteValues = [10, 20, 10, 20];
//             const notes = await Promise.all(
//                 accounts.map(({ publicKey }, i) => {
//                     return note.create(publicKey, noteValues[i]);
//                 }),
//             );

//             // Body of test
//             const { data, length } = abiEncoder.encoderFactory.encodeMetadata(notes.slice(0, numNotes));
//             const result = new HexString(data);
//             expect(length).to.equal(result.hexLength());
//             expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(result.hexLength() - 0x20);
//             expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(numNotes);
//             for (let i = 0; i < numNotes; i += 1) {
//                 const offsetDataStart = 0x40 + i * 0x20;
//                 const offsetDataFinish = 0x60 + i * 0x20;

//                 const offset = parseInt(result.slice(offsetDataStart, offsetDataFinish), 16);
//                 const metadataLength = parseInt(result.slice(offset, offset + 0x20), 16);
//                 expect(metadataLength).to.equal(0x21);
//                 const metadata = result.slice(offset + 0x20, offset + 0x20 + metadataLength);
//                 expect(secp256k1.decompressHex(metadata).eq(notes[i].ephemeral.getPublic())).to.equal(true);
//             }
//         });

//         it('should validate that encodeInputSignatures works', () => {
//             // Setup
//             const input = [fakeSignature(), fakeSignature(), fakeSignature()];
//             const { data, length } = abiEncoder.encoderFactory.encodeInputSignatures(input);
//             const result = new HexString(data);
//             expect(result.hexLength()).to.equal(0x60 * input.length + 0x20);
//             expect(result.hexLength()).to.equal(length);
//             expect(parseInt(result.slice(0x00, 0x20), 16)).to.equal(input.length);

//             for (let i = 0; i < input.length; i += 1) {
//                 expect(result.slice(0x20 + i * 0x60, 0x40 + i * 0x60)).to.equal(input[i][0].slice(2));
//                 expect(result.slice(0x40 + i * 0x60, 0x60 + i * 0x60)).to.equal(input[i][1].slice(2));
//                 expect(result.slice(0x60 + i * 0x60, 0x80 + i * 0x60)).to.equal(input[i][2].slice(2));
//             }
//         });
//     });

//     describe('Swap', () => {
//         it('should format swap properly', async () => {
//             // Setup
//             const numNotes = 4;
//             const accounts = Array(numNotes).fill().map(() => secp256k1.generateAccount());
//             const noteValues = [10, 20, 10, 20];
//             const notes = await Promise.all(
//                 accounts.map(({ publicKey }, i) => {
//                     return note.create(publicKey, noteValues[i]);
//                 }),
//             );

//             // Body of test
//             const inputNotes = notes.slice(0, 2);
//             const outputNotes = notes.slice(2, 4);
//             const senderAddress = accounts[0].address;
//             const { proofData, challenge } = swapProof.constructProof([...inputNotes, ...outputNotes], senderAddress);

//             const inputOwners = inputNotes.map((m) => m.owner);
//             const outputOwners = outputNotes.map((m) => m.owner);
//             const owners = [...inputOwners, ...outputOwners];

//             const result = new HexString(
//                 abiEncoder.inputCoder.swap(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
//             );

//             expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));
//             const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
//             expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(numNotes);
//             const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + numNotes * 0xc0));
//             for (let i = 0; i < numNotes; i += 1) {
//                 const noteDataStart = i * 0xc0;
//                 const noteDataFinish = i * 0xc0 + 0xc0;

//                 const recoveredNote = recoveredProofData.slice(noteDataStart, noteDataFinish);
//                 expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
//             }

//             const offsetToOwners = parseInt(result.slice(0x40, 0x60), 16);
//             expect(parseInt(result.slice(offsetToOwners - 0x20, offsetToOwners), 16)).to.equal(4);
//             const recoveredOwners = new HexString(result.slice(offsetToOwners, offsetToOwners + 4 * 0x20));
//             expect(recoveredOwners.slice(0x00, 0x20)).to.equal(padLeft(owners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredOwners.slice(0x20, 0x40)).to.equal(padLeft(owners[1].slice(2).toLowerCase(), 64));
//             expect(recoveredOwners.slice(0x40, 0x60)).to.equal(padLeft(owners[2].slice(2).toLowerCase(), 64));
//             expect(recoveredOwners.slice(0x60, 0x80)).to.equal(padLeft(owners[3].slice(2).toLowerCase(), 64));

//             const offsetToMetadata = parseInt(result.slice(0x60, 0x80), 16);
//             const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
//             expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

//             const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
//             expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
//         });
//     });

//     describe('Join-Split', () => {
//         it('should format joinSplit properly', async () => {
//             // Setup
//             const accounts = Array(10).fill().map(() => secp256k1.generateAccount());
//             const notes = await Promise.all(
//                 accounts.map(({ publicKey }) => {
//                     return note.create(publicKey, randomNoteValue());
//                 }),
//             );
//             const numNotes = 4;
//             const m = 2;
//             const inputNotes = notes.slice(0, 2);
//             const outputNotes = notes.slice(2, 4);
//             const senderAddress = accounts[0].address;
//             const contractAddress = accounts[1].address;

//             // Main
//             const { proofData, challenge } = joinSplitProof.constructProof([...inputNotes, ...outputNotes], m, senderAddress, 0);

//             const inputSignatures = inputNotes.map((inputNote, index) => {
//                 const domain = signer.generateAZTECDomainParams(contractAddress, constants.ACE_DOMAIN_PARAMS);
//                 const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
//                 const message = {
//                     proof: proofs.JOIN_SPLIT_PROOF,
//                     noteHash: inputNote.noteHash,
//                     challenge,
//                     sender: senderAddress,
//                 };
//                 const { privateKey } = accounts[index];
//                 const { signature } = signer.signTypedData(domain, schema, message, privateKey);
//                 return signature;
//             });

//             const publicOwner = accounts[0].address;
//             const outputOwners = outputNotes.map((n) => n.owner);
//             const inputOwners = inputNotes.map((n) => n.owner);

//             const result = new HexString(
//                 abiEncoder.inputCoder
//                     .joinSplit(proofData, m, challenge, publicOwner, inputSignatures, inputOwners, outputOwners, outputNotes)
//                     .slice(2),
//             );

//             const mDataStart = 0x00;
//             const mDataFinish = 0x20;

//             expect(parseInt(result.slice(mDataStart, mDataFinish), 16)).to.equal(m);
//             expect(result.slice(0x20, 0x40)).to.equal(padLeft(challenge.slice(2), 64));
//             expect(result.slice(0x40, 0x60)).to.equal(padLeft(publicOwner.slice(2).toLowerCase(), 64));

//             const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
//             expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4);
//             const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

//             for (let i = 0; i < numNotes; i += 1) {
//                 const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
//                 expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
//             }

//             const offsetToSignatures = parseInt(result.slice(0x80, 0xa0), 16);
//             expect(parseInt(result.slice(offsetToSignatures - 0x20, offsetToSignatures), 16)).to.equal(2);
//             const recoveredSignatures = new HexString(result.slice(offsetToSignatures, offsetToSignatures + 3 * 0x60));
//             for (let i = 0; i < m; i += 1) {
//                 const sigDataStart = i * 0x60;
//                 const sigDataFinish = i * 0x60 + 0x60;
//                 const recoveredSignature = recoveredSignatures.slice(sigDataStart, sigDataFinish);
//                 expect(recoveredSignature).to.equal(inputSignatures[i].map((s) => s.slice(2)).join(''));
//             }

//             const offsetToInputOwners = parseInt(result.slice(0xa0, 0xc0), 16);
//             const numInputOwners = 2;

//             expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputOwners);
//             const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 2 * 0x20));
//             expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredInputOwners.slice(0x20, 0x40)).to.equal(padLeft(inputOwners[1].slice(2).toLowerCase(), 64));

//             const offsetToOutputOwners = parseInt(result.slice(0xc0, 0xe0), 16);
//             const numOutputOwners = 2;

//             expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputOwners);
//             const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
//             expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

//             const offsetToMetadata = parseInt(result.slice(0xe0, 0x100), 16);
//             const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
//             expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

//             const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
//             expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
//         });
//     });

//     describe('Mint', () => {
//         it('should format mint properly', async () => {
//             // Setup
//             let accounts = [];
//             let notes = [];

//             const numNotes = 4;
//             const noteValues = [50, 30, 10, 10];
//             accounts = Array(numNotes).fill().map(() => secp256k1.generateAccount());
//             notes = await Promise.all(
//                 accounts.map(({ publicKey }, i) => {
//                     return note.create(publicKey, noteValues[i]);
//                 }),
//             );

//             const inputNotes = notes.slice(0, 1);
//             const outputNotes = notes.slice(1, 4);

//             const senderAddress = accounts[0].address;

//             // Main
//             const { proofData, challenge } = mintProof.constructProof([...inputNotes, ...outputNotes], senderAddress, 0);

//             const inputOwners = inputNotes.map((n) => n.owner);
//             const outputOwners = outputNotes.map((n) => n.owner);

//             const result = new HexString(
//                 abiEncoder.inputCoder.joinSplitFluid(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
//             );

//             expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

//             const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
//             expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4); // there are 4 notes in this test
//             const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

//             for (let i = 0; i < numNotes; i += 1) {
//                 const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
//                 expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
//             }

//             const numInputNotes = 1;
//             const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
//             expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputNotes); // 1 input note
//             const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
//             expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

//             const numOutputNotes = 3;
//             const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
//             expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputNotes); // 3 output notes
//             const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
//             expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));
//             const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);

//             const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
//             expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(numOutputNotes);

//             const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
//             expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
//         });
//     });

//     describe('Burn', () => {
//         it('should format burn properly', async () => {
//             // Setup
//             let accounts = [];
//             let notes = [];

//             const numNotes = 4;
//             const noteValues = [50, 30, 10, 10];
//             accounts = Array(numNotes).fill().map(() => secp256k1.generateAccount());
//             notes = await Promise.all(
//                 accounts.map(({ publicKey }, i) => {
//                     return note.create(publicKey, noteValues[i]);
//                 }),
//             );

//             const inputNotes = notes.slice(0, 1);
//             const outputNotes = notes.slice(1, 4);

//             const senderAddress = accounts[0].address;

//             // Main
//             const { proofData, challenge } = burnProof.constructProof([...inputNotes, ...outputNotes], senderAddress, 0);

//             const inputOwners = inputNotes.map((n) => n.owner);
//             const outputOwners = outputNotes.map((n) => n.owner);

//             const result = new HexString(
//                 abiEncoder.inputCoder.joinSplitFluid(proofData, challenge, inputOwners, outputOwners, outputNotes).slice(2),
//             );

//             expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

//             const offsetToProofData = parseInt(result.slice(0x20, 0x40), 16);
//             expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(4); // there are 4 notes in this test
//             const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));

//             for (let i = 0; i < numNotes; i += 1) {
//                 const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
//                 expect(recoveredNote).to.equal(proofData[i].map((p) => p.slice(2)).join(''));
//             }

//             const numInputNotes = 1;
//             const offsetToInputOwners = parseInt(result.slice(0x40, 0x60), 16);
//             expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(numInputNotes); // 1 input note
//             const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
//             expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

//             const numOutputNotes = 3;
//             const offsetToOutputOwners = parseInt(result.slice(0x60, 0x80), 16);
//             expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(numOutputNotes); // 3 output notes
//             const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
//             expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));
//             const offsetToMetadata = parseInt(result.slice(0x80, 0xa0), 16);

//             const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
//             expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(numOutputNotes);

//             const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
//             expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
//         });
//     });

//     describe('Dividend', () => {
//         it('should format dividendComputation properly', async () => {
//             // Setup
//             let accounts = [];
//             let notes = [];
//             const za = 100;
//             const zb = 5;

//             const numNotes = 3;
//             const noteValues = [90, 4, 50];
//             accounts = Array(numNotes).fill().map(() => secp256k1.generateAccount());
//             notes = await Promise.all(
//                 accounts.map(({ publicKey }, i) => {
//                     return note.create(publicKey, noteValues[i]);
//                 }),
//             );

//             const inputNotes = notes.slice(0, 1);
//             const outputNotes = notes.slice(1, 3);

//             const senderAddress = accounts[0].address;

//             // Main
//             const { proofData, challenge } = dividendComputationProof.constructProof(
//                 [...inputNotes, ...outputNotes],
//                 za,
//                 zb,
//                 senderAddress,
//             );

//             const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12)], [proofData.slice(12, 18)]);

//             const inputOwners = inputNotes.map((m) => m.owner);
//             const outputOwners = outputNotes.map((n) => n.owner);

//             const result = new HexString(
//                 abiEncoder.inputCoder
//                     .dividend(proofDataFormatted, challenge, za, zb, inputOwners, outputOwners, outputNotes)
//                     .slice(2),
//             );
//             expect(result.slice(0x00, 0x20)).to.equal(padLeft(challenge.slice(2), 64));

//             expect(parseInt(result.slice(0x20, 0x40), 16)).to.equal(za);
//             expect(parseInt(result.slice(0x40, 0x60), 16)).to.equal(zb);

//             const offsetToProofData = parseInt(result.slice(0x60, 0x80), 16);
//             expect(parseInt(result.slice(offsetToProofData - 0x20, offsetToProofData), 16)).to.equal(3);
//             const recoveredProofData = new HexString(result.slice(offsetToProofData, offsetToProofData + 4 * 0xc0));
//             for (let i = 0; i < numNotes; i += 1) {
//                 const recoveredNote = recoveredProofData.slice(i * 0xc0, i * 0xc0 + 0xc0);
//                 expect(recoveredNote).to.equal(proofDataFormatted[i].map((p) => p.slice(2)).join(''));
//             }

//             const offsetToInputOwners = parseInt(result.slice(0x80, 0xa0), 16);
//             expect(parseInt(result.slice(offsetToInputOwners - 0x20, offsetToInputOwners), 16)).to.equal(1);
//             const recoveredInputOwners = new HexString(result.slice(offsetToInputOwners, offsetToInputOwners + 0x60));
//             expect(recoveredInputOwners.slice(0x00, 0x20)).to.equal(padLeft(inputOwners[0].slice(2).toLowerCase(), 64));

//             const offsetToOutputOwners = parseInt(result.slice(0xa0, 0xc0), 16);
//             expect(parseInt(result.slice(offsetToOutputOwners - 0x20, offsetToOutputOwners), 16)).to.equal(2);
//             const recoveredOutputOwners = new HexString(result.slice(offsetToOutputOwners, offsetToOutputOwners + 2 * 0x20));
//             expect(recoveredOutputOwners.slice(0x00, 0x20)).to.equal(padLeft(outputOwners[0].slice(2).toLowerCase(), 64));
//             expect(recoveredOutputOwners.slice(0x20, 0x40)).to.equal(padLeft(outputOwners[1].slice(2).toLowerCase(), 64));

//             const offsetToMetadata = parseInt(result.slice(0xc0, 0xe0), 16);
//             const metadataLength = parseInt(result.slice(offsetToMetadata - 0x20, offsetToMetadata), 16);
//             expect(parseInt(result.slice(offsetToMetadata, offsetToMetadata + 0x20), 16)).to.equal(2);

//             const recoveredMetadata = result.slice(offsetToMetadata - 0x20, offsetToMetadata + metadataLength);
//             expect(recoveredMetadata).to.equal(abiEncoder.encoderFactory.encodeMetadata(outputNotes).data);
//         });
//     });
// });
>>>>>>> feat(aztec.js): implement new verifiers classes
