/* global chrome */
import {
    get,
    set,
    onIdle,
} from '~utils/storage';
import settings from '~background/utils/settings';
import SyncService from '~backgroundServices/SyncService';
import GraphNodeService from '~backgroundServices/GraphNodeService';
import syncAssetInfo from '../services/AuthService/enableAssetForDomain/syncAssetInfo';

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        await set({
            // __graphNode: 'http://localhost:4000/',
            __graphNode: 'http://127.0.0.1:8000/subgraphs/name/aztec/note-management',
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


    SyncService.set({
        notesPerRequest: await settings('NOTES_PER_SYNC_REQUEST'),
        syncInterval: await settings('SYNC_INTERVAL'),
    });

    const graphNodeServerUrl = await get('__graphNode');
    GraphNodeService.set({
        graphNodeServerUrl,
    });
}
