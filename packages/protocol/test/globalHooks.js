/* global: describe, after: true */

after('generate profiler/ coverage report', async () => {
    if (process.env.MODE === 'profile') {
        await global.profilerSubprovider.writeProfilerOutputAsync();
    } else if (process.env.MODE === 'coverage') {
        await global.coverageSubprovider.writeCoverageAsync();
    }
});
