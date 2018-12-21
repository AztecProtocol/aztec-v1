const chai = require('chai');
const crypto = require('crypto');
const web3Utils = require('web3-utils');

const ecdsa = require('../../secp256k1/ecdsa');
const secp256k1 = require('../../secp256k1/secp256k1');

const { padLeft } = web3Utils;
const { expect } = chai;

describe('ecdsa.js tests', () => {
    it('signature parameters can be used to recover signer public key', async () => {
        const message = web3Utils.sha3('this is a test message');

        const keypair = secp256k1.genKeyPair();
        const privateKey = `0x${padLeft(keypair.priv.toString(16), 64)}`;
        const publicKey = secp256k1.g.mul(keypair.priv);
        const signature = secp256k1.sign(
            Buffer.from(message.slice(2), 'hex'),
            Buffer.from(privateKey.slice(2), 'hex')
        );
        const recovered = secp256k1.recoverPubKey(
            Buffer.from(message.slice(2), 'hex'),
            { r: signature.r, s: signature.s },
            signature.recoveryParam
        );
        expect(recovered.eq(publicKey)).to.equal(true);
    });

    it('can construct a valid signature', async () => {
        const { publicKey, privateKey } = secp256k1.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
        const hash = `0x${crypto.randomBytes(32).toString('hex')}`;
        const [, r, s] = ecdsa.signMessage(hash, privateKey);
        const res = ecdsa.verifyMessage(hash, r, s, publicKey);
        expect(res).to.equal(true);
    });

    it('can recover signing public key', async () => {
        const { publicKey, privateKey } = secp256k1.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
        const hash = `0x${crypto.randomBytes(32).toString('hex')}`;
        const [v, r, s] = ecdsa.signMessage(hash, privateKey);
        const res = ecdsa.recoverPublicKey(hash, r, s, v);
        expect(res.eq(secp256k1.keyFromPublic(publicKey.slice(2), 'hex').getPublic())).to.equal(true);
    });

    it('signs the same signatures as web3?', async () => {
        const { result: [v, r, s], web3Sig } = ecdsa.web3Comparison();
        expect(r === web3Sig.r);
        expect(s === web3Sig.s);
        expect(v === web3Sig.v);
    });
});
