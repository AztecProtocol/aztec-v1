
const { constants, proofs } = require('@aztec/dev-utils');

const BN = require('bn.js');
const crypto = require('crypto');
const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const ethUtil = require('ethereumjs-util');

const proofUtils = require('../../src/proof/proofUtils');
const sign = require('../../src/sign');
const eip712 = require('../../src/sign/eip712');
const bn128 = require('../../src/bn128');
const secp256k1 = require('../../src/secp256k1');

const { expect } = chai;

describe('sign tests', () => {
    let accounts;

    beforeEach(() => {
        accounts = [
            secp256k1.generateAccount(),
            secp256k1.generateAccount(),
        ];
    });

    describe('Structure specific EIP712 tests', () => {
        const domainTypes = {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'verifyingContract', type: 'address' },
            ],
        };

        it('will generate correct AZTEC domain params', () => {
            expect(sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC')).to.deep.equal({
                name: 'AZTEC_CRYPTOGRAPHY_ENGINE',
                version: '1',
                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
            });
        });

        it('AZTEC domain params resolves to expected message', () => {
            const messageInput = sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC');
            const result = eip712.encodeMessageData(domainTypes, 'EIP712Domain', messageInput);
            const messageData = [
                sha3('EIP712Domain(string name,string version,address verifyingContract)').slice(2),
                sha3('AZTEC_CRYPTOGRAPHY_ENGINE').slice(2),
                sha3('1').slice(2),
                padLeft('cccccccccccccccccccccccccccccccccccccccc', 64),
            ];
            const expected = (messageData.join(''));
            expect(result).to.equal(expected);
        });
    });

    describe('EIP712 implementation tests for JOIN_SPLIT_SIGNATURE', () => {
        it('check that the signature outputted is well formed', () => {
            const verifyingContract = proofUtils.randomAddress();
            const noteString = [...new Array(4)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`);
            const senderAddress = proofUtils.randomAddress();
            const challengeString = `${senderAddress}${padLeft('132', 64)}${padLeft('1', 64)}${[...noteString]}`;
            const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const domain = sign.generateAZTECDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof: proofs.JOIN_SPLIT_PROOF,
                noteHash: `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`,
                challenge,
                sender: senderAddress,
            };
            const { privateKey } = accounts[0];
            const { signature } = sign.signStructuredData(domain, schema, message, privateKey);

            const expectedLength = 3;
            const expectedNumCharacters = 64; // v, r and s should be 32 bytes

            expect(signature.length).to.equal(expectedLength);
            expect(signature[0].length - 2).to.equal(expectedNumCharacters);
            expect(signature[1].length - 2).to.equal(expectedNumCharacters);
            expect(signature[2].length - 2).to.equal(expectedNumCharacters);
        });

        it('check public key is correctly recovered from signature params', () => {
            const verifyingContract = proofUtils.randomAddress();
            const noteString = [...new Array(4)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`);
            const senderAddress = proofUtils.randomAddress();
            const challengeString = `${senderAddress}${padLeft('132', 64)}${padLeft('1', 64)}${[...noteString]}`;
            const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const domain = sign.generateAZTECDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof: proofs.JOIN_SPLIT_PROOF,
                noteHash: `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`,
                challenge,
                sender: senderAddress,
            };
            const { privateKey, publicKey } = accounts[0];
            const { signature, encodedTypedData } = sign.signStructuredData(domain, schema, message, privateKey);
            const messageHash = Buffer.from(encodedTypedData.slice(2), 'hex');

            const v = parseInt(signature[0], 16); // has to be in number format
            const r = Buffer.from(signature[1].slice(2), 'hex');
            const s = Buffer.from(signature[2].slice(2), 'hex');

            const publicKeyRecover = (ethUtil.ecrecover(messageHash, v, r, s)).toString('hex');
            expect(publicKeyRecover).to.equal(publicKey.slice(4));
        });
    });
});
