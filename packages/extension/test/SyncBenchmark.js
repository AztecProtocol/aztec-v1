/* global artifacts, expect, contract, beforeEach, it:true */

// ### External Dependencies
const { expect } = require('chai');
const chai = require('chai');
const dotenv = require('dotenv');
const path = require('path');
const truffleAssert = require('truffle-assertions');
const {
    performance,
} = require('perf_hooks');

const Environment = require('./harness');

const extensionPath = path.resolve(__dirname + '/../client');

dotenv.config();


contract.only('SyncBenchmark', (accounts) => {
    const seedPhrease = 'warm pink purchase relax hollow swarm digital novel avocado pig toss satoshi';
    const assetAddress = '0x7BD50530d2527672Cc3E5EBaB2f9333547cacB8f';
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
        
        const backgroundPageTarget = await environment.getExtensionBackground();
        const bgPage = await backgroundPageTarget.page();
        bgPage.on('console', msg => console.log(`New message in the console: ${msg.text()}`));

        const tStart = performance.now();
        let t0 = tStart;
        let t1;

        // some bug we need use `enable` twice after restoring (start syncing into indexedDB)
        await homepage.api.evaluate(async () => window.aztec.enable());
        const balance = await homepage.api.evaluate(async address => (await window.aztec.asset(address)).balance(), assetAddress);
        expect(balance).to.equal(0);
        await environment.newLog(bgPage, 'Finished pulling notes');
        t1 = performance.now();

        console.log(`Syncing notes with syncNotes took: ${((t1 - t0) / 1000)} seconds.`);

        // some bug we need use `enable` once more
        await homepage.api.evaluate(async () => window.aztec.enable());

        t0 = performance.now();
        const balanceAfter = await homepage.api.evaluate(async address => (await window.aztec.asset(address)).balance(), assetAddress);
        console.log(`balanceAfter: ${balanceAfter}`);
        t1 = performance.now();

        console.log(`Syncing notes and decryption with NoteService took: ${((t1 - t0) / 1000)} seconds.`);
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