import bitcore from 'bitcore-lib';
import Mnemonic from 'bitcore-mnemonic';
import nacl from 'tweetnacl';
import tweetNaclUtils from 'tweetnacl-util';
import scrypt from 'scrypt-async';

nacl.util = tweetNaclUtils;

Object.defineProperty(global, '_bitcore', { get() { return undefined; }, set() {} });

const { Random } = bitcore.crypto;
const { Hash } = bitcore.crypto;

function strip0x(input) {
    if (typeof (input) !== 'string') {
        return input;
    }
    if (input.length >= 2 && input.slice(0, 2) === '0x') {
        return input.slice(2);
    }

    return input;
}
function add0x(input) {
    if (typeof (input) !== 'string') {
        return input;
    }
    if (input.length < 2 || input.slice(0, 2) !== '0x') {
        return `0x${input}`;
    }

    return input;
}

function leftPadString(stringToPad, padChar, length) {
    let repreatedPadChar = '';
    for (let i = 0; i < length; i++) {
        repreatedPadChar += padChar;
    }

    return ((repreatedPadChar + stringToPad).slice(-length));
}

function nacl_encodeHex(msgUInt8Arr) {
    const msgBase64 = nacl.util.encodeBase64(msgUInt8Arr);
    return (new Buffer(msgBase64, 'base64')).toString('hex');
}

function nacl_decodeHex(msgHex) {
    const msgBase64 = (new Buffer(msgHex, 'hex')).toString('base64');
    return nacl.util.decodeBase64(msgBase64);
}


function generateSalt(byteCount) {
    return bitcore.crypto.Random.getRandomBuffer(byteCount || 32).toString('base64');
}


export const utils = {

    encryptString: (string, pwDerivedKey) => {
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const encObj = nacl.secretbox(nacl.util.decodeUTF8(string), nonce, pwDerivedKey);
        const encString = {
            encStr: nacl.util.encodeBase64(encObj),
            nonce: nacl.util.encodeBase64(nonce),
        };
        return encString;
    },

    decryptString: (cipher, pwDerivedKey) => {
        const secretbox = nacl.util.decodeBase64(cipher.encStr);
        const nonce = nacl.util.decodeBase64(cipher.nonce);

        const decryptedStr = nacl.secretbox.open(secretbox, nonce, pwDerivedKey);

        if (!decryptedStr) {
            throw new Error('Decryption failed!');
        }

        return nacl.util.encodeUTF8(decryptedStr);
    },

    // This function is tested using the test vectors here:
    // http://www.di-mgt.com.au/sha_testvectors.html
    concatAndSha256: (entropyBuf0, entropyBuf1) => {
        const totalEnt = Buffer.concat([entropyBuf0, entropyBuf1]);
        if (totalEnt.length !== entropyBuf0.length + entropyBuf1.length) {
            throw new Error('generateRandomSeed: Logic error! Concatenation of entropy sources failed.');
        }

        const hashedEnt = Hash.sha256(totalEnt);

        return hashedEnt;
    },
};


export class KeyStore {
    constructor({
        mnemonic,
        pwDerivedKey,
        hdPathString,
        salt,
    }) {
        // Default hdPathString
        if (!hdPathString) {
            throw new Error("Keystore: Must include hdPathString in createVault inputs. Suggested alternatives are m/0'/0'/0' for previous lightwallet default, or m/44'/60'/0'/0 for BIP44 (used by Jaxx & MetaMask)");
        }
        if (!salt) {
            throw new Error('Keystore: Must include salt in createVault inputs.');
        }
        if (!mnemonic) {
            throw new Error('Keystore: Must include mnemonic in createVault inputs.');
        }
        if (!pwDerivedKey) {
            throw new Error('Keystore: Must include pwDerivedKey in createVault inputs.');
        }

        this.salt = salt;
        this.hdPathString = hdPathString;
        this.encSeed = undefined;
        this.encHdRootPriv = undefined;
        this.hdIndex = 0;
        if ((typeof pwDerivedKey !== 'undefined') && (typeof mnemonic !== 'undefined')) {
            const words = mnemonic.split(' ');
            if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12) {
                throw new Error('KeyStore: Invalid mnemonic');
            }

            // Pad the seed to length 120 before encrypting
            const paddedSeed = leftPadString(mnemonic, ' ', 120);
            this.encSeed = utils.encryptString(paddedSeed, pwDerivedKey);

            // hdRoot is the relative root from which we derive the keys using
            // generateNewAddress(). The derived keys are then
            // `hdRoot/hdIndex`.

            const hdRoot = new Mnemonic(mnemonic).toHDPrivateKey().xprivkey;
            const hdRootKey = new bitcore.HDPrivateKey(hdRoot);
            const hdPathKey = hdRootKey.derive(hdPathString).xprivkey;
            this.encHdRootPriv = utils.encryptString(hdPathKey, pwDerivedKey);
            this.privacyKeys = this.generatePrivacyKeys(pwDerivedKey);
        }
    }

    generatePrivacyKeys(pwDerivedKey) {
        const hdRoot = utils.decryptString(this.encHdRootPriv, pwDerivedKey);

        if (hdRoot.length === 0) {
            throw new Error('Provided password derived key is wrong');
        }

        const hdprivkey = new bitcore.HDPrivateKey(hdRoot).derive(this.hdIndex++);
        const privkeyBuf = hdprivkey.privateKey.toBuffer();

        let privkeyHex = privkeyBuf.toString('hex');
        if (privkeyBuf.length < 16) {
            // Way too small key, something must have gone wrong
            // Halt and catch fire
            throw new Error('Private key suspiciously small: < 16 bytes. Aborting!');
        } else if (privkeyBuf.length < 32) {
            // Pad private key if too short
            // bitcore has a bug where it sometimes returns
            // truncated keys
            privkeyHex = leftPadString(privkeyBuf.toString('hex'), '0', 64);
        } else if (privkeyBuf.length > 32) {
            throw new Error('Private key larger than 32 bytes. Aborting!');
        }

        const encPrivKey = utils.encryptString(privkeyHex, pwDerivedKey);

        const privKeyUInt8Array = new Uint8Array(privkeyBuf);
        const pubKey = nacl.box.keyPair.fromSecretKey(privKeyUInt8Array).publicKey;
        const pubKeyBase64 = nacl.util.encodeBase64(pubKey);

        return {
            publicKey: pubKeyBase64,
            encPrivKey,
        };
    }

    curve25519Encrypt(receiverPublicKey, msgParams) {
        const ephemeralKeyPair = nacl.box.keyPair();
        try {
            var pubKeyUInt8Array = nacl.util.decodeBase64(receiverPublicKey);
        } catch (err) {
            throw new Error('Bad public key');
        }

        const msgParamsUInt8Array = nacl.util.decodeUTF8(msgParams);
        const nonce = nacl.randomBytes(nacl.box.nonceLength);

        // encrypt
        const encryptedMessage = nacl.box(msgParamsUInt8Array, nonce, pubKeyUInt8Array, ephemeralKeyPair.secretKey);

        // handle encrypted data
        const output = {
            nonce: nacl.util.encodeBase64(nonce),
            ephemPublicKey: nacl.util.encodeBase64(ephemeralKeyPair.publicKey),
            ciphertext: nacl.util.encodeBase64(encryptedMessage),
        };
        // return encrypted msg data
        return output;
    }

    curve25519Decrypt(encryptedData, pwDerivedKey) {
        const privKey = utils.decryptString(this.privacyKeys.encPrivKey, pwDerivedKey);
        // string to buffer to UInt8Array
        const recieverPrivateKeyUint8Array = nacl_decodeHex(privKey);
        const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(recieverPrivateKeyUint8Array).secretKey;

        const nonce = nacl.util.decodeBase64(encryptedData.nonce);
        const ciphertext = nacl.util.decodeBase64(encryptedData.ciphertext);
        const ephemPublicKey = nacl.util.decodeBase64(encryptedData.ephemPublicKey);

        // decrypt
        const decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPublicKey, recieverEncryptionPrivateKey);

        // return decrypted msg data
        try {
            var output = nacl.util.encodeUTF8(decryptedMessage);
        } catch (err) {
            throw new Error('Decryption failed.');
        }
        if (output) {
            return output;
        }
        throw new Error('Decryption failed.');
    }


    serialize() {
        const jsonKS = {
            encSeed: this.encSeed,
            encHdRootPriv: this.encHdRootPriv,
            hdPathString: this.hdPathString,
            salt: this.salt,
            hdIndex: this.hdIndex,
            privacyKeys: this.privacyKeys,
        };

        return JSON.stringify(jsonKS);
    }

    exportSeed(pwDerivedKey) {
        if (!this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }

        const paddedSeed = utils.decryptString(this.encSeed, pwDerivedKey);
        return paddedSeed.trim();
    }

    exportPrivateKey(pwDerivedKey) {
        if (!this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }

        const privKey = utils.decryptString(this.encHdRootPriv, pwDerivedKey);

        return privKey;
    }

    isDerivedKeyCorrect(pwDerivedKey) {
        const paddedSeed = utils.decryptString(this.encSeed, pwDerivedKey);
        if (paddedSeed && paddedSeed.length > 0) {
            return true;
        }
    }
}


KeyStore.generateDerivedKey = ({ password, salt }) => {
    if (!salt) {
        salt = generateSalt(32);
    }

    const logN = 14;
    const r = 8;
    const dkLen = 32;
    const interruptStep = 200;

    return new Promise((resolve, reject) => {
        scrypt(password, salt, logN, r, dkLen, interruptStep, (key) => {
            resolve({ pwDerivedKey: key, salt });
        }, 'binary');
    });
};


// External static functions


// Generates a random seed. If the optional string
// extraEntropy is set, a random set of entrop
// y
// is created, then concatenated with extraEntropy
// and hashed to produce the entropy that gives the seed.
// Thus if extraEntropy comes from a high-entropy source
// (like dice) it can give some protection from a bad RNG.
// If extraEntropy is not set, the random number generator
// is used directly.

KeyStore.generateRandomSeed = function (extraEntropy) {
    let seed = '';
    if (extraEntropy === undefined) {
        seed = new Mnemonic(Mnemonic.Words.ENGLISH);
    } else if (typeof extraEntropy === 'string') {
        const entBuf = new Buffer(extraEntropy);
        const randBuf = Random.getRandomBuffer(256 / 8);
        const hashedEnt = utils.concatAndSha256(randBuf, entBuf).slice(0, 128 / 8);
        seed = new Mnemonic(hashedEnt, Mnemonic.Words.ENGLISH);
    } else {
        throw new Error('generateRandomSeed: extraEntropy is set but not a string.');
    }

    return seed.toString();
};

KeyStore.isSeedValid = function (seed) {
    return Mnemonic.isValid(seed, Mnemonic.Words.ENGLISH);
};


KeyStore.deserialize = (jsonKs, pwDerivedKey) => {
    // we have an encrypted keyStore here. We need to decrypt the functions and init
    const mnemonic = utils.decryptString(jsonKs.encSeed, pwDerivedKey).trim();

    // Create keystore
    const keystoreX = new KeyStore({
        mnemonic,
        salt: jsonKs.salt,
        hdPathString: jsonKs.hdPathString,
        pwDerivedKey,
    });

    return keystoreX;
};

export default KeyStore;
