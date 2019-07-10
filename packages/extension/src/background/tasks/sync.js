import {
    get,
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

    const graphNodeServerUrl = await get('__graphNode');
    SyncService.set({
        graphNodeServerUrl,
    });
    const users = await userModel.get();

    if (users) {
        const startTimeAsync = Date.now();

        const syncPromises = Object.keys(users)
            .map(address => SyncService.syncAccount(address));

        await Promise.all(syncPromises);
        console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);
    }
}
