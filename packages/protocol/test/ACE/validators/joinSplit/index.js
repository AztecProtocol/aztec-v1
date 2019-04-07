/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');

// ### Internal Dependencies
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const {
    bn128,
    proof: { joinSplit, proofUtils },
    sign,
    abiEncoder: { outputCoder, inputCoder, encoderFactory },
    note,
    secp256k1,
    keccak,
} = require('aztec.js');

const Keccak = keccak;
// ### Artifacts
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');

JoinSplit.abi = JoinSplitInterface.abi;


contract('JoinSplit', (accounts) => {
    let joinSplitContract;
    // Creating a collection of tests that should pass
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        beforeEach(async () => {
            joinSplitContract = await JoinSplit.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
        });

        it('successfully validates encoding of an AZTEC JOIN-SPLIT zero-knowledge proof', async () => {
            const inputNotes = notes.slice(2, 4);
            const outputNotes = notes.slice(0, 2);
            const kPublic = 40;
            const publicOwner = aztecAccounts[0].address;
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 4),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, opts);
            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

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
            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(40);
            expect(result).to.equal(expectedOutput);
        });

        it('validates proof where kPublic > 0 and kPublic < GROUP_MODULUS/2', async () => {
            const inputNotes = notes.slice(2, 5);
            const outputNotes = notes.slice(0, 2);
            const kPublic = 80;
            const publicOwner = aztecAccounts[0].address;
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 5),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validates proof where kPublic > GROUP_MODULUS/2', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = -40;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);
            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(decoded[0].publicValue).to.equal(-40);
        });

        it('validates that large numbers of input/output notes work', async () => {
            const inputNotes = notes.slice(0, 10);
            const outputNotes = notes.slice(10, 20);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validate that zero quantity of input notes works', async () => {
            const outputNotes = notes.slice(0, 10);
            const kPublic = -450;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes,
                senderAddress,
                inputNoteOwners: [],
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validate that zero quantity of output notes works', async () => {
            const inputNotes = notes.slice(0, 10);
            const kPublic = 450;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes: [],
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validate that input notes of zero value work', async () => {
            const inputNotes = [
                note.create(aztecAccounts[0].publicKey, 0),
                note.create(aztecAccounts[1].publicKey, 0),
            ];
            const outputNotes = notes.slice(0, 2);
            const kPublic = -10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validate that output notes of zero value work', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                note.create(aztecAccounts[0].publicKey, 0),
                note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('validate the minimum number of notes possible (one input, one output) works', async () => {
            const inputNotes = notes.slice(0, 1);

            const outputNotes = [
                note.create(aztecAccounts[0].publicKey, 0),
            ];

            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);
        });

        it('Validate success if challenge has GROUP_MODULUS added to it', async () => {
            const inputNotes = notes.slice(0, 2);
            const inputNoteOwners = aztecAccounts.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const kPublic = -40;
            const publicOwner = aztecAccounts[0].address;
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

            const challengeBN = new BN(challenge.slice(2), 16);
            const notModRChallenge = `0x${(challengeBN.add(constants.GROUP_MODULUS)).toString(16)}`;
            const validatorAddress = joinSplitContract.address;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(validatorAddress, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge: notModRChallenge,
                    sender: senderAddress,
                };
                const { privateKey } = inputNoteOwners[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                notModRChallenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue: kPublic,
                challenge: notModRChallenge,
            }]).slice(0x42)}`;

            const result = await joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            expect(result).to.equal(expectedOutput);
        });

        it('validate successful recovery of note owner', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const kPublic = -40;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );


            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);

                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts);

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);


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

            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(kPublic);
        });
    });

    describe('failure states', () => {
        beforeEach(async () => {
            joinSplitContract = await JoinSplit.new({
                from: accounts[0],
            });
        });

        it('validates failure when using a fake challenge', async () => {
            const aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                note.create(aztecAccounts[0].publicKey, 0),
                note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(fakeProofData, senderAddress, constants.CRS, opts));
        });

        it('validates failure for random proof data', async () => {
            const aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                note.create(aztecAccounts[0].publicKey, 0),
                note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));
            const proofData = inputCoder.joinSplit(
                fakeProofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validates failure for fake signature', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            // Note, the below are fake signatures. The v parameter has been fixed to 
            // 27, but the r and s parameters are fake data
            const inputSignatures = [
                ['0x000000000000000000000000000000000000000000000000000000000000001b',
                    '0xcbc2f0a07ef0684bd5af6338e0df66e7048dbbfc75e50a89ce631103ac975fb3',
                    '0x38e71e1b7919f9fef61aeab31c57a23c0ec3ae8f414c1e1c2886a569398235e9'],
                ['0x000000000000000000000000000000000000000000000000000000000000001b',
                    '0xb5bc488fe84f6b5bbb81e5f7313b4ac73f53ad64b28a9d3408accaf1b52bc25c',
                    '0x141acee147d2fb8b3c8f1c796c564b3c014d4e99bf77f517ee7774925deb878e']];

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );


            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('Validate failure if scalars are not mod(GROUP_MODULUS)', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const m = inputNotes.length;

            const proofConstruct = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge: proofConstruct.challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            // Generate scalars that NOT mod r
            const kBarBN = new BN(proofConstruct.proofData[0][0].slice(2), 16);
            const notModRKBar = `0x${(kBarBN.add(constants.GROUP_MODULUS)).toString(16)}`;

            proofConstruct.proofData[0][0] = notModRKBar;

            const proofData = inputCoder.joinSplit(
                proofConstruct.proofData,
                m,
                proofConstruct.challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );


            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when kPublic NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, m, publicOwner, notes, blindingFactors);
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validate failure when EIP712 signatures use incorrect domain params (so domain hash incorrect)', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());


            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );


            const inputSignatures = inputNotes.map((inputNote, index) => {
                const fakeDomain = {
                    name: 'TEST_CASE',
                    version: '10',
                };

                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, fakeDomain);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);

                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });
        it('Validate failure when publicOwner NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const kPublicBN = new BN(kPublic);
            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, kPublicBN, m, notes, blindingFactors);
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('Validate failure when m NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const kPublicBN = new BN(kPublic);

            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(
                senderAddress, kPublicBN, publicOwner, notes, blindingFactors
            );
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validate failure for group element (blinding factor) resolving to infinity', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;


            const proofConstruct = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofConstruct.proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofConstruct.proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofConstruct.proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofConstruct.proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofConstruct.challenge = `0x${padLeft('0a', 64)}`;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge: proofConstruct.challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofConstruct.proofData,
                m,
                proofConstruct.challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });


        it('validate failure when scalars are zero', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

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

            const zeroScalar = padLeft(0, 64);
            expect(scalarZeroProofData[0][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[0][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[1][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[2][1]).to.equal(zeroScalar);
            expect(scalarZeroProofData[3][0]).to.equal(zeroScalar);
            expect(scalarZeroProofData[3][1]).to.equal(zeroScalar);

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                scalarZeroProofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when proof data not correctly encoded', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const m = inputNotes.length;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const metadata = outputNotes;

            const { length } = proofDataRaw;
            const noteString = proofDataRaw.map(individualNotes => encoderFactory.encodeNote(individualNotes));

            // Incorrect encoding of proof data happens here: first two characters incorrectly sliced off
            // noteString, and padLeft() increases from 64 to 66 to still recognise it as a valid bytes 
            // object. However. this is incorrect ABI encoding so will throw
            const data = [padLeft(Number(length).toString(16), 66), ...noteString.slice(2)].join('');
            const actualLength = Number(data.length / 2);

            const configs = {
                M: padLeft(Number(m).toString(16), 64),
                CHALLENGE: challenge.slice(2),
                PUBLIC_OWNER: padLeft(publicOwner.slice(2), 64),
                PROOF_DATA: { data, length: actualLength },
                INPUT_SIGNATURES: encoderFactory.encodeInputSignatures(inputSignatures),
                INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
                OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
                METADATA: encoderFactory.encodeMetadata(metadata),
            };

            const abiParams = [
                'PROOF_DATA',
                'INPUT_SIGNATURES',
                'INPUT_OWNERS',
                'OUTPUT_OWNERS',
                'METADATA',
            ];

            const incorrectEncoding = encoderFactory.encode(configs, abiParams, 'joinSplit');

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(incorrectEncoding, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when incorrect H_X, H_Y in CRS is supplied', async () => {
            const noteValues = [10, 20, 10, 20];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());


            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;

            const { proofData } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
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

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, accounts[0], fakeCRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when sender address NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const kPublicBN = new BN(kPublic);

            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(kPublicBN, m, publicOwner, notes, blindingFactors);
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('Validate failure when commitments NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const kPublicBN = new BN(kPublic);

            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, kPublicBN, m, publicOwner, blindingFactors);
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });


        it('Validate failure when blinding factors NOT integrated into challenge variable', async () => {
            const noteValues = [10, 20, 10, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;

            const rollingHash = new Keccak();
            notes.forEach((individualNote) => {
                rollingHash.append(individualNote.gamma);
                rollingHash.append(individualNote.sigma);
            });

            const kPublicBN = new BN(kPublic);

            const localConstructBlindingFactors = joinSplit.constructBlindingFactors;
            const localGenerateBlindingScalars = joinSplit.generateBlindingScalars;

            const blindingScalars = joinSplit.generateBlindingScalars(numNotes, m);
            const blindingFactors = joinSplit.constructBlindingFactors(notes, m, rollingHash, blindingScalars);

            const localComputeChallenge = proofUtils.computeChallenge;
            proofUtils.computeChallenge = () => localComputeChallenge(senderAddress, kPublicBN, m, publicOwner, notes);
            joinSplit.constructBlindingFactors = () => blindingFactors;
            joinSplit.generateBlindingScalars = () => blindingScalars;

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            proofUtils.computeChallenge = localComputeChallenge;
            joinSplit.constructBlindingFactors = localConstructBlindingFactors;
            joinSplit.generateBlindingScalars = localGenerateBlindingScalars;
            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });

            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('Validate failure for no notes', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const inputNotes = [];
            const outputNotes = [];
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;

            const { proofData } = joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner,
                kPublic,
                validatorAddress: joinSplitContract.address,
            });

            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });


        it('validate failure for zero input note value', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [0, 0, 5, 5];
            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validate failure for zero output note value', async () => {
            const noteValues = [10, 10, 0, 0];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const inputOwners = inputNotes.map(n => n.owner);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validate failure when using a fake trusted setup key', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            const { commitments, m } = joinSplit.helpers.generateFakeCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = joinSplit.constructJoinSplitModified(commitments, m, accounts[0], 0, publicOwner);

            const inputSignatures = commitments.slice(0, 2).map((inputNote, index) => {
                const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = sign.signStructuredData(domain, schema, message, privateKey);
                return signature;
            });
            const outputOwners = aztecAccounts.slice(2, 4).map(a => a.address);
            const inputOwners = aztecAccounts.slice(0, 2).map(a => a.address);

            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                commitments.slice(2, 4)
            );

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });

        it('validate failure when points not on curve', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = `${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}`;
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');
            const m = 1;
            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
            const senderAddress = accounts[0];

            const noteHash = sha3(`0x${padLeft('1', 64)}${padLeft('0', 256)}`, 'hex');
            const domain = sign.generateAZTECDomainParams(joinSplitContract.address, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof: JOIN_SPLIT_PROOF,
                noteHash,
                challenge,
                sender: senderAddress,
            };
            const { privateKey } = aztecAccounts[0];
            const { signature } = sign.signStructuredData(domain, schema, message, privateKey);

            const outputOwners = [];
            const inputOwners = [];
            const publicOwner = aztecAccounts[0].address;
            const proofData = inputCoder.joinSplit(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                signature,
                inputOwners,
                outputOwners,
                []
            );

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            await truffleAssert.reverts(joinSplitContract.validateJoinSplit(proofData, senderAddress, constants.CRS, opts));
        });
    });
});
