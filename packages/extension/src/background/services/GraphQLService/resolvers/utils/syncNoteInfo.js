import {
    metadata,
} from '@aztec/note-access';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import decodePrivateKey from '~/background/utils/decodePrivateKey';
import {
    fromHexString,
} from '~/utils/encryptedViewingKey';
import {
    valueFromViewingKey,
} from '~/utils/note';
import {
    argsError,
} from '~/utils/error';
import Web3Service from '~/helpers/Web3Service';
import Note from '~/background/database/models/note';
import syncLatestNoteOnChain from './syncLatestNoteOnChain';

export default async function syncNoteInfo(args, ctx) {
    const {
        id: noteId,
    } = args;

    if (!noteId) {
        return null;
    }

    const {
        user: { address: userAddress },
    } = ctx;
    const {
        networkId,
    } = Web3Service;

    let note = await Note.get({ networkId }, noteId);
    if (!note) {
        note = await syncLatestNoteOnChain({
            account: userAddress,
            noteId,
        });
    }

    if (!note) {
        throw argsError('note.not.found', {
            id: noteId,
        });
    }

    const metadataObj = metadata(note.metadata.slice(METADATA_AZTEC_DATA_LENGTH + 2));
    const {
        viewingKey,
    } = metadataObj.getAccess(userAddress) || {};

    let value;
    if (viewingKey) {
        const {
            keyStore,
            session: {
                pwDerivedKey,
            },
        } = ctx;

        const privateKey = decodePrivateKey(keyStore, pwDerivedKey);
        const realViewingKey = fromHexString(viewingKey).decrypt(privateKey);
        value = valueFromViewingKey(realViewingKey);
    }

    return {
        ...note,
        value,
    };
}
