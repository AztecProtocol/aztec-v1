import browser from 'webextension-polyfill';

export default function get(keys, {
    sync = false,
} = {}) {
    return new Promise((resolve) => {
        browser.storage[sync ? 'sync' : 'local']
            .get(keys)
            .then((values) => {
                const result = values && typeof keys === 'string'
                    ? values[keys]
                    : values;

                resolve(result);
            })
            .catch(error => console.error(error));
    });
}
