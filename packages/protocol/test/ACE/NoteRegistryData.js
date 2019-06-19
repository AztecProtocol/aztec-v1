/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { encoder, note, proof } = require('aztec.js');
const sepc256k1 = require('@aztec/secp256k1');
const { constants: { addresses } } = require('@aztec/dev-utils');

// ### Artifacts
const NoteRegistryData = artifacts.require('./NoteRegistryData');

contract.only('NoteRegistryData', (accounts) => {
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
            const encodedNote = encoder.outputCoder.encodeInputNote(newNote);
            await NoteRegistryDataContract.createNote(`0x${encodedNote.slice(0x40)}`, { from: owner });
            const noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData).to.not.equal(undefined);
            expect(noteData.noteOwner).to.equal(noteOwner.address);
        });

        it('should delete a Note in the registry', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            const encodedNote = encoder.outputCoder.encodeInputNote(newNote);
            await NoteRegistryDataContract.createNote(`0x${encodedNote.slice(0x40)}`, { from: owner });
            let noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData.status.toNumber()).to.equal(1);
            await NoteRegistryDataContract.deleteNote(`0x${encodedNote.slice(0x40)}`, { from: owner });
            noteData = await NoteRegistryDataContract.getNote(newNote.noteHash, { from: owner });
            expect(noteData.status.toNumber()).to.equal(2);
        });
    });

    describe('Failure States', async () => {
        it('should fail if transaction not from owner', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            const encodedNote = encoder.outputCoder.encodeInputNote(newNote);
            await truffleAssert.reverts(NoteRegistryDataContract.createNote(`0x${encodedNote.slice(0x40)}`, { from: notOwner }));
        });

        it('should fail to delete a note if the note is not UNSPENT', async () => {
            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            const encodedNote = encoder.outputCoder.encodeInputNote(newNote);
            await NoteRegistryDataContract.createNote(`0x${encodedNote.slice(0x40)}`, { from: owner });
            await NoteRegistryDataContract.deleteNote(`0x${encodedNote.slice(0x40)}`, { from: owner });
            await truffleAssert.reverts(NoteRegistryDataContract.deleteNote(`0x${encodedNote.slice(0x40)}`, { from: owner }));

        });

        it('should fail to delete a note if the note owner is not stored owner', async () => {
            const invalidOwner = sepc256k1.generateAccount();

            const newNote = await note.create(noteOwner.publicKey, 10, noteOwner.address);
            const encodedNote = encoder.outputCoder.encodeInputNote(newNote);
            await NoteRegistryDataContract.createNote(`0x${encodedNote.slice(0x40)}`, { from: owner });

            const invalidNote = await note.create(noteOwner.publicKey, 10, invalidOwner.address);
            const invalidEncodedNote = encoder.outputCoder.encodeInputNote(invalidNote);
            await truffleAssert.reverts(NoteRegistryDataContract.deleteNote(`0x${invalidEncodedNote.slice(0x40)}`, { from: owner }),
                'input note status is not UNSPENT');
        });
    });
});
