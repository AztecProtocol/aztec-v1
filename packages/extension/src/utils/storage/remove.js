import browser from 'webextension-polyfill';
import {
    errorLog,
} from '~utils/log';

export default function remove(keys, {
    sync = false,
} = {}) {
    return new Promise((resolve, reject) => {
        browser.storage[sync ? 'sync' : 'local']
            .remove(keys)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                errorLog(error);
                reject();
            });
    });
}
