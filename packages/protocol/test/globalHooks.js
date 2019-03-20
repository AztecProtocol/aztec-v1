/* global: describe, after: true */


after('generate coverage report', async () => {
    if (process.env.MODE === 'coverage') {
        await global.coverageSubprovider.writeCoverageAsync();
    }
});
