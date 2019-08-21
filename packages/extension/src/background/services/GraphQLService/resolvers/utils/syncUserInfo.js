import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';

export default async function syncUserInfo(args, ctx) {
    const {
        currentAddress: userAddress,
    } = args;

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

    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
    } = ctx;
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const linkedPublicKey = decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey);
    const resetRegisteredAt = linkedPublicKey !== prevLinkedPublicKey;

    let user = await AuthService.getRegisteredUser(userAddress);
    if (!user
        || user.linkedPublicKey !== linkedPublicKey
    ) {
        user = await AuthService.registerAddress({
            address: userAddress,
            linkedPublicKey,
            registeredAt: resetRegisteredAt
                ? 0
                : parseInt(prevRegisteredAt, 10) || 0,
        });
    }

    return user;
}
