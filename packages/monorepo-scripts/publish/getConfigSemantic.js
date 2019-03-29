const semanticGetConfig = require('semantic-release/lib/get-config');
const { WritableStreamBuffer } = require('stream-buffers');
const { Signale } = require('signale');

/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param {Object} context Object containing cwd, env, and logger properties that are passed to getConfig()
 * @param {Object} options Options object for the config.
 * @returns {Object} Returns what semantic-release's get config returns (object with options and plugins objects).
 *
 * @internal
 */
async function getConfigSemantic({ cwd, env, stdout, stderr, logger }, options) {
    try {
        // Blackhole logger (so we don't clutter output with "loaded plugin" messages).
        const blackhole = new Signale({ stream: new WritableStreamBuffer() });

        // Return semantic-release's getConfig script.
        return await semanticGetConfig({ cwd, env, stdout, stderr, logger: blackhole }, options);
    } catch (error) {
        // Log error and rethrow it.
        // istanbul ignore next (not important)
        logger.error(`Error in semantic-release getConfig(): %0`, error);
        // istanbul ignore next (not important)
        throw error;
    }
}

// Exports.
module.exports = getConfigSemantic;
