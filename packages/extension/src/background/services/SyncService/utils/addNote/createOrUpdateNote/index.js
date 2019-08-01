import {
    errorLog,
} from '~utils/log';
import {
    toCode,
    isDestroyed,
} from '~utils/noteStatus';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    fromViewingKey,
    valueOf,
} from '~utils/note';
import noteModel from '~database/models/note';
import noteAccessModel from '~database/models/noteAccess';
import NoteService from '~background/services/NoteService';

import {
    permissionError,
} from '~utils/error';
import { get } from '~utils/storage';
import {
    utils as keyvaultUtils,
} from '~utils/keyvault';

const getPrivateKey = async (currentAddress) => {
    // TODO
    // should use user's address to find their private key
    const {
        keyStore,
        session,
    } = await get([
        'keyStore',
        'session',
    ]);
    if (session && !session.pwDerivedKey) {
        return permissionError('account.not.login', {
            messageOptions: { account: currentAddress },
            currentAddress,

        });
    }

    const {
        encPrivKey,
    } = keyStore.privacyKeys;
    const decodedKey = new Uint8Array(Object.values(JSON.parse(session.pwDerivedKey)));

    const privateKey = await keyvaultUtils.decryptString(encPrivKey, decodedKey);

    return privateKey;
};

export default async function createOrUpdateNote(note, privateKey) {
    const {
        assetKey,
        ownerKey,
        owner: {
            address: ownerAddress,
        },
        viewingKey: encryptedVkString,
        status,
    } = note;

    const isOwner = note.account.address === note.owner.address;

    const model = isOwner
        ? noteModel
        : noteAccessModel;

    let value = 0;
    try {
        const realViewingKey = fromHexString(encryptedVkString).decrypt(privateKey);
        const aztecNote = await fromViewingKey(realViewingKey);
        value = valueOf(aztecNote);
    } catch (error) {
        const privateKeyNew = await getPrivateKey(note.owner.address);
        errorLog('Failed to decrypt note from viewingKey.', {
            viewingKey: encryptedVkString,
            privateKey,
            privateKeyNew,
        });
        value = -1;
    }

    const newData = {
        ...note,
        value,
        asset: assetKey,
        owner: ownerKey,
        status: toCode(status),
    };

    const {
        key: noteKey,
        storage: prevStorage,
        modified,
    } = await model.set(
        newData,
        {
            ignoreDuplicate: true,
        },
    );

    const justCreated = modified.length > 0;

    const promises = [];

    if (!justCreated) {
        const {
            [noteKey]: prevNoteStorage,
        } = prevStorage;
        const newNoteStorage = model.toStorageData(newData);
        const hasChanged = prevNoteStorage.length !== newNoteStorage.length
            || prevNoteStorage.some((v, i) => v !== newNoteStorage[i]);
        if (hasChanged) {
            promises.push(model.update(newData));
        }
    }

    if (isOwner) {
        const assetId = note.asset.address;
        if (isDestroyed(status)) {
            NoteService.removeNoteValue({
                assetId,
                ownerAddress,
                noteKey,
                value,
            });
        } else {
            NoteService.addNoteValue({
                assetId,
                ownerAddress,
                noteKey,
                value,
            });
        }
    }

    await Promise.all(promises);

    return {
        key: noteKey,
    };
}
