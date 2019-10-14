import decodePrivateKey from '~background/utils/decodePrivateKey';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    valueFromViewingKey,
    valueOf,
} from '~utils/note';
import fetchLatestNote from './fetchLatestNote';


export default async function syncNoteInfo(args, ctx) {
    const {
        id: noteId,
    } = args;

    if (!noteId) {
        return null;
    }

    const {
        user: {
            address: userAddress,
        },
        networkId = 0,
    } = ctx;

    const [note] = await fetchLatestNote({
        account: userAddress,
        noteId,
        networkId,
    }) || [];

    if (!note) {
        return null;
    }

    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
    } = ctx;
    const {
        viewingKey,
    } = note;
    const privateKey = decodePrivateKey(keyStore, pwDerivedKey);
    const realViewingKey = fromHexString(viewingKey).decrypt(privateKey);
    const value = valueFromViewingKey(realViewingKey);

    return {
        ...note,
        value,
    };
}
