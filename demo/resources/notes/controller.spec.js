const chai = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');

const { clear } = require('../../db');

const notes = require('./controller');
const wallets = require('../wallets');
const aztecNotes = require('../../../aztec-crypto-js/note');

const { NOTE_STATUS } = require('../../config');

const { expect } = chai;

describe('notes controller tests', () => {
    describe('success states', () => {
        beforeEach(() => {
            clear();
        });

        it('can read and write', () => {
            const wallet = wallets.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
            const result = notes.createNote(wallet.address, 100);
            const expected = notes.get(result.noteHash);
            expect(result.noteHash).to.equal(expected.noteHash);
            expect(result.getView()).to.deep.equal(expected.note.getView());
            expect(expected.status).to.equal(NOTE_STATUS.OFF_CHAIN);
        });

        it('can update', () => {
            const wallet = wallets.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
            const result = notes.createNote(wallet.address, 100);
            const expected = notes.setNoteStatus(result.noteHash, NOTE_STATUS.SPENT);
            expect(expected.status).to.deep.equal(NOTE_STATUS.SPENT);
        });
    });

    describe('failure states', () => {
        let create;
        beforeEach(() => {
            clear();
            create = sinon.stub(aztecNotes, 'create').callsFake(() => ({
                exportNote: () => ({ noteHash: 'foo' }),
            }));
        });
        afterEach(() => {
            create.restore();
        });
        it('cannot create a note that already exists', () => {
            const wallet = wallets.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
            notes.createNote(wallet.address, 100);
            let message = '';
            try {
                notes.createNote(wallet.address, 100);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('note foo already exists');
        });

        it('cannot get a nonexistent note', () => {
            const noteHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            let message = '';
            try {
                notes.get(noteHash);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal(`could not find note at ${noteHash}`);
        });

        it('cannot set note status to an invalid status', () => {
            const wallet = wallets.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
            const result = notes.createNote(wallet.address, 100);
            let message = '';
            try {
                notes.setNoteStatus(result.noteHash, 'foo');
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('status foo is not a valid AZTEC note status');
        });
    });
});
