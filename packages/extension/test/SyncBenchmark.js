/* global artifacts, expect, contract, beforeEach, it:true */

// ### External Dependencies
const { expect } = require('chai');
const dotenv = require('dotenv');
const path = require('path');
const {
    performance,
} = require('perf_hooks');

const Environment = require('./harness');

const extensionPath = path.resolve(__dirname + '/../client');
const dotenvFile = path.resolve(__dirname + '/../.env.development');

dotenv.config({ path: dotenvFile });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


contract.only('SyncBenchmark', (accounts) => {
    const seedPhrease = process.env.RINKEBY_TESTING_ACCOUNT_0_AZTEC_SEED_PHRASE;
    const assetAddress = '0xae5fEB559F4486730333cabFaa407A9e10c0E874';
    const assetBalance = 10;

    let environment;
    before(async () => {
        environment = await Environment.init(extensionPath, {
            debug: true,
            observeTime: 0,
            network: 'Rinkeby',
        });
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

        await sleep(5000000);
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