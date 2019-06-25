import bitcore from 'bitcore-lib';
import Mnemonic from 'bitcore-mnemonic';
import nacl from 'tweetnacl';
import utils from 'tweetnacl-util';
import scrypt from 'scrypt-async';

nacl.util = utils;

const { Random } = bitcore.crypto;
const { Hash } = bitcore.crypto;

function strip0x (input) {
    if (typeof(input) !== 'string') {
        return input;
    }
    if (input.length >= 2 && input.slice(0,2) === '0x') {
        return input.slice(2);
    }

    return input;

}

function add0x (input) {
    if (typeof(input) !== 'string') {
        return input;
    }
    if (input.length < 2 || input.slice(0,2) !== '0x') {
        return '0x' + input;
    }

    return input;

}

function leftPadString (stringToPad, padChar, length) {

    let repreatedPadChar = '';
    for (let i=0; i<length; i++) {
        repreatedPadChar += padChar;
    }

    return ( (repreatedPadChar + stringToPad).slice(-length) );
}

function nacl_encodeHex(msgUInt8Arr) {
    const msgBase64 = nacl.util.encodeBase64(msgUInt8Arr);
    return (new Buffer(msgBase64, 'base64')).toString('hex');
}

function nacl_decodeHex(msgHex) {
    const msgBase64 = (new Buffer(msgHex, 'hex')).toString('base64');
    return nacl.util.decodeBase64(msgBase64);
}

function encryptString (string, pwDerivedKey) {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encObj = nacl.secretbox(nacl.util.decodeUTF8(string), nonce, pwDerivedKey);
    const encString = { 'encStr': nacl.util.encodeBase64(encObj),
        'nonce': nacl.util.encodeBase64(nonce)};
    return encString;
};



const curve25519Encrypt = function(receiverPublicKey, msgParams) {
    // generate ephemeral keypair

    // assemble encryption parameters - from string to UInt8
    const ephemeralKeyPair = nacl.box.keyPair();
    try {
        var pubKeyUInt8Array = nacl.util.decodeBase64(receiverPublicKey);
    } catch (err){
        throw new Error('Bad public key')
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


const KeyStore = function() {}

KeyStore.prototype.init = function(mnemonic, pwDerivedKey, hdPathString, salt) {

    this.salt = salt
    this.hdPathString = hdPathString
    this.encSeed = undefined;
    this.encHdRootPriv = undefined;
    this.version = 3;
    this.hdIndex = 0;

    if ( (typeof pwDerivedKey !== 'undefined') && (typeof mnemonic !== 'undefined') ){
        const words = mnemonic.split(' ');
        if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12){
            throw new Error('KeyStore: Invalid mnemonic');
        }

        // Pad the seed to length 120 before encrypting
        const paddedSeed = leftPadString(mnemonic, ' ', 120);
        this.encSeed = encryptString(paddedSeed, pwDerivedKey);

        // hdRoot is the relative root from which we derive the keys using
        // generateNewAddress(). The derived keys are then
        // `hdRoot/hdIndex`.

        const hdRoot = new Mnemonic(mnemonic).toHDPrivateKey().xprivkey;
        const hdRootKey = new bitcore.HDPrivateKey(hdRoot);
        const hdPathKey = hdRootKey.derive(hdPathString).xprivkey;
        this.encHdRootPriv = encryptString(hdPathKey, pwDerivedKey);
        this.privacyKeys = this._generatePrivacyKeys(pwDerivedKey);
    }
}

KeyStore.createVault = function(opts, cb) {

    // Default hdPathString
    if (!('hdPathString' in opts)) {
        var err = new Error("Keystore: Must include hdPathString in createVault inputs. Suggested alternatives are m/0'/0'/0' for previous lightwallet default, or m/44'/60'/0'/0 for BIP44 (used by Jaxx & MetaMask)")
        return cb(err)
    }

    if (!('seedPhrase' in opts)) {
        var err = new Error('Keystore: Must include seedPhrase in createVault inputs.')
        return cb(err)
    }

    if (!('salt' in opts)) {
        opts.salt = generateSalt(32);
    }

    KeyStore.deriveKeyFromPasswordAndSalt(opts.password, opts.salt, function(err, pwDerivedKey) {
        if (err) return cb(err);

        const ks = new KeyStore();
        ks.init(opts.seedPhrase, pwDerivedKey, opts.hdPathString, opts.salt);

        cb(null, ks);
    });
};

KeyStore.generateSalt = generateSalt;

function generateSalt (byteCount) {
    return bitcore.crypto.Random.getRandomBuffer(byteCount || 32).toString('base64');
}

KeyStore.prototype.isDerivedKeyCorrect = function(pwDerivedKey) {

    const paddedSeed = KeyStore._decryptString(this.encSeed, pwDerivedKey);
    if (paddedSeed.length > 0) {
        return true;
    }

    return false;

};

KeyStore._encryptString = encryptString

KeyStore._decryptString = function (cipher, pwDerivedKey) {

    const secretbox = nacl.util.decodeBase64(cipher.encStr);
    const nonce = nacl.util.decodeBase64(cipher.nonce);

    const decryptedStr = nacl.secretbox.open(secretbox, nonce, pwDerivedKey);

    if (decryptedStr === undefined) {
        throw new Error("Decryption failed!");
    }

    return nacl.util.encodeUTF8(decryptedStr);
};

KeyStore.prototype._encrypt25519 = curve25519Encrypt;
KeyStore.prototype._decrypt25519 = function(encryptedData, pwDerivedKey) {

    const privKey = KeyStore._decryptString(this.privacyKeys.encPrivKey, pwDerivedKey);
    // string to buffer to UInt8Array
    const recieverPrivateKeyUint8Array = nacl_decodeHex(privKey);
    const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(recieverPrivateKeyUint8Array).secretKey

    const nonce = nacl.util.decodeBase64(encryptedData.nonce);
    const ciphertext = nacl.util.decodeBase64(encryptedData.ciphertext);
    const ephemPublicKey = nacl.util.decodeBase64(encryptedData.ephemPublicKey);

    // decrypt
    const decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPublicKey, recieverEncryptionPrivateKey);

    // return decrypted msg data
    try {
        var output = nacl.util.encodeUTF8(decryptedMessage);
    }catch(err) {
        throw new Error('Decryption failed.')
    }
    if (output){
        return output;
    }
    throw new Error('Decryption failed.')



}

// This function is tested using the test vectors here:
// http://www.di-mgt.com.au/sha_testvectors.html
KeyStore._concatAndSha256 = function(entropyBuf0, entropyBuf1) {

    const totalEnt = Buffer.concat([entropyBuf0, entropyBuf1]);
    if (totalEnt.length !== entropyBuf0.length + entropyBuf1.length) {
        throw new Error('generateRandomSeed: Logic error! Concatenation of entropy sources failed.')
    }

    const hashedEnt = Hash.sha256(totalEnt);

    return hashedEnt;
}

// External static functions


// Generates a random seed. If the optional string
// extraEntropy is set, a random set of entropy
// is created, then concatenated with extraEntropy
// and hashed to produce the entropy that gives the seed.
// Thus if extraEntropy comes from a high-entropy source
// (like dice) it can give some protection from a bad RNG.
// If extraEntropy is not set, the random number generator
// is used directly.

KeyStore.generateRandomSeed = function(extraEntropy) {

    let seed = '';
    if (extraEntropy === undefined) {
        seed = new Mnemonic(Mnemonic.Words.ENGLISH);
    }
    else if (typeof extraEntropy === 'string') {
        const entBuf = new Buffer(extraEntropy);
        const randBuf = Random.getRandomBuffer(256 / 8);
        const hashedEnt = this._concatAndSha256(randBuf, entBuf).slice(0, 128 / 8);
        seed = new Mnemonic(hashedEnt, Mnemonic.Words.ENGLISH);
    }
    else {
        throw new Error('generateRandomSeed: extraEntropy is set but not a string.')
    }

    return seed.toString();
};

KeyStore.isSeedValid = function(seed) {
    return Mnemonic.isValid(seed, Mnemonic.Words.ENGLISH)
};

// Takes keystore serialized as string and returns an instance of KeyStore
KeyStore.deserialize = function (keystore) {
    const jsonKS = JSON.parse(keystore);

    if (jsonKS.version === undefined || jsonKS.version !== 3) {
        throw new Error('Old version of serialized keystore. Please use KeyStore.upgradeOldSerialized() to convert it to the latest version.')
    }

    // Create keystore
    const keystoreX = new KeyStore();

    keystoreX.salt = jsonKS.salt
    keystoreX.hdPathString = jsonKS.hdPathString
    keystoreX.encSeed = jsonKS.encSeed;
    keystoreX.encHdRootPriv = jsonKS.encHdRootPriv;
    keystoreX.version = jsonKS.version;
    keystoreX.hdIndex = jsonKS.hdIndex;
    keystoreX.privacyKeys = jsonKS.privacyKeys;

    return keystoreX;
};

KeyStore.deriveKeyFromPasswordAndSalt = function(password, salt, callback) {

    // Do not require salt, and default it to 'lightwalletSalt'
    // (for backwards compatibility)
    if (!callback && typeof salt === 'function') {
        callback = salt
        salt = 'lightwalletSalt'
    } else if (!salt && typeof callback === 'function') {
        salt = 'lightwalletSalt'
    }

    const logN = 14;
    const r = 8;
    const dkLen = 32;
    const interruptStep = 200;

    const cb = function(derKey) {
        let err = null
        let ui8arr = null
        try{
            ui8arr = (new Uint8Array(derKey));
        } catch (e) {
            err = e
        }
        callback(err, ui8arr);
    }

    scrypt(password, salt, logN, r, dkLen, interruptStep, cb, null);
}

// External API functions

KeyStore.prototype.serialize = function () {
    const jsonKS = {
        'encSeed': this.encSeed,
        'encHdRootPriv' : this.encHdRootPriv,
        'hdPathString' : this.hdPathString,
        'salt': this.salt,
        'hdIndex' : this.hdIndex,
        'version' : this.version,
        'privacyKeys': this.privacyKeys,
    };

    return JSON.stringify(jsonKS);
};




KeyStore.prototype.exportSeed = function (pwDerivedKey) {

    if(!this.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error("Incorrect derived key!");
    }

    const paddedSeed = KeyStore._decryptString(this.encSeed, pwDerivedKey);
    return paddedSeed.trim();
};

KeyStore.prototype.exportPrivateKey = function (pwDerivedKey) {

    if(!this.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error("Incorrect derived key!");
    }

    const privKey = KeyStore._decryptString(this.encHdRootPriv, pwDerivedKey);

    return privKey;
};



KeyStore.prototype.keyFromPassword = function(password, callback) {
    KeyStore.deriveKeyFromPasswordAndSalt(password, this.salt, callback);
}


// Async functions exposed for Hooked Web3-provider
// hasAddress(address, callback)
// signTransaction(txParams, callback)
//
// The function signTransaction() needs the
// function KeyStore.prototype.passwordProvider(callback)
// to be set in order to run properly.
// The function passwordProvider is an async function
// that calls the callback(err, password) with a password
// supplied by the user or by other means.
// The user of the hooked web3-provider is encouraged
// to write their own passwordProvider.
//
// Uses defaultHdPathString for the addresses.


KeyStore.prototype.passwordProvider = function (callback) {

    const password = prompt("Enter password to continue","Enter password");
    callback(null, password);

}


KeyStore.prototype._generatePrivacyKeys = function(pwDerivedKey) {

    if(!this.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error("Incorrect derived key!");
    }
    const hdRoot = KeyStore._decryptString(this.encHdRootPriv, pwDerivedKey);

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
    }
    else if (privkeyBuf.length < 32) {
        // Pad private key if too short
        // bitcore has a bug where it sometimes returns
        // truncated keys
        privkeyHex = leftPadString(privkeyBuf.toString('hex'), '0', 64);
    }
    else if (privkeyBuf.length > 32) {
        throw new Error('Private key larger than 32 bytes. Aborting!');
    }

    const encPrivKey = KeyStore._encryptString(privkeyHex, pwDerivedKey);

    const privKeyUInt8Array = new Uint8Array(privkeyBuf);
    const pubKey = nacl.box.keyPair.fromSecretKey(privKeyUInt8Array).publicKey;
    const pubKeyBase64 = nacl.util.encodeBase64(pubKey);

    return {
        publicKey: pubKeyBase64,
        encPrivKey,
    }
};

export default KeyStore;

