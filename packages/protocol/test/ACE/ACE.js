/* global artifacts, expect, contract, beforeEach, web3, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const { exceptions } = require('@aztec/dev-utils');

// ### Internal Dependencies

const {
    abiEncoder,
    note,
    secp256k1,
    proof,
} = require('aztec.js');
const {
    constants: {
        CRS,
    },
} = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;
const { joinSplit: { encodeJoinSplitTransaction } } = proof;


// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');

JoinSplit.abi = JoinSplitInterface.abi;


contract('ACE', (accounts) => {
    describe('initialization tests', () => {
        let ace;
        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
        });

        it('can set the common reference string', async () => {
            await ace.setCommonReferenceString(CRS, { from: accounts[0] });
            const result = await ace.getCommonReferenceString();
            expect(result).to.deep.equal(CRS);
        });

        it('can set a proof', async () => {
            const aztec = await JoinSplit.new();
            await ace.setProof(1, aztec.address, true);
            const resultValidatorAddress = await ace.validators(1);
            expect(resultValidatorAddress).to.equal(aztec.address);
            const resultBalanced = await ace.balancedProofs(1);
            expect(resultBalanced).to.equal(true);
        });

        it('cannot set a proof if not owner', async () => {
            await exceptions.catchRevert(ace.setProof(1, accounts[1], true, {
                from: accounts[1],
            }));
        });

        it('cannot set the common reference string if not owner', async () => {
            await exceptions.catchRevert(ace.setCommonReferenceString(CRS, {
                from: accounts[1],
            }));
        });
    });

    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let proofData;
        let proofHash;
        let expectedOutput;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(CRS);
            const aztec = await JoinSplit.new();
            await ace.setProof(1, aztec.address, true);
            const inputNotes = notes.slice(2, 4);
            const outputNotes = notes.slice(0, 2);
            const kPublic = 40;
            const publicOwner = aztecAccounts[0].address;
            ({ proofData, expectedOutput } = encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 4),
                publicOwner,
                kPublic,
                validatorAddress: aztec.address,
            }));
            const proofOutput = outputCoder.getProofOutput(expectedOutput, 0);
            proofHash = outputCoder.hashProofOutput(proofOutput);
        });

        it('will validate a join-split transaction!', async () => {
            const { receipt } = await ace.validateProof(1, accounts[0], proofData);
            expect(receipt.status).to.equal(true);
            const hashData = [
                padLeft(proofHash.slice(2), 64),
                padLeft('01', 64),
                padLeft(accounts[0].slice(2), 64),
            ].join('');
            const validatedProofsSlot = 9;
            const storageHash = [
                padLeft(sha3(`0x${hashData}`).slice(2), 64),
                padLeft(validatedProofsSlot.toString(16), 64),
            ].join('');
            const storagePtr = sha3(`0x${storageHash}`).slice(2);
            const result = await web3.eth.getStorageAt(ace.address, new BN(storagePtr, 16));
            expect(result).to.equal('0x01');
        });

        it('validateProofByHash will return true for a previously validated proof', async () => {
            const { receipt } = await ace.validateProof(1, accounts[0], proofData);
            expect(receipt.status).to.equal(true);
            const result = await ace.validateProofByHash(1, proofHash, accounts[0]);
            expect(result).to.equal(true);
        });

        it('clearProofByHashes will clear previously set proofs', async () => {
            await ace.validateProof(1, accounts[0], proofData);
            const firstResult = await ace.validateProofByHash(1, proofHash, accounts[0]);
            expect(firstResult).to.equal(true);
            await ace.clearProofByHashes(1, [proofHash]);
            const secondResult = await ace.validateProofByHash(1, proofHash, accounts[0]);
            expect(secondResult).to.equal(false);
        });
    });
});
