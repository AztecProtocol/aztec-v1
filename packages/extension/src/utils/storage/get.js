/* global chrome */

export default function get(keys, {
    sync = false,
} = {}) {
    return new Promise((resolve) => {
        chrome.storage[sync ? 'sync' : 'local']
            .get(keys, (values) => {
                const result = values && typeof keys === 'string'
                    ? values[keys]
                    : values;

                resolve(result);
            });
    });
}
