/* global artifacts, expect, contract, beforeEach, it:true */
const { JoinSplitProof, note, signer } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { encoder, note, proof, signer } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { constants } = devUtils;
const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const { outputCoder } = encoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ZkAssetOwnable = artifacts.require('./ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./ZkAssetOwnableTest');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

const setupTwoProofTest = async (noteValues) => {
    const numNotes = noteValues.length;
    const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
    const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

    const depositInputNotes = [];
    const depositOutputNotes = notes.slice(0, 2);
    const depositInputOwnerAccounts = [];

    const transferInputNotes = depositOutputNotes;
    const transferOutputNotes = notes.slice(2, 4);
    const transferInputNoteOwnerAccounts = aztecAccounts.slice(0, 2);

    return {
        depositInputNotes,
        depositOutputNotes,
        depositInputOwnerAccounts,
        transferInputNotes,
        transferOutputNotes,
        transferInputNoteOwnerAccounts,
        notes,
        aztecAccounts,
    };
};

contract('ZkAssetOwnable', (accounts) => {
    let ace;
    let joinSplitValidator;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;

    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join-split validator because of 1 * 256**(0)
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    const publicOwner = accounts[0];

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

    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        erc20 = await ERC20Mintable.new({ from: accounts[0] });
        joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });

        await ace.setCommonReferenceString(bn128.CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);

        erc20 = await ERC20Mintable.new();
        const canAdjustSupply = false;
        const canConvert = true;
        zkAssetOwnable = await ZkAssetOwnable.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await zkAssetOwnable.setProofs(epoch, filter);
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();
        await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);

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

        const canAdjustSupply = false;
        const canConvert = true;
        zkAssetOwnable = await ZkAssetOwnable.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await zkAssetOwnable.setProofs(epoch, filter);

        zkAssetOwnableTest = await ZkAssetOwnableTest.new();
        await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);
    });

    describe('Success States', () => {
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate an address to update a note registry by consuming input notes, with kPublic negative', async () => {
            const noteValues = [0, 10, 30, 20];
            const depositPublicValue = -10;
            const sender = accounts[0];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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
            const transferPublicValue = -40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);
            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic positive', async () => {
            const noteValues = [60, 70, 50, 40];
            const depositPublicValue = -130;
            const sender = accounts[0];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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

            const transferPublicValue = 40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);
            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output);
            expect(receipt.status).to.equal(true);

            const spentNoteHash = transferInputNotes[0].noteHash;
            const result = await ace.getNote(zkAssetOwnable.address, spentNoteHash);
            expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should delegate a contract to update a note registry with kPublic = 0', async () => {
            const noteValues = [10, 20, 15, 15];
            const depositPublicValue = -30;
            const sender = accounts[0];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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

            const transferPublicValue = 0;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);
            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);
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
            await truffleAssert.reverts(zkAssetOwnable.setProofs(epoch, filter, opts), 'only the owner can set the epoch proofs');
        });

        it("should fail to approve a contract to update a note registry if note doesn't exist", async () => {
            const noteValues = [0, 10, 30];
            const depositPublicValue = -10;
            const sender = accounts[0];
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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
                aztecAccounts[0].privateKey,
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
            const noteValues = [0, 10, 30, 20];
            const depositPublicValue = -10;

            const sender = accounts[0];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                transferInputNoteOwnerAccounts,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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

            const transferPublicValue = -40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);
            const transferSignatures = transferProof.constructSignatures(zkAssetOwnable.address, transferInputNoteOwnerAccounts);

            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            await zkAssetOwnable.confidentialTransfer(transferData, transferSignatures);

            const signature = signer.signNote(
                zkAssetOwnable.address,
                transferInputNotes[0].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[0].privateKey,
            );
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(transferInputNotes[0].noteHash, zkAssetOwnableTest.address, true, signature),
                'only unspent notes can be approved',
            );
        });

        // eslint-disable-next-line max-len
        it('should fail to perform confidentialApprove() if a fake signature is provided', async () => {
            const noteValues = [0, 10];
            const depositPublicValue = -10;
            const sender = accounts[0];
            const { depositInputNotes, depositOutputNotes, depositInputOwnerAccounts, notes } = await setupTwoProofTest(
                noteValues,
            );

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
                zkAssetOwnable.confidentialApprove(notes[0].noteHash, zkAssetOwnableTest.address, true, emptySignature),
                'the note owner did not sign this message',
            );
        });

        it('should fail to delegate a contract to update a note registry is proof is not supported', async () => {
            const noteValues = [0, 10, 30, 20];
            const depositPublicValue = -10;
            const sender = accounts[0];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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

            const transferPublicValue = -40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);
            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            const bogusProof = `${parseInt(JOIN_SPLIT_PROOF, 10) + 1}`; // adding 1 changes the proof id from the proof object
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(bogusProof, transferProof.eth.output),
                'expected proof to be supported',
            );
        });

        it('should fail to delegate a contract to update a note registry if publicApprove has not been called', async () => {
            const noteValues = [0, 10, 30, 20];
            const depositPublicValue = -10;
            const sender = accounts[0];
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                notes,
                aztecAccounts,
            } = await setupTwoProofTest(noteValues);

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

            const transferPublicValue = -40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);

            await confidentialApprove([0, 1], notes, aztecAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output),
                'public owner has not validated a transfer of tokens',
            );
        });

        it('should fail to confidentialTransferFrom() if confidentialApprove() has not been called', async () => {
            const noteValues = [0, 10, 30, 20];
            const depositPublicValue = -10;
            const sender = accounts[0];
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
            } = await setupTwoProofTest(noteValues);

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
            const transferPublicValue = -40;
            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAssetOwnable.address);

            await ace.publicApprove(zkAssetOwnable.address, transferProof.hash, transferPublicValue, {
                from: accounts[0],
            });

            // No confidentialApprove() call
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferData);

            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output),
                'sender does not have approval to spend input note',
            );
        });
    });
});
