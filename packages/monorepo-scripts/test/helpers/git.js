/**
 * Lifted and tweaked from semantic-release because we follow how they test their internals.
 * https://github.com/semantic-release/semantic-release/blob/master/test/helpers/git-utils.js
 */

const { check } = require('blork');
const tempy = require('tempy');
const execa = require('execa');
const fileUrl = require('file-url');
const gitLogParser = require('git-log-parser');
const { array: getStreamArray } = require('get-stream');

/**
 * @typedef {Object} Commit
 * @property {string} branch The commit branch.
 * @property {string} hash The commit hash.
 * @property {string} message The commit message.
 */

// Init.

/**
 * Create a Git repository.
 * _Created in a temp folder._
 *
 * @param {string} branch="master" The branch to initialize the repository to.
 * @return {Promise<string>} Promise that resolves to string pointing to the CWD for the created Git repository.
 */
function gitInit(branch = 'master') {
    // Check params.
    check(branch, 'branch: kebab');

    // Init Git in a temp directory.
    const cwd = tempy.directory();
    execa.sync('git', ['init'], { cwd });
    execa.sync('git', ['checkout', '-b', branch], { cwd });

    // Disable GPG signing for commits.
    gitConfig(cwd, 'commit.gpgsign', false);

    // Return directory.
    return cwd;
}

/**
 * Create a remote Git repository.
 * _Created in a temp folder._
 *
 * @return {Promise<string>} Promise that resolves to string URL of the of the remote origin.
 */
function gitInitRemote() {
    // Init bare Git repository in a temp directory.
    const cwd = tempy.directory();
    execa.sync('git', ['init', '--bare'], { cwd });

    // Turn remote path into a file URL.
    const url = fileUrl(cwd);

    // Return URL for remote.
    return url;
}

/**
 * Create a remote Git repository and set it as the origin for a Git repository.
 * _Created in a temp folder._
 *
 * @param {string} cwd The cwd to create and set the origin for.
 * @return {Promise<string>} Promise that resolves to string URL of the of the remote origin.
 */
function gitInitOrigin(cwd) {
    // Check params.
    check(cwd, 'cwd: absolute');

    // Turn remote path into a file URL.
    const url = gitInitRemote();

    // Set origin on local repo.
    execa.sync('git', ['remote', 'add', 'origin', url], { cwd });

    // Return URL for remote.
    return url;
}

// Add.

/**
 * Add files to staged commit in a Git repository.
 *
 * @param {string} cwd The cwd to create and set the origin for.
 * @param {string} file="." The file to add, defaulting to "." (all files).
 * @return {Promise<void>} Promise that resolves when done.
 */
function gitAdd(cwd, file = '.') {
    // Check params.
    check(cwd, 'cwd: absolute');

    // Await command.
    execa.sync('git', ['add', file], { cwd });
}

// Commits.

/**
 * Create commit on a Git repository.
 * _Allows empty commits without any files added._
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} message Commit message.
 * @returns {Promise<string>} Promise that resolves to the SHA for the commit.
 */
function gitCommit(cwd, message) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(message, 'message: string+');

    // Await the command.
    execa.sync('git', ['commit', '-m', message, '--no-gpg-sign'], { cwd });

    // Return HEAD SHA.
    return gitGetHead(cwd);
}

/**
 * `git add .` followed by `git commit`
 * _Allows empty commits without any files added._
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} message Commit message.
 * @returns {Promise<string>} Promise that resolves to the SHA for the commit.
 */
function gitCommitAll(cwd, message) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(message, 'message: string+');

    // Await command.
    gitAdd(cwd);

    // Await command and return the SHA hash.
    return gitCommit(cwd, message);
}

// Push.

/**
 * Push to a remote Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} remote The remote repository URL or name.
 * @param {string} branch The branch to push.
 * @returns {Promise<void>} Promise that resolves when done.
 * @throws {Error} if the push failed.
 */
function gitPush(cwd, remote = 'origin', branch = 'master') {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(remote, 'remote: string');
    check(branch, 'branch: lower');

    // Await command.
    execa.sync('git', ['push', '--tags', remote, `HEAD:${branch}`], { cwd });
}

// Branches.

/**
 * Create a branch in a local Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} branch Branch name to create.
 * @returns {Promise<void>} Promise that resolves when done.
 */
function gitBranch(cwd, branch) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(branch, 'branch: lower');

    // Await command.
    execa.sync('git', ['branch', branch], { cwd });
}

/**
 * Checkout a branch in a local Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} branch Branch name to checkout.
 * @returns {Promise<void>} Promise that resolves when done.
 */
function gitCheckout(cwd, branch) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(branch, 'branch: lower');

    // Await command.
    execa.sync('git', ['checkout', branch], { cwd });
}

// Hashes.

/**
 * Get the current HEAD SHA in a local Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @return {Promise<string>} Promise that resolves to the SHA of the head commit.
 */
function gitGetHead(cwd) {
    // Check params.
    check(cwd, 'cwd: absolute');

    // Await command and return HEAD SHA.
    return execa.sync('git', ['rev-parse', 'HEAD'], { cwd }).stdout;
}

// Tags.

/**
 * Create a tag on the HEAD commit in a local Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} tagName The tag name to create.
 * @param {string} hash=false SHA for the commit on which to create the tag. If falsy the tag is created on the latest commit.
 * @returns {Promise<void>} Promise that resolves when done.
 */
function gitTag(cwd, tagName, hash = undefined) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(tagName, 'tagName: string+');
    check(hash, 'hash: alphanumeric{40}?');

    // Run command.
    execa.sync('git', hash ? ['tag', '-f', tagName, hash] : ['tag', tagName], { cwd });
}

/**
 * Get the tag associated with a commit SHA.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} hash The commit SHA for which to retrieve the associated tag.
 * @return {Promise<string>} The tag associated with the SHA in parameter or `null`.
 */
function gitGetTags(cwd, hash) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(hash, 'hash: alphanumeric{40}');

    // Run command.
    return execa.sync('git', ['describe', '--tags', '--exact-match', hash], { cwd }).stdout;
}

/**
 * Get the first commit SHA tagged `tagName` in a local Git repository.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 * @return {Promise<string>} Promise that resolves to the SHA of the first commit associated with `tagName`.
 */
function gitGetTagHash(cwd, tagName) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(tagName, 'tagName: string+');

    // Run command.
    return execa.sync('git', ['rev-list', '-1', tagName], { cwd }).stdout;
}

// Configs.

/**
 * Add a Git config setting.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} name Config name.
 * @param {any} value Config value.
 * @returns {Promise<void>} Promise that resolves when done.
 */
function gitConfig(cwd, name, value) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(name, 'name: string+');

    // Run command.
    execa.sync('git', ['config', '--add', name, value], { cwd });
}

/**
 * Get a Git config setting.
 *
 * @param {string} cwd The CWD of the Git repository.
 * @param {string} name Config name.
 * @returns {Promise<void>} Promise that resolves when done.
 */
function gitGetConfig(cwd, name) {
    // Check params.
    check(cwd, 'cwd: absolute');
    check(name, 'name: string+');

    // Run command.
    execa.sync('git', ['config', name], { cwd }).stdout;
}

// Exports.
module.exports = {
    gitInit,
    gitInitRemote,
    gitInitOrigin,
    gitAdd,
    gitCommit,
    gitCommitAll,
    gitPush,
    gitCheckout,
    gitGetHead,
    gitGetTags,
    gitTag,
    gitGetTagHash,
    gitConfig,
    gitGetConfig,
};
