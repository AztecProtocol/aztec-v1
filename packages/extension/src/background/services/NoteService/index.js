import {
    argsError,
} from '~utils/error';
import {
    get,
} from '~utils/storage';
import Note from '~background/database/models/note';
import ApiSessionManager from './helpers/ApiSessionManager';
import validate from './utils/pickNotes/validate';
import pickNotes from './utils/pickNotes';
import pickNotesInRange from './utils/pickNotesInRange';

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
    validatePick: async (
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
            return null;
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
                    return argsError('note.pick.sum', {
                        messageOptions: {
                            count: numberOfNotes,
                        },
                        balance,
                        numberOfNotes,
                        value: minSum,
                    });
                }

                try {
                    validate({
                        noteValues,
                        minSum,
                        numberOfNotes,
                        allowLessNumberOfNotes,
                    });
                } catch (error) {
                    return error;
                }

                return null;
            },
        );
    },
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
    fetch: async (
        networkId,
        ownerAddress,
        assetId,
        {
            equalTo,
            greaterThan,
            lessThan,
            numberOfNotes,
            allowLessNumberOfNotes = true,
        } = {},
    ) => {
        if (typeof numberOfNotes === 'number'
            && numberOfNotes <= 0) {
            return [];
        }
        if (typeof equalTo === 'number'
            && ((typeof greaterThan === 'number' && equalTo <= greaterThan)
                || (typeof lessThan === 'number' && equalTo >= lessThan))
        ) {
            return [];
        }

        return manager.ensureSynced(
            networkId,
            ownerAddress,
            assetId,
            async ({
                noteValues,
            }) => {
                const noteKeyData = pickNotesInRange({
                    noteValues,
                    equalTo,
                    greaterThan,
                    lessThan,
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
