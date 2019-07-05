import browser from 'webextension-polyfill';
import {
    errorLog,
} from '~utils/log';

export default function get(keys, {
    sync = false,
} = {}) {
    return new Promise((resolve, reject) => {
        browser.storage[sync ? 'sync' : 'local']
            .get(keys)
            .then((values) => {
                const result = values && typeof keys === 'string'
                    ? values[keys]
                    : values;

                resolve(result);
            })
            .catch((error) => {
                errorLog(error);
                reject();
            });
    });
}
