const { writeFileSync } = require('fs');
const path = require('path');
const { Signale } = require('signale');
const { WritableStreamBuffer } = require('stream-buffers');
const execa = require('execa');
const tempy = require('tempy');

const { copyDirectory } = require('../helpers/file');
const {
    gitInit,
    gitAdd,
    gitCommit,
    gitCommitAll,
    gitInitOrigin,
    gitPush,
    gitTag,
    gitGetTags,
} = require('../helpers/git');

// Clear mocks before tests.
beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks.
    require.cache = {}; // Clear the require cache so modules are loaded fresh.
});

// Tests.
describe('multiSemanticRelease()', () => {
    test('Initial commit (changes in all packages)', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = gitInit();
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        const sha = gitCommitAll(cwd, 'feat: Initial release');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Call multiSemanticRelease()
        // Doesn't include plugins that actually publish.
        const multiSemanticRelease = require('../../');
        const result = await multiSemanticRelease(
            [
                `packages/a/package.json`,
                `packages/b/package.json`,
                `packages/c/package.json`,
                `packages/d/package.json`,
            ],
            {},
            { cwd, stdout, stderr },
        );

        // Get stdout and stderr output.
        const err = stderr.getContentsAsString('utf8');
        expect(err).toBe(false);
        const out = stdout.getContentsAsString('utf8');
        expect(out).toMatch('Started multirelease! Loading 4 packages...');
        expect(out).toMatch('Loaded package msr-test-a');
        expect(out).toMatch('Loaded package msr-test-b');
        expect(out).toMatch('Loaded package msr-test-c');
        expect(out).toMatch('Loaded package msr-test-d');
        expect(out).toMatch('Queued 4 packages! Starting release...');
        expect(out).toMatch('Created tag msr-test-a@1.0.0');
        expect(out).toMatch('Created tag msr-test-b@1.0.0');
        expect(out).toMatch('Created tag msr-test-c@1.0.0');
        expect(out).toMatch('Created tag msr-test-d@1.0.0');
        expect(out).toMatch('Released 4 of 4 packages, semantically!');

        // A.
        expect(result[0].name).toBe('msr-test-a');
        expect(result[0].result.lastRelease).toEqual({});
        expect(result[0].result.nextRelease).toMatchObject({
            gitHead: sha,
            gitTag: 'msr-test-a@1.0.0',
            type: 'minor',
            version: '1.0.0',
        });
        expect(result[0].result.nextRelease.notes).toMatch('# msr-test-a 1.0.0');
        expect(result[0].result.nextRelease.notes).toMatch('### Features\n\n* Initial release');
        expect(result[0].result.nextRelease.notes).toMatch('### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0');

        // B.
        expect(result[1].name).toBe('msr-test-b');
        expect(result[1].result.lastRelease).toEqual({});
        expect(result[1].result.nextRelease).toMatchObject({
            gitHead: sha,
            gitTag: 'msr-test-b@1.0.0',
            type: 'minor',
            version: '1.0.0',
        });
        expect(result[1].result.nextRelease.notes).toMatch('# msr-test-b 1.0.0');
        expect(result[1].result.nextRelease.notes).toMatch('### Features\n\n* Initial release');
        expect(result[1].result.nextRelease.notes).toMatch(
            '### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0',
        );

        // C.
        expect(result[2].name).toBe('msr-test-c');
        expect(result[2].result.lastRelease).toEqual({});
        expect(result[2].result.nextRelease).toMatchObject({
            gitHead: sha,
            gitTag: 'msr-test-c@1.0.0',
            type: 'minor',
            version: '1.0.0',
        });
        expect(result[2].result.nextRelease.notes).toMatch('# msr-test-c 1.0.0');
        expect(result[2].result.nextRelease.notes).toMatch('### Features\n\n* Initial release');
        expect(result[2].result.nextRelease.notes).toMatch('### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0');

        // D.
        expect(result[3].name).toBe('msr-test-d');
        expect(result[3].result.lastRelease).toEqual({});
        expect(result[3].result.nextRelease).toMatchObject({
            gitHead: sha,
            gitTag: 'msr-test-d@1.0.0',
            type: 'minor',
            version: '1.0.0',
        });
        expect(result[3].result.nextRelease.notes).toMatch('# msr-test-d 1.0.0');
        expect(result[3].result.nextRelease.notes).toMatch('### Features\n\n* Initial release');
        expect(result[3].result.nextRelease.notes).not.toMatch('### Dependencies');

        // ONLY four times.
        expect(result).toHaveLength(4);

        // Check manifests.
        expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
            peerDependencies: {
                'msr-test-c': '1.0.0',
            },
        });
        expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
            dependencies: {
                'msr-test-a': '1.0.0',
            },
            devDependencies: {
                'msr-test-c': '1.0.0',
            },
        });
        expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
            devDependencies: {
                'msr-test-b': '1.0.0',
                'msr-test-d': '1.0.0',
            },
        });
    });
    test('No changes in any packages', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = gitInit();
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        const sha = gitCommitAll(cwd, 'feat: Initial release');
        // Creating the four tags so there are no changes in any packages.
        gitTag(cwd, 'msr-test-a@1.0.0');
        gitTag(cwd, 'msr-test-b@1.0.0');
        gitTag(cwd, 'msr-test-c@1.0.0');
        gitTag(cwd, 'msr-test-d@1.0.0');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Call multiSemanticRelease()
        // Doesn't include plugins that actually publish.
        const multiSemanticRelease = require('../../');
        const result = await multiSemanticRelease(
            [
                `packages/c/package.json`,
                `packages/a/package.json`,
                `packages/d/package.json`,
                `packages/b/package.json`,
            ],
            {},
            { cwd, stdout, stderr },
        );

        // Get stdout and stderr output.
        const err = stderr.getContentsAsString('utf8');
        expect(err).toBe(false);
        const out = stdout.getContentsAsString('utf8');
        expect(out).toMatch('Started multirelease! Loading 4 packages...');
        expect(out).toMatch('Loaded package msr-test-a');
        expect(out).toMatch('Loaded package msr-test-b');
        expect(out).toMatch('Loaded package msr-test-c');
        expect(out).toMatch('Loaded package msr-test-d');
        expect(out).toMatch('Queued 4 packages! Starting release...');
        expect(out).toMatch('There are no relevant changes, so no new version is released');
        expect(out).not.toMatch('Created tag');
        expect(out).toMatch('Released 0 of 4 packages, semantically!');

        // Results.
        expect(result[0].result).toBe(false);
        expect(result[1].result).toBe(false);
        expect(result[2].result).toBe(false);
        expect(result[3].result).toBe(false);
        expect(result).toHaveLength(4);
    });
    test('Changes in some packages', async () => {
        // Create Git repo.
        const cwd = gitInit();
        // Initial commit.
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        const sha1 = gitCommitAll(cwd, 'feat: Initial release');
        gitTag(cwd, 'msr-test-a@1.0.0');
        gitTag(cwd, 'msr-test-b@1.0.0');
        gitTag(cwd, 'msr-test-c@1.0.0');
        gitTag(cwd, 'msr-test-d@1.0.0');
        // Second commit.
        writeFileSync(`${cwd}/packages/a/aaa.txt`, 'AAA');
        const sha2 = gitCommitAll(cwd, 'feat(aaa): Add missing text file');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Call multiSemanticRelease()
        // Doesn't include plugins that actually publish.
        const multiSemanticRelease = require('../../');
        const result = await multiSemanticRelease(
            [
                `packages/c/package.json`,
                `packages/d/package.json`,
                `packages/b/package.json`,
                `packages/a/package.json`,
            ],
            {},
            { cwd, stdout, stderr },
        );

        // Get stdout and stderr output.
        const err = stderr.getContentsAsString('utf8');
        expect(err).toBe(false);
        const out = stdout.getContentsAsString('utf8');
        expect(out).toMatch('Started multirelease! Loading 4 packages...');
        expect(out).toMatch('Loaded package msr-test-a');
        expect(out).toMatch('Loaded package msr-test-b');
        expect(out).toMatch('Loaded package msr-test-c');
        expect(out).toMatch('Loaded package msr-test-d');
        expect(out).toMatch('Queued 4 packages! Starting release...');
        expect(out).toMatch('Created tag msr-test-a@1.1.0');
        expect(out).toMatch('Created tag msr-test-b@1.0.1');
        expect(out).toMatch('Created tag msr-test-c@1.0.1');
        expect(out).toMatch('There are no relevant changes, so no new version is released');
        expect(out).toMatch('Released 3 of 4 packages, semantically!');

        // A.
        expect(result[3].name).toBe('msr-test-a');
        expect(result[3].result.lastRelease).toMatchObject({
            gitHead: sha1,
            gitTag: 'msr-test-a@1.0.0',
            version: '1.0.0',
        });
        expect(result[3].result.nextRelease).toMatchObject({
            gitHead: sha2,
            gitTag: 'msr-test-a@1.1.0',
            type: 'minor',
            version: '1.1.0',
        });
        expect(result[3].result.nextRelease.notes).toMatch('# msr-test-a [1.1.0]');
        expect(result[3].result.nextRelease.notes).toMatch('### Features\n\n* **aaa:** Add missing text file');
        expect(result[3].result.nextRelease.notes).toMatch('### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.1');

        // B.
        expect(result[2].name).toBe('msr-test-b');
        expect(result[2].result.lastRelease).toEqual({
            gitHead: sha1,
            gitTag: 'msr-test-b@1.0.0',
            version: '1.0.0',
        });
        expect(result[2].result.nextRelease).toMatchObject({
            gitHead: sha2,
            gitTag: 'msr-test-b@1.0.1',
            type: 'patch',
            version: '1.0.1',
        });
        expect(result[2].result.nextRelease.notes).toMatch('# msr-test-b [1.0.1]');
        expect(result[2].result.nextRelease.notes).not.toMatch('### Features');
        expect(result[2].result.nextRelease.notes).not.toMatch('### Bug Fixes');
        expect(result[2].result.nextRelease.notes).toMatch('### Dependencies\n\n* **msr-test-a:** upgraded to 1.1.0');

        // C.
        expect(result[0].name).toBe('msr-test-c');
        expect(result[0].result.lastRelease).toEqual({
            gitHead: sha1,
            gitTag: 'msr-test-c@1.0.0',
            version: '1.0.0',
        });
        expect(result[0].result.nextRelease).toMatchObject({
            gitHead: sha2,
            gitTag: 'msr-test-c@1.0.1',
            type: 'patch',
            version: '1.0.1',
        });
        expect(result[0].result.nextRelease.notes).toMatch('# msr-test-c [1.0.1]');
        expect(result[0].result.nextRelease.notes).not.toMatch('### Features');
        expect(result[0].result.nextRelease.notes).not.toMatch('### Bug Fixes');
        expect(result[0].result.nextRelease.notes).toMatch('### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.1');

        // D.
        expect(result[1].name).toBe('msr-test-d');
        expect(result[1].result).toBe(false);

        // ONLY four times.
        expect(result[4]).toBe(undefined);

        // Check manifests.
        expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
            peerDependencies: {
                'msr-test-c': '1.0.1',
            },
        });
        expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
            dependencies: {
                'msr-test-a': '1.1.0',
            },
            devDependencies: {
                'msr-test-c': '1.0.1',
            },
        });
        expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
            devDependencies: {
                'msr-test-b': '1.0.1',
                'msr-test-d': '1.0.0',
            },
        });
    });
    test("Error if release's local deps have no version number", async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = gitInit();
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        gitAdd(cwd, 'packages/a/package.json');
        const sha = gitCommit(cwd, 'feat: Commit first package only');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Call multiSemanticRelease()
        try {
            const multiSemanticRelease = require('../../');
            const result = await multiSemanticRelease(
                [`packages/a/package.json`, `packages/c/package.json`],
                {},
                { cwd, stdout, stderr },
            );

            // Not reached.
            expect(false).toBe(true);
        } catch (e) {
            expect(e.message).toBe('Cannot release because dependency msr-test-c has not been released');
        }
    });
    test('Configured plugins are called as normal', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = gitInit();
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        const sha = gitCommitAll(cwd, 'feat: Initial release');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Make an inline plugin.
        const plugin = {
            verifyConditions: jest.fn(),
            analyzeCommits: jest.fn(),
            verifyRelease: jest.fn(),
            generateNotes: jest.fn(),
            prepare: jest.fn(),
            success: jest.fn(),
            fail: jest.fn(),
        };

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Call multiSemanticRelease()
        const multiSemanticRelease = require('../../');
        const result = await multiSemanticRelease(
            [`packages/d/package.json`],
            {
                // Override to add our own plugins.
                plugins: ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', plugin],
            },
            { cwd, stdout, stderr },
        );

        // Check calls.
        expect(plugin.verifyConditions).toBeCalledTimes(1);
        expect(plugin.analyzeCommits).toBeCalledTimes(1);
        expect(plugin.verifyRelease).toBeCalledTimes(1);
        expect(plugin.generateNotes).toBeCalledTimes(1);
        expect(plugin.prepare).toBeCalledTimes(1);
        expect(plugin.success).toBeCalledTimes(1);
        expect(plugin.fail).not.toBeCalled();
    });
    test('Deep errors (e.g. in plugins) bubble up and out', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = gitInit();
        copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
        const sha = gitCommitAll(cwd, 'feat: Initial release');
        const url = gitInitOrigin(cwd);
        gitPush(cwd);

        // Capture output.
        const stdout = new WritableStreamBuffer();
        const stderr = new WritableStreamBuffer();

        // Release.
        const multiSemanticRelease = require('../../');

        // Call multiSemanticRelease()
        // Doesn't include plugins that actually publish.
        try {
            await multiSemanticRelease(
                [`packages/d/package.json`, `packages/a/package.json`],
                {
                    // Override to add our own erroring plugin.
                    plugins: [
                        {
                            analyzeCommits: () => {
                                throw new Error('NOPE');
                            },
                        },
                    ],
                },
                { cwd, stdout, stderr },
            );

            // Not reached.
            expect(false).toBe(true);
        } catch (e) {
            // Error bubbles up through semantic-release and multi-semantic-release and out.
            expect(e.message).toBe('NOPE');
        }
    });
    test('TypeError if CWD is not string', async () => {
        const multiSemanticRelease = require('../../');
        await expect(multiSemanticRelease()).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease(undefined)).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease(null)).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([1, 2, 3])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([true, false])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([undefined])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([null])).rejects.toBeInstanceOf(TypeError);
    });
    test('TypeError if paths is not a list of strings', async () => {
        const multiSemanticRelease = require('../../');
        await expect(multiSemanticRelease()).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease(undefined)).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease(null)).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([1, 2, 3])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([true, false])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([undefined])).rejects.toBeInstanceOf(TypeError);
        await expect(multiSemanticRelease([null])).rejects.toBeInstanceOf(TypeError);
    });
    test('ReferenceError if paths points to a non-file', async () => {
        const multiSemanticRelease = require('../../');
        const stdout = new WritableStreamBuffer(); // Blackhole the output so it doesn't clutter Jest.
        const r1 = multiSemanticRelease(['test/fixtures/DOESNOTEXIST.json'], {}, { stdout });
        await expect(r1).rejects.toBeInstanceOf(ReferenceError); // Path that does not exist.
        const r2 = multiSemanticRelease(['test/fixtures/DOESNOTEXIST/'], {}, { stdout });
        await expect(r2).rejects.toBeInstanceOf(ReferenceError); // Path that does not exist.
        const r3 = multiSemanticRelease(['test/fixtures/'], {}, { stdout });
        await expect(r3).rejects.toBeInstanceOf(ReferenceError); // Directory that exists.
    });
    test('SyntaxError if paths points to package.json with bad syntax', async () => {
        const multiSemanticRelease = require('../../');
        const stdout = new WritableStreamBuffer(); // Blackhole the output so it doesn't clutter Jest.
        const r1 = multiSemanticRelease(['test/fixtures/invalidPackage.json'], {}, { stdout });
        await expect(r1).rejects.toBeInstanceOf(SyntaxError);
        await expect(r1).rejects.toMatchObject({
            message: expect.stringMatching('could not be parsed'),
        });
        const r2 = multiSemanticRelease(['test/fixtures/numberPackage.json'], {}, { stdout });
        await expect(r2).rejects.toBeInstanceOf(SyntaxError);
        await expect(r2).rejects.toMatchObject({
            message: expect.stringMatching('not an object'),
        });
        const r3 = multiSemanticRelease(['test/fixtures/badNamePackage.json'], {}, { stdout });
        await expect(r3).rejects.toBeInstanceOf(SyntaxError);
        await expect(r3).rejects.toMatchObject({
            message: expect.stringMatching('Package name must be non-empty string'),
        });
        const r4 = multiSemanticRelease(['test/fixtures/badDepsPackage.json'], {}, { stdout });
        await expect(r4).rejects.toBeInstanceOf(SyntaxError);
        await expect(r4).rejects.toMatchObject({
            message: expect.stringMatching('Package dependencies must be object'),
        });
        const r5 = multiSemanticRelease(['test/fixtures/badDevDepsPackage.json'], {}, { stdout });
        await expect(r5).rejects.toBeInstanceOf(SyntaxError);
        await expect(r5).rejects.toMatchObject({
            message: expect.stringMatching('Package devDependencies must be object'),
        });
        const r6 = multiSemanticRelease(['test/fixtures/badPeerDepsPackage.json'], {}, { stdout });
        await expect(r6).rejects.toBeInstanceOf(SyntaxError);
        await expect(r6).rejects.toMatchObject({
            message: expect.stringMatching('Package peerDependencies must be object'),
        });
    });
});
