/* global chrome */

export default function set(data, {
    sync = false,
} = {}) {
    return new Promise((resolve) => {
        chrome.storage[sync ? 'sync' : 'local']
            .set(data, async () => {
                // TODO - check if data has been saved successfully
                resolve(data);
            });
    });
}
