/* global artifacts, expect, web3, contract, it:true */
const { JoinSplitProof, note, signer } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { randomHex, keccak256 } = require('web3-utils');

const helpers = require('../helpers/ERC1724');
const { generateFactoryId } = require('../helpers/Factory');

const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const ZkAssetOwnable = artifacts.require('./ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./ZkAssetOwnableTest');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
const BaseFactory = artifacts.require('./noteRegistry/epochs/201907/base/FactoryBase201907');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

contract('Approval', (accounts) => {
    let ace;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;
    let baseFactory;

    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join-split validator because of 1 * 256**(0)
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    const publicOwner = accounts[0];
    const sender = accounts[0];
    const newFactoryId = generateFactoryId(2, 1, 1);

    before(async () => {
        ace = await ACE.at(ACE.address);
        erc20 = await ERC20Mintable.new({ from: accounts[0] });

        erc20 = await ERC20Mintable.new();

        zkAssetOwnable = await ZkAssetOwnable.new(ace.address, erc20.address, scalingFactor);
        await zkAssetOwnable.setProofs(epoch, filter);
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();
        await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);

        baseFactory = await BaseFactory.new(ace.address);
        await ace.setFactory(newFactoryId, baseFactory.address);

        await Promise.all(
            accounts.map((account) => {
                const opts = { from: accounts[0], gas: 4700000 };
                return erc20.mint(account, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
        await Promise.all(
            accounts.map((account) => {
                const opts = { from: account, gas: 4700000 };
                return erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
    });

    describe('Success States', () => {
        it('should allow a contract to spend notes if it is the owner', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const outputNotesOwnedByContract = depositOutputNotes.map((noteData) => {
                // eslint-disable-next-line no-param-reassign
                noteData.owner = zkAssetOwnableTest.address;
                return noteData;
            });

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                outputNotesOwnedByContract,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAssetOwnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetOwnable.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAssetOwnable.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });
            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, {
                from: accounts[0],
            });

            const transferProof = new JoinSplitProof(
                outputNotesOwnedByContract,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);

            const { receipt } = await zkAssetOwnableTest.callApproveAndTransferFrom(JOIN_SPLIT_PROOF, transferData);
            expect(receipt.status).to.equal(true);

            const spentNoteHash = outputNotesOwnedByContract[0].noteHash;
            const result = await ace.getNote(zkAssetOwnable.address, spentNoteHash);
            expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });
    });

    describe('Failure States', async () => {
        it('should fail to replay confidentialApprove() signature with flipped s', async () => {
            const { publicKey, privateKey } = secp256k1.generateAccount();
            const testNote = await note.create(publicKey, 10);
            const spenderAddress = randomHex(20);

            // Create some notes in the assets note registry
            const inputNotes = [];
            const outputNotes = [testNote];
            const publicValue = -10;

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const signatures = [];
            const depositData = depositProof.encodeABI(zkAssetOwnable.address);

            await ace.publicApprove(zkAssetOwnable.address, depositProof.hash, publicValue, { from: sender });

            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](depositData, signatures, {
                from: sender,
            });

            let spenderApproval = true;
            const approvalSignature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                testNote.noteHash,
                spenderAddress,
                spenderApproval,
                privateKey,
            );

            // Grant permission
            await zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, approvalSignature);
            const loggedApprovalStatus = await zkAssetOwnable.confidentialApproved.call(testNote.noteHash, spenderAddress);
            expect(loggedApprovalStatus).to.equal(true);

            spenderApproval = false;
            const revokeApprovalSignature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                testNote.noteHash,
                spenderAddress,
                spenderApproval,
                privateKey,
            );

            // Revoke permission
            await zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, revokeApprovalSignature);
            const loggedRevokedStatus = await zkAssetOwnable.confidentialApproved.call(testNote.noteHash, spenderAddress);
            expect(loggedRevokedStatus).to.equal(false);

            // Attempt replay attack - take the previously used grant permission sig,
            // and use to reverse the revoke permission action
            spenderApproval = true;

            const replaySig = signer.makeReplaySignature(approvalSignature);
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, replaySig),
                'revert signature recovery failed',
            );
        });

        it('should fail to replay approveProof() signature with flipped s', async () => {

            const { publicKey, privateKey } = secp256k1.generateAccount();
            const testNoteA = await note.create(publicKey, 10);
            const testNoteB = await note.create(publicKey, 40);

            // Create some notes in the assets note registry
            const depositInputNotes = [];
            const depositOutputNotes = [testNoteA, testNoteB];
            const depositPublicValue = -50;

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const signatures = [];
            const depositData = depositProof.encodeABI(zkAssetOwnable.address);

            await ace.publicApprove(zkAssetOwnable.address, depositProof.hash, depositPublicValue, { from: sender });

            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](depositData, signatures, {
                from: sender,
            });

            const transferInputNotes = depositOutputNotes;
            const transferOutputNotes = [await note.create(publicKey, 50)];
            const withdrawalPublicValue = 0;

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnableTest.address);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const spender = zkAssetOwnableTest.address;

            const proofApprovalSignature = signer.signApprovalForProof(
                zkAssetOwnable.address,
                transferProof.eth.outputs,
                spender,
                true,
                privateKey,
            );

            await zkAssetOwnableTest.callApproveProof(
                JOIN_SPLIT_PROOF,
                transferProof.eth.outputs,
                spender,
                true,
                proofApprovalSignature,
            );

            const loggedApprovalStatusA = await zkAssetOwnable.confidentialApproved.call(
                keccak256(transferProof.eth.output),
                spender,
            );
            expect(loggedApprovalStatusA).to.equal(true);

            const proofRejectSignature = signer.signApprovalForProof(
                zkAssetOwnable.address,
                transferProof.eth.outputs,
                spender,
                false,
                privateKey,
            );

            await zkAssetOwnableTest.callApproveProof(
                JOIN_SPLIT_PROOF,
                transferProof.eth.outputs,
                spender,
                false,
                proofRejectSignature,
            );

            // Attempt replay attack - take the previously used grant permission sig,
            // and use to reverse the revoke permission action
            const replaySig = signer.makeReplaySignature(proofApprovalSignature);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callApproveProof(
                    JOIN_SPLIT_PROOF,
                    transferProof.eth.outputs,
                    spender,
                    true,
                    replaySig,
                ),
                'revert signature recovery failed',
            );
            const loggedApprovalStatusB = await zkAssetOwnable.confidentialApproved.call(
                keccak256(transferProof.eth.output),
                spender,
            );

            expect(loggedApprovalStatusB).to.equal(false);
        });

        it('should not allow a contract to spend notes if it is not the owner', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAssetOwnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetOwnable.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAssetOwnable.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });
            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, {
                from: accounts[0],
            });

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callApproveAndTransferFrom(JOIN_SPLIT_PROOF, transferData),
                'the note owner did not sign this message',
            );
        });

        it('should fail to perform a replay attack, by using a previous signature in confidentialApprove()', async () => {
            const { publicKey, privateKey } = secp256k1.generateAccount();
            const testNote = await note.create(publicKey, 10);
            const spenderAddress = randomHex(20);

            // Create some notes in the assets note registry
            const inputNotes = [];
            const outputNotes = [testNote];
            const publicValue = -10;

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const signatures = [];
            const depositData = depositProof.encodeABI(zkAssetOwnable.address);

            await ace.publicApprove(zkAssetOwnable.address, depositProof.hash, publicValue, { from: sender });

            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](depositData, signatures, {
                from: sender,
            });

            let spenderApproval = true;
            const approvalSignature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                testNote.noteHash,
                spenderAddress,
                spenderApproval,
                privateKey,
            );

            // Grant permission
            await zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, approvalSignature);
            const loggedApprovalStatus = await zkAssetOwnable.confidentialApproved.call(testNote.noteHash, spenderAddress);
            expect(loggedApprovalStatus).to.equal(true);

            spenderApproval = false;
            const revokeApprovalSignature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                testNote.noteHash,
                spenderAddress,
                spenderApproval,
                privateKey,
            );

            // Revoke permission
            await zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, revokeApprovalSignature);
            const loggedRevokedStatus = await zkAssetOwnable.confidentialApproved.call(testNote.noteHash, spenderAddress);
            expect(loggedRevokedStatus).to.equal(false);

            // Attempt replay attack - take the previously used grant permission sig,
            // and use to reverse the revoke permission action
            spenderApproval = true;
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(testNote.noteHash, spenderAddress, spenderApproval, approvalSignature),
                'signature has already been used',
            );
        });
    });
});
