/* eslint-disable object-curly-newline */
/* global artifacts, contract, expect, it: true */
const { note } = require('aztec.js');

const MetaDataUtils = artifacts.require('./MetaDataUtils');
const { customMetaData } = note.utils;


contract('MetaDataUtils', async () => {
    let metaDataUtils;

    beforeEach(async () => {
        metaDataUtils = await MetaDataUtils.new();
    })

    it('should extract single correct address', async () => {
        const address = [
            '000000000000000000000000ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a',
        ];

        const addressToExtract = 0;
        const extractedAddress = await metaDataUtils.extractAddress.call(customMetaData, addressToExtract);
        expect(extractedAddress.slice(2)).to.equal(address[0]);
    });

    it('should extract several correct addresses', async () => {
        const addresses = [
            '000000000000000000000000ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a',
            '000000000000000000000000ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1a',
            '000000000000000000000000ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2a',
        ];

        const extractedAddresses = await metaDataUtils.extractAddresses.call(customMetaData);
        expect(extractedAddresses.length).to.equal(3);
        expect(extractedAddresses[0].slice(2)).to.equal(addresses[0]);
        expect(extractedAddresses[1].slice(2)).to.equal(addresses[1]);
        expect(extractedAddresses[2].slice(2)).to.equal(addresses[2]);
    })
})