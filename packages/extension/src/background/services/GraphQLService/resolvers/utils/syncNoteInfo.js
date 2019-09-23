import {
    ADDRESS_LENGTH,
} from '~config/constants';
import {
    get,
} from '~utils/storage';
import noteModel from '~database/models/note';
import decodePrivateKey from '~background/utils/decodePrivateKey';
import SyncService from '~background/services/SyncService';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    fromViewingKey,
    valueOf,
} from '~utils/note';


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
        // TODO: remove default value, when it will be passed here.
        networkId = 0,
    } = ctx;

    let note = await noteModel.get({
        id: noteId,
    });

    let noteUser;
    if (note) {
        noteUser = note.owner.length === (ADDRESS_LENGTH + 2)
            ? userAddress
            : await get(userAddress);
    }

    if (!note
        || note.owner !== noteUser // the note in storage could have been synced using owner's account
    ) {
        note = await SyncService.syncNote({
            address: userAddress,
            noteId,
            networkId,
        });
        console.log(`EventService.syncNote after: ${JSON.stringify(note)}`);
    }

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
    const aztecNote = await fromViewingKey(realViewingKey);
    const value = valueOf(aztecNote);

    return {
        ...note,
        value,
    };
}
