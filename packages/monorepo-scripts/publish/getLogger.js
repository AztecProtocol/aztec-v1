const { Signale } = require('signale');

/**
 * Return a new Signale instance.
 * _Similar to get-logger.js in semantic-release_
 *
 * @param {Stream} stdout A writable stream for output.
 * @param {Stream} stderr A writable stream for errors.
 * @returns {Logger} An instance of Logger
 *
 * @internal
 */
function getLogger({ stdout, stderr }) {
    return new Signale({
        config: { displayTimestamp: true, displayLabel: false },
        // scope: "multirelease",
        stream: stdout,
        types: {
            error: { color: 'red', label: '', stream: [stderr] },
            log: { color: 'magenta', label: '', stream: [stdout], badge: '•' },
            success: { color: 'green', label: '', stream: [stdout] },
            complete: { color: 'green', label: '', stream: [stdout], badge: '🎉' },
        },
    });
}

// Exports.
module.exports = getLogger;
