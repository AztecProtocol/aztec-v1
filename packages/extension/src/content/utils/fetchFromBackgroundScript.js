import browser from 'webextension-polyfill';

export default function fetchFromBackgroundScript(data = {}) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(data)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
