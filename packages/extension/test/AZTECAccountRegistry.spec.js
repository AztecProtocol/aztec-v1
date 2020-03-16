// /* global artifacts, expect, contract, beforeEach, it:true */
// // ### External Dependencies
// const dotenv = require('dotenv');

// const truffleAssert = require('truffle-assertions');
// const nacl = require('tweetnacl');
// nacl.util = require('tweetnacl-util');

// // ### Internal Dependencies
// const devUtils = require('@aztec/dev-utils');
// const aztec = require('aztec.js');
// const secp256k1 = require('@aztec/secp256k1');
// const typedData = require('@aztec/typed-data');
// const sigUtil = require('eth-sig-util');
// const { keccak256 } = require('web3-utils');

// // ### Artifacts
// const AZTECAccountRegistry = artifacts.require('./AZTECAccountRegistry');

// dotenv.config();

// const { EIP712_DOMAIN } = devUtils.constants.eip712;

// const signatureSchema = {
//     types: {
//         AZTECAccount: [
//             { name: 'account', type: 'address' },
//             { name: 'linkedPublicKey', type: 'bytes' },
//         ],
//         EIP712Domain: EIP712_DOMAIN,
//     },
//     primaryType: 'AZTECAccount',
// };

// contract('AZTECAccountRegistry', (accounts) => {
//     describe('Success States', () => {
//         let registryContract;
//         let domain;

//         beforeEach(async () => {
//             registryContract = await AZTECAccountRegistry.new({from: accounts[0]});
//             domain = {
//                 name: 'AZTECAccountRegistry',
//                 version: '2',
//                 verifyingContract: registryContract.address
//             };
//         });

//         it('be able to register the extension for the sender account', async () => {
//             const { privateKey, publicKey, address } = secp256k1.generateAccount();
//             const message = {
//                 account: address,
//                 linkedPublicKey: keccak256('0x01'),
//             };
//             const { receipt: registerExtensionReceipt } = await registryContract.registerAZTECExtension(
//                 accounts[0],
//                 keccak256('0x01'),
//                 '0x',
//             );

//             expect(registerExtensionReceipt);

//         });

//         it('be able to register the extension with a valid signature', async () => {

//             const { privateKey, publicKey, address } = secp256k1.generateAccount();
//             const message = {
//                 account: address,
//                 linkedPublicKey: keccak256('0x01'),
//             };

//             const encodedTypedData = typedData.encodeTypedData({
//                 domain,
//                 ...signatureSchema,
//                 message,
//             });


//             const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

//             const r = signature[1];
//             const s = signature[2].slice(2);
//             const v = signature[0].slice(-2);
//             const sig =  r + s + v;


//             const { receipt: registerExtensionReceipt } = await registryContract.registerAZTECExtension(
//                 address,
//                 keccak256('0x01'),
//                 sig,
//                 {from: accounts[2]}
//             );
//             expect(registerExtensionReceipt.status).to.equal(true);
//         });

//         it('be able to commit to a registration code', async () => {
            
            

//         });
//     });

//     describe('Failure States', () => {

//         let registryContract;
//         let domain;

//         beforeEach(async () => {
//             registryContract = await AZTECAccountRegistry.new({from: accounts[0]});
//             domain = {
//                 name: 'AZTEC_ACCOUNT_REGISTRY',
//                 version: '1',
//                 verifyingContract: registryContract.address,
//             };
//         });

//         it('should fail to register the extension if the signature does not match the account', async () => {

//             const { privateKey, publicKey, address } = secp256k1.generateAccount();
//             const message = {
//                 account: address,
//                 linkedPublicKey: keccak256('0x01'),
//             };
//             const encodedTypedData = typedData.encodeTypedData({
//                 domain,
//                 ...signatureSchema,
//                 message,
//             });


//             const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

//             const sig=  signature[0] + signature[1].slice(2) + signature[2].slice(2);

//             await truffleAssert.reverts(registryContract.registerAZTECExtension(
//                 accounts[0],
//                 keccak256('0x01'),
//                 sig
//             ));
//         });

//         it('should fail to register the extension if the sender does not match the account', async () => {
//             const { privateKey, publicKey, address } = secp256k1.generateAccount();
//             const message = {
//                 account: address,
//                 linkedPublicKey: keccak256('0x01'),
//             };
//             await truffleAssert.reverts(registryContract.registerAZTECExtension(
//                 address,
//                 keccak256('0x01'),
//                 '0x'
//             ));

//         });


//     });
// });
