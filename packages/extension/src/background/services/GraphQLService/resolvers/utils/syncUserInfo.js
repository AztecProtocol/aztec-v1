import {
    permissionError,
} from '~/utils/error';
import Web3Service from '~/helpers/Web3Service';
import AuthService from '~/background/services/AuthService';
import NoteService from '~/background/services/NoteService';
import EventService from '~/background/services/EventService';
import decodeLinkedPublicKey from '~/background/utils/decodeLinkedPublicKey';
import decodeKeyStore from '~/background/utils/decodeKeyStore';
import decodePrivateKey from '~/background/utils/decodePrivateKey';

export default async function syncUserInfo(args, ctx) {
    const {
        currentAddress: userAddress,
    } = args;
    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
    } = ctx;
    const {
        networkId,
    } = Web3Service;
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

    if (linkedPublicKey !== prevLinkedPublicKey) {
        throw permissionError('account.duplicated');
    }

    await AuthService.registerAddress(account);

    const user = await AuthService.getRegisteredUser(userAddress);
    if (user) {
        const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
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
            networkId,
        );
    }

    return user;
}
