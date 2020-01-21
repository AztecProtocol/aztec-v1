import { expect } from 'chai';
import nacl from 'tweetnacl';
import tweetNaclUtils from 'tweetnacl-util';
import {
    KeyStore,
    utils,
} from '../index';
import fixtures from '../keystore.json';

nacl.util = tweetNaclUtils;


describe('Keystore', () => {
    describe('generating the derivided key from a password', () => {
        test('should be generate a derived key from the supplied password', async () => {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: fixture.password,
                salt: fixture.salt,
            });
            // .to.exist is not recommended
            expect(key.pwDerivedKey).to.exist; // eslint-disable-line no-unused-expressions
            expect(key.salt).to.exist; // eslint-disable-line no-unused-expressions
            expect(key.pwDerivedKey.constructor).to.equal(Uint8Array);
            expect(key.pwDerivedKey).to.eql(new Uint8Array(fixture.pwDerivedKey));
        });
    });

    describe('keystore constructor', () => {
        test('should initialise a keystore', async () => {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });
            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            expect(k).to.exist; // eslint-disable-line no-unused-expressions
            expect(k.privacyKeys).to.exist; // eslint-disable-line no-unused-expressions
            // check it returns an error if missing params
            // check it creates the keys
            // check it encrypts
        });
    });


    describe('IES encryption', () => {
        test('should be able to decrypt a cipher with the public key of the private key', async () => {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });
            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            const output = k.curve25519Encrypt(
                k.privacyKeys.publicKey, 'Hello World',
            );
            const decrypted = k.curve25519Decrypt(output, new Uint8Array(fixture.pwDerivedKey));
            expect(decrypted).to.equal('Hello World');
        });
        // Can't directly test the encrypt/decrypt functions
        // since salt and iv is used.
        fixtures.valid.forEach((f) => {
            test(`'encrypts the seed then returns same seed decrypted "${f.mnSeed.substring(0, 25)}..."`, (done) => {
                const encryptedString = utils.encryptString(
                    f.mnSeed,
                    Uint8Array.from(f.pwDerivedKey),
                );
                const decryptedString = utils.decryptString(
                    encryptedString,
                    Uint8Array.from(f.pwDerivedKey),
                );

                expect(decryptedString).to.equal(f.mnSeed);
                done();
            });
        });
    });

    describe('deriveKeyFromPassword', () => {
        test('Checks if a derived key is correct or not', async () => {
            const derKey = Uint8Array.from(fixtures.valid[0].pwDerivedKey);
            const derKey1 = Uint8Array.from(fixtures.valid[1].pwDerivedKey);
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });
            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });

            const isDerKeyCorrect = k.isDerivedKeyCorrect(derKey);
            expect(isDerKeyCorrect).to.equal(true);
            let isDerKey1Correct;
            try {
                isDerKey1Correct = k.isDerivedKeyCorrect(derKey1);
            } catch (e) {
                expect(isDerKey1Correct).to.equal(undefined);
                expect(e.constructor).to.equal(Error);
            }
        });
    });


    describe('serialize deserialize', () => {
        test('serializes empty keystore and returns same non-empty keystore when deserialized ', async () => {
            const fixture = fixtures.valid[0];

            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });
            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });

            const serKS = k.serialize();
            const deserKS = KeyStore.deserialize(JSON.parse(serKS), key.pwDerivedKey);

            // Retains all attributes properly
            expect(deserKS.privacyKeys.publicKey).to.equal(k.privacyKeys.publicKey);
        });
    });


    describe('Seed functions', () => {
        test('returns the unencrypted seed', async () => {
            const fixture = fixtures.valid[0];

            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });

            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });


            expect(k.exportSeed(key.pwDerivedKey)).to.equal(fixture.mnSeed);
        });

        test('checks if seed is valid', async () => {
            let isValid = KeyStore.isSeedValid(fixtures.valid[0].mnSeed);
            expect(isValid).to.equal(true);

            isValid = KeyStore.isSeedValid(fixtures.invalid[0].mnSeed);
            expect(isValid).to.equal(false);
        });

        test('concatenates and hashes entropy sources', async () => {
            const N = fixtures.sha256Test.length;
            for (let i = 0; i < N; i += 1) {
                const ent0 = Buffer.from(fixtures.sha256Test[i].ent0);
                const ent1 = Buffer.from(fixtures.sha256Test[i].ent1);
                const outputString = utils.concatAndSha256(ent0, ent1).toString('hex');
                expect(outputString).to.equal(fixtures.sha256Test[i].targetHash);
            }
        });
    });


    describe('exportPrivateKey', () => {
        test('should export the raw private key', async () => {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt,
            });
            const k = new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            const privateKey = k.exportPrivateKey(key.pwDerivedKey);

            expect(privateKey).to.equal(fixture.privateKey);
        });
    });
});
