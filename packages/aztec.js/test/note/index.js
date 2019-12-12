const bn128 = require('@aztec/bn128');
const {
    AZTEC_JS_METADATA_PREFIX_LENGTH,
    metadata: metaDataConstructor,
    METADATA_AZTEC_DATA_LENGTH,
    VIEWING_KEY_LENGTH,
} = require('@aztec/note-access');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const { expect } = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');
const web3Utils = require('web3-utils');

const note = require('../../src/note');

const { padLeft, toHex, randomHex } = web3Utils;

const userAccount = {
    address: '0xfB95acC8D3870da3C646Ae8c3C621916De8DF42d',
    linkedPublicKey: '0xa61d17b0dd3095664d264628a6b947721314b6999aa6a73d3c7698f041f78a4d',
    linkedPrivateKey: 'e1ec35b90155a633ac75d0508e537a7e00fd908a5295365054001a44b4a0560c',
    spendingPublicKey: '0x0290e0354caa04c73920339f979cfc932dd3d52ba8210fec34571bb6422930c396',
};

const userAccount2 = {
    address: '0x61EeAd169ec67b24abee7B81Ca750b6dCA3a9CCd',
    linkedPublicKey: '0x058d55269a83b5ea379931ac58bc3def375eab12e527708111545af46f5f9b5c',
    linkedPrivateKey: '6a30cc7b28b037b47378522a1a370c2394b0dd2d70c6abbe5ac66c8a1d84db21',
    spendingPublicKey: '0x02090a6b89b0588626f26babc87f2dc1e2c815b8248754bed93d837f7071411605',
};

describe('Note', () => {
    const metadataLenDiff = METADATA_AZTEC_DATA_LENGTH - AZTEC_JS_METADATA_PREFIX_LENGTH;

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
            const access = {
                address: userAccount.address,
                linkedPublicKey: userAccount.linkedPublicKey,
            };

            const testNote = await note.create(userAccount.spendingPublicKey, 10, access);
            const metadataStr = testNote.exportMetaData();
            const metadataObj = metaDataConstructor(metadataStr.padStart(metadataStr.length + metadataLenDiff, '0'));
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
            const metadataObj = metaDataConstructor(metadataStr.padStart(metadataStr.length + metadataLenDiff, '0'));
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
