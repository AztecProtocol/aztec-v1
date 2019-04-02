/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
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
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;


contract('ACE', (accounts) => {
    describe('initialization tests', () => {
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
        let notes = [];
        let ace;
        let aztecJoinSplit;
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
            const publicOwner = aztecAccounts[0].address;
            const kPublic = 40;
            ({ proofData, expectedOutput } = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 4),
                publicOwner,
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
            it('should throw when the proof maps to no validator address', async () => {
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
                const malformedProofData = '0x0123' + proofData.slice(6);
                await truffleAssert.reverts(ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], malformedProofData));
            });

            it('should not validate a malformed uint24 proof', async () => {
                const MALFORMED_PROOF = '0';
                await truffleAssert.reverts(
                    ace.validateProof(MALFORMED_PROOF, accounts[0], proofData),
                    'proof object invalid'
                );
            });

            // TODO: fix this
            // it('should not validate an invalid proof hash', async () => {
            //     const bogusProofHash = '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff';
            //     await truffleAssert.reverts(
            //         ace.validateProofByHash(JOIN_SPLIT_PROOF, bogusProofHash, accounts[0]),
            //         'proof invalid'
            //     );
            // });

            // TODO: fix this
            // it('should invalidate a previously validated join-split proof', async () => {
            //     await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofData);
            //     const { receipt } = await ace.invalidateProof(JOIN_SPLIT_PROOF);
            //     expect(receipt.status).to.equal(true);

            //     await truffleAssert(
            //         ace.validateProofByHash(JOIN_SPLIT_PROOF, validatedProofHash, accounts[0]),
            //         'this proof id has been invalidated!'
            //     );
            // });

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

contract('note registry', (accounts) => {
    describe('success states', async () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let scalingFactor;
        const proofs = [];
        let proofOutputs = [];
        const tokensTransferred = new BN(100000);

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
            const aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            const publicOwner = accounts[0];
            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner,
                kPublic: -10,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[3] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: 40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[4] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[5] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                validatorAddress: aztecJoinSplit.address,
            });
            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                ace.address, // address approving to spend
                scalingFactor.mul(tokensTransferred), // value to transfer
                { from: account, gas: 4700000 }
            ))); // approving tokens
            proofOutputs = proofs.map(({ expectedOutput }) => outputCoder.getProofOutput(expectedOutput, 0));
            const proofHashes = proofOutputs.map(proofOutput => outputCoder.hashProofOutput(proofOutput));
            await ace.publicApprove(
                accounts[0],
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
        });

        it('should create a new note registry', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const { receipt } = await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[1] }
            );
            expect(receipt.status).to.equal(true);
        });

        it('should be able to read a registry from storage', async () => {
            const registry = await ace.getRegistry(accounts[0]);
            expect(registry.linkedToken).to.equal(erc20.address);
            expect(registry.scalingFactor.toString()).to.equal(scalingFactor.toString());
            expect(registry.confidentialTotalSupply).to.equal(padLeft('0x00', 64));
            expect(registry.canAdjustSupply).to.equal(false);
            expect(registry.canConvert).to.equal(true);
        });

        it('should be able to read a note from storage', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const result = await ace.getNote(accounts[0], notes[0].noteHash);
            const block = await web3.eth.getBlock('latest');
            expect(result.status.toNumber()).to.equal(1);
            expect(result.createdOn.toString()).to.equal(block.timestamp.toString());
            expect(result.destroyedOn.toString()).to.equal('0');
            expect(result.noteOwner).to.equal(notes[0].owner);
        });

        it('should withdraw from the public erc20 contract ', async () => {
            const publicOwner = accounts[0];
            const previousTokenBalance = await erc20.balanceOf(publicOwner);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const tokenBalance = await erc20.balanceOf(publicOwner);
            const withdrawnAmount = new BN(10); // kPublic is -10
            const newBalance = previousTokenBalance.sub(withdrawnAmount);
            expect(tokenBalance.toString()).to.equal(newBalance.toString());
        });

        it('should deposit into the public erc20 contract ', async () => {
            const publicOwner = accounts[2];
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const previousTokenBalance = await erc20.balanceOf(publicOwner);

            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[3].proofData);
            formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const tokenBalance = await erc20.balanceOf(publicOwner);
            const withdrawnAmount = new BN(40); // kPublic is 40
            const newBalance = previousTokenBalance.add(withdrawnAmount);
            expect(tokenBalance.toString()).to.equal(newBalance.toString());
        });

        it('should update a note registry with output notes', async () => {
            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should put output notes in the registry', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
            const secondNote = await ace.getNote(accounts[0], notes[1].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        });

        it('should clear input notes from the registry', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            let firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
            let secondNote = await ace.getNote(accounts[0], notes[1].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);

            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[1].proofData);
            formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
            secondNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[1].proofData);
            formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic positive', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[3].proofData);
            formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[4].proofData);
            let formattedProofOutput = `0x${proofOutputs[4].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[5].proofData);
            formattedProofOutput = `0x${proofOutputs[5].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });
    });

    describe('failure states', async () => {
        let ace;

        it('should throw when trying to read a non-existent registry', async () => {
            await truffleAssert.reverts(
                ace.getRegistry(accounts[1]),
                'registry not created'
            );
        });
    });
});
