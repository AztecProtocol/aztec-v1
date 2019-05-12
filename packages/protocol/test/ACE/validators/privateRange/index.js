/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');
const BN = require('bn.js');
const secp256k1 = require('@aztec/secp256k1');
const sinon = require('sinon');

// ### Internal Dependencies
const { constants } = require('@aztec/dev-utils');

const {
    proof: { privateRange, proofUtils },
    note,
    abiEncoder: { inputCoder, outputCoder, encoderFactory },
    bn128,
    keccak,
} = require('aztec.js');

const Keccak = keccak;

// ### Artifacts
const PrivateRange = artifacts.require('./PrivateRange');
const PrivateRangeInterface = artifacts.require('./PrivateRangeInterface');

PrivateRange.abi = PrivateRangeInterface.abi;

contract.only('PrivateRange', (accounts) => {
    let privateRangeContract;
    describe('Success States', () => {
        beforeEach(async () => {
            privateRangeContract = await PrivateRange.new({
                from: accounts[0],
            });
        });

        it('validate zk validator success', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData, expectedOutput } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });


            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);

            expect(result).to.equal(expectedOutput);
        });

        it('validate it works with input notes of zero value', async () => {
            const noteValues = [10, 0];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData, expectedOutput } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);

            expect(result).to.equal(expectedOutput);
        });

        it.skip('validate it works with output notes of zero value', async () => {
            const noteValues = [0, 0];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData, expectedOutput } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);

            expect(result).to.equal(expectedOutput);
        });

        it('validate success when challenge has GROUP_MODULUS added to it', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];
            const senderAddress = accounts[0];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                notes,
                senderAddress,
            );

            const challengeBN = new BN(challenge.slice(2), 16);
            const challengePlusGroupModulus = `0x${challengeBN.add(constants.GROUP_MODULUS).toString(16)}`;

            const proofData = inputCoder.privateRange(
                proofDataRaw,
                challengePlusGroupModulus,
                inputOwners,
                outputOwners,
                outputNotes,
            );

            const publicOwner = constants.addresses.ZERO_ADDRESS;
            const publicValue = 0;

            const expectedOutput = `0x${outputCoder
                .encodeProofOutputs([
                    {
                        inputNotes,
                        outputNotes,
                        publicOwner,
                        publicValue,
                        challenge: challengePlusGroupModulus,
                    },
                ])
                .slice(0x42)}`;

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });
    });

    describe('Failure States', () => {
        beforeEach(async () => {
            privateRangeContract = await PrivateRange.new({
                from: accounts[0],
            });
        });

        it('validate failure for incorrect balancing relation', async () => {
            const noteValues = [10, 20];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure for fake challenge', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            console.log('proof data: ', proofData);

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(
                privateRangeContract.validatePrivateRange(fakeProofData, accounts[0], constants.CRS, opts),
            );
        });

        it('validate failure for fake proof data', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];
            const senderAddress = accounts[0];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];


            const { challenge } = privateRange.constructProof(notes, senderAddress);

            const fakeProofData = [...Array(4)].map(() =>
                [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
            );

            const proofData = inputCoder.privateRange(fakeProofData, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if points not on the curve', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');

            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if scalars are zero', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];


            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );

            const scalarZeroProofData = proofDataRaw.map((proofElement) => {
                return [padLeft(0, 64), padLeft(0, 64), proofElement[2], proofElement[3], proofElement[4], proofElement[5]];
            });

            const proofData = inputCoder.privateRange(scalarZeroProofData, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if scalars are NOT mod(GROUP_MODULUS)', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );

            // Generate scalars that NOT mod r
            const kBarBN = new BN(proofDataRaw[0][0].slice(2), 16);
            const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

            proofDataRaw[0][0] = notModRKBar;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if group element (blinding factor) resolves to the point at infinity', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const { proofData: proofDataRaw } = privateRange.constructProof([...inputNotes, ...outputNotes], senderAddress);

            proofDataRaw[0][0] = `0x${padLeft('05', 64)}`;
            proofDataRaw[0][1] = `0x${padLeft('05', 64)}`;
            proofDataRaw[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataRaw[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofDataRaw[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataRaw[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            // Generate scalars that NOT mod r
            const kBarBN = new BN(proofDataRaw[0][0].slice(2), 16);
            const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

            proofDataRaw[0][0] = notModRKBar;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if proofData NOT correctly encoded', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );

            const metadata = outputNotes;

            const { length } = proofDataRaw;
            const noteString = proofDataRaw.map((individualNotes) => encoderFactory.encodeNote(individualNotes));
            // Incorrect encoding of proof data happens here: first two characters incorrectly sliced off
            // noteString, and padLeft() increases from 64 to 66 to still recognise it as a valid bytes
            // object. However. this is incorrect ABI encoding so will throw
            const data = [padLeft(Number(length).toString(16), 66), ...noteString.slice(2)].join('');
            const actualLength = Number(data.length / 2);

            const configs = {
                CHALLENGE: challenge.slice(2),
                PROOF_DATA: { data, length: actualLength },
                INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
                OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
                METADATA: encoderFactory.encodeMetadata(metadata),
            };

            const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

            const incorrectEncoding = encoderFactory.encode(configs, abiParams, 'privateRange');

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(
                privateRangeContract.validatePrivateRange(incorrectEncoding, accounts[0], constants.CRS, opts),
            );
        });

        it.only('validate failure for incorrect H_X, H_Y in CRS', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notes[0];
            const comparisonNote = notes[1];

            const { proofData } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const H_X = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
            const H_Y = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
            const t2 = [
                `0x${padLeft('1cf7cc93bfbf7b2c5f04a3bc9cb8b72bbcf2defcabdceb09860c493bdf1588d', 64)}`,
                `0x${padLeft('8d554bf59102bbb961ba81107ec71785ef9ce6638e5332b6c1a58b87447d181', 64)}`,
                `0x${padLeft('204e5d81d86c561f9344ad5f122a625f259996b065b80cbbe74a9ad97b6d7cc2', 64)}`,
                `0x${padLeft('2cb2a424885c9e412b94c40905b359e3043275cd29f5b557f008cd0a3e0c0dc', 64)}`,
            ];

            const fakeHx = H_X.add(new BN(1, 10));
            const fakeHy = H_Y.add(new BN(1, 10));

            const fakeCRS = [`0x${padLeft(fakeHx.toString(16), 64)}`, `0x${padLeft(fakeHy.toString(16), 64)}`, ...t2];

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], fakeCRS, opts));
        });

        it.skip('validate failure for no notes', async () => {
            const originalNote = [];
            const comparisonNote = [];

            const stubNoteNumberCheck = sinon.stub(proofUtils, 'checkNumNotes');

            const { proofData } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
            stubNoteNumberCheck.restore();
        });

        it.skip('validate failure for too many notes', async () => {
            const noteValues = [10, 3, 4];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const stubNoteNumberCheck = sinon.stub(proofUtils, 'checkNumNotes');

            const { proofData } = await privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
            stubNoteNumberCheck.restore();
        });

        it.only('validate failure if sender address NOT integrated into challenge variable', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const rollingHash = new Keccak();
            const kPublicBN = new BN(0);
            const publicOwner = constants.ZERO_ADDRESS;

            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = privateRange.constructBlindingFactors;
            const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(kPublicBN, publicOwner, notes, blindingFactors);
            privateRange.constructBlindingFactors = () => blindingFactors;

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );
            proofUtils.computeChallenge = localComputeChallenge;
            privateRange.constructBlindingFactors = localConstructBlindingFactors;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });


        it.only('validate failure if kPublic NOT integrated into challenge variable', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const rollingHash = new Keccak();
            const publicOwner = constants.ZERO_ADDRESS;


            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = privateRange.constructBlindingFactors;
            const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(notes, publicOwner, blindingFactors);
            privateRange.constructBlindingFactors = () => blindingFactors;

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );
            proofUtils.computeChallenge = localComputeChallenge;
            privateRange.constructBlindingFactors = localConstructBlindingFactors;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it.only('validate failure if public owner NOT integrated into challenge variable', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];
            const kPublicBN = new BN(0);

            const rollingHash = new Keccak();

            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = privateRange.constructBlindingFactors;
            const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(notes, kPublicBN, blindingFactors);
            privateRange.constructBlindingFactors = () => blindingFactors;

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );
            proofUtils.computeChallenge = localComputeChallenge;
            privateRange.constructBlindingFactors = localConstructBlindingFactors;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it.only('validate failure if notes NOT integrated into challenge variable', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const rollingHash = new Keccak();
            const kPublicBN = new BN(0);
            const publicOwner = constants.ZERO_ADDRESS;

            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = privateRange.constructBlindingFactors;
            const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, kPublicBN, publicOwner, blindingFactors);
            privateRange.constructBlindingFactors = () => blindingFactors;

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );

            proofUtils.computeChallenge = localComputeChallenge;
            privateRange.constructBlindingFactors = localConstructBlindingFactors;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it.only('validate failure if blinding factors NOT integrated into challenge variable', async () => {
            const noteValues = [10, 4];
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const notesWithoutUtility = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);
            const originalNote = notesWithoutUtility[0];
            const comparisonNote = notesWithoutUtility[1];

            const notes = await privateRange.helpers.constructUtilityNote([originalNote, comparisonNote]);
            const inputNotes = [originalNote, comparisonNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputNotes = [notes[2]];
            const outputOwners = [notes[2].owner];
            const senderAddress = accounts[0];

            const rollingHash = new Keccak();
            const kPublicBN = new BN(0);
            const publicOwner = constants.ZERO_ADDRESS;

            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = privateRange.constructBlindingFactors;
            const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(kPublicBN, publicOwner, senderAddress, notes);
            privateRange.constructBlindingFactors = () => blindingFactors;

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [...inputNotes, ...outputNotes],
                senderAddress,
            );

            proofUtils.computeChallenge = localComputeChallenge;
            privateRange.constructBlindingFactors = localConstructBlindingFactors;

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });
    });
});
