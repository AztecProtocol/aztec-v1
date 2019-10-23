import {
    argsError,
} from '~utils/error';
import {
    get,
} from '~utils/storage';
import Note from '~background/database/models/note';
import ApiSessionManager from './helpers/ApiSessionManager';
import pickNotes from './utils/pickNotes';

const manager = new ApiSessionManager();

export default {
    initWithUser: async (
        ownerAddress,
        linkedPrivateKey,
        linkedPublicKey,
        networkId,
    ) => manager.init(
        networkId,
        {
            address: ownerAddress,
            linkedPrivateKey,
            linkedPublicKey,
        },
    ),
    save: async () => manager.save(),
    addNotes: async (
        networkId,
        ownerAddress,
        notes,
    ) => manager.addRawNotes({
        networkId,
        ownerAddress,
        notes,
    }),
    getBalance: async (
        // TODO - pass networkId
        ownerAddress,
        assetId,
    ) => manager.ensureSynced(
        manager.networkId,
        ownerAddress,
        assetId,
        ({ balance }) => balance,
    ),
    pick: async (
        networkId,
        ownerAddress,
        assetId,
        minSum,
        {
            numberOfNotes = 1,
            allowLessNumberOfNotes = true,
        } = {},
    ) => {
        if (numberOfNotes <= 0) {
            return [];
        }

        return manager.ensureSynced(
            networkId,
            ownerAddress,
            assetId,
            async ({
                balance,
                noteValues,
            }) => {
                if (balance < minSum) {
                    throw argsError('note.pick.sum', {
                        messageOptions: {
                            value: minSum,
                        },
                    });
                }

                const noteKeyData = pickNotes({
                    noteValues,
                    minSum,
                    numberOfNotes,
                    allowLessNumberOfNotes,
                });

                const notes = await Promise.all(noteKeyData.map(async ({
                    key,
                    value,
                }) => {
                    const noteHash = await get(key);
                    const note = await Note.get({ networkId }, noteHash);
                    return {
                        ...note,
                        value,
                    };
                }));

                return notes;
            },
        );
    },
};
