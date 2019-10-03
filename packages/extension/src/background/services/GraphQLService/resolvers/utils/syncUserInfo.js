import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function syncUserInfo(args, ctx) {
    const {
        currentAddress: userAddress,
    } = args;

    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
        // TODO: remove default value, when it will be passed here.
        networkId = 0,
    } = ctx;
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const linkedPublicKey = decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey);

    const {
        account,
    } = await EventService.fetchAztecAccount({
        address: userAddress,
        networkId,
    });
    const {
        linkedPublicKey: prevLinkedPublicKey,
    } = account || {};

    if (!prevLinkedPublicKey) {
        throw permissionError('address.not.registered', {
            messageOptions: {
                address: userAddress,
            },
        });
    }

    // if (linkedPublicKey !== prevLinkedPublicKey) {
    //     // TODO
    //     // we need to show different UI saying the account is registered, please restore from seed phrase
    //     throw permissionError('account.duplicated');
    // }

    await AuthService.registerAddress(account);

    const user = await AuthService.getRegisteredUser(userAddress);
    if (user) {

        const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
        // console.log(`privateKey privateKeyprivateKeyprivateKeyprivateKey: ----------- ${JSON.stringify(privateKey)}, user: ${JSON.stringify(user)}`);

        EventService.addAccountToSync({
            address: user.address,
            networkId,
        });

        EventService.startAutoSync({
            networkId,
        });

        NoteService.initWithUser(
            user.address,
            privateKey,
            user.linkedPublicKey,
        );

        SyncService.syncAccount({
            address: user.address,
            privateKey,
            networkId,
        });

    }

    return user;
}
