import browser from 'webextension-polyfill';
import {
    errorLog,
} from '~utils/log';

export default function fetchFromBackgroundScript(data = {}) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(data)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                errorLog(error);
                reject(error);
            });
    });
}
