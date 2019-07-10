/* global chrome */
import '~utils/hot-reload';
import {
    set,
    onIdle,
} from '~utils/storage';
import userModel from '~database/models/user';

export default async function initDb() {
    if (process.env.NODE_ENV !== 'production') {
        chrome.storage.local.clear();

        await set({
            __graphNode: 'http://localhost:4000/',
        });
        await userModel.set({
            address: '__account_id_0',
        });

        onIdle(
            async () => {
                await set({
                    __sync: 0,
                });
                console.log('--- database idle ---');
                chrome.storage.local.getBytesInUse(null, (bytes) => {
                    console.log('getBytesInUse', bytes);
                });
                chrome.storage.local.get(null, data => console.info(data));
            },
            {
                persistent: true,
            },
        );
    }
}
