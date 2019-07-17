/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { note } = require('aztec.js');
const sepc256k1 = require('@aztec/secp256k1');
const { constants: { addresses } } = require('@aztec/dev-utils');

// ### Artifacts
const NoteRegistryData = artifacts.require('./noteRegistry/epochs/201907/Data201907');

contract('NoteRegistryData', (accounts) => {
    let NoteRegistryDataContract;
    const [owner, notOwner] = accounts;
    const noteOwner = sepc256k1.generateAccount();

    beforeEach(async () => {
        // Deploy data contract owned by an account
        NoteRegistryDataContract = await NoteRegistryData.new(addresses.ZERO_ADDRESS, 1, false, false, {from: owner});
    });

    describe('Success States', async () => {
        it('should be ownable', async () => {
            expect(await NoteRegistryDataContract.owner()).to.equal(owner)
        });

        it('should contain a registry', async () => {
            const noteRegistry = await NoteRegistryDataContract.registry();
            expect(noteRegistry).to.not.equal(undefined);
            expect(noteRegistry.active).to.equal(true);
            expect(noteRegistry.linkedToken).to.equal(addresses.ZERO_ADDRESS);
            expect(noteRegistry.scalingFactor.toNumber()).to.equal(1);
            expect(noteRegistry.totalSupply.toNumber()).to.equal(0);
            expect(noteRegistry.notes).to.equal(undefined)
        });

        it('should create a Note in the registry', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            await NoteRegistryDataContract.createNote(newNote.noteHash, noteOwner.address, { from: owner });
            const noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData).to.not.equal(undefined);
            expect(noteData.noteOwner).to.equal(noteOwner.address);
        });

        it('should delete a Note in the registry', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            await NoteRegistryDataContract.createNote(newNote.noteHash, noteOwner.address, { from: owner });
            let noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData.status.toNumber()).to.equal(1);
            await NoteRegistryDataContract.deleteNote(newNote.noteHash, noteOwner.address, { from: owner });
            noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData.status.toNumber()).to.equal(2);
        });
    });

    describe('Failure States', async () => {
        it('should fail if transaction not from owner', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            await truffleAssert.reverts(NoteRegistryDataContract.createNote(newNote.noteHash, noteOwner.address, { from: notOwner }));
        });

        it('should fail to delete a note if the note is not UNSPENT', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            await NoteRegistryDataContract.createNote(newNote.noteHash, noteOwner.address, { from: owner });
            await NoteRegistryDataContract.deleteNote(newNote.noteHash, noteOwner.address, { from: owner });
            await truffleAssert.reverts(NoteRegistryDataContract.deleteNote(newNote.noteHash, noteOwner.address, { from: owner }));

        });

        it('should fail to delete a note if the note owner is not stored owner', async () => {
            const invalidOwner = sepc256k1.generateAccount();

            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            await NoteRegistryDataContract.createNote(newNote.noteHash, noteOwner.address, { from: owner });

            const invalidNote = await note.create(noteOwner.publicKey, 10, invalidOwner.address);
            await truffleAssert.reverts(NoteRegistryDataContract.deleteNote(invalidNote.noteHash, invalidOwner.address, { from: owner }),
                'input note status is not UNSPENT');
        });
    });
});
