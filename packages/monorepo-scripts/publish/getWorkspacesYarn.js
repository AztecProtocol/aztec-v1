const { checker } = require('blork');
const glob = require('bash-glob');
const getManifest = require('./getManifest');

/**
 * Return array of package.json for Yarn workspaces.
 *
 * @param {string} cwd The current working directory where a package.json file can be found.
 * @returns {string[]} An array of package.json files corresponding to the workspaces setting in package.json
 */
function getWorkspacesYarn(cwd) {
    // Load package.json
    const manifest = getManifest(`${cwd}/package.json`);

    // Only continue if manifest.workspaces is an array of strings.
    if (!checker('string[]+')(manifest.workspaces))
        throw new TypeError('package.json: workspaces: Must be non-empty array of string');

    // Turn workspaces into list of package.json files.
    const workspaces = glob.sync(manifest.workspaces.map((p) => p.replace(/\/?$/, '/package.json')), {
        cwd: cwd,
        realpath: true,
        ignore: '**/node_modules/**',
    });

    // Must have at least one workspace.
    if (!workspaces.length) throw new TypeError('package.json: workspaces: Must contain one or more workspaces');

    // Return.
    return workspaces;
}

// Exports.
module.exports = getWorkspacesYarn;
