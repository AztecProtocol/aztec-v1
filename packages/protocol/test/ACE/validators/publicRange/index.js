/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const sinon = require('sinon');
const secp256k1 = require('@aztec/secp256k1');
const {
    abiEncoder: { inputCoder, outputCoder, encoderFactory },
    note,
    proof: { publicRange, proofUtils },
    bn128,
    keccak,
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');

const Keccak = keccak;

// ### Artifacts
const PublicRange = artifacts.require('./PublicRange');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface');

PublicRange.abi = PublicRangeInterface.abi;

contract('Public range proof tests', (accounts) => {
    let publicRangeContract;

    describe('Greater than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate success when a correct proof is supplied', async () => {
                const originalNoteValue = 50;
                const publicComparison = 10;
                const isGreaterOrEqual = true;
                const aztecAccount = secp256k1.generateAccount();

                const originalNote = await note.create(aztecAccount.publicKey, originalNoteValue);

                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });

                expect(result).to.equal(expectedOutput);
            });

            it('validate success for note value of zero', async () => {
                const originalNoteValue = 10;
                const publicComparison = 10;
                const isGreaterOrEqual = true;
                const aztecAccount = secp256k1.generateAccount();

                const originalNote = await note.create(aztecAccount.publicKey, originalNoteValue);

                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });

            it('validate success when challenge has GROUP_MODULUS added to it', async () => {
                // k1 > publicComparison
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputNotes = [originalNote];
                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const challengeBN = new BN(challenge.slice(2), 16);
                const challengePlusGroupModulus = `0x${challengeBN.add(constants.GROUP_MODULUS).toString(16)}`;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challengePlusGroupModulus,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const publicValue = 0;
                const publicOwner = constants.addresses.ZERO_ADDRESS;

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

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });
        });

        describe('Failure States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('should fail when balancing relationship not held', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 41;
                const publicComparison = 10;
                const numNotes = 2;
                const isGreaterOrEqual = true;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                    utilityNote,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail when note value is less than public integer', async () => {
                const originalNoteValue = 9;
                const utilityNoteValue = 0;
                const publicComparison = 10;
                const numNotes = 2;
                const isGreaterOrEqual = true;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                    utilityNote,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail for random proof data', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const { challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const fakeProofData = [...Array(4)].map(() =>
                    [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
                );

                const proofData = inputCoder.publicRange(
                    fakeProofData,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail for fake challenge', async () => {
                const originalNoteValue = 50;
                const publicComparison = 10;
                const isGreaterOrEqual = true;
                const aztecAccounts = secp256k1.generateAccount();

                const originalNote = await note.create(aztecAccounts.publicKey, originalNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                });

                const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
                const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(fakeProofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if scalars are NOT mod(GROUP_MODULUS)', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                // Generate scalars that NOT mod r
                const kBarBN = new BN(proofDataRaw[0][0].slice(2), 16);
                const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

                proofDataRaw[0][0] = notModRKBar;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if group element (blinding factor) resolves to the point at infinity', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofDataRaw[0][0] = `0x${padLeft('05', 64)}`;
                proofDataRaw[0][1] = `0x${padLeft('05', 64)}`;
                proofDataRaw[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
                proofDataRaw[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
                proofDataRaw[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
                proofDataRaw[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
                const challenge = `0x${padLeft('0a', 64)}`;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );
                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if scalars are zero', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const scalarZeroProofData = proofDataRaw.map((proofElement) => {
                    return [padLeft(0, 64), padLeft(0, 64), proofElement[2], proofElement[3], proofElement[4], proofElement[5]];
                });

                const proofData = inputCoder.publicRange(
                    scalarZeroProofData,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if proofData NOT correctly encoded', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const metadata = outputNotes;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const { length } = proofDataRaw;
                const noteString = proofDataRaw.map((individualNotes) => encoderFactory.encodeNote(individualNotes));

                // Incorrect encoding of proof data happens here: first two characters incorrectly sliced off
                // noteString, and padLeft() increases from 64 to 66 to still recognise it as a valid bytes
                // object. However. this is incorrect ABI encoding so will throw
                const data = [padLeft(Number(length).toString(16), 66), ...noteString.slice(2)].join('');
                const actualLength = Number(data.length / 2);

                const configs = {
                    CHALLENGE: challenge.slice(2),
                    PUBLIC_INTEGER: padLeft(Number(publicComparison).toString(16), 64),
                    PROOF_DATA: { data, length: actualLength },
                    INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
                    OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
                    METADATA: encoderFactory.encodeMetadata(metadata),
                };

                const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

                const incorrectEncoding = encoderFactory.encode(configs, abiParams, 'publicRange');

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(incorrectEncoding, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail for incorrect H_X, H_Y in CRS', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;
                const isGreaterOrEqual = true;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                    utilityNote,
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
                await truffleAssert.reverts(publicRangeContract.validatePublicRange(proofData, senderAddress, fakeCRS, opts));
            });

            it('should fail for no notes', async () => {
                const publicComparison = 100;
                const checkNumNotes = sinon.stub(proofUtils, 'checkNumNotes');

                const notes = [];
                const inputOwners = [];
                const outputNotes = [];
                const outputOwners = [];
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };

                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
                checkNumNotes.restore();
            });

            it('should fail for too many notes', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 20;
                const extraTestNoteValue = 40;
                const publicComparison = 30;
                const numNotes = 3;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const extraTestNote = await note.create(aztecAccounts[2].publicKey, extraTestNoteValue);

                const notes = [originalNote, utilityNote, extraTestNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote, extraTestNote];
                const outputOwners = [utilityNote.owner, extraTestNote.owner];
                const senderAddress = accounts[0];

                const checkNumNotes = sinon.stub(proofUtils, 'checkNumNotes').callsFake(() => {});
                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );
                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };

                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
                checkNumNotes.restore();
            });

            it('should fail if sender address NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const publicComparisonBN = new BN(publicComparison);
                const kPublicBN = new BN(0);
                const publicOwner = constants.addresses.ZERO_ADDRESS;

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(publicComparisonBN, kPublicBN, publicOwner, notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if publicComparison NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const kPublicBN = new BN(0);
                const publicOwner = constants.addresses.ZERO_ADDRESS;

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(senderAddress, kPublicBN, publicOwner, notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if kPublic NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const kPublicBN = new BN(0);
                const publicOwner = constants.addresses.ZERO_ADDRESS;

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(senderAddress, kPublicBN, publicOwner, notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if publicOwner NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const publicComparisonBN = new BN(publicComparison);
                const kPublicBN = new BN(0);

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(senderAddress, publicComparisonBN, kPublicBN, notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if notes NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const publicComparisonBN = new BN(publicComparison);
                const kPublicBN = new BN(0);
                const publicOwner = constants.addresses.ZERO_ADDRESS;

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(senderAddress, publicComparisonBN, kPublicBN, publicOwner, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if blindingFactors NOT integrated into challenge variable', async () => {
                const originalNoteValue = 50;
                const utilityNoteValue = 40;
                const publicComparison = 10;
                const numNotes = 2;

                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
                const notes = [originalNote, utilityNote];

                const inputOwners = [originalNote.owner];
                const outputNotes = [utilityNote];
                const outputOwners = [utilityNote.owner];
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const publicComparisonBN = new BN(publicComparison);
                const kPublicBN = new BN(0);
                const publicOwner = constants.addresses.ZERO_ADDRESS;

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () =>
                    localComputeChallenge(senderAddress, publicComparisonBN, kPublicBN, publicOwner, notes);

                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('should fail if points are NOT on the curve', async () => {
                const publicComparison = 0;
                const zeroes = `${padLeft('0', 64)}`;
                const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
                const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft(
                    '1',
                    64,
                )}${noteString}`;
                const challenge = sha3(challengeString, 'hex');

                const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
                const outputOwners = [proofUtils.randomAddress()];
                const inputOwners = [proofUtils.randomAddress()];
                const metadata = [];

                const senderAddress = accounts[0];

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    publicComparison,
                    inputOwners,
                    outputOwners,
                    metadata,
                );

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });
        });
    });
    describe('Less than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('should succeed for a less than proof', async () => {
                // proof that originalNoteValue <= publicComparison
                const originalNoteValue = 10;
                const publicComparison = 20;

                const isGreaterOrEqual = false;
                const aztecAccount = secp256k1.generateAccount();

                const originalNote = await note.create(aztecAccount.publicKey, originalNoteValue);

                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });

            it('should succeed for originalValeu = publicComparison, when making a less than or equal to proof', async () => {
                const originalNoteValue = 20;
                const publicComparison = 20;

                const isGreaterOrEqual = false;
                const aztecAccount = secp256k1.generateAccount();

                const originalNote = await note.create(aztecAccount.publicKey, originalNoteValue);

                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });
        });

        describe('Failure States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('should fail for an unbalanced less than proof', async () => {
                const originalNoteValue = 10;
                const utilityNoteValue = 9;
                const publicComparison = 20;
                const numNotes = 2;

                const isGreaterOrEqual = false;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                    utilityNote,
                });

                await truffleAssert.reverts(publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS));
            });

            it('should fail for a less than proof, when a greater than proof is specified', async () => {
                const originalNoteValue = 10;
                const utilityNoteValue = 10;
                const publicComparison = 20;
                const numNotes = 2;

                const isGreaterOrEqual = true;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

                const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
                const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);

                const senderAddress = accounts[0];

                const { proofData } = await publicRange.encodePublicRangeTransaction({
                    originalNote,
                    publicComparison,
                    senderAddress,
                    isGreaterOrEqual,
                    utilityNote,
                });

                await truffleAssert.reverts(publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS));
            });
        });
    });
});
