/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const sinon = require('sinon');

// ### Internal Dependencies
const {
    abiEncoder: { inputCoder, outputCoder, encoderFactory },
    secp256k1,
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

contract.only('Public range proof tests', (accounts) => {
    let publicRangeContract;

    describe('Greater than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate success when using zk validator contract', async () => {
                // k1 > kPublic
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });

            it('validate success for note value of zero', async () => {
                const noteValues = [10, 0];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });

            it('validate success when challenge has GROUP_MODULUS added to it', async () => {
                // k1 > kPublic
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                const challengeBN = new BN(challenge.slice(2), 16);
                const challengePlusGroupModulus = `0x${challengeBN.add(constants.GROUP_MODULUS).toString(16)}`;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challengePlusGroupModulus,
                    kPublic,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );

                const publicValue = kPublic;
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

            it('validate failure when balancing relationship not held', async () => {
                const noteValues = [50, 41];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('validate failure when note value is less than public integer', async () => {
                const noteValues = [9, 0];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('validate failure for random proof data', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { challenge } = publicRange.constructProof([...inputNotes, ...outputNotes], kPublic, senderAddress);

                const fakeProofData = [...Array(4)].map(() =>
                    [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
                );

                const proofData = inputCoder.publicRange(
                    fakeProofData,
                    challenge,
                    kPublic,
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

            it('validate failure for fake challenge', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
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

            it('validate failure if scalars are NOT mod(GROUP_MODULUS)', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                // Generate scalars that NOT mod r
                const kBarBN = new BN(proofDataRaw[0][0].slice(2), 16);
                const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

                proofDataRaw[0][0] = notModRKBar;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    kPublic,
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

            it('validate failure if group element (blinding factor) resolves to the point at infinity', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

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
                    kPublic,
                    inputOwners,
                    outputOwners,
                    outputNotes,
                );
                // Generate scalars that NOT mod r
                const kBarBN = new BN(proofDataRaw[0][0].slice(2), 16);
                const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

                proofDataRaw[0][0] = notModRKBar;

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('validate failure if scalars are zero', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                const scalarZeroProofData = proofDataRaw.map((proofElement) => {
                    return [padLeft(0, 64), padLeft(0, 64), proofElement[2], proofElement[3], proofElement[4], proofElement[5]];
                });

                const proofData = inputCoder.publicRange(
                    scalarZeroProofData,
                    challenge,
                    kPublic,
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

            it('validate failure if proofData NOT correctly encoded', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
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
                    PUBLIC_INTEGER: padLeft(Number(kPublic).toString(16), 64),
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

            it('validate failure for incorrect H_X, H_Y in CRS', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
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

            it.only('validate failure for no notes', async () => {
                const kPublic = 0;
                const inputNotes = [];
                const outputNotes = [];
                const senderAddress = accounts[0];

                const checkNumNotes = sinon.stub(proofUtils, 'checkNumNotes').callsFake(() => {});

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                console.log({ proofData });
                console.log({ inputNotes });
                console.log({ outputNotes });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };

                const result = await publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts);
                console.log('recovered challenge: ', result);
                // await truffleAssert.reverts(
                //     publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                // );
                checkNumNotes.restore();
            });

            it('validate failure if sender address NOT integrated into challenge variable', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const kPublicBN = new BN(kPublic);

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, kPublicBN);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () => localComputeChallenge(notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    kPublic,
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

            it('validate failure if notes NOT integrated into challenge variable', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const kPublicBN = new BN(kPublic);

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, kPublicBN);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    kPublic,
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

            it('validate failure if blindingFactors NOT integrated into challenge variable', async () => {
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    }),
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const inputOwners = inputNotes.map((m) => m.owner);
                const outputOwners = outputNotes.map((n) => n.owner);
                const senderAddress = accounts[0];

                const rollingHash = new Keccak();

                notes.forEach((individualNote) => {
                    rollingHash.append(individualNote.gamma);
                    rollingHash.append(individualNote.sigma);
                });

                const kPublicBN = new BN(kPublic);

                const localConstructBlindingFactors = publicRange.constructBlindingFactors;
                const blindingFactors = publicRange.constructBlindingFactors(notes, kPublicBN);

                const localComputeChallenge = proofUtils.computeChallenge;
                proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, notes, blindingFactors);
                publicRange.constructBlindingFactors = () => blindingFactors;

                const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                    [...inputNotes, ...outputNotes],
                    kPublic,
                    senderAddress,
                );

                proofUtils.computeChallenge = localComputeChallenge;
                publicRange.constructBlindingFactors = localConstructBlindingFactors;

                const proofData = inputCoder.publicRange(
                    proofDataRaw,
                    challenge,
                    kPublic,
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

            it('validate failure if points are NOT on the curve', async () => {
                const kPublic = 0;
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

                const proofData = inputCoder.publicRange(proofDataRaw, challenge, kPublic, inputOwners, outputOwners, metadata);

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
    /*
    describe('Less than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate success when using zk validator contract', async () => {
                // TODO
                const noteValues = [0, 0];
                const kPublic = constants.GROUP_MODULUS;
                console.log({ kPublic });

                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                });

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(true);
            });
        });
    });
    */
});
