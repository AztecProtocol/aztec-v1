import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import AccountSyncService from '~background/services/eventsSyncServices/AccountSyncService';
import NoteSyncService from '~background/services/eventsSyncServices/NoteSyncService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function validateAccount(_, args, ctx) {
    const {
        currentAddress,
    } = args;

    const user = await AuthService.getRegisteredUser(currentAddress);
    if (!user) {
        return permissionError('account.not.linked');
    }

    const {
        keyStore,
        session,
    } = ctx;
    const {
        pwDerivedKey,
    } = session || {};

    let decodedKeyStore;
    try {
        decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    } catch (error) {
        return permissionError('account.incorrect.password', error);
    }

    SyncService.syncAccount({
        address: user.address,
        privateKey: decodePrivateKey(decodedKeyStore, pwDerivedKey),
    });

    //TODO: Check weather should we start syncing an address if the address has an `RegisterExtension` event
    AccountSyncService.syncEthAddress({
        address: currentAddress,
    })
    NoteSyncService.syncEthAddress({
        address: currentAddress,
    })

    const newSession = await AuthService.updateSession(currentAddress);

    return {
        keyStore: decodedKeyStore,
        session: newSession,
        user,
    };
}
