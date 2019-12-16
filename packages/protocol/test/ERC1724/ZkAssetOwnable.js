/* global artifacts, expect, web3, contract, it:true */
const { JoinSplitProof, note, signer } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { randomHex } = require('web3-utils');

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

contract('ZkAssetOwnable', (accounts) => {
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

    const confidentialApprove = async (indexes, notes, aztecAccounts) => {
        const spenderApproval = true;
        await Promise.all(
            indexes.map((i) => {
                const signature = signer.signNoteForConfidentialApprove(
                    zkAssetOwnable.address,
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    spenderApproval,
                    aztecAccounts[i].privateKey,
                );
                // eslint-disable-next-line no-await-in-loop
                return zkAssetOwnable.confidentialApprove(notes[i].noteHash, zkAssetOwnableTest.address, true, signature);
            }),
        );
    };

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
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate an address to update a note registry by consuming input notes, with kPublic negative', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
                notes,
                ownerAccounts,
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

            await confidentialApprove([0, 1], notes, ownerAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);
        });

        it('should be able to deploy an upgraded note registry if owner', async () => {
            await zkAssetOwnable.upgradeRegistryVersion(newFactoryId);

            const topic = web3.utils.keccak256('UpgradeNoteRegistry(address,address,address)');

            const logs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: ace.address,
                        topics: [topic],
                    })
                    .then(resolve);
            });
            expect(logs.length).to.not.equal(0);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic positive', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
                notes,
                ownerAccounts,
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
            await confidentialApprove([0, 1], notes, ownerAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);

            const spentNoteHash = transferInputNotes[0].noteHash;
            const result = await ace.getNote(zkAssetOwnable.address, spentNoteHash);
            expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should delegate, using confidentialApprove(), a contract to update a note registry with kPublic = 0', async () => {
            const depositOutputNoteValues = [10, 20];
            const depositPublicValue = -30;

            const transferOutputNoteValues = [15, 15];
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                ownerAccounts,
            } = await helpers.getDepositAndTransferNotes(depositOutputNoteValues, transferOutputNoteValues);

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

            await confidentialApprove([0, 1], notes, ownerAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);
        });

        it('should revoke confidentialApprove() permission granting', async () => {
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
        });

        it('should delegate spending control of multiple notes, using batchConfidentialApprove()', async () => {
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

            const spenderApprovals = [true, true];
            const noteHashes = [testNoteA.noteHash, testNoteB.noteHash];
            const spender = zkAssetOwnableTest.address;

            const batchSignature = signer.signNotesForBatchConfidentialApprove(
                zkAssetOwnable.address,
                noteHashes,
                spender,
                spenderApprovals,
                privateKey,
            );

            await zkAssetOwnableTest.callBatchConfidentialApprove(noteHashes, spender, spenderApprovals, batchSignature);
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);
        });

        // eslint-disable-next-line max-len
        it('should seletively approve and revoke spending control of multiple notes, using batchConfidentialApprove()', async () => {
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

            const spenderApprovals = [true, false];
            const noteHashes = [testNoteA.noteHash, testNoteB.noteHash];
            const spender = zkAssetOwnableTest.address;

            const batchSignature = signer.signNotesForBatchConfidentialApprove(
                zkAssetOwnable.address,
                noteHashes,
                spender,
                spenderApprovals,
                privateKey,
            );

            await zkAssetOwnableTest.callBatchConfidentialApprove(noteHashes, spender, spenderApprovals, batchSignature);

            const loggedApprovalStatusA = await zkAssetOwnable.confidentialApproved.call(testNoteA.noteHash, spender);
            expect(loggedApprovalStatusA).to.equal(true);

            const loggedApprovalStatusB = await zkAssetOwnable.confidentialApproved.call(testNoteB.noteHash, spender);
            expect(loggedApprovalStatusB).to.equal(false);
        });
    });

    describe('Failure States', async () => {
        it('should fail to set a new proof bit filter if not owner', async () => {
            const opts = {
                from: accounts[1],
            };
            await truffleAssert.reverts(zkAssetOwnable.setProofs(epoch, filter, opts));
        });

        it("should fail to approve a contract to update a note registry if note doesn't exist", async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                depositPublicValue,
                notes,
                ownerAccounts,
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

            const spenderApproval = true;
            const signature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                spenderApproval,
                ownerAccounts[0].privateKey,
            );
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[2].noteHash, // wrong note hash
                    zkAssetOwnableTest.address,
                    true,
                    signature,
                ),
                'expected note to exist',
            );
        });

        it('should fail to perform confidentialApprove() for an already spent note', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                transferInputOwnerAccounts,
                depositPublicValue,
                withdrawalPublicValue,
                ownerAccounts,
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

            const transferSignatures = transferProof.constructSignatures(zkAssetOwnable.address, transferInputOwnerAccounts);

            await zkAssetOwnable.methods['confidentialTransfer(bytes,bytes)'](transferData, transferSignatures);

            const spenderApproval = true;
            const signature = signer.signNoteForConfidentialApprove(
                zkAssetOwnable.address,
                transferInputNotes[0].noteHash,
                zkAssetOwnableTest.address,
                spenderApproval,
                ownerAccounts[0].privateKey,
            );
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(transferInputNotes[0].noteHash, zkAssetOwnableTest.address, true, signature),
                'only unspent notes can be approved',
            );
        });

        it('should fail to perform confidentialApprove() if a malformed signature is provided', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                depositPublicValue,
                transferInputNotes,
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

            const emptySignature = '0x';
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    transferInputNotes[0].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    emptySignature,
                ),
                'the note owner did not sign this message',
            );
        });

        it('should fail to delegate a contract to update a note registry is proof is not supported', async () => {
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
                notes,
                ownerAccounts,
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
            await confidentialApprove([0, 1], notes, ownerAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const bogusProof = `${parseInt(JOIN_SPLIT_PROOF, 10) + 1}`; // adding 1 changes the proof id from the proof object
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(bogusProof, transferProof.eth.output),
                'expected proof to be supported',
            );
        });

        it('should fail to confidentialTransferFrom() if confidentialApprove() has not been called', async () => {
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

            // No confidentialApprove() call
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output),
                'sender does not have approval to spend input note',
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

        it('should fail to perform confidentialTransferFrom() if batchConfidentialApprove() not previously called', async () => {
            const { publicKey } = secp256k1.generateAccount();
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

            // batchConfidentialApprove() not called
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output),
                'sender does not have approval to spend input note',
            );
        });
    });
});
