/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');
const sinon = require('sinon');

// ### Internal Dependencies
const {
    proof: { dividendComputation, proofUtils },
    abiEncoder: { inputCoder, outputCoder, encoderFactory },
    note,
    secp256k1,
    bn128,
    keccak,
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');

const Keccak = keccak;


// ### Artifacts
const dividend = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputation');
const dividendInterface = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputationInterface');

dividend.abi = dividendInterface.abi;

contract('Dividend Computation', (accounts) => {
    let dividendContract;
    describe('success states', () => {
        let dividendAccounts = [];

        beforeEach(async () => {
            dividendContract = await dividend.new({
                from: accounts[0],
            });
            dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
        });

        it('successfully validates output coding of AZTEC dividend computation zero-knowledge proof', async () => {
            const noteValues = [90, 4, 50];
            const za = 100;
            const zb = 5;

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);

            const { proofData, expectedOutput } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress: accounts[0],
            });

            const publicOwner = '0x0000000000000000000000000000000000000000';

            const result = await dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );


            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[1].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[1].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[1].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[0].outputNotes[1].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(result).to.equal(expectedOutput);
        });

        it('Validate success if challenge has GROUP_MODULUS added to it', async () => {
            const noteValues = [90, 4, 50];
            const za = 100;
            const zb = 5;

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof(
                [...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress
            );

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const challengeBN = new BN(challenge.slice(2), 16);
            const notModRChallenge = `0x${(challengeBN.add(constants.GROUP_MODULUS)).toString(16)}`;

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                notModRChallenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue,
                challenge: notModRChallenge,
            }]).slice(0x42)}`;


            const result = await dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            expect(result).to.equal(expectedOutput);
        });
    });

    describe('failure states', () => {
        beforeEach(async () => {
            dividendContract = await dividend.new(accounts[0]);
        });

        it('validate failure for residual commitment message that does not satisfy proof relation', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 3, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];


            const {
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, senderAddress);

            const inputOwners = [...inputNotes.map(m => m.owner)];
            const outputOwners = [...outputNotes.map(n => n.owner)];

            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const proofData = inputCoder.dividendComputation(
                fakeProofData,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when points not on curve', async () => {
            const za = 100;
            const zb = 5;

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');

            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
            const outputOwners = [proofUtils.randomAddress()];
            const inputOwners = [proofUtils.randomAddress()];

            const proofData = inputCoder.dividendComputation(
                proofDataRaw,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                []
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure if scalars are not mod(GROUP_MODULUS)', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const proofConstruct = dividendComputation.constructProof(
                [...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress
            );

            const proofDataRawFormatted = [proofConstruct.proofData.slice(0, 6)].concat(
                [proofConstruct.proofData.slice(6, 12),
                    proofConstruct.proofData.slice(12, 18)]
            );


            const outputOwners = [...outputNotes.map(n => n.owner)];
            const inputOwners = [...inputNotes.map(n => n.owner)];

            // Generate scalars that NOT mod r
            const kBarBN = new BN(proofConstruct.proofData[0][0].slice(2), 16);
            const notModRKBar = `0x${(kBarBN.add(constants.GROUP_MODULUS)).toString(16)}`;

            proofDataRawFormatted[0][0] = notModRKBar;

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                proofConstruct.challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );


            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when group element (blinding factor) resolves to infinity', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const proofConstruct = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            const proofDataRawFormatted = [proofConstruct.proofData.slice(0, 6)].concat(
                [proofConstruct.proofData.slice(6, 12),
                    proofConstruct.proofData.slice(12, 18)]
            );

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            proofDataRawFormatted[0][0] = `0x${padLeft('05', 64)}`;
            proofDataRawFormatted[0][1] = `0x${padLeft('05', 64)}`;
            proofDataRawFormatted[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataRawFormatted[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofDataRawFormatted[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataRawFormatted[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofConstruct.challenge = `0x${padLeft('0a', 64)}`;

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                proofConstruct.challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when scalars are zero', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const scalarZeroProofData = proofDataRawFormatted.map((proofElement) => {
                return [
                    padLeft(0, 64),
                    padLeft(0, 64),
                    proofElement[2],
                    proofElement[3],
                    proofElement[4],
                    proofElement[5],
                ];
            });

            const proofData = inputCoder.dividendComputation(
                scalarZeroProofData,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const zeroScalar = padLeft(0, 64);
            expect(scalarZeroProofData[0][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[0][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][1]).to.equal(zeroScalar);

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when proof data not correctly encoded', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            // Performing ABI encoding
            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof(
                [...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress
            );

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const outputOwners = [...outputNotes.map(n => n.owner)];
            const metadata = outputNotes;

            const { length } = proofDataRawFormatted;
            const noteString = proofDataRawFormatted.map(individualNotes => encoderFactory.encodeNote(individualNotes));

            // Incorrect encoding of proof data happens here: first two characters incorrectly sliced off
            // noteString, and padLeft() increases from 64 to 66 to still recognise it as a valid bytes 
            // object. However. this is incorrect ABI encoding so will throw
            const data = [padLeft(Number(length).toString(16), 66), ...noteString.slice(2)].join('');
            const actualLength = Number(data.length / 2);

            const configs = {
                CHALLENGE: challenge.slice(2),
                PROOF_DATA: { data, length: actualLength },
                OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
                METADATA: encoderFactory.encodeMetadata(metadata),
            };

            const abiParams = [
                'PROOF_DATA',
                'OUTPUT_OWNERS',
                'METADATA',
            ];

            const incorrectEncoding = encoderFactory.encode(configs, abiParams, 'dividendComputation');

            await truffleAssert.reverts(
                dividendContract.validateDividendComputation(incorrectEncoding, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                })
            );
        });

        it('validate failure when incorrect H_X, H_Y in CRS is supplied)', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
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

            const fakeCRS = [
                `0x${padLeft(fakeHx.toString(16), 64)}`,
                `0x${padLeft(fakeHy.toString(16), 64)}`,
                ...t2,
            ];

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], fakeCRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure when using a fake challenge', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            await truffleAssert.reverts(dividendContract.validateDividendComputation(fakeProofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when sender address NOT integrated into challenge variable', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const zaBN = new BN(za);
            const zbBN = new BN(zb);

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = dividendComputation.constructBlindingFactors;
            const blindingFactors = dividendComputation.constructBlindingFactors(notes, zaBN, zbBN, rollingHash);
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(zaBN, zbBN, notes, blindingFactors);
            dividendComputation.constructBlindingFactors = () => blindingFactors;


            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            dividendComputation.constructBlindingFactors = localConstructBlindingFactors;

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when za NOT integrated into challenge variable', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const zaBN = new BN(za);
            const zbBN = new BN(zb);

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = dividendComputation.constructBlindingFactors;
            const blindingFactors = dividendComputation.constructBlindingFactors(notes, zaBN, zbBN, rollingHash);
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, zbBN, notes, blindingFactors);
            dividendComputation.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            dividendComputation.constructBlindingFactors = localConstructBlindingFactors;

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when zb NOT integrated into challenge variable', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const zaBN = new BN(za);
            const zbBN = new BN(zb);

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });
            const localConstructBlindingFactors = dividendComputation.constructBlindingFactors;
            const blindingFactors = dividendComputation.constructBlindingFactors(notes, zaBN, zbBN, rollingHash);
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, zaBN, notes, blindingFactors);
            dividendComputation.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            dividendComputation.constructBlindingFactors = localConstructBlindingFactors;

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when initial commitments NOT integrated into challenge variable', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const zaBN = new BN(za);
            const zbBN = new BN(zb);

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = dividendComputation.constructBlindingFactors;
            const blindingFactors = dividendComputation.constructBlindingFactors(notes, zaBN, zbBN, rollingHash);
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, zaBN, zbBN, blindingFactors);
            dividendComputation.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            dividendComputation.constructBlindingFactors = localConstructBlindingFactors;

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when blinding factors NOT integrated into challenge variable', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const zaBN = new BN(za);
            const zbBN = new BN(zb);

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = dividendComputation.constructBlindingFactors;
            const blindingFactors = dividendComputation.constructBlindingFactors(notes, zaBN, zbBN, rollingHash);
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, zaBN, zbBN, notes);
            dividendComputation.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            dividendComputation.constructBlindingFactors = localConstructBlindingFactors;

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for number of notes less than minimum number required - using 2 instead of 4', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4];

            const numNotes = 2;

            const dividendAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const senderAddress = accounts[0];

            const checkNumNotes = sinon.stub(proofUtils, 'checkNumNotes').callsFake(() => { });

            const {
                proofData: proofDataRaw,
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes],
                za,
                zb,
                senderAddress);

            const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12),
                proofDataRaw.slice(12, 18)]);


            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.dividendComputation(
                proofDataRawFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));

            checkNumNotes.restore();
        });

        it('validates failure for zero input note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [0, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero output note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 0];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero residual note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 0, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for z_a > kMax', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const zaHigh = constants.K_MAX + za;

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za: zaHigh,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for z_b > kMax', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const zbHigh = constants.K_MAX + zb;

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb: zbHigh,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
