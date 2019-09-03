/* global artifacts, contract, expect, it: true */

const devUtils = require('@aztec/dev-utils');

const aztec = require('aztec.js');
const dotenv = require('dotenv');

dotenv.config();

const secp256k1 = require('@aztec/secp256k1');

const ACE = artifacts.require('./ACE.sol');
const ethUtil = require('ethereumjs-util');

const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');
const Wallet = artifacts.require('./Wallet.sol');
const helpers = require('../helpers/wallet');
const truffleAssert = require('truffle-assertions');

// const bob = secp256k1.generateAccount();
const alice = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
const bob = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1);
const eve = secp256k1.generateAccount(); // attacker

contract.only('Wallet', async (accounts) => {
    let ace;
    let zkAssetMintableContract;
    let walletContract;

    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        zkAssetMintableContract = await ZkAssetMintable.new(ace.address, '0x0000000000000000000000000000000000000000', 1, 0, []);
        walletContract = await Wallet.new(ace.address, { from: alice.address });
        expect(await walletContract.owner()).to.equal(alice.address);
        expect(accounts[0]).to.equal(alice.address);
    });

    it('owner of the contract should be able to mint notes that are owned by the contract', async () => {
        const { notes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        notes.map(async (note) => {
            const aceNote = await ace.getNote(zkAssetMintableContract.address, note.noteHash);
            expect(aceNote).to.not.equal(undefined);
            expect(aceNote.noteOwner).to.equal(walletContract.address);
        });
    });

    it('owner of contract can approve notes that are owned by the contract to be spent by the contract', async () => {
        const { notes } = await helpers.mintNotes(
            [50, 75, 100, 25, 125],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        const approvedMintedNotes = [notes[0], notes[1], notes[2]];
        const nonApprovedMintedNotes = [notes[3], notes[4]];

        const approvedNoteHashes = approvedMintedNotes.map((note) => note.noteHash);
        await walletContract.batchConfidentialApprove(
            approvedNoteHashes,
            zkAssetMintableContract.address,
            walletContract.address,
            true,
        );

        let approvedMintedNotesConfidentialApproved = await Promise.all(
            approvedMintedNotes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(approvedMintedNotesConfidentialApproved).to.deep.equal(
            approvedMintedNotes.map((i) => true),
        );

        let nonApprovedMintedNotesConfidentialApproved = await Promise.all(
            nonApprovedMintedNotes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(nonApprovedMintedNotesConfidentialApproved).to.deep.equal(
            nonApprovedMintedNotes.map((i) => false),
        );
    });

    it('owner of contract can revoke approval of notes that are owned by the contract to be spent by the contract', async () => {
        const { notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        let notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(
            notes.map((i) => false),
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(
            notes.map((i) => true),
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, false);
        notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(
            notes.map((i) => false),
        );
    });

    it('the contract should be able to spend notes after they have been approved for it to spend', async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        const result = await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        );
        expect(result.receipt.status).to.equal(true);
    });

    it('the contract should be able to approve and spend notes in one call using the spendNotes method', async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        const result = await helpers.approveAndSpendNotes(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            noteHashes,
            zkAssetMintableContract,
            walletContract,
        );
        expect(result.receipt.status).to.equal(true);
    });

    it("the contract shouldn't be able to spend unapproved notes", async () => {
        const { values, notes } = await helpers.mintNotes(
            [25, 125],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await truffleAssert.reverts(helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        ), 'sender does not have approval to spend input note');
    });

    it("the contract shouldn't be able to spend notes that have had approval revoked", async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, false);
        await truffleAssert.reverts(helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        ), 'sender does not have approval to spend input note');
    });

    it("the contract shouldn't be able to spend notes that it has already spent", async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        );
        await truffleAssert.reverts(
            helpers.spendNotesWithFunctions(
                100,
                bob.publicKey,
                alice.publicKey,
                helpers.sum(values),
                notes,
                zkAssetMintableContract,
                walletContract,
            ),
            'input note status is not UNSPENT',
        );

    });

    it('owner of the contract should be able to approve notes for spending by another person', async () => {
        const { notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, bob.address, true);
        notes.map(async (note) => {
            expect(await zkAssetMintableContract.confidentialApproved(note.noteHash, bob.address)).to.equal(true);
        });
    });

    it("the contract shouldn't be able to approve notes for itself to spend that have already been spent", async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        );
        await truffleAssert.reverts(walletContract.batchConfidentialApprove(
            noteHashes,
            zkAssetMintableContract.address,
            walletContract.address,
            true,
        ), 'only unspent notes can be approved');
    });

    it("the contract shouldn't be able to approve notes for another address to spend that have already been spent", async () => {
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            accounts[0],
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, walletContract.address, true);
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
        );
        await truffleAssert.reverts(walletContract.batchConfidentialApprove(noteHashes, zkAssetMintableContract.address, bob.address, true), 'only unspent notes can be approved');
    });

    // it('another person should be able to spend notes owned by the contract after approval to spend', async () => {
    // });

    it('signNoteForConfidentialApprove() should produce a well formed `v` ECDSA parameter', async () => {
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            accounts[0],
            zkAssetMintableContract,
        );
        const spender = account.address;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
        );
        const v = parseInt(signature.slice(130, 132), 16);
        expect(v).to.be.oneOf([27, 28]);
    });

    it('should recover publicKey from signature params', async () => {
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            verifyingContract,
            accounts[0],
            zkAssetMintableContract,
        );
        const spender = bob.address;
        const { encodedTypedData, signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
        );
        const r = Buffer.from(signature.slice(2, 66), 'hex');
        const s = Buffer.from(signature.slice(66, 130), 'hex');
        const v = parseInt(signature.slice(130, 132), 16);
        const messageHash = Buffer.from(encodedTypedData.slice(2), 'hex');
        const publicKeyRecover = ethUtil.ecrecover(messageHash, v, r, s).toString('hex');
        expect(publicKeyRecover).to.equal(account.publicKey.slice(4));
    });

    it('a private key should be able to sign notes for confidential approval and be verified', async () => {
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            accounts[0],
            zkAssetMintableContract,
        );
        const spender = account.address;
        const status = true;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
        );
        await walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address);
    });

    it('signing with another private key should result in the verification failing', async () => {
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            accounts[0],
            zkAssetMintableContract,
        );
        const spender = account.address;
        const status = true;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            eve.privateKey,
        );

        await truffleAssert.reverts(walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address), 'the contract owner did not sign this message');
    });

    // TODO: tests on empty notesArray
});
