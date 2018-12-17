const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const eip712 = require('./eip712');

const { expect } = chai;

const sign = require('./sign');

describe.only('sign tests', () => {
    const domainTypes = {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
    };
    it('will generate correct AZTEC domain params', () => {
        expect(sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', 1)).to.deep.equal({
            name: 'AZTECERC20BRIDGE_DOMAIN',
            version: '0.1.1',
            chainId: 1,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        });

        expect(sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', 107)).to.deep.equal({
            name: 'AZTECERC20BRIDGE_DOMAIN',
            version: '0.1.1',
            chainId: 107,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        });
    });

    it('AZTEC domain params resolves to expected message', () => {
        const message = sign.generateAZTECDomainParams('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', 1);
        const result = eip712.encodeMessageData(domainTypes, 'EIP712Domain', message);
        const messageData = [
            sha3('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)').slice(2),
            sha3('AZTECERC20BRIDGE_DOMAIN').slice(2),
            sha3('0.1.1').slice(2),
            padLeft('1', 64),
            padLeft('cccccccccccccccccccccccccccccccccccccccc', 64),
        ];
        const expected = (messageData.join(''));
        expect(result).to.equal(expected);
    });
});
