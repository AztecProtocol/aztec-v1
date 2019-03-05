const BN = require('bn.js');
const crypto = require('crypto');
const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const ethUtil = require('ethereumjs-util');

const { expect } = chai;

const {
    constants: {
        ACE_DOMAIN_PARAMS,
        ACE_NOTE_SIGNATURE,
    },
} = require('@aztec/dev-utils');

const sign = require('../../src/sign');
const eip712 = require('../../src/sign/eip712');
const bn128 = require('../../src/bn128');
const secp256k1 = require('../../src/secp256k1');

function randomAddress() {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
}


describe('sign tests', () => {
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
                name: 'AZTECERC20BRIDGE_DOMAIN',
                version: '0.1.1',
                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
            });
        });

        it('AZTEC domain params resolves to expected message', () => {
            const message = sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC');
            const result = eip712.encodeMessageData(domainTypes, 'EIP712Domain', message);
            const messageData = [
                sha3('EIP712Domain(string name,string version,address verifyingContract)').slice(2),
                sha3('AZTECERC20BRIDGE_DOMAIN').slice(2),
                sha3('0.1.1').slice(2),
                padLeft('cccccccccccccccccccccccccccccccccccccccc', 64),
            ];
            const expected = (messageData.join(''));
            expect(result).to.equal(expected);
        });
    });

    describe.only('General purpose EIP712 tests', () => {
        let message;
        let schema;
        let accounts;
        let domainParams;
        let verifyingContract;
        let challenge;
        let senderAddress;
        let noteString;


        beforeEach(() => {
            accounts = [
                secp256k1.generateAccount(),
                secp256k1.generateAccount(),
            ];

            noteString = [...new Array(4)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`);

            senderAddress = randomAddress();
            const challengeString = `${senderAddress}${padLeft('132', 64)}${padLeft('1', 64)}${[...noteString]}`;
            challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;
            verifyingContract = randomAddress();


            domainParams = sign.generateAZTECDomainParams(verifyingContract, ACE_DOMAIN_PARAMS);

            message = {
                proofId: 1,
                note: noteString,
                challenge,
                sender: senderAddress,
            };

            schema = ACE_NOTE_SIGNATURE;
        });

        it('check that the signature outputted is well formed', () => {
            const { privateKey } = accounts[0];

            const { signature } = sign.signStructuredData(domainParams, schema, message, privateKey);

            const expectedLength = 3;
            const expectedNumCharacters = 64; // v, r and s should be 32 bytes

            expect(signature.length).to.equal(expectedLength);
            expect(signature[0].length - 2).to.equal(expectedNumCharacters);
            expect(signature[1].length - 2).to.equal(expectedNumCharacters);
            expect(signature[2].length - 2).to.equal(expectedNumCharacters);
        });

        it('new signing technique generates same signature as old technique', () => {
            const { privateKey } = accounts[0];

            const { signature } = sign.signStructuredData(domainParams, schema, message, privateKey);

            const oldSignature = sign.signACENote(noteString, challenge, senderAddress, verifyingContract, privateKey);

            expect(signature[0]).to.equal(oldSignature[0]);
            expect(signature[1]).to.equal(oldSignature[1]);
            expect(signature[2]).to.equal(oldSignature[2]);
        });

        it('check public key is correctly recovered from signature params', () => {
            const { privateKey, publicKey } = accounts[0];
            const { signature, encodeTypedData } = sign.signStructuredData(domainParams, schema, message, privateKey);

            const messageHash = Buffer.from(encodeTypedData.slice(2), 'hex');

            const v = parseInt(signature[0], 16); // has to be in number format
            const r = Buffer.from(signature[1].slice(2), 'hex');
            const s = Buffer.from(signature[2].slice(2), 'hex');

            const publicKeyRecover = (ethUtil.ecrecover(messageHash, v, r, s)).toString('hex');

            expect(publicKeyRecover).to.equal(publicKey.slice(4));
        });
    });
});
