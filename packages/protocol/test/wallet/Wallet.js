/* global artifacts, contract, expect, it: true */

const aztec = require('aztec.js');
const dotenv = require('dotenv');

dotenv.config();

const secp256k1 = require('@aztec/secp256k1');

const ACE = artifacts.require('./ACE.sol');
const ethUtil = require('ethereumjs-util');

const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');
const Wallet = artifacts.require('./Wallet.sol');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const helpers = require('../helpers/wallet');

// set TEST_MNEMONIC in packages/protocol/.env, packages/protocol/scripts/test.js will automatically start ganache using it
const mnemonic = process.env.TEST_MNEMONIC;

const seed = bip39.mnemonicToSeed(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);
const aliceWallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
const bobWallet = hdwallet.derivePath("m/44'/60'/0'/0/1").getWallet();

const alice = secp256k1.accountFromPrivateKey(aliceWallet.getPrivateKeyString());
const bob = secp256k1.accountFromPrivateKey(bobWallet.getPrivateKeyString());
const eve = secp256k1.generateAccount(); // attacker

contract('Wallet', async (accounts) => {
    let ace;
    let zkAssetMintableContract;
    let walletContract;

    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        zkAssetMintableContract = await ZkAssetMintable.new(ace.address, '0x0000000000000000000000000000000000000000', 1, 0, []);
        walletContract = await Wallet.new(ace.address);
        await walletContract.transferOwnership(alice.address);
        expect(await walletContract.owner()).to.equal(alice.address);
        expect(accounts[0]).to.equal(alice.address);
        expect(accounts[1]).to.equal(bob.address);
    });

    it('owner of the contract should be able to mint notes that are owned by the contract', async () => {
        const sender = alice.address;
        const { notes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await Promise.all(
            notes.map(async (note) => {
                const aceNote = await ace.getNote(zkAssetMintableContract.address, note.noteHash, { from: sender });
                expect(aceNote).to.not.equal(undefined);
                expect(aceNote.noteOwner).to.equal(walletContract.address);
            }),
        );
    });

    it('owner of contract can approve notes that are owned by the contract to be spent by the contract', async () => {
        const sender = alice.address;
        const { notes } = await helpers.mintNotes(
            [50, 75, 100, 25, 125],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        const approvedMintedNotes = [notes[0], notes[1], notes[2]];
        const nonApprovedMintedNotes = [notes[3], notes[4]];

        const approvedNoteHashes = approvedMintedNotes.map((note) => note.noteHash);
        await walletContract.batchConfidentialApprove(
            approvedNoteHashes,
            walletContract.address,
            true,
            zkAssetMintableContract.address,
            { from: sender },
        );
        const approvedMintedNotesConfidentialApproved = await Promise.all(
            approvedMintedNotes.map((note) =>
                zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address),
            ),
        );
        expect(approvedMintedNotesConfidentialApproved).to.deep.equal(approvedMintedNotes.map(() => true));

        const nonApprovedMintedNotesConfidentialApproved = await Promise.all(
            nonApprovedMintedNotes.map((note) =>
                zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address),
            ),
        );
        expect(nonApprovedMintedNotesConfidentialApproved).to.deep.equal(nonApprovedMintedNotes.map(() => false));
    });

    it('owner of contract can revoke approval of notes that are owned by the contract to be spent by the contract', async () => {
        const sender = alice.address;
        const { notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        let notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(notes.map(() => false));
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(notes.map(() => true));
        await walletContract.batchConfidentialApprove(
            noteHashes,
            walletContract.address,
            false,
            zkAssetMintableContract.address,
            { from: sender },
        );
        notesConfidentialApproved = await Promise.all(
            notes.map((note) => zkAssetMintableContract.confidentialApproved(note.noteHash, walletContract.address)),
        );
        expect(notesConfidentialApproved).to.deep.equal(notes.map(() => false));
    });

    it('the contract should be able to spend notes after they have been approved for it to spend', async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        const result = await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
            sender,
        );
        expect(result.receipt.status).to.equal(true);
    });

    it('the contract should be able to approve and spend notes in one call using the spendNotes method', async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
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
            sender,
        );
        expect(result.receipt.status).to.equal(true);
    });

    it("the contract shouldn't be able to spend unapproved notes", async () => {
        const sender = alice.address;
        const { values, notes } = await helpers.mintNotes(
            [25, 125],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
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
                sender,
            ),
            'sender does not have approval to spend input note',
        );
    });

    it("the contract shouldn't be able to spend notes that have had approval revoked", async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        await walletContract.batchConfidentialApprove(
            noteHashes,
            walletContract.address,
            false,
            zkAssetMintableContract.address,
            { from: sender },
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
                sender,
            ),
            'sender does not have approval to spend input note',
        );
    });

    it("the contract shouldn't be able to spend notes that it has already spent", async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
            sender,
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
                sender,
            ),
            'input note status is not UNSPENT',
        );
    });

    it('owner of the contract should be able to approve notes for spending by another person', async () => {
        const sender = alice.address;
        const { notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, bob.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        await Promise.all(
            notes.map(async (note) => {
                expect(await zkAssetMintableContract.confidentialApproved(note.noteHash, bob.address)).to.equal(true);
            }),
        );
    });

    it("the contract shouldn't be able to approve notes for itself to spend that have already been spent", async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
            sender,
        );
        await truffleAssert.reverts(
            walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
                from: sender,
            }),
            'only unspent notes can be approved',
        );
    });

    it("the contract shouldn't be able to approve notes for another address to spend that have already been spent", async () => {
        const sender = alice.address;
        const { values, notes, noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            walletContract.address,
            sender,
            zkAssetMintableContract,
        );
        await walletContract.batchConfidentialApprove(noteHashes, walletContract.address, true, zkAssetMintableContract.address, {
            from: sender,
        });
        await helpers.spendNotesWithFunctions(
            100,
            bob.publicKey,
            alice.publicKey,
            helpers.sum(values),
            notes,
            zkAssetMintableContract,
            walletContract,
            sender,
        );
        await truffleAssert.reverts(
            walletContract.batchConfidentialApprove(noteHashes, bob.address, true, zkAssetMintableContract.address, {
                from: sender,
            }),
            'only unspent notes can be approved',
        );
    });

    it('signNoteForConfidentialApprove() should produce a well formed `v` ECDSA parameter', async () => {
        const sender = alice.address;
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            sender,
            zkAssetMintableContract,
        );
        const spender = account.address;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
            { from: sender },
        );
        const v = parseInt(signature.slice(130, 132), 16);
        expect(v).to.be.oneOf([27, 28]);
    });

    it('should recover publicKey from signature params', async () => {
        const sender = alice.address;
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            alice.publicKey,
            verifyingContract,
            sender,
            zkAssetMintableContract,
        );
        const spender = bob.address;
        const { encodedTypedData, signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
            { from: sender },
        );
        const r = Buffer.from(signature.slice(2, 66), 'hex');
        const s = Buffer.from(signature.slice(66, 130), 'hex');
        const v = parseInt(signature.slice(130, 132), 16);
        const messageHash = Buffer.from(encodedTypedData.slice(2), 'hex');
        const publicKeyRecover = ethUtil.ecrecover(messageHash, v, r, s).toString('hex');
        expect(publicKeyRecover).to.equal(account.publicKey.slice(4));
    });

    it('a private key should be able to sign notes for confidential approval and be verified', async () => {
        const sender = alice.address;
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            sender,
            zkAssetMintableContract,
        );
        const spender = account.address;
        const status = true;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
            { from: sender },
        );
        await walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
            from: sender,
        });
    });

    it('signing with another private key should result in the verification failing', async () => {
        const sender = alice.address;
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            sender,
            zkAssetMintableContract,
        );
        const spender = account.address;
        const status = true;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            eve.privateKey,
            { from: sender },
        );

        await truffleAssert.reverts(
            walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'the contract owner did not sign this message',
        );
    });

    it('signing with a bad or empty signature should result in the verification failing', async () => {
        const sender = alice.address;
        const account = alice;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100],
            account.publicKey,
            verifyingContract,
            sender,
            zkAssetMintableContract,
        );
        const spender = account.address;
        const status = true;
        let { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            noteHashes,
            spender,
            eve.privateKey,
            { from: sender },
        );
        signature = signature.slice(0, signature.length - 7).concat('aaaaaa');
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'signer address cannot be 0',
        );
        signature = padLeft(randomHex(132), 132);
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'signer address cannot be 0',
        );
        signature = padLeft(randomHex(234), 321);
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'signer address cannot be 0',
        );
        signature = '0x';
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(noteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'signer address cannot be 0',
        );
    });

    it('validation should fail when the note hashes presented are different', async () => {
        const sender = alice.address;
        const account = alice;
        const spender = account.address;
        const verifyingContract = walletContract.address;
        const { noteHashes } = await helpers.mintNotes(
            [50, 75, 100, 50, 75, 100],
            account.publicKey,
            verifyingContract,
            spender,
            zkAssetMintableContract,
        );
        const goodNoteHashes = noteHashes.slice(0, 2);
        const badNoteHashes = noteHashes.slice(3);

        const status = true;
        const { signature } = aztec.signer.signMultipleNotesForBatchConfidentialApprove(
            verifyingContract,
            goodNoteHashes,
            spender,
            account.privateKey,
            { from: sender },
        );
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(badNoteHashes, spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'the contract owner did not sign this message',
        );
        await truffleAssert.reverts(
            walletContract.batchValidateSignature(
                noteHashes.concat(badNoteHashes[0]),
                spender,
                status,
                signature,
                zkAssetMintableContract.address,
                { from: sender },
            ),
            'the contract owner did not sign this message',
        );
        await truffleAssert.reverts(
            walletContract.batchValidateSignature([], spender, status, signature, zkAssetMintableContract.address, {
                from: sender,
            }),
            'the contract owner did not sign this message',
        );
    });
});
