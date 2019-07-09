import browser from 'webextension-polyfill';
import {
    errorLog,
} from '~utils/log';

export default function set(data, {
    sync = false,
} = {}) {
    return new Promise((resolve, reject) => {
        browser.storage[sync ? 'sync' : 'local']
            .set(data)
            .then(() => resolve(data))
            .catch((error) => {
                errorLog(error);
                reject();
            });
    });
}
