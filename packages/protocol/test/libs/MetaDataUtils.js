/* eslint-disable object-curly-newline */
/* global artifacts, contract, describe, expect, it: true */
const { encoder, JoinSplitProof, note } = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const MetaDataUtils = artifacts.require('./MetaDataUtils');
const { customMetaData } = note.utils;
const { publicKey } = secp256k1.generateAccount();


contract('MetaDataUtils', async () => {
    let metaDataUtils;
    beforeEach(async () => {
        metaDataUtils = MetaDataUtils.new();
    })

    it.only('can extract correct number of addresses', () => {
        const dummyNoteHash = padLeft(randomHex(32), 64);
        const numAddresses = 3;
        const extractedNumAddresses = metaDataUtils.extractAddresses(dummyNoteHash, customMetaData);
        console.log({ numAddresses });
        expect(numAddresses).to.equal(extractedNumAddresses);
    })
})