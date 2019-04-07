/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, keccak256 } = require('web3-utils');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { BOGUS_PROOF, JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ACETest = artifacts.require('./contracts/ACE/ACETest');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('ACE', (accounts) => {
    describe('initialization', () => {
        let ace;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
        });

        it('should set the owner', async () => {
            const owner = await ace.owner();
            expect(owner).to.equal(accounts[0]);
        });

        it('should set the common reference string', async () => {
            await ace.setCommonReferenceString(constants.CRS, { from: accounts[0] });
            const result = await ace.getCommonReferenceString();
            expect(result).to.deep.equal(constants.CRS);
        });

        it('should set a proof', async () => {
            const aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            const resultValidatorAddress = await ace.getValidatorAddress(JOIN_SPLIT_PROOF);
            expect(resultValidatorAddress).to.equal(aztecJoinSplit.address);
        });
    });

    describe('runtime', () => {
        let aztecAccounts = [];
        let ace;
        let aztecJoinSplit;
        let notes = [];
        let proofData;
        let proofOutput;
        let proofHash;
        let expectedOutput;
        let validatedProofHash;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(constants.CRS);
            aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            const inputNotes = notes.slice(2, 4);
            const outputNotes = notes.slice(0, 2);
            const kPublic = 40;
            ({ proofData, expectedOutput } = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 4),
                publicOwner: aztecAccounts[0].address,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            }));
            proofOutput = outputCoder.getProofOutput(expectedOutput, 0);
            proofHash = outputCoder.hashProofOutput(proofOutput);
            const hex = parseInt(JOIN_SPLIT_PROOF, 10).toString(16);
            const hashData = [
                padLeft(proofHash.slice(2), 64),
                padLeft(hex, 64),
                padLeft(accounts[0].slice(2), 64),
            ].join('');
            validatedProofHash = keccak256(`0x${hashData}`);
        });

        describe('success states', () => {
            it('should read the validator address', async () => {
                const validatorAddress = await ace.getValidatorAddress(JOIN_SPLIT_PROOF);
                expect(validatorAddress).to.equal(aztecJoinSplit.address);
            });

            it('should increment the latest epoch', async () => {
                const latestEpoch = new BN(await ace.latestEpoch()).add(new BN(1));
                await ace.incrementLatestEpoch();
                const newLatestEpoch = await ace.latestEpoch();
                expect(newLatestEpoch.toString()).to.equal(latestEpoch.toString());
            });

            it('should validate a join-split proof', async () => {
                const { receipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
                expect(receipt.status).to.equal(true);

                const result = await ace.validatedProofs(validatedProofHash);
                expect(result).to.equal(true);
            });

            it('should have a wrapper contract validate a join-split transaction', async () => {
                const aceTest = await ACETest.new();
                await aceTest.setACEAddress(ace.address);
                const { receipt } = await aceTest.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
                expect(proofOutput).to.equal(receipt.logs[0].args.proofOutputs.slice(0x82));
            });

            it('should validate-by-hash previously set proofs', async () => {
                await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
                const result = await ace.validateProofByHash(JOIN_SPLIT_PROOF, proofHash, accounts[0]);
                expect(result).to.equal(true);
            });

            it('should not validate-by-hash not previously set proofs', async () => {
                const result = await ace.validateProofByHash(BOGUS_PROOF, proofHash, accounts[0]);
                expect(result).to.equal(false);
            });

            it('should not validate an invalid proof hash', async () => {
                const bogusProofHash = '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff';
                const result = await ace.validateProofByHash(JOIN_SPLIT_PROOF, bogusProofHash, accounts[0]);
                expect(result).to.equal(false);
            });

            it('should clear previously set proofs', async () => {
                await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
                const firstResult = await ace.validateProofByHash(JOIN_SPLIT_PROOF, proofHash, accounts[0]);
                expect(firstResult).to.equal(true);
                await ace.clearProofByHashes(JOIN_SPLIT_PROOF, [proofHash]);
                const secondResult = await ace.validateProofByHash(JOIN_SPLIT_PROOF, proofHash, accounts[0]);
                expect(secondResult).to.equal(false);
            });
        });

        describe('failure states', async () => { /* eslint-disable no-unused-vars */
            it('should fail to read a validator address', async () => {
                await truffleAssert.reverts(
                    ace.getValidatorAddress(BOGUS_PROOF),
                    'expected the validator address to exist'
                );
            });

            it('should not increment the latest epoch if not owner', async () => {
                const opts = { from: accounts[1] };
                await truffleAssert.reverts(
                    ace.incrementLatestEpoch(opts),
                    'only the owner can update the latest epoch'
                );
            });

            it('should not set a proof if not owner', async () => {
                const opts = { from: accounts[1] };
                await truffleAssert.reverts(
                    ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address, opts),
                    'only the owner can set a proof'
                );
            });

            it('should not set a proof if the proof\'s epoch is higher than the contract latest epoch', async () => {
                const JOIN_SPLIT_PROOF_V2 = `${parseInt(JOIN_SPLIT_PROOF, 10) + 65536}`; // epoch is 2 instead of 1
                await truffleAssert.reverts(
                    ace.setProof(JOIN_SPLIT_PROOF_V2, aztecJoinSplit.address),
                    'the proof epoch cannot be bigger than the latest epoch'
                );
            });

            it('should not set a proof if it had been set already', async () => {
                await truffleAssert.reverts(
                    ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address),
                    'existing proofs cannot be modified'
                );
            });

            it('should not set a proof if validator address does not exist', async () => {
                await truffleAssert.reverts(
                    ace.setProof(JOIN_SPLIT_PROOF, constants.addresses.ZERO_ADDRESS),
                    'expected the validator address to exist'
                );
            });

            it('should not set the common reference string if not owner', async () => {
                const opts = { from: accounts[1] };
                await truffleAssert.reverts(
                    ace.setCommonReferenceString(constants.CRS, opts),
                    'only the owner can set the common reference string'
                );
            });

            it('should not validate malformed proof data', async () => {
                const malformedProofData = `0x0123${proofData.slice(6)}`;
                // no error message because it throws in assembly
                await truffleAssert.reverts(ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], malformedProofData));
            });

            it('should not validate a malformed uint24 proof', async () => {
                const MALFORMED_PROOF = '0';
                await truffleAssert.reverts(
                    ace.validateProof(MALFORMED_PROOF, accounts[0], proofData),
                    'expected the proof to be valid'
                );
            });

            it('should invalidate a previously validated join-split proof', async () => {
                await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
                await ace.invalidateProof(JOIN_SPLIT_PROOF);

                await truffleAssert.reverts(
                    ace.validateProofByHash(JOIN_SPLIT_PROOF, validatedProofHash, accounts[0]),
                    'proof id has been invalidated'
                );
            });

            it('should not invalidate proof if not owner', async () => {
                await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);

                const opts = { from: accounts[1] };
                await truffleAssert.reverts(
                    ace.invalidateProof(JOIN_SPLIT_PROOF, opts),
                    'only the owner can invalidate a proof'
                );
            });

            it('should not clear empty proof hashes', async () => {
                await truffleAssert.reverts(
                    ace.clearProofByHashes(JOIN_SPLIT_PROOF, [padLeft('0x0', 64)]),
                    'expected no empty proof hash'
                );
            });

            it('should not clear not previously validated proof hashes', async () => {
                await truffleAssert.reverts(
                    ace.clearProofByHashes(JOIN_SPLIT_PROOF, [proofHash]),
                    'can only clear previously validated proofs'
                );
            });
        });
    });
});
