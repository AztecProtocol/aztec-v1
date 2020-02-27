/* global artifacts, expect, contract, beforeEach, it:true */
const { signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const truffleAssert = require('truffle-assertions');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const { keccak256, randomHex } = require('web3-utils');

const AccountRegistry = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');

const createSignature = require('../../../helpers/AccountRegistry/AccountRegistryManager');

const { ACCOUNT_REGISTRY_SIGNATURE } = devUtils.constants.eip712;

contract('AccountRegistry: Behaviour20200106', (accounts) => {
    let registryContract;

    beforeEach(async () => {
        const trustedGSNSignerAddress = randomHex(20);
        const aceAddress = randomHex(20);
        registryContract = await AccountRegistry.new(aceAddress, trustedGSNSignerAddress, { from: accounts[0] });
    });

    describe('Success States', () => {
        it('should initialise the register', async () => {
            const { receipt } = await registryContract.initialize();
            expect(receipt.status).to.equal(true);
        });

        it('should be able to register the extension with a valid signature', async () => {
            const { privateKey, address, publicKey } = secp256k1.generateAccount();

            const { address: AZTECaddress } = secp256k1.generateAccount();

            const domain = signer.generateAccountRegistryDomainParams(registryContract.address);
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
                AZTECaddress,
            };

            const encodedTypedData = typedData.encodeTypedData({
                domain,
                ...ACCOUNT_REGISTRY_SIGNATURE,
                message,
            });

            const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

            const r = signature[1];
            const s = signature[2].slice(2);
            const v = signature[0].slice(-2);
            const sig = r + s + v;

            const { receipt: registerExtensionReceipt } = await registryContract.registerAZTECExtension(
                address,
                AZTECaddress,
                keccak256('0x01'),
                `0x${publicKey.slice(4)}`,
                sig,
                { from: accounts[2] },
            );
            expect(registerExtensionReceipt.status).to.equal(true);
        });
    });

    describe('Failure States', () => {
        it('should fail to register the extension if the signature does not match the account', async () => {
            const { privateKey, address } = secp256k1.generateAccount();
            const { address: AZTECaddress } = secp256k1.generateAccount();

            const domain = signer.generateAccountRegistryDomainParams(registryContract.address);
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
                AZTECaddress,
            };
            const encodedTypedData = typedData.encodeTypedData({
                domain,
                ...ACCOUNT_REGISTRY_SIGNATURE,
                message,
            });

            const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

            const sig = signature[0] + signature[1].slice(2) + signature[2].slice(2);

            const dummyAddress = accounts[0];
            await truffleAssert.reverts(
                registryContract.registerAZTECExtension(dummyAddress, AZTECaddress, keccak256('0x01'), keccak256('0x0'), sig),
            );
        });

        it('should not be possible to use the same signature to register multiple accounts', async () => {
            const { address, linkedPublicKey, AZTECaddress, spendingPublicKey, sig: legitimateSignature } = createSignature(
                registryContract.address,
            );

            await registryContract.registerAZTECExtension(
                address,
                AZTECaddress,
                linkedPublicKey,
                spendingPublicKey,
                legitimateSignature,
            );

            const replaySignature = legitimateSignature;

            const secondAddress = randomHex(20);
            const secondLinkedPublicKey = keccak256('0x01');
            const secondSpendingPublicKey = keccak256('0x0');

            await truffleAssert.reverts(
                registryContract.registerAZTECExtension(
                    secondAddress,
                    AZTECaddress,
                    secondLinkedPublicKey,
                    secondSpendingPublicKey,
                    replaySignature,
                ),
                'signature has already been used',
            );
        });
    });
});
