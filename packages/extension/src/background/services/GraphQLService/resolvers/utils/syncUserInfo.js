import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';

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
    } = ctx;
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const linkedPublicKey = decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey);

    const {
        account,
    } = await GraphNodeService.query(`
       account(id: "${userAddress}") {
           address
           linkedPublicKey
           registeredAt
       }
    `) || {};

    const {
        registeredAt: prevRegisteredAt,
        linkedPublicKey: prevLinkedPublicKey,
    } = account || {};

    if (prevLinkedPublicKey
        && linkedPublicKey !== prevLinkedPublicKey
        && !reset
    ) {
        return permissionError('account.duplicated');
    }

    let user = await AuthService.getRegisteredUser(userAddress);
    if (!user
        || user.linkedPublicKey !== linkedPublicKey
    ) {
        user = await AuthService.registerAddress({
            address: userAddress,
            linkedPublicKey,
            registeredAt: !prevRegisteredAt || reset
                ? 0
                : parseInt(prevRegisteredAt, 10) || 0,
        });
    }

    return user;
}
