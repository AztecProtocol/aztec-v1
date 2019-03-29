const cosmiconfig = require('cosmiconfig');

// Copied from get-config.js in semantic-release
const CONFIG_NAME = 'release';
const CONFIG_FILES = [
    'package.json',
    `.${CONFIG_NAME}rc`,
    `.${CONFIG_NAME}rc.json`,
    `.${CONFIG_NAME}rc.yaml`,
    `.${CONFIG_NAME}rc.yml`,
    `.${CONFIG_NAME}rc.js`,
    `${CONFIG_NAME}.config.js`,
];

/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param {string} cwd The directory to search.
 * @returns {Object} The found configuration option
 *
 * @internal
 */
module.exports = async function getConfig(cwd) {
    // Call cosmiconfig.
    const config = await cosmiconfig(CONFIG_NAME, { searchPlaces: CONFIG_FILES }).search(cwd);

    // Return the found config or empty object.
    // istanbul ignore next (not important).
    return config ? config.config : {};
};
