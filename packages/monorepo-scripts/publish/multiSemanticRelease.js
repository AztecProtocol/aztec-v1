const { resolve, dirname } = require('path');
const semanticRelease = require('semantic-release');
const { WritableStreamBuffer } = require('stream-buffers');
const { check } = require('./blork');
const getLogger = require('./getLogger');
const getConfig = require('./getConfig');
const getConfigSemantic = require('./getConfigSemantic');
const getManifest = require('./getManifest');
const cleanPath = require('./cleanPath');
const RescopedStream = require('./RescopedStream');
const createInlinePluginCreator = require('./createInlinePluginCreator');

/**
 * The multirelease context.
 * @typedef MultiContext
 * @param {Package[]} packages Array of all packages in this multirelease.
 * @param {Package[]} releasing Array of packages that will release.
 * @param {string} cwd The current working directory.
 * @param {Object} env The environment variables.
 * @param {Logger} logger The logger for the multirelease.
 * @param {Stream} stdout The output stream for this multirelease.
 * @param {Stream} stderr The error stream for this multirelease.
 */

/**
 * Details about an individual package in a multirelease
 * @typedef Package
 * @param {string} path String path to `package.json` for the package.
 * @param {string} dir The working directory for the package.
 * @param {string} name The name of the package, e.g. `my-amazing-package`
 * @param {string[]} deps Array of all dependency package names for the package (merging dependencies, devDependencies, peerDependencies).
 * @param {Package[]} localDeps Array of local dependencies this package relies on.
 * @param {context|void} context The semantic-release context for this package's release (filled in once semantic-release runs).
 * @param {undefined|Result|false} result The result of semantic-release (object with lastRelease, nextRelease, commits, releases), false if this package was skipped (no changes or similar), or undefined if the package's release hasn't completed yet.
 */

/**
 * Perform a multirelease.
 *
 * @param {string[]} paths An array of paths to package.json files.
 * @param {Object} inputOptions An object containing semantic-release options.
 * @param {Object} settings An object containing: cwd, env, stdout, stderr (mainly for configuring tests).
 * @returns {Promise<Package[]>} Promise that resolves to a list of package objects with `result` property describing whether it released or not.
 */
async function multiSemanticRelease(
    paths,
    inputOptions = {},
    { cwd = process.cwd(), env = process.env, stdout = process.stdout, stderr = process.stderr } = {},
) {
    // Check params.
    check(paths, 'paths: string[]');
    check(cwd, 'cwd: directory');
    check(env, 'env: objectlike');
    check(stdout, 'stdout: stream');
    check(stderr, 'stderr: stream');
    cwd = cleanPath(cwd);

    // Start.
    const logger = getLogger({ stdout, stderr });
    logger.complete(`Started multirelease! Loading ${paths.length} packages...`);

    // Vars.
    const globalOptions = await getConfig(cwd);
    const options = Object.assign({}, globalOptions, inputOptions);
    const multiContext = { options, cwd, env, stdout, stderr };

    // Load packages from paths.
    const packages = await Promise.all(paths.map((path) => getPackage(path, multiContext)));
    packages.forEach((pkg) => logger.success(`Loaded package ${pkg.name}`));
    logger.complete(`Queued ${packages.length} packages! Starting release...`);

    // Release all packages.
    const createInlinePlugin = createInlinePluginCreator(packages, multiContext);
    await Promise.all(packages.map((pkg) => releasePackage(pkg, createInlinePlugin, multiContext)));
    const released = packages.filter((pkg) => pkg.result).length;

    // Return packages list.
    logger.complete(`Released ${released} of ${packages.length} packages, semantically!`);
    return packages;
}

// Exports.
module.exports = multiSemanticRelease;

/**
 * Load details about a package.
 *
 * @param {string} path The path to load details about.
 * @param {Object} allOptions Options that apply to all packages.
 * @param {MultiContext} multiContext Context object for the multirelease.
 * @returns {Promise<Package|void>} A package object, or void if the package was skipped.
 *
 * @internal
 */
async function getPackage(path, { options: globalOptions, env, cwd, stdout, stderr }) {
    // Make path absolute.
    path = cleanPath(path, cwd);
    const dir = dirname(path);

    // Get package.json file contents.
    const manifest = getManifest(path);
    const name = manifest.name;

    // Combine list of all dependency names.
    const deps = [
        ...Object.keys(manifest.dependencies),
        ...Object.keys(manifest.devDependencies),
        ...Object.keys(manifest.peerDependencies),
    ];

    // Load the package-specific options.
    const { options: pkgOptions } = await getConfig(dir);

    // The 'final options' are the global options merged with package-specific options.
    // We merge this ourselves because package-specific options can override global options.
    const finalOptions = Object.assign({}, globalOptions, pkgOptions);

    // Make a fake logger so semantic-release's get-config doesn't fail.
    const logger = { error() {}, log() {} };

    // Use semantic-release's internal config with the final options (now we have the right `options.plugins` setting) to get the plugins object and the options including defaults.
    // We need this so we can call e.g. plugins.analyzeCommit() to be able to affect the input and output of the whole set of plugins.
    const { options, plugins } = await getConfigSemantic({ cwd: dir, env, stdout, stderr, logger }, finalOptions);

    // Return package object.
    return { path, dir, name, manifest, deps, options, plugins };
}

/**
 * Release an individual package.
 *
 * @param {Package} pkg The specific package.
 * @param {Function} createInlinePlugin A function that creates an inline plugin.
 * @param {MultiContext} multiContext Context object for the multirelease.
 * @returns {Promise<void>} Promise that resolves when done.
 *
 * @internal
 */
async function releasePackage(pkg, createInlinePlugin, multiContext) {
    // Vars.
    const { options: pkgOptions, name, path, dir } = pkg;
    const { todo, options: globalOptions, cwd, env, logger, stdout, stderr } = multiContext;

    // Set the options that we call semanticRelease() with.
    // This consists of:
    // - The global options (e.g. from the top level package.json)
    // - The package options (e.g. from the specific package's package.json)
    const options = Object.assign({}, globalOptions, pkgOptions);

    // Add the package name into tagFormat.
    // Thought about doing a single release for the tag (merging several packages), but it's impossible to prevent Github releasing while allowing NPM to continue.
    // It'd also be difficult to merge all the assets into one release without full editing/overriding the plugins.
    options.tagFormat = name + '@${version}';

    // Make an 'inline plugin' for this package.
    // The inline plugin is the only plugin we call semanticRelease() with.
    // The inline plugin functions then call e.g. plugins.analyzeCommits() manually and sometimes manipulate the responses.
    const inlinePlugin = createInlinePlugin(pkg);
    options.plugins = [inlinePlugin];

    // Call semanticRelease() on the directory and save result to pkg.
    // Don't need to log out errors as semantic-release already does that.
    pkg.result = await semanticRelease(options, {
        cwd: dir,
        env,
        stdout: new RescopedStream(stdout, name),
        stderr: new RescopedStream(stdout, name),
    });
}
