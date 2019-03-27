/* global artifacts, beforeEach, contract, expect,it */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAssetOwnable = artifacts.require('./contracts/ZkAsset/ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./contracts/ZkAsset/ZkAssetOwnableTest');


JoinSplit.abi = JoinSplitInterface.abi;

const signNote = (verifyingContract, noteHash, spender, status, privateKey) => {
    const domain = {
        name: 'ZK_ASSET',
        version: '1',
        verifyingContract,
    };
    const schema = constants.eip712.NOTE_SIGNATURE;
    const message = {
        noteHash,
        spender,
        status,
    };
    return sign.signStructuredData(domain, schema, message, privateKey);
};

contract('ZkAssetOwnable', (accounts) => {
    let ace;
    let aztecJoinSplit;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;

    let aztecAccounts = [];
    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join split validator because of 1 * 256**(0)
    let notes = [];
    let scalingFactor;
    const proofs = [];
    let proofHashes = [];
    let proofOutputs = [];
    const tokensTransferred = new BN(100000);

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

        proofOutputs = proofs.map(({ expectedOutput }) => {
            return outputCoder.getProofOutput(expectedOutput, 0);
        });
        proofHashes = proofOutputs.map((proofOutput) => {
            return outputCoder.hashProofOutput(proofOutput);
        });

        erc20 = await ERC20Mintable.new();
        scalingFactor = new BN(10);
        zkAssetOwnable = await ZkAssetOwnable.new(
            ace.address,
            erc20.address,
            scalingFactor
        );
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();

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
            zkAssetOwnable.address,
            proofHashes[0],
            10,
            { from: accounts[0] }
        );
        await ace.publicApprove(
            zkAssetOwnable.address,
            proofHashes[1],
            40,
            { from: accounts[1] }
        );
    });

    describe('success states', () => {
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it('should have an approved contract update a note registry with output notes', async () => {
            await zkAssetOwnable.setProofs(epoch, filter);
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            await Promise.all([0, 1].map((i) => {
                // eslint-disable-next-line no-unused-vars
                const { typedData, signature } = signNote(
                    zkAssetOwnable.address,
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    aztecAccounts[i].privateKey
                );
                const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
                return zkAssetOwnable.confidentialApprove(
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    concatenatedSignature
                );
            }));

            await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[1].proofData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(
                JOIN_SPLIT_PROOF,
                `0x${proofOutputs[1].slice(0x40)}`
            );
            expect(receipt.status).to.equal(true);
        });
    });

    describe('failure states', async () => {
        it('should fail to set a new proof bit filter', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                zkAssetOwnable.setProofs(epoch, filter, opts),
                'only the owner can set the epoch proofs'
            );
        });

        it('should fail to approve a contract', async () => {
            await zkAssetOwnable.setProofs(epoch, filter);
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            const { signature } = signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                true,
                aztecAccounts[0].privateKey
            );
            const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[2].noteHash, // wrong note hash
                    zkAssetOwnableTest.address,
                    true,
                    concatenatedSignature
                ),
                'only unspent notes can be approved'
            );
        });

        it('should have an approved contract fail to update a note registry with output notes', async () => {
            await zkAssetOwnable.setProofs(epoch, filter);
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            await Promise.all([0, 1].map((i) => {
                const { signature } = signNote(
                    zkAssetOwnable.address,
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    aztecAccounts[i].privateKey
                );
                const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
                return zkAssetOwnable.confidentialApprove(
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    concatenatedSignature
                );
            }));

            await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[1].proofData);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(
                    parseInt(JOIN_SPLIT_PROOF, 10) + 1, // adding 1 changes the proof id from the proof object
                    `0x${proofOutputs[1].slice(0x40)}`
                ),
                'expected proof to be supported'
            );
        });
    });
});
