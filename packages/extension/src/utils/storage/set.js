import browser from 'webextension-polyfill';

export default function set(data, {
    sync = false,
} = {}) {
    return new Promise((resolve) => {
        browser.storage[sync ? 'sync' : 'local']
            .set(data)
            .then(() => resolve(data))
            .catch(error => console.error(error));
    });
}
