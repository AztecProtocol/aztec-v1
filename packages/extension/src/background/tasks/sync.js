import userModel from '~database/models/user';
import asyncMap from '~utils/asyncMap';
import AuthService from '../services/AuthService';
import SyncService from '../services/SyncService';

export default async function sync() {
    const users = await userModel.get();

    if (users) {
        const privateKeys = await asyncMap(
            Object.keys(users),
            address => AuthService.getPrivateKey(address),
        );
        const syncPromises = Object.keys(users)
            .map((address, i) => SyncService.syncAccount({
                address,
                privateKey: privateKeys[i],
            }));

        await Promise.all(syncPromises);
    }
}
