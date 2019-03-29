const { isAbsolute, join } = require('path');
const tempy = require('tempy');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const getCommitsFiltered = require('../../publish/getCommitsFiltered');
const { gitInit, gitCommitAll, gitGetCommits } = require('../helpers/git');

// Tests.
describe('getCommitsFiltered()', () => {
    test('Works correctly (no lastHead)', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = await gitInit();
        writeFileSync(`${cwd}/AAA.txt`, 'AAA');
        const sha1 = await gitCommitAll(cwd, 'Commit 1');
        mkdirSync(`${cwd}/bbb`);
        writeFileSync(`${cwd}/bbb/BBB.txt`, 'BBB');
        const sha2 = await gitCommitAll(cwd, 'Commit 2');
        mkdirSync(`${cwd}/ccc`);
        writeFileSync(`${cwd}/ccc/CCC.txt`, 'CCC');
        const sha3 = await gitCommitAll(cwd, 'Commit 3');

        // Filter a single directory of the repo.
        const commits = await getCommitsFiltered(cwd, 'bbb/');
        expect(commits.length).toBe(1);
        expect(commits[0].hash).toBe(sha2);
        expect(commits[0].subject).toBe('Commit 2');
    });
    test('Works correctly (with lastHead)', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = await gitInit();
        writeFileSync(`${cwd}/AAA.txt`, 'AAA');
        const sha1 = await gitCommitAll(cwd, 'Commit 1');
        mkdirSync(`${cwd}/bbb`);
        writeFileSync(`${cwd}/bbb/BBB.txt`, 'BBB');
        const sha2 = await gitCommitAll(cwd, 'Commit 2');
        mkdirSync(`${cwd}/ccc`);
        writeFileSync(`${cwd}/ccc/CCC.txt`, 'CCC');
        const sha3 = await gitCommitAll(cwd, 'Commit 3');

        // Filter a single directory of the repo since sha3
        const commits = await getCommitsFiltered(cwd, 'bbb/', sha3);
        expect(commits.length).toBe(0);
    });
    test('Works correctly (initial commit)', async () => {
        // Create Git repo with copy of Yarn workspaces fixture.
        const cwd = await gitInit();
        mkdirSync(`${cwd}/bbb`);
        mkdirSync(`${cwd}/ccc`);
        writeFileSync(`${cwd}/AAA.txt`, 'AAA');
        writeFileSync(`${cwd}/bbb/BBB.txt`, 'BBB');
        writeFileSync(`${cwd}/ccc/CCC.txt`, 'CCC');
        const sha = await gitCommitAll(cwd, 'Initial commit');

        // Filter a single directory of the repo.
        const commits = await getCommitsFiltered(cwd, 'bbb/');
        expect(commits.length).toBe(1);
        expect(commits[0].hash).toBe(sha);
    });
    test('TypeError if cwd is not absolute path to directory', async () => {
        await expect(getCommitsFiltered(123, '.')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(123, '.')).rejects.toMatchObject({
            message: expect.stringMatching('cwd: Must be directory that exists in the filesystem'),
        });
        await expect(getCommitsFiltered('aaa', '.')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered('aaa', '.')).rejects.toMatchObject({
            message: expect.stringMatching('cwd: Must be directory that exists in the filesystem'),
        });
        const cwd = tempy.directory();
        await expect(getCommitsFiltered(`${cwd}/abc`, '.')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(`${cwd}/abc`, '.')).rejects.toMatchObject({
            message: expect.stringMatching('cwd: Must be directory that exists in the filesystem'),
        });
    });
    test('TypeError if dir is not path to directory', async () => {
        const cwd = tempy.directory();
        await expect(getCommitsFiltered(cwd, 123)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, 123)).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must be valid path'),
        });
        await expect(getCommitsFiltered(cwd, 'abc')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, 'abc')).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must be directory that exists in the filesystem'),
        });
        await expect(getCommitsFiltered(cwd, `${cwd}/abc`)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, `${cwd}/abc`)).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must be directory that exists in the filesystem'),
        });
    });
    test('TypeError if dir is equal to cwd', async () => {
        const cwd = tempy.directory();
        await expect(getCommitsFiltered(cwd, cwd)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, cwd)).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must not be equal to cwd'),
        });
        await expect(getCommitsFiltered(cwd, '.')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, '.')).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must not be equal to cwd'),
        });
    });
    test('TypeError if dir is not inside cwd', async () => {
        const cwd = tempy.directory();
        const dir = tempy.directory();
        await expect(getCommitsFiltered(cwd, dir)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, dir)).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must be inside cwd'),
        });
        await expect(getCommitsFiltered(cwd, '..')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, '..')).rejects.toMatchObject({
            message: expect.stringMatching('dir: Must be inside cwd'),
        });
    });
    test('TypeError if lastHead is not 40char alphanumeric Git SHA hash', async () => {
        const cwd = tempy.directory();
        mkdirSync(join(cwd, 'dir'));
        await expect(getCommitsFiltered(cwd, 'dir', false)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, 'dir', false)).rejects.toMatchObject({
            message: expect.stringMatching('lastHead: Must be alphanumeric string with size 40 or empty'),
        });
        await expect(getCommitsFiltered(cwd, 'dir', 123)).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, 'dir', 123)).rejects.toMatchObject({
            message: expect.stringMatching('lastHead: Must be alphanumeric string with size 40 or empty'),
        });
        await expect(getCommitsFiltered(cwd, 'dir', 'nottherightlength')).rejects.toBeInstanceOf(TypeError);
        await expect(getCommitsFiltered(cwd, 'dir', 'nottherightlength')).rejects.toMatchObject({
            message: expect.stringMatching('lastHead: Must be alphanumeric string with size 40 or empty'),
        });
    });
});
