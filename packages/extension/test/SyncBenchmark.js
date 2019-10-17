/* global artifacts, expect, contract, beforeEach, it:true */

// ### External Dependencies
const { expect } = require('chai');
const chai = require('chai');
const dotenv = require('dotenv');
const path = require('path');
const truffleAssert = require('truffle-assertions');

const Environment = require('./harness');

const extensionPath = path.resolve(__dirname + '/../client');

dotenv.config();

function randomInt(from, to = null) {
    const start = to !== null ? from : 0;
    const offset = to !== null ? to - from : from;
    return start + Math.floor(Math.random() * (offset + 1));
}

contract.only('SyncBenchmark', (accounts) => {
    const [user] = accounts;
    const totalBalance = 10000;
    const seedPhrease = 'topple actress bread print concert trash print kidney gadget retreat text sunny';
    const assetAddress = '0xB09f84187B9aD0DB68C680df845291C0333F21bB';
    const assetBalance = 10;

    let environment;
    before(async () => {
        environment = await Environment.init(extensionPath, { debug: true, observeTime: 0 });
    });

    after(async () => {
        await environment.browser.close();
    });

    it.only('should successfully restore existing AZTEC account', async () => {
        await environment.restoreAccount(seedPhrease);

        const homepage = Object.values(environment.openPages)
            .find(p => p.aztecContext === true);

        // some bug we need use `enable` twice after restoring
        await homepage.api.evaluate(async () => window.aztec.enable());

        // wait until account will be fetched
        // await environment.wait(1000);

        const balance = await homepage.api.evaluate(async address => (await window.aztec.asset(address)).balance(), assetAddress);
        expect(balance).to.equal(0);

        await homepage.api.waitFor(async address => (await window.aztec.asset(address)).balance() !== 0, assetAddress);

        // const balanceAfter = await homepage.api.evaluate(async address => window.aztec.asset(address).balance(), assetAddress);
        // console.log(`Balance: ${balanceAfter}`);
    });

    it.only('should sync an AZTEC asset', async () => {
        // await environment.syncAsset(assetAddress);

        // console.log('----------- 0 ');
        // const homepage = Object.values(environment.openPages)
        //     .find(p => p.aztecContext === true);
        // console.log('----------- 1 ');

        // const asset = await homepage.api.evaluate(async (address) => await window.aztec.asset(address), assetAddress);
        // console.log('----------- 2 ');
        // expect(asset.address).to.equal(assetAddress);
    });

});