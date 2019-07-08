/* global chrome */

export default function remove(keys, {
    sync = false,
} = {}) {
    return new Promise((resolve) => {

        chrome.storage[sync ? 'sync' : 'local']
            .remove(keys, async () => {
                // TODO - check if data has been saved successfully
                resolve(data);
            });
    });
};
