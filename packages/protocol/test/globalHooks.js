/* global: describe, after: true */


after('generate coverage report', async () => {
    if (process.env.MODE === 'coverage') {
        await global.coverageSubprovider.writeCoverageAsync();
    }
    if (process.env.MOD === 'profile') {
        await global.profilerSubprovider.writeProfilerOutputAsync();
        await global.profilerSubprovider.writeCoverageAsync();
    }
});
