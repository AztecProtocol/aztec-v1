import { expect } from 'chai';
import Promise from 'bluebird';
import nacl from 'tweetnacl';
import utils from 'tweetnacl-util';
import keyStore from './index.js';
import fixtures from './keystore';

// Test with 100 private keys
import addrprivkeyvector from './addrprivkey100.json';

nacl.util = utils;

// Test with 10000 private keys - takes about 40 seconds to run
// var addrprivkeyvector = require('./fixtures/addrprivkey10000.json')
const defaultHdPathString = "m/0'/0'/0'";



describe("Keystore", function() {

    describe("createVault constructor", function() {
        it('accepts a variety of options', function(done) {
            const fixture = fixtures.valid[0];

            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function(err, ks) {
                expect(ks.encSeed).to.not.equal(undefined);
                const decryptedPaddedSeed = keyStore._decryptString(ks.encSeed, Uint8Array.from(fixtures.valid[0].pwDerivedKey));
                // Check padding
                expect(decryptedPaddedSeed.length).to.equal(120);
                expect(decryptedPaddedSeed.trim()).to.equal(fixtures.valid[0].mnSeed);
                done();
            });
        });

        it('generates a random salt for key generation', function(done) {
            this.timeout(10000);
            const fixture = fixtures.valid[0];

            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                hdPathString: fixture.hdPathString,
            }, function(err, ks) {
                const salt0 = ks.salt;
                expect(ks.salt).to.not.equal(undefined);
                ks.keyFromPassword(fixture.password, function(err, derivedKey) {
                    const decryptedPaddedSeed = keyStore._decryptString(ks.encSeed, derivedKey);
                    // Check padding
                    expect(decryptedPaddedSeed.length).to.equal(120);
                    expect(decryptedPaddedSeed.trim()).to.equal(fixtures.valid[0].mnSeed);
                    keyStore.createVault({
                        password: fixture.password,
                        seedPhrase: fixture.mnSeed,
                        hdPathString: fixture.hdPathString,
                    }, function(err, ks1) {
                        const salt1 = ks1.salt;
                        expect(salt0).to.not.equal(salt1);
                        done();
                    })
                });
            });
        });

    });


    // Can't directly test the encrypt/decrypt functions
    // since salt and iv is used.
    describe("_encryptString _decryptString", function() {

        fixtures.valid.forEach(function (f) {
            it('encrypts the seed then returns same seed decrypted ' + '"' + f.mnSeed.substring(0,25) + '..."', function (done) {

                const encryptedString = keyStore._encryptString(f.mnSeed, Uint8Array.from(f.pwDerivedKey))
                const decryptedString = keyStore._decryptString(encryptedString, Uint8Array.from(f.pwDerivedKey))

                expect(decryptedString).to.equal(f.mnSeed)
                done();
            })
        })
    });


    describe("IES encryption", function () {

        it('should be able to decrypt a cipher with the public key of the private key', function (done) {

            const fixture = fixtures.valid[0];
            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function (err, ks) {
                const output = ks._encrypt25519(
                    ks.privacyKeys.publicKey, 'Hello Word'
                );
                const decrypted = ks._decrypt25519(output, new Uint8Array(fixture.pwDerivedKey));
                done();
            });

        });

    });

    describe("deriveKeyFromPassword", function () {
        it("derives a key correctly from the password", function(done) {
            const derKeyProm = Promise.promisify(keyStore.deriveKeyFromPasswordAndSalt);
            const promArray = [];
            fixtures.valid.forEach(function (f) {
                promArray.push(derKeyProm(f.password, f.salt));
            })
            Promise.all(promArray).then(function(derived) {
                for(let i=0; i<derived.length; i++) {
                    expect(derived[i]).to.deep.equal(Uint8Array.from(fixtures.valid[i].pwDerivedKey))
                }
                done();
            })
        })

        it('Checks if a derived key is correct or not', function (done) {
            const derKey = Uint8Array.from(fixtures.valid[0].pwDerivedKey)
            const derKey1 = Uint8Array.from(fixtures.valid[1].pwDerivedKey)
            const fixture = fixtures.valid[0]
            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function (err, ks) {
                const isDerKeyCorrect = ks.isDerivedKeyCorrect(derKey);
                expect(isDerKeyCorrect).to.equal(true);
                const isDerKey1Correct = ks.isDerivedKeyCorrect(derKey1);
                expect(isDerKey1Correct).to.equal(false);
                done();
            });
        })

    })


    describe("serialize deserialize", function() {

        it("serializes empty keystore and returns same non-empty keystore when deserialized ", function(done) {

            const fixture = fixtures.valid[0]
            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function (err, origKS) {

                const serKS = origKS.serialize()
                const deserKS = keyStore.deserialize(serKS)

                // Retains all attributes properly
                expect(deserKS).to.deep.equal(origKS)
                done();
            })
        })


        it("serializes non-empty keystore and returns same non-empty keystore when deserialized ", function(done) {

            const fixture = fixtures.valid[0]
            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function (err, origKS) {


                const serKS = origKS.serialize()
                const deserKS = keyStore.deserialize(serKS)

                // Retains all attributes properly
                expect(deserKS).to.deep.equal(origKS)
                done();
            })
        })

    });


    describe("Seed functions", function() {
        it('returns the unencrypted seed', function(done) {

            const fixture = fixtures.valid[0]
            keyStore.createVault({
                password: fixture.password,
                seedPhrase: fixture.mnSeed,
                salt: fixture.salt,
                hdPathString: fixture.hdPathString,
            }, function (err, ks) {

                const pwKey = Uint8Array.from(fixtures.valid[0].pwDerivedKey)
                expect(ks.exportSeed(pwKey)).to.equal(fixture.mnSeed)
                done();
            })
        });

        it('checks if seed is valid', function(done) {
            let isValid = keyStore.isSeedValid(fixtures.valid[0].mnSeed)
            expect(isValid).to.equal(true);

            isValid = keyStore.isSeedValid(fixtures.invalid[0].mnSeed)
            expect(isValid).to.equal(false);
            done();
        });

        it('concatenates and hashes entropy sources', function(done) {

            const N = fixtures.sha256Test.length;
            for (let i=0; i<N; i++) {
                const ent0 = new Buffer(fixtures.sha256Test[i].ent0);
                const ent1 = new Buffer(fixtures.sha256Test[i].ent1);
                const outputString = keyStore._concatAndSha256(ent0, ent1).toString('hex');
                expect(outputString).to.equal(fixtures.sha256Test[i].targetHash);
            }
            done();
        })

    });



    describe("exportPrivateKey", function() {
        it('should export the raw private key', function(done) {

        });
    });


});
