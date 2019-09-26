import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import EventService from '~background/services/EventService';

export default async function syncUserInfo(args, ctx) {
    const {
        currentAddress: userAddress,
        reset = false,
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
        error,
        account,
    } = await EventService.fetchAztecAccount({
        address: userAddress,
        networkId,
    });

    const {
        blockNumber: prevBlockNumber,
        linkedPublicKey: prevLinkedPublicKey,
    } = account || {};

    if (prevLinkedPublicKey
        && linkedPublicKey !== prevLinkedPublicKey
        && !reset
    ) {
        // TODO
        // we need to show different UI saying the account is registered, please restore from seed phrase
        return permissionError('account.duplicated');
    }

    const user = await AuthService.getRegisteredUser(userAddress);

    return user;
}
