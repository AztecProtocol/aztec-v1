/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');
const { keccak256 } = require('web3-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAsset = artifacts.require('./contracts/ZkAsset/ZkAsset');


JoinSplit.abi = JoinSplitInterface.abi;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = sign.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${sign.eip712.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

contract('ZkAsset', (accounts) => {
    describe('success states', () => {
        let ace;
        let aztecAccounts = [];
        let aztecJoinSplit;
        const canAdjustSupply = false;
        const canConvert = true;
        let erc20;
        let notes = [];
        const proofs = [];
        const scalingFactor = new BN(10);
        const tokensTransferred = new BN(100000);
        let zkAsset;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(constants.CRS);
            aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
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

            const proofOutputs = proofs.map(({ expectedOutput }) => {
                return outputCoder.getProofOutput(expectedOutput, 0);
            });
            const proofHashes = proofOutputs.map((proofOutput) => {
                return outputCoder.hashProofOutput(proofOutput);
            });

            erc20 = await ERC20Mintable.new();
            zkAsset = await ZkAsset.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert
            );

            await Promise.all(accounts.map((account) => {
                const opts = { from: accounts[0], gas: 4700000 };
                return erc20.mint(
                    account,
                    scalingFactor.mul(tokensTransferred),
                    opts
                );
            }));
            await Promise.all(accounts.map((account) => {
                const opts = { from: account, gas: 4700000 };
                return erc20.approve(
                    ace.address,
                    scalingFactor.mul(tokensTransferred),
                    opts
                );
            }));

            await ace.publicApprove(
                zkAsset.address,
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await ace.publicApprove(
                zkAsset.address,
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await ace.publicApprove(
                zkAsset.address,
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await ace.publicApprove(
                zkAsset.address,
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
        });


        describe('success states', async () => {
            it('should correctly compute the domain hash', async () => {
                const domainHash = computeDomainHash(zkAsset.address);
                const result = await zkAsset.EIP712_DOMAIN_HASH();
                expect(result).to.equal(domainHash);
            });

            it('should correctly set the flags', async () => {
                const result = await zkAsset.flags();
                expect(result.active).to.equal(true);
                expect(result.canAdjustSupply).to.equal(false);
                expect(result.canConvert).to.equal(true);
            });

            it('should correctly set the linked token', async () => {
                const result = await zkAsset.linkedToken();
                expect(result).to.equal(erc20.address);
            });

            it('should correctly set the scaling factor', async () => {
                const result = await zkAsset.scalingFactor();
                expect(result.toNumber()).to.equal(scalingFactor.toNumber());
            });

            it('should update a note registry with output notes', async () => {
                const { receipt } = await zkAsset.confidentialTransfer(proofs[0].proofData);
                expect(receipt.status).to.equal(true);
                console.log('gas used = ', receipt.gasUsed);
            });

            it('should update a note registry by consuming input notes, with kPublic negative', async () => {
                await zkAsset.confidentialTransfer(proofs[0].proofData);
                const { receipt } = await zkAsset.confidentialTransfer(proofs[1].proofData);
                expect(receipt.status).to.equal(true);
            });

            it('should update a note registry by consuming input notes, with kPublic positive', async () => {
                await zkAsset.confidentialTransfer(proofs[2].proofData);
                const { receipt } = await zkAsset.confidentialTransfer(proofs[3].proofData);
                expect(receipt.status).to.equal(true);
                const result = await ace.getNote(zkAsset.address, notes[6].noteHash);
                expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
            });

            it('should update a note registry with kPublic = 0', async () => {
                await zkAsset.confidentialTransfer(proofs[4].proofData);
                const { receipt } = await zkAsset.confidentialTransfer(proofs[5].proofData);
                expect(receipt.status).to.equal(true);
            });
        });

        describe('failure states', async () => {
            it('should fail if the ace fails to validate the proof', async () => {
                const malformedProofData = `0x0123${proofs[0].proofData.slice(6)}`;
                // no error message because it throws in assembly
                await truffleAssert.reverts(zkAsset.confidentialTransfer(malformedProofData));
            });
        });
    });
});
