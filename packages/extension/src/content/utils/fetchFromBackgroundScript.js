import browser from 'webextension-polyfill';

export default function fetchFromBackgroundScript(data = {}) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(data)
            .then((result) => {
                resolve({ data: result, requestId: data.requestId });
            })
            .catch((error) => {
                reject({ error, requestId: data.requestId });
            });
    });
}
