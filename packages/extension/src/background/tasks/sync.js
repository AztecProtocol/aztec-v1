import userModel from '~database/models/user';
import SyncService from '../services/SyncService';

export default async function sync() {
    const users = await userModel.get();

    if (users) {
        const syncPromises = Object.keys(users)
            .map(address => SyncService.syncAccount(address));

        await Promise.all(syncPromises);
    }
}
