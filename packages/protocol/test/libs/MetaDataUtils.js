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

    it('should extract a correct address', async () => {
        const address = ['ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a'];

        const addressToExtract = 0;
        const extractedAddress = await metaDataUtils.extractAddress.call(customMetaData.dataWithNewEphemeral, addressToExtract);
        expect(toChecksumAddress(extractedAddress.slice(2))).to.equal(toChecksumAddress(address[0]));
    });
});
