/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const dotenv = require('dotenv');

const truffleAssert = require('truffle-assertions');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// ### Internal Dependencies
const devUtils = require('@aztec/dev-utils');
const aztec = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const sigUtil = require('eth-sig-util');
const { keccak256 } = require('web3-utils');

// ### Artifacts
const AZTECAccountRegistry = artifacts.require('./AZTECAccountRegistry');

dotenv.config();

const { EIP712_DOMAIN } = devUtils.constants.eip712;

const signatureSchema = {
    types: {
        RegisterExtensionSignature: [
            { name: 'account', type: 'address' },
            { name: 'linkedPublicKey', type: 'bytes' },
        ],
        EIP712Domain: EIP712_DOMAIN,
    },
    primaryType: 'RegisterExtensionSignature',
};

contract('AZTECAccountRegistry', (accounts) => {
    describe('Success States', () => {
        let registryContract;
        let domain;

        beforeEach(async () => {
            registryContract = await AZTECAccountRegistry.new({from: accounts[0]});
            domain = {
                name: 'AZTEC_ACCOUNT_REGISTRY',
                version: '1',
                verifyingContract: '0xbe091542F3502952Ce0a4c26Fb94d70a8C99670F'
            };
        });

        it('be able to register the extension for the sender account', async () => {
            const { privateKey, publicKey, address } = secp256k1.generateAccount();
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
            };
            const { receipt: registerExtensionReceipt } = await registryContract.registerAZTECExtension(
                accounts[0],
                keccak256('0x01'),
                '0x'
            );
            expect(registerExtensionReceipt.status).to.equal(true);

        });

        it.only('be able to register the extension with a valid signature', async () => {

            // const { privateKey, publicKey, address } = secp256k1.generateAccount();
            const privateKey = '0xd243839fc3ca0efa30ab5a7c7cfc1f5ef8e8f1c6a5e7046def0b741f8098491c';
            const address = '0x5c1976FF7696913e62e42b4a46B787aF0F68E973';
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
            };

            const  pkBuf= Buffer.from(privateKey.slice(2), 'hex');
            const sig2 = sigUtil.signTypedData(pkBuf, {
                data: {
                    domain,
                    ...signatureSchema,
                    message,

                }
            });
            console.log(sig2);
            const encodedTypedData = typedData.encodeTypedData({
                domain,
                ...signatureSchema,
                message,
            });


            const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

            const sig=  signature[0] + signature[1].slice(2) + signature[2].slice(2);

            const r = "" + sig2.substring(0, 64);
            const s = "0x" + sig2.substring(64, 128);
            const v = parseInt(sig2.substring(128, 130), 16);

            console.log(r,s,v);
            const { receipt: registerExtensionReceipt } = await registryContract.registerAZTECExtension(
                '0x5c1976FF7696913e62e42b4a46B787aF0F68E973',
                '0x5fe7f977e71dba2ea1a68e21057beebb9be2ac30c6410aa38d4f3fbe41dcffd2',
                v,r,s,
                {from: accounts[2]}
            );
            expect(false).to.equal(true);
            expect(registerExtensionReceipt.status).to.equal(true);
        });

    });

    describe('Failure States', () => {

        let registryContract;
        let domain;

        beforeEach(async () => {
            registryContract = await AZTECAccountRegistry.new({from: accounts[0]});
            domain = {
                name: 'AZTEC_ACCOUNT_REGISTRY',
                version: '1',
                verifyingContract: registryContract.address,
            };
        });

        it('should fail to register the extension if the signature does not match the account', async () => {

            const { privateKey, publicKey, address } = secp256k1.generateAccount();
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
            };
            const encodedTypedData = typedData.encodeTypedData({
                domain,
                ...signatureSchema,
                message,
            });


            const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

            const sig=  signature[0] + signature[1].slice(2) + signature[2].slice(2);

            await truffleAssert.reverts(registryContract.registerAZTECExtension(
                accounts[0],
                keccak256('0x01'),
                sig
            ));
        });

        it('should fail to register the extension if the sender does not match the account', async () => {
            const { privateKey, publicKey, address } = secp256k1.generateAccount();
            const message = {
                account: address,
                linkedPublicKey: keccak256('0x01'),
            };
            await truffleAssert.reverts(registryContract.registerAZTECExtension(
                address,
                keccak256('0x01'),
                '0x'
            ));

        });

    });
});
