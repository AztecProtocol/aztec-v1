/* global chrome */
import {
    get,
    set,
    onIdle,
} from '~utils/storage';
import userModel from '~database/models/user';
import GraphNodeService from '../services/GraphNodeService';

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        chrome.storage.local.clear();

        await set({
            __graphNode: 'http://localhost:4000/',
        });
        await userModel.set({
            address: '0x_account_00000000000000000000_address__0',
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

    const graphNodeServerUrl = await get('__graphNode');
    GraphNodeService.set({
        graphNodeServerUrl,
    });
}
