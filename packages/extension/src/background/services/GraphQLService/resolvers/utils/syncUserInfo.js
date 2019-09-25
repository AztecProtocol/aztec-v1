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
        // TODO
        // we need to show different UI saying the account is registered, please restore from seed phrase
        return permissionError('account.duplicated');
    }

    const user = await AuthService.getRegisteredUser(userAddress);

    return user;
}
