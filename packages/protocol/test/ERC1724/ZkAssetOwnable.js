/* global artifacts, expect, web3, contract, beforeEach, it:true */
const { JoinSplitProof, signer } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const helpers = require('../helpers/ERC1724');

const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const ZkAssetOwnable = artifacts.require('./ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./ZkAssetOwnableTest');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
const ConvertibleFactory = artifacts.require('./noteRegistry/epochs/201907/convertible/FactoryConvertible201907');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

const generateFactoryId = (epoch, cryptoSystem, assetType) => {
    return epoch * 256 ** 2 + cryptoSystem * 256 ** 1 + assetType * 256 ** 0;
};

contract('ZkAssetOwnable', (accounts) => {
    let ace;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;
    let convertibleFactory;

    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join-split validator because of 1 * 256**(0)
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    const publicOwner = accounts[0];
    const sender = accounts[0];
    const newFactoryId = generateFactoryId(2, 1, 1);

    const confidentialApprove = async (indexes, notes, aztecAccounts) => {
        await Promise.all(
            indexes.map((i) => {
                const signature = signer.signNote(
                    zkAssetOwnable.address,
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
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

        convertibleFactory = await ConvertibleFactory.new(ace.address);
        await ace.setFactory(newFactoryId, convertibleFactory.address);

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

            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });
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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

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

        it('should delegate a contract to update a note registry with kPublic = 0', async () => {
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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

            const signature = signer.signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);

            const transferSignatures = transferProof.constructSignatures(zkAssetOwnable.address, transferInputOwnerAccounts);

            await zkAssetOwnable.confidentialTransfer(transferData, transferSignatures);

            const signature = signer.signNote(
                zkAssetOwnable.address,
                transferInputNotes[0].noteHash,
                zkAssetOwnableTest.address,
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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

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
            await zkAssetOwnable.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });
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
    });
});
