/* eslint-disable no-underscore-dangle */
/* global artifacts, contract, expect: true */
const { secp256k1, sign } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, keccak256 } = require('web3-utils');

const LibEIP712 = artifacts.require('./LibEIP712Test');

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = sign.generateAZTECDomainParams(validatorAddress, constants.eip712.ACE_DOMAIN_PARAMS);
    return keccak256(`0x${sign.eip712.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

const computeMsgHash = (domainHash, sender) => {
    const noteHash = crypto.randomBytes(32).toString('hex');
    const encodedSender = padLeft(sender.slice(2), 64);
    const status = padLeft(1, 64);
    const hashStruct = keccak256([
        constants.JOIN_SPLIT_SIGNATURE_TYPE_HASH,
        noteHash,
        encodedSender,
        status,
    ].join(''));
    const msg = ['0x1901', domainHash.slice(2), hashStruct.slice(2)].join('');
    const msgHash = keccak256(msg);
    return { hashStruct, msgHash };
};

const signNote = (verifyingContract, spender, privateKey) => {
    const domain = sign.generateAZTECDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
    const schema = constants.eip712.NOTE_SIGNATURE;

    const message = {
        noteHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        spender,
        status: true,
    };
    return sign.signStructuredData(domain, schema, message, privateKey);
};

contract('LibEIP712', (accounts) => {
    let libEIP712;

    beforeEach(async () => {
        libEIP712 = await LibEIP712.new();
    });

    describe('success states', async () => {
        it('should correctly compute the domain hash', async () => {
            const domainHash = computeDomainHash(libEIP712.address);
            const result = await libEIP712.EIP712_DOMAIN_HASH();
            expect(result).to.equal(domainHash);
        });

        it('should correctly compute the message hash', async () => {
            const domainHash = computeDomainHash(libEIP712.address);
            const { hashStruct, msgHash } = computeMsgHash(domainHash, accounts[0]);
            const result = await libEIP712._hashEIP712Message(hashStruct);
            expect(result).to.equal(msgHash);
        });

        it('should recover the sender address', async () => {
            const aztecAccount = secp256k1.generateAccount();
            const { signature, encodedTypedData } = signNote(
                libEIP712.address,
                aztecAccount.address,
                aztecAccount.privateKey
            );
            const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
            const result = await libEIP712._recoverSignature(encodedTypedData, concatenatedSignature);
            expect(result).to.equal(aztecAccount.address);
        });
    });

    describe('failure states', async () => {
        it('should fail when signer is 0x0', async () => {
            const aztecAccount = secp256k1.generateAccount();
            const { signature, encodedTypedData } = signNote(
                libEIP712.address,
                aztecAccount.address,
                aztecAccount.privateKey
            );

            // see https://ethereum.stackexchange.com/questions/69328/how-to-get-0x0-from-ecrecover/69329#69329
            const v = padLeft('0x10', 64);
            const concatenatedSignature = v + signature[1].slice(2) + signature[2].slice(2);
            await truffleAssert.reverts(
                libEIP712._recoverSignature(encodedTypedData, concatenatedSignature),
                'signer address cannot be 0'
            );
        });
    });
});
