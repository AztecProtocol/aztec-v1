/* eslint-disable object-curly-newline */
/* global artifacts, contract, expect, it: true */
const { toChecksumAddress } = require('web3-utils');

const { customMetaData } = require('../helpers/ERC1724');

const MetaDataUtils = artifacts.require('./MetaDataUtils');

contract('MetaDataUtils', async () => {
    let metaDataUtils;

    beforeEach(async () => {
        metaDataUtils = await MetaDataUtils.new();
    });

    it('should extract single correct address', async () => {
        const address = ['ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a'];

        const addressToExtract = 0;
        const extractedAddress = await metaDataUtils.extractAddress.call(customMetaData.data, addressToExtract);
        expect(toChecksumAddress(extractedAddress.slice(2))).to.equal(toChecksumAddress(address[0]));
    });

    it('should extract several correct addresses', async () => {
        const addresses = [
            'ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a',
            'ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1a',
            'ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2a',
        ];

        const extractedAddresses = await metaDataUtils.extractAddresses.call(customMetaData.data);
        expect(extractedAddresses.length).to.equal(3);
        expect(toChecksumAddress(extractedAddresses[0].slice(2))).to.equal(toChecksumAddress(addresses[0]));
        expect(toChecksumAddress(extractedAddresses[1].slice(2))).to.equal(toChecksumAddress(addresses[1]));
        expect(toChecksumAddress(extractedAddresses[2].slice(2))).to.equal(toChecksumAddress(addresses[2]));
    });
});
