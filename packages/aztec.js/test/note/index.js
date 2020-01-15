import * as bn128 from '@aztec/bn128';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { expect } from 'chai';
import crypto from 'crypto';
import web3Utils from 'web3-utils';
import * as noteAccess from '@aztec/note-access';

import note from '../../src/note';
import { userAccount, userAccount2 } from '../helpers/note';

const {
    constants: { AZTEC_JS_METADATA_PREFIX_LENGTH, VIEWING_KEY_LENGTH },
    metadata: metaDataConstructor,
} = noteAccess;

const { padLeft, toHex, randomHex } = web3Utils;

describe('Note', () => {
    describe('Success states', async () => {
        it('should create well formed notes using the fromPublic and fromViewKey methods', async () => {
            const aBn = new BN(crypto.randomBytes(32), 16).umod(bn128.groupModulus);
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

            expect(new BN(sharedSecrets[0].slice(2), 16).umod(bn128.groupModulus).eq(noteArray[0].a.fromRed())).to.equal(true);
            expect(new BN(sharedSecrets[1].slice(2), 16).umod(bn128.groupModulus).eq(noteArray[1].a.fromRed())).to.equal(true);
            expect(new BN(sharedSecrets[2].slice(2), 16).umod(bn128.groupModulus).eq(noteArray[2].a.fromRed())).to.equal(true);
            expect(new BN(sharedSecrets[3].slice(2), 16).umod(bn128.groupModulus).eq(noteArray[3].a.fromRed())).to.equal(true);
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

        it('should set note. metadata property to custom metadata', async () => {
            const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
            const customData = padLeft(randomHex(20), 64);
            const customMetadata = testNote.setMetaData(customData);
            expect(customMetadata).to.equal(testNote.metaData);
        });

        it('should export the note metaData', async () => {
            const testNote = await note.create(secp256k1.generateAccount().publicKey, 100);
            const ephemeralKey = secp256k1.compress(testNote.ephemeralFromMetaData().getPublic());
            const ephemeralKeyLength = ephemeralKey.length;
            const customData = `0x${padLeft(randomHex(20), 64)}`;

            testNote.setMetaData(customData);
            const metaData = testNote.exportMetaData();

            // multiple subtracting of 2 chars to represent slices
            // addition of 64 to represent the prepended word of data containing length of metaData
            const expectedLength = customData.length - 2 + ephemeralKeyLength - 2 + 64;
            expect(metaData.length).to.equal(expectedLength);
            expect(metaData.slice(64, 130)).to.equal(ephemeralKey.slice(2));
            expect(metaData.slice(130, 196)).to.equal(customData.slice(2));
        });

        it('should add note access when creating note', async () => {
            const access = [
                {
                    address: userAccount.address,
                    linkedPublicKey: userAccount.linkedPublicKey,
                },
            ];

            const testNote = await note.create(userAccount.spendingPublicKey, 10, access);
            const metadataStr = testNote.exportMetaData();
            const metadataObj = metaDataConstructor(metadataStr.slice(AZTEC_JS_METADATA_PREFIX_LENGTH));
            const allowedAccess = metadataObj.getAccess(userAccount.address);
            expect(Object.keys(allowedAccess)).to.deep.equal(['address', 'viewingKey']);
            expect(allowedAccess.address).to.equal(userAccount.address);
            expect(allowedAccess.viewingKey.length).to.equal(VIEWING_KEY_LENGTH + 2);
        });

        it('allow to pass an array of access', async () => {
            const access = [
                {
                    address: userAccount.address,
                    linkedPublicKey: userAccount.linkedPublicKey,
                },
                {
                    address: userAccount2.address,
                    linkedPublicKey: userAccount2.linkedPublicKey,
                },
            ];
            const testNote = await note.create(userAccount.spendingPublicKey, 10, access);

            const metadataStr = testNote.exportMetaData();
            const metadataObj = metaDataConstructor(metadataStr.slice(AZTEC_JS_METADATA_PREFIX_LENGTH));
            const allowedAccess = metadataObj.getAccess(userAccount.address);
            expect(allowedAccess.viewingKey.length).to.equal(VIEWING_KEY_LENGTH + 2);
            const allowedAccess2 = metadataObj.getAccess(userAccount2.address);
            expect(allowedAccess2.viewingKey.length).to.equal(VIEWING_KEY_LENGTH + 2);
        });
    });

    describe('Failure states', async () => {
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
});
