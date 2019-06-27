import { expect } from 'chai';
import Promise from 'bluebird';
import nacl from 'tweetnacl';
import tweetNaclUtils from 'tweetnacl-util';
import {
    KeyStore,
    utils
} from './index.js';
import fixtures from './keystore';

// Test with 100 private keys
import addrprivkeyvector from './addrprivkey100.json';

nacl.util = tweetNaclUtils;

// Test with 10000 private keys - takes about 40 seconds to run
// var addrprivkeyvector = require('./fixtures/addrprivkey10000.json')
const defaultHdPathString = "m/0'/0'/0'";



describe("Keystore", function() {
    describe("generating the derivided key from a password", async()=> {
        it('should be generate a derived key from the supplied password', async() => {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: fixture.password,
                salt:fixture.salt
            });
            expect(key.pwDerivedKey).to.exist;
            expect(key.salt).to.exist;
            expect(key.pwDerivedKey.constructor).to.equal(Uint8Array);
            expect(key.pwDerivedKey).to.eql(new Uint8Array(fixture.pwDerivedKey));
        });
    });

    describe("keystore constructor", async()=> {
        it('should initialise a keystore', async()=> {
            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            expect(k).to.exist;
            expect(k.privacyKeys).to.exist;
            // check it returns an error if missing params
            // check it creates the keys
            // check it encrypts

        });


    });


    // Can't directly test the encrypt/decrypt functions
    // since salt and iv is used.
    describe("_encryptString _decryptString", function() {

        fixtures.valid.forEach(function (f) {
            it('encrypts the seed then returns same seed decrypted ' + '"' + f.mnSeed.substring(0,25) + '..."', function (done) {

                const encryptedString = utils.encryptString(f.mnSeed, Uint8Array.from(f.pwDerivedKey))
                const decryptedString = utils.decryptString(encryptedString, Uint8Array.from(f.pwDerivedKey))

                expect(decryptedString).to.equal(f.mnSeed)
                done();
            })
        })
    });


    describe("IES encryption", async () => {

        it('should be able to decrypt a cipher with the public key of the private key', async () => {

            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            const output = k.curve25519Encrypt(
                k.privacyKeys.publicKey, 'Hello Word'
            );
            const decrypted = k.curve25519Decrypt(output, new Uint8Array(fixture.pwDerivedKey));

        });

    });

    describe("deriveKeyFromPassword", async ()=> {

        it('Checks if a derived key is correct or not', async () => {
            const derKey = Uint8Array.from(fixtures.valid[0].pwDerivedKey)
            const derKey1 = Uint8Array.from(fixtures.valid[1].pwDerivedKey)
            const fixture = fixtures.valid[0]
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });
            
            const isDerKeyCorrect = k.isDerivedKeyCorrect(derKey);
            expect(isDerKeyCorrect).to.equal(true);
            let isDerKey1Correct 
            try {

                isDerKey1Correct = k.isDerivedKeyCorrect(derKey1);
            }
            catch (e) {

                expect(isDerKey1Correct).to.equal(undefined);
                expect(e.constructor).to.equal(Error);
            }
        })

    })


    describe("serialize deserialize", async()=> {

        it("serializes empty keystore and returns same non-empty keystore when deserialized ", async()=> {

            const fixture = fixtures.valid[0];

            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });

            const serKS = k.serialize();
            const deserKS = KeyStore.deserialize(serKS, key.pwDerivedKey);

            // Retains all attributes properly
            expect(deserKS.privacyKeys.publicKey).to.equal(k.privacyKeys.publicKey);
        })

    });


    describe("Seed functions", async() => {
        it('returns the unencrypted seed', async()=> {
            const fixture = fixtures.valid[0];

            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
                pwDerivedKey: key.pwDerivedKey,
                salt: fixture.salt,
                mnemonic: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            });


            expect(k.exportSeed(key.pwDerivedKey)).to.equal(fixture.mnSeed)
        });

        it('checks if seed is valid', async() => {
            let isValid = KeyStore.isSeedValid(fixtures.valid[0].mnSeed)
            expect(isValid).to.equal(true);

            isValid = KeyStore.isSeedValid(fixtures.invalid[0].mnSeed)
            expect(isValid).to.equal(false);
        });

        it('concatenates and hashes entropy sources', async() => {

            const N = fixtures.sha256Test.length;
            for (let i=0; i<N; i++) {
                const ent0 = new Buffer(fixtures.sha256Test[i].ent0);
                const ent1 = new Buffer(fixtures.sha256Test[i].ent1);
                const outputString = utils.concatAndSha256(ent0, ent1).toString('hex');
                expect(outputString).to.equal(fixtures.sha256Test[i].targetHash);
            }
        })

    });



    describe("exportPrivateKey", async() => {
        it('should export the raw private key', async() => {

            const fixture = fixtures.valid[0];
            const key = await KeyStore.generateDerivedKey({
                password: 'password',
                salt: fixture.salt
            });
            const k =  new KeyStore({
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
