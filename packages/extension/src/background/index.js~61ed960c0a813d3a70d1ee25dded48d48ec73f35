/* global chrome */
import '~utils/hot-reload';
import {
    set,
    onIdle,
} from '~utils/storage';
import sync from './tasks/sync';
import acceptConnection from './tasks/acceptConnection';

const runScript = () => {
    chrome.storage.local.clear();
    onIdle(
        async () => {
            await set({
                _sync: 0,
            });
            console.log('--- database idle ---');
            chrome.storage.local.get(null, data => console.info(data));
        },
        {
            persistent: true,
        },
    );

    acceptConnection();
    sync();
};

runScript();
