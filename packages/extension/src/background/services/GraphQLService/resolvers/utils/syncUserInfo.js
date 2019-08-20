import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';

export default async function syncUserInfo(args, ctx) {
    const {
        currentAddress: userAddress,
    } = args;

    let user = await AuthService.getRegisteredUser(userAddress);
    if (!user) {
        const {
            keyStore,
            session: {
                pwDerivedKey,
            },
        } = ctx;

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
        const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
        const linkedPublicKey = decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey);

        user = await AuthService.registerAddress({
            address: userAddress,
            linkedPublicKey,
            registeredAt: linkedPublicKey === prevLinkedPublicKey
                ? prevRegisteredAt || 0
                : 0,
        });
    }

    return user;
}
