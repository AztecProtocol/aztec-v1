const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const BN = require('bn.js');
const { expect } = require('chai');
const ethUtil = require('ethereumjs-util');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../src/bn128');
const signer = require('../../src/signer');

describe('Signer', () => {
    let accounts;
    const domainTypes = {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'verifyingContract', type: 'address' },
        ],
    };

    beforeEach(() => {
        accounts = [secp256k1.generateAccount(), secp256k1.generateAccount()];
    });

    it('should generate correct AZTEC domain params', () => {
        expect(signer.generateACEDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC')).to.deep.equal({
            name: 'AZTEC_CRYPTOGRAPHY_ENGINE',
            version: '1',
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        });
    });

    it('should have the domain params resolve to expected message', () => {
        const messageInput = signer.generateACEDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC');
        const result = typedData.encodeMessageData(domainTypes, 'EIP712Domain', messageInput);
        const messageData = [
            keccak256('EIP712Domain(string name,string version,address verifyingContract)').slice(2),
            keccak256('AZTEC_CRYPTOGRAPHY_ENGINE').slice(2),
            keccak256('1').slice(2),
            padLeft('cccccccccccccccccccccccccccccccccccccccc', 64),
        ];
        const expected = messageData.join('');
        expect(result).to.equal(expected);
    });

    describe('Join Split Signature', () => {
        it('should output a well formed signature', () => {
            const verifyingContract = randomHex(20);
            const noteString = Array(4)
                .fill()
                .map(() => randomHex(32));
            const senderAddress = randomHex(20);
            const challengeString = `${senderAddress}${padLeft('132', 64)}${padLeft('1', 64)}${[...noteString]}`;
            const challenge = `0x${new BN(keccak256(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const domain = signer.generateACEDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof: proofs.JOIN_SPLIT_PROOF,
                noteHash: randomHex(32),
                challenge,
                sender: senderAddress,
            };
            const { privateKey } = accounts[0];
            const { signature } = signer.signTypedData(domain, schema, message, privateKey);

            const expectedLength = 3;
            const expectedNumCharacters = 64; // v, r and s should be 32 bytes

            expect(signature.length).to.equal(expectedLength);
            expect(signature[0].length - 2).to.equal(expectedNumCharacters);
            expect(signature[1].length - 2).to.equal(expectedNumCharacters);
            expect(signature[2].length - 2).to.equal(expectedNumCharacters);
        });

        it('should recover public key from signature params', () => {
            const verifyingContract = randomHex(20);
            const noteString = Array(4)
                .fill()
                .map(() => randomHex(32));
            const senderAddress = randomHex(20);
            const challengeString = `${senderAddress}${padLeft('132', 64)}${padLeft('1', 64)}${[...noteString]}`;
            const challenge = `0x${new BN(keccak256(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const domain = signer.generateACEDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof: proofs.JOIN_SPLIT_PROOF,
                noteHash: randomHex(32),
                challenge,
                sender: senderAddress,
            };
            const { privateKey, publicKey } = accounts[0];
            const { signature, encodedTypedData } = signer.signTypedData(domain, schema, message, privateKey);
            const messageHash = Buffer.from(encodedTypedData.slice(2), 'hex');

            const v = parseInt(signature[0], 16); // has to be in number format
            const r = Buffer.from(signature[1].slice(2), 'hex');
            const s = Buffer.from(signature[2].slice(2), 'hex');

            const publicKeyRecover = ethUtil.ecrecover(messageHash, v, r, s).toString('hex');
            expect(publicKeyRecover).to.equal(publicKey.slice(4));
        });
    });
});
