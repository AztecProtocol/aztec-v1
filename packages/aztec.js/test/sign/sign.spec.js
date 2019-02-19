const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');

const { expect } = chai;

const sign = require('../../src/sign');
const eip712 = require('../../src/sign/eip712');

describe('sign tests', () => {
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
