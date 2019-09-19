import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import EventService from '~background/services/EventService'

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
        //TODO: remove default value,
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

    console.log(`account in syncUserInfo: ${JSON.stringify(account)}`)

    const {
        blockNumber: prevBlockNumber,
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
            blockNumber: !prevBlockNumber || reset
                ? 0
                : parseInt(prevBlockNumber, 10) || 0,
        });
    }

    return user;
}
