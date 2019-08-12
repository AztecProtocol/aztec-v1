import AuthService from '~background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';
import SyncService from '~background/services/SyncService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function validateAccount(_, args, ctx) {
    const {
        currentAddress,
    } = args;
    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
    } = ctx;

    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);

    let user = await AuthService.getRegisteredUser(currentAddress);
    if (!user) {
        // TODO: return permission error
        // should let user know they are binding a new address to this extension account
        // and call registerAddress through ui
        const {
            account,
        } = await GraphNodeService.query(`
           account(id: "${currentAddress}") {
               address
               linkedPublicKey
               registeredAt
           }
        `) || {};

        const {
            registeredAt,
        } = account || {};

        user = await AuthService.registerAddress({
            address: currentAddress,
            linkedPublicKey: decodeLinkedPublicKey(decodedKeyStore, pwDerivedKey),
            registeredAt: registeredAt | 0, // eslint-disable-line no-bitwise
        });
    }

    if (user.registeredAt) {
        SyncService.syncAccount({
            address: user.address,
            privateKey: decodePrivateKey(decodedKeyStore, pwDerivedKey),
        });
    }

    const newSession = await AuthService.updateSession(currentAddress);

    return {
        keyStore: decodedKeyStore,
        session: newSession,
        user,
    };
}
