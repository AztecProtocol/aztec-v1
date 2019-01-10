const chai = require('chai');
const crypto = require('crypto');
const Tx = require('ethereumjs-tx');

const { clear } = require('../../db');

const keystore = require('../../../accounts.json');
const basicWallet = require('./controller');
const secp256k1 = require('../../../aztec-crypto-js/secp256k1');
const web3 = require('../../web3Listener');

const { expect } = chai;

describe('basicWallet controller tests', () => {
    describe('success states', async () => {
        beforeEach(() => {
            clear();
        });

        it('can read and write', async () => {
            const name = 'test';
            const publicKey = `0x${crypto.randomBytes(32).toString('hex')}`;
            const expected = basicWallet.createFromPublicKey(publicKey, name);
            const result = basicWallet.get(expected.address);
            expect(!expected.name).to.equal(false);
            expect(!expected.publicKey).to.equal(false);
            expect(!expected.name).to.equal(false);
            expect(expected.name).to.equal(result.name);
            expect(expected.address).to.equal(result.address);
            expect(expected.publicKey).to.equal(result.publicKey);
        });

        it('can update', async () => {
            const expected = basicWallet.createFromPublicKey(
                `0x${crypto.randomBytes(32).toString('hex')}`,
                'test'
            );
            basicWallet.update(expected.address, { foo: 'bar' });
            const result = basicWallet.get(expected.address);
            expect(result.foo).to.equal('bar');
        });

        it('address and public key are expected to be well-formed', () => {
            const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
            const wallet = basicWallet.createFromPrivateKey(privateKey);
            const publicKey = secp256k1.ec.keyFromPublic(wallet.publicKey.slice(2), 'hex');
            const expected = secp256k1.curve.g.mul(Buffer.from(privateKey.slice(2), 'hex'));
            expect(publicKey.getPublic().eq(expected)).to.equal(true);
        });

        it('wallet.init will recover nonce for wallet', async () => {
            const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
            const wallet = basicWallet.createFromPrivateKey(privateKey);
            const accounts = await web3.eth.getAccounts();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: wallet.address,
                value: web3.utils.toWei('0.1', 'ether'),
            });

            const transaction = new Tx({
                nonce: 0,
                gas: 100000,
                gasPrice: web3.utils.toHex('10000000000'),
                data: '',
                from: wallet.address,
                to: accounts[0],
                value: web3.utils.toHex(web3.utils.toWei('0.05', 'ether')),
                chainId: web3.utils.toHex(await web3.eth.net.getId()),
            });
            transaction.sign(Buffer.from(wallet.privateKey.slice(2), 'hex'));
            await web3.eth.sendSignedTransaction(`0x${transaction.serialize().toString('hex')}`);

            await basicWallet.init(wallet.address);
            const result = basicWallet.get(wallet.address);
            expect(result.nonce).to.equal(1);
        });

        it('wallet.init will create a wallet if account exists in keystore', async () => {
            const { address } = keystore.keys[0];
            await basicWallet.init(address);
            const result = basicWallet.get(address);
            expect(result.address).to.equal(address);
        });
    });

    describe('failure states', () => {
        beforeEach(() => {
            clear();
        });
        it('cannot create wallet with an address that already exists', () => {
            const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
            basicWallet.createFromPrivateKey(privateKey);
            let message = '';
            try {
                basicWallet.createFromPrivateKey(privateKey);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('wallet already exists');
        });

        it('will throw if wallet.init is called on a nonexistant wallet', async () => {
            const address = `0x${crypto.randomBytes(20).toString('hex')}`;
            let message = '';
            try {
                await basicWallet.init(address);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal(`could not find account in db or keystore that corresponds to ${address}`);
        });

        it('wallet.get will throw if cannot find wallet', async () => {
            const address = `0x${crypto.randomBytes(20).toString('hex')}`;
            let message = '';
            try {
                await basicWallet.get(address);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal(`could not find wallet at address ${address}`);
        });

        it('wallet.update will throw if cannot find wallet', async () => {
            const address = `0x${crypto.randomBytes(20).toString('hex')}`;
            let message = '';
            try {
                await basicWallet.update(address, { foo: 'bar' });
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal(`could not find wallet at address ${address}`);
        });
    });
});
