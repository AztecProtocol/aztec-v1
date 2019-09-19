import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import EventService from '~background/services/EventService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function validateAccount(_, args, ctx) {
    const {
        currentAddress,
    } = args;

    console.log(`validateAccount: ${JSON.stringify(currentAddress)}`);

    const user = await AuthService.getRegisteredUser(currentAddress);
    if (!user) {
        return permissionError('account.not.linked');
    }

    const {
        keyStore,
        session,
        //TODO: remove default value,
        networkId = 0,
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

    EventService.syncNotes({
        address: user.address,
        networkId,
    });

    SyncService.syncAccount({
        address: user.address,
        privateKey: decodePrivateKey(decodedKeyStore, pwDerivedKey),
        networkId,
    });
    
    const newSession = await AuthService.updateSession(currentAddress);

    return {
        keyStore: decodedKeyStore,
        session: newSession,
        user,
    };
}
