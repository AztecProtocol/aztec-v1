const chai = require('chai');
const crypto = require('crypto');
const web3Utils = require('web3-utils');

const secp256k1 = require('../../src/secp256k1');

const { padLeft } = web3Utils;
const { expect } = chai;

describe('ECDSA', () => {
    it('should reuse signature parameters to recover signer public key', async () => {
        const message = web3Utils.sha3('this is a test message');

        const keypair = secp256k1.ec.genKeyPair();
        const privateKey = `0x${padLeft(keypair.priv.toString(16), 64)}`;
        const publicKey = secp256k1.curve.g.mul(keypair.priv);
        const signature = secp256k1.ec.sign(Buffer.from(message.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'));
        const recovered = secp256k1.ec.recoverPubKey(
            Buffer.from(message.slice(2), 'hex'),
            { r: signature.r, s: signature.s },
            signature.recoveryParam,
        );
        expect(recovered.eq(publicKey)).to.equal(true);
    });

    it('should construct a valid signature', async () => {
        const { publicKey, privateKey } = secp256k1.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
        const hash = `0x${crypto.randomBytes(32).toString('hex')}`;
        const [, r, s] = secp256k1.ecdsa.signMessage(hash, privateKey);
        const res = secp256k1.ecdsa.verifyMessage(hash, r, s, publicKey);
        expect(res).to.equal(true);
    });

    it('should recover signing public key', async () => {
        const { publicKey, privateKey } = secp256k1.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
        const hash = `0x${crypto.randomBytes(32).toString('hex')}`;
        const [v, r, s] = secp256k1.ecdsa.signMessage(hash, privateKey);
        const res = secp256k1.ecdsa.recoverPublicKey(hash, r, s, v);
        expect(res.eq(secp256k1.ec.keyFromPublic(publicKey.slice(2), 'hex').getPublic())).to.equal(true);
    });
});
