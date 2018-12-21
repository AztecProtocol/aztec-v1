const chai = require('chai');
const crypto = require('crypto');
const web3Utils = require('web3-utils');
const BN = require('bn.js');

const notes = require('../../note/note');
const noteUtils = require('../../note/utils');
const secp256k1 = require('../../secp256k1/secp256k1');
const { GROUP_MODULUS } = require('../../params');

const { padLeft } = web3Utils;
const { expect } = chai;

describe('note tests', () => {
    it('notes.fromPublic and notes.fromViewKey create well formed notes', () => {
        const aBn = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS);
        const a = padLeft(aBn.toString(16), 64);

        const k = padLeft(web3Utils.toHex('13456').slice(2), 8);
        const ephemeral = secp256k1.keyFromPrivate(crypto.randomBytes(32));
        const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
        const note = notes.fromViewKey(viewingKey);
        const expectedViewKey = note.getView();
        expect(expectedViewKey).to.equal(viewingKey);
        const exportedPublicKey = note.getPublic();

        const importedNote = notes.fromPublicKey(exportedPublicKey);

        expect(importedNote.gamma.encode('hex', false)).to.equal(note.gamma.encode('hex', false));
        expect(importedNote.sigma.encode('hex', false)).to.equal(note.sigma.encode('hex', false));
    });

    it('note.create and note.derive create well formed notes', () => {
        const spendingKey = secp256k1.keyFromPrivate(crypto.randomBytes(32));
        const result = notes.create(`0x${spendingKey.getPublic(true, 'hex')}`, 1234);
        const expected = notes.derive(result.getPublic(), `0x${spendingKey.getPrivate('hex')}`);
        expect(result.gamma.encode('hex', false)).to.equal(expected.gamma.encode('hex', false));
        expect(result.sigma.encode('hex', false)).to.equal(expected.sigma.encode('hex', false));
        expect(result.k.toString(16)).to.equal(expected.k.toString(16));
        expect(result.a.toString(16)).to.equal(expected.a.toString(16));
        expect(expected.k.toString(10)).to.equal('1234');
    });

    it('encodeMetadata correctly encodes the metadata of a set of notes', () => {
        const accounts = [secp256k1.generateAccount(), secp256k1.generateAccount()];
        const noteArray = [
            notes.create(accounts[0].publicKey, 100),
            notes.create(accounts[0].publicKey, 100),
            notes.create(accounts[1].publicKey, 100),
            notes.create(accounts[1].publicKey, 100),
        ];
        const metadata = notes.encodeMetadata(noteArray);
        expect(metadata.length).to.equal(266);

        const ephemeralKeys = [
            secp256k1.curve.pointFromX(metadata.slice(4, 68), metadata.slice(2, 4) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(70, 134), metadata.slice(68, 70) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(136, 200), metadata.slice(134, 136) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(202, 266), metadata.slice(200, 202) === '03'),
        ];

        const sharedSecrets = [
            noteUtils.getSharedSecret(ephemeralKeys[0], accounts[0].privateKey),
            noteUtils.getSharedSecret(ephemeralKeys[1], accounts[0].privateKey),
            noteUtils.getSharedSecret(ephemeralKeys[2], accounts[1].privateKey),
            noteUtils.getSharedSecret(ephemeralKeys[3], accounts[1].privateKey),
        ];
        expect(new BN(sharedSecrets[0].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[0].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[1].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[1].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[2].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[2].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[3].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[3].a.fromRed())).to.equal(true);
    });

    it('note.exportNote will produce k, a values of 0 for a note created from a note public key', () => {
        const note = notes.create(secp256k1.generateAccount().publicKey, 100);
        const publicKey = note.getPublic();
        const imported = notes.fromPublicKey(publicKey);
        const result = imported.exportNote();
        expect(result.a).to.equal('0x');
        expect(result.k).to.equal('0x');
        expect(result.viewingKey).to.equal('0x');
        expect(result.publicKey).to.equal(publicKey);
    });

    it('Note constructor will throw if given a public key and a viewing key', () => {
        const note = notes.create(secp256k1.generateAccount().publicKey, 100);
        const { publicKey, viewingKey } = note.exportNote();
        let message = '';
        try {
            notes.Note(publicKey, viewingKey);
        } catch (e) {
            ({ message } = e);
        }
        expect(message).to.equal('expected one of publicKey or viewingKey, not both');
    });

    it('Note constructor will throw if given a non-string public key', () => {
        let message = '';
        try {
            notes.Note({ foo: 'bar' }, null);
        } catch (e) {
            ({ message } = e);
        }
        expect(message).to.equal('expected key type object to be of type string');
    });

    it('Note constructor will throw if given an incorect length public key', () => {
        const note = notes.create(secp256k1.generateAccount().publicKey, 100);
        const { publicKey } = note.exportNote();
        let message = '';
        try {
            notes.Note(`${publicKey}abcdef`, null);
        } catch (e) {
            ({ message } = e);
        }
        expect(message).to.equal('invalid public key length, expected 200, got 206');
    });

    it('Note constructor will throw if given a non-string viewing key', () => {
        let message = '';
        try {
            notes.Note(null, { foo: 'bar' });
        } catch (e) {
            ({ message } = e);
        }
        expect(message).to.equal('expected key type object to be of type string');
    });

    it('Note constructor will throw if given an incorect length viewing key', () => {
        const note = notes.create(secp256k1.generateAccount().publicKey, 100);
        const { viewingKey } = note.exportNote();
        let message = '';
        try {
            notes.Note(null, `${viewingKey}abcdef`);
        } catch (e) {
            ({ message } = e);
        }
        expect(message).to.equal('invalid viewing key length, expected 140, got 146');
    });
});
