import {
    NOTES_PER_SYNC_REQUEST,
    SYNC_INTERVAL,
} from '~config/settings';
import {
    set,
} from '~utils/storage';
import userModel from '~database/models/user';
import SyncService from '../services/SyncService';

export default async function sync() {
    // TODO
    // implement onStart in storage and set _sync: 1 through it
    await set({
        __sync: 1,
    });

    const users = await userModel.get();

    if (users) {
        const startTimeAsync = Date.now();

        SyncService.set({
            notesPerRequest: NOTES_PER_SYNC_REQUEST,
            syncInterval: SYNC_INTERVAL,
        });

        const syncPromises = Object.keys(users)
            .map(address => SyncService.syncAccount(address));

        await Promise.all(syncPromises);
        console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);
    }
}
