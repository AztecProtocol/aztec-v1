/* global: describe, after: true */

const { provider, coverageSubprovider } = require('./coverageVars');

before('start web3 provider', () => {
    provider.start();
});
after('generate coverage report', async () => {
    if (process.env.SOLIDITY_COVERAGE) {
        await coverageSubprovider.writeCoverageAsync();
    }
    provider.stop();
});
