const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const { expect } = require('chai');
const crypto = require('crypto');
const web3Utils = require('web3-utils');

const note = require('../../src/note');

const { GROUP_MODULUS } = constants;
const { padLeft, toHex } = web3Utils;

describe('Note', () => {
    it('should create well formed notes using the fromPublic and fromViewKey methods', async () => {
        const aBn = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS);
        const a = padLeft(aBn.toString(16), 64);

        const k = padLeft(toHex('13456').slice(2), 8);
        const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
        const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
        const testNote = await note.fromViewKey(viewingKey);
        const expectedViewKey = testNote.getView();
        expect(expectedViewKey).to.equal(viewingKey);

        const exportedPublicKey = testNote.getPublic();
        const importedNote = note.fromPublicKey(exportedPublicKey);
        expect(importedNote.gamma.encode('hex', false)).to.equal(testNote.gamma.encode('hex', false));
        expect(importedNote.sigma.encode('hex', false)).to.equal(testNote.sigma.encode('hex', false));
    });

    it('should create well formed notes using the create and derive functions', async () => {
        const spendingKey = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
        const result = await note.create(`0x${spendingKey.getPublic(true, 'hex')}`, 1234);
        const expected = await note.derive(result.getPublic(), `0x${spendingKey.getPrivate('hex')}`);
        expect(result.gamma.encode('hex', false)).to.equal(expected.gamma.encode('hex', false));
        expect(result.sigma.encode('hex', false)).to.equal(expected.sigma.encode('hex', false));
        expect(result.k.toString(16)).to.equal(expected.k.toString(16));
        expect(result.a.toString(16)).to.equal(expected.a.toString(16));
        expect(expected.k.toString(10)).to.equal('1234');
    });

    it('should encode the metadata of a set of notes', async () => {
        const accounts = [secp256k1.generateAccount(), secp256k1.generateAccount()];
        const noteArray = [
            await note.create(accounts[0].publicKey, 100),
            await note.create(accounts[0].publicKey, 100),
            await note.create(accounts[1].publicKey, 100),
            await note.create(accounts[1].publicKey, 100),
        ];
        const metadata = note.encodeMetadata(noteArray);
        expect(metadata.length).to.equal(266);

        const ephemeralKeys = [
            secp256k1.curve.pointFromX(metadata.slice(4, 68), metadata.slice(2, 4) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(70, 134), metadata.slice(68, 70) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(136, 200), metadata.slice(134, 136) === '03'),
            secp256k1.curve.pointFromX(metadata.slice(202, 266), metadata.slice(200, 202) === '03'),
        ];

        const sharedSecrets = [
            note.utils.getSharedSecret(ephemeralKeys[0], accounts[0].privateKey),
            note.utils.getSharedSecret(ephemeralKeys[1], accounts[0].privateKey),
            note.utils.getSharedSecret(ephemeralKeys[2], accounts[1].privateKey),
            note.utils.getSharedSecret(ephemeralKeys[3], accounts[1].privateKey),
        ];

        expect(new BN(sharedSecrets[0].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[0].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[1].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[1].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[2].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[2].a.fromRed())).to.equal(true);
        expect(new BN(sharedSecrets[3].slice(2), 16).umod(GROUP_MODULUS).eq(noteArray[3].a.fromRed())).to.equal(true);
    });

    it('should export k, a values of 0 for a note created from a note public key', async () => {
        const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
        const publicKey = testNote.getPublic();
        const imported = note.fromPublicKey(publicKey);
        const result = imported.exportNote();
        expect(result.a).to.equal('0x');
        expect(result.k).to.equal('0x');
        expect(result.viewingKey).to.equal('0x');
        expect(result.publicKey).to.equal(publicKey);
    });

    it('should throw if given both a public key and a viewing key', async () => {
        const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
        const { publicKey, viewingKey } = testNote.exportNote();
        try {
            const _ = new note.Note(publicKey, viewingKey);
        } catch (err) {
            expect(err.message).to.equal('expected one of publicKey or viewingKey, not both');
        }
    });

    it('should throw if malformed public key', () => {
        try {
            const _ = new note.Note({ foo: 'bar' }, null);
        } catch (err) {
            expect(err.message).to.equal('expected key type object to be of type string');
        }
    });

    it('should throw if incorrect length public key', async () => {
        const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
        const { publicKey } = testNote.exportNote();
        try {
            const _ = new note.Note(`${publicKey}abcdef`, null);
        } catch (err) {
            expect(err.message).to.equal('invalid public key length, expected 200, got 206');
        }
    });

    it('should throw if malformed viewing key', () => {
        try {
            const _ = new note.Note(null, { foo: 'bar' });
        } catch (err) {
            expect(err.message).to.equal('expected key type object to be of type string');
        }
    });

    it('should throw if incorrect length viewing key', async () => {
        const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
        const { viewingKey } = testNote.exportNote();
        try {
            const _ = new note.Note(null, `${viewingKey}abcdef`);
        } catch (err) {
            expect(err.message).to.equal('invalid viewing key length, expected 140, got 146');
        }
    });
});
