/* global chrome */
import {
    get,
    set,
    onIdle,
} from '~utils/storage';
import settings from '~background/utils/settings';
import SyncService from '~background/services/SyncService';
import GraphNodeService from '~background/services/GraphNodeService';
import Web3Service from '~client/services/Web3Service';
import domainModel from '../../database/models/domain';
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry.json';
import ZkAssetTemplate from '../../../build/contracts/ZkAssetTemplate.json';
import NoteService from '~background/services/NoteService';
import AuthService from '~background/services/AuthService';

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        await set({
            // __graphNode: 'http://localhost:4000/',
            __graphNode: 'http://127.0.0.1:8000/subgraphs/name/aztec/note-management',
        });
        await domainModel.set(
            {
                domain: window.location.origin,
            },
            {
                ignoreDuplicate: true,
            },
        );

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

    // TODO this will eventually be passed in from the config
    await Web3Service.init({
        provider: 'http://localhost:8545',
    });
    // load the contracts
    Web3Service.registerContract(AZTECAccountRegistry);
    //
    Web3Service.registerInterface(ZkAssetTemplate, {
        name: 'ZkAsset',
    });

    SyncService.set({
        notesPerRequest: await settings('NOTES_PER_SYNC_REQUEST'),
        syncInterval: await settings('SYNC_INTERVAL'),
    });


    const graphNodeServerUrl = await get('__graphNode');

    GraphNodeService.set({
        graphNodeServerUrl,
    });

    NoteService.init();
}
