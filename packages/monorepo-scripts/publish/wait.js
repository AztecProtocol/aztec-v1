/**
 * Function that waits for a particular set of conditions to be true.
 *
 * @param {Function} callback Function that returns truthy if the condition is met, and falsy otherwise.
 * @returns {Promise<void>} Promise that resolves when the condition is met.
 */
function wait(callback) {
    return new Promise((resolve, reject) => {
        // Run the callback.
        const runCallback = () => {
            try {
                if (callback()) resolve();
                else setImmediate(runCallback);
            } catch (error) {
                // istanbul ignore next (not important)
                reject(error);
            }
        };

        // Set an immediate callback.
        setImmediate(runCallback);
    });
}

// Exports.
module.exports = wait;
