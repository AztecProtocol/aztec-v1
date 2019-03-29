const { check } = require('blork');
const { existsSync, lstatSync, readFileSync } = require('fs');

/**
 * Get the parsed contents of a package.json manifest file.
 *
 * @param {string} path The path to the package.json manifest file.
 * @returns {object} The manifest file's contents.
 *
 * @internal
 */
function getManifest(path) {
    // Check it exists.
    if (!existsSync(path)) throw new ReferenceError(`package.json file not found: "${path}"`);

    // Stat the file.
    let stat;
    try {
        stat = lstatSync(path);
    } catch (e) {
        // istanbul ignore next (hard to test — happens if no read acccess etc).
        throw new ReferenceError(`package.json cannot be read: "${path}"`);
    }

    // Check it's a file!
    if (!stat.isFile()) throw new ReferenceError(`package.json is not a file: "${path}"`);

    // Read the file.
    let contents;
    try {
        contents = readFileSync(path, 'utf8');
    } catch (e) {
        // istanbul ignore next (hard to test — happens if no read acccess etc).
        throw new ReferenceError(`package.json cannot be read: "${path}"`);
    }

    // Parse the file.
    let manifest;
    try {
        manifest = JSON.parse(contents);
    } catch (e) {
        throw new SyntaxError(`package.json could not be parsed: "${path}"`);
    }

    // Must be an object.
    if (typeof manifest !== 'object') throw new SyntaxError(`package.json was not an object: "${path}"`);

    // Must have a name.
    if (typeof manifest.name !== 'string' || !manifest.name.length)
        throw new SyntaxError(`Package name must be non-empty string: "${path}"`);

    // Check dependencies.
    if (!manifest.hasOwnProperty('dependencies')) manifest.dependencies = {};
    else if (typeof manifest.dependencies !== 'object')
        throw new SyntaxError(`Package dependencies must be object: "${path}"`);

    // Check devDependencies.
    if (!manifest.hasOwnProperty('devDependencies')) manifest.devDependencies = {};
    else if (typeof manifest.devDependencies !== 'object')
        throw new SyntaxError(`Package devDependencies must be object: "${path}"`);

    // Check peerDependencies.
    if (!manifest.hasOwnProperty('peerDependencies')) manifest.peerDependencies = {};
    else if (typeof manifest.peerDependencies !== 'object')
        throw new SyntaxError(`Package peerDependencies must be object: "${path}"`);

    // Return contents.
    return manifest;
}

// Exports.
module.exports = getManifest;
