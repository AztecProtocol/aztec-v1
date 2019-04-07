/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const truffleAssert = require('truffle-assertions');
const crypto = require('crypto');

// ### Internal Dependencies
const {
    proof: { bilateralSwap, proofUtils },
    abiEncoder: { inputCoder, outputCoder, encoderFactory },
    note,
    secp256k1,
    bn128,
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');


// ### Artifacts
const BilateralSwap = artifacts.require('contracts/ACE/validators/bilateralSwap/BilateralSwap');
const BilateralSwapInterface = artifacts.require('contracts/ACE/validators/bilateralSwap/BilateralSwapInterface');

BilateralSwap.abi = BilateralSwapInterface.abi;

contract('Bilateral Swap', (accounts) => {
    let bilateralSwapContract;
    describe('success states', () => {
        let bilateralSwapAccounts = [];

        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new({
                from: accounts[0],
            });

            bilateralSwapAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
        });

        it('successfully validate output encoding for bilateral proof in zero-knowledge', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const { proofData, expectedOutput } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());


            expect(decoded[1].inputNotes[0].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].inputNotes[0].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].inputNotes[0].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[1].inputNotes[0].owner).to.equal(outputNotes[1].owner.toLowerCase());
            expect(decoded[1].outputNotes[0].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(result).to.equal(expectedOutput);
        });

        it('validate a proof that uses notes worth 0', async () => {
            const noteValues = [0, 20, 0, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);
        });

        it('Validate success if challenge has GROUP_MODULUS added to it', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const challengeBN = new BN(challenge.slice(2), 16);
            const notModRChallenge = `0x${(challengeBN.add(constants.GROUP_MODULUS)).toString(16)}`;

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                notModRChallenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const expectedOutput = `0x${outputCoder.encodeProofOutputs([
                {
                    inputNotes: [inputNotes[0]],
                    outputNotes: [outputNotes[0]],
                    publicOwner,
                    publicValue,
                    challenge: notModRChallenge,
                },
                {
                    inputNotes: [outputNotes[1]],
                    outputNotes: [inputNotes[1]],
                    publicOwner,
                    publicValue,
                    challenge: `0x${padLeft(sha3(notModRChallenge).slice(2), 64)}`,
                },
            ]).slice(0x42)}`;

            expect(result).to.equal(expectedOutput);
        });
    });

    describe('failure states', () => {
        let bilateralSwapAccounts = [];

        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new({
                from: accounts[0],
            });

            bilateralSwapAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
        });

        it('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const noteValues = [10, 50, 20, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });


            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using random proof data', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const {
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];

            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const proofData = inputCoder.bilateralSwap(
                fakeProofData,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when points not on curve', async () => {
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');

            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
            const outputOwners = [proofUtils.randomAddress()];

            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                outputOwners,
                []
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure if scalars are not mod(GROUP_MODULUS)', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const proofConstruct = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];

            // Generate scalars that NOT mod r
            const kBarBN = new BN(proofConstruct.proofData[0][0].slice(2), 16);
            const notModRKBar = `0x${(kBarBN.add(constants.GROUP_MODULUS)).toString(16)}`;

            proofConstruct.proofData[0][0] = notModRKBar;

            const proofData = inputCoder.bilateralSwap(
                proofConstruct.proofData,
                proofConstruct.challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );


            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when scalars are zero', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const scalarZeroProofData = proofDataRaw.map((proofElement) => {
                return [
                    padLeft(0, 64),
                    padLeft(0, 64),
                    proofElement[2],
                    proofElement[3],
                    proofElement[4],
                    proofElement[5],
                ];
            });

            const proofData = inputCoder.bilateralSwap(
                scalarZeroProofData,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            const zeroScalar = padLeft(0, 64);
            expect(scalarZeroProofData[0][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[0][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[3][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[3][1]).to.equal(zeroScalar);

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when proof data not correctly encoded', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            // Performing ABI encoding
            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const metadata = outputNotes;

            const { length } = proofDataRaw;
            const noteString = proofDataRaw.map(individualNotes => encoderFactory.encodeNote(individualNotes));

            // Incorrect encoding of proof data happens here: first two characters incorrectly sliced off
            // noteString, and padLeft() increases from 64 to 66 to still recognise it as a valid bytes 
            // object. However. this is incorrect ABI encoding so will throw
            const data = [padLeft(Number(length).toString(16), 66), ...noteString.slice(2)].join('');
            const actualLength = Number(data.length / 2);

            const configs = {
                CHALLENGE: challenge.slice(2),
                PROOF_DATA: { data, length: actualLength },
                OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(noteOwners),
                METADATA: encoderFactory.encodeMetadata(metadata),
            };

            const abiParams = [
                'PROOF_DATA',
                'OUTPUT_OWNERS',
                'METADATA',
            ];

            const incorrectEncoding = encoderFactory.encode(configs, abiParams, 'bilateralSwap');

            await truffleAssert.reverts(
                bilateralSwapContract.validateBilateralSwap(incorrectEncoding, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                })
            );
        });

        it('validate failure when incorrect H_X, H_Y in CRS is supplied)', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
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

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], fakeCRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using a fake challenge', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(fakeProofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when sender address NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const blindingFactors = bilateralSwap.constructBlindingFactors(notes);
            const localConstructBlindingFactors = bilateralSwap.constructBlindingFactors;
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge([...inputNotes, ...outputNotes], blindingFactors);
            bilateralSwap.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);


            proofUtils.computeChallenge = localComputeChallenge;
            bilateralSwap.constructBlindingFactors = localConstructBlindingFactors;

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure if a group element (blinding factor) resolves to the point at infinity', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const proofConstruct = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            proofConstruct.proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofConstruct.proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofConstruct.proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofConstruct.challenge = `0x${padLeft('0a', 64)}`;

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofConstruct.proofData,
                proofConstruct.challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when initial commitments NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const blindingFactors = bilateralSwap.constructBlindingFactors(notes);
            const localConstructBlindingFactors = bilateralSwap.constructBlindingFactors;
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, blindingFactors);
            bilateralSwap.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            bilateralSwap.constructBlindingFactors = localConstructBlindingFactors;

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when blinding factors NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const blindingFactors = bilateralSwap.constructBlindingFactors(notes);
            const localConstructBlindingFactors = bilateralSwap.constructBlindingFactors;
            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, [...inputNotes, ...outputNotes]);
            bilateralSwap.constructBlindingFactors = () => blindingFactors;

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            proofUtils.computeChallenge = localComputeChallenge;
            bilateralSwap.constructBlindingFactors = localConstructBlindingFactors;

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for number of notes less than minimum number required - using 2 instead of 4', async () => {
            const noteValues = [20, 20];
            const numNotes = 2;

            bilateralSwapAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                noteOwners,
                [outputNotes[0]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for number of notes less than minimum number required - using 3 instead of 4', async () => {
            const noteValues = [10, 10, 10];
            const numNotes = 3;

            bilateralSwapAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 3);
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);

            const noteOwners = [...inputNotes.map(m => m.owner), ...outputNotes.map(n => n.owner)];
            const proofData = inputCoder.bilateralSwap(
                proofDataRaw,
                challenge,
                noteOwners,
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });


        it('validate failure for random note values between [0,...,K_MAX]', async () => {
            const noteValues = [
                proofUtils.generateNoteValue(),
                proofUtils.generateNoteValue(),
                proofUtils.generateNoteValue(),
                proofUtils.generateNoteValue(),
            ];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const noteValues = [10, 20, 30, 10, 20, 30];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });
            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for a bid note of zero value that does not satisfy proof relationship', async () => {
            const noteValues = [0, 20, 10, 20];

            const notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });
            await truffleAssert.reverts(bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
