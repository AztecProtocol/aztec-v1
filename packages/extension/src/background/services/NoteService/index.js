import {
    argsError,
} from '~/utils/error';
import ApiSessionManager from './helpers/ApiSessionManager';
import validate from './utils/pickNotes/validate';
import pickNotes from './utils/pickNotes';
import excludeValues from './utils/pickNotes/excludeValues';
import excludeNoteKeys from './utils/pickNotes/excludeNoteKeys';
import pickNotesInRange from './utils/pickNotesInRange';
import getNotesByKeys from './utils/getNotesByKeys';
import getKeysByNoteHashes from './utils/getKeysByNoteHashes';

const manager = new ApiSessionManager('1');

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
        networkId,
        ownerAddress,
        assetId,
    ) => manager.ensureSynced(
        networkId,
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
            numberOfNotes = null,
            allowLessNumberOfNotes = true,
            excludedNotes = null,
        } = {},
    ) => {
        if (numberOfNotes !== null && numberOfNotes <= 0) {
            return null;
        }

        return manager.ensureSynced(
            networkId,
            ownerAddress,
            assetId,
            async ({
                balance,
                getSortedValues,
            }) => {
                if (balance < minSum) {
                    return argsError('note.pick.sum', {
                        messageOptions: {
                            count: numberOfNotes || '',
                        },
                        balance,
                        numberOfNotes,
                        value: minSum,
                    });
                }

                try {
                    const sortedValues = getSortedValues();
                    const excludedValues = excludedNotes
                        ? excludedNotes.map(({ value }) => value)
                        : [];
                    const validValues = excludeValues(sortedValues, excludedValues);
                    validate({
                        sortedValues: validValues,
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
            numberOfNotes = null,
            allowLessNumberOfNotes = true,
            excludedNotes = null,
        } = {},
    ) => {
        if (numberOfNotes !== null && numberOfNotes <= 0) {
            return [];
        }

        return manager.ensureSynced(
            networkId,
            ownerAddress,
            assetId,
            async ({
                balance,
                noteValues,
                getSortedValues,
            }) => {
                if (balance < minSum) {
                    throw argsError('note.pick.sum', {
                        messageOptions: {
                            value: minSum,
                        },
                    });
                }

                const sortedValues = getSortedValues();
                const excludedValues = excludedNotes
                    ? excludedNotes.map(({ value }) => value)
                    : [];
                const excludedKeys = excludedNotes
                    ? await getKeysByNoteHashes(excludedNotes.map(({ noteHash }) => noteHash))
                    : [];
                const excludedKeyValuePairs = excludedKeys.map((key, i) => ({
                    key,
                    value: excludedNotes[i].value,
                }));
                const validValues = excludeValues(sortedValues, excludedValues);
                const validNoteValues = excludeNoteKeys(noteValues, excludedKeyValuePairs);
                const noteKeyData = pickNotes({
                    sortedValues: validValues,
                    noteValues: validNoteValues,
                    minSum,
                    numberOfNotes,
                    allowLessNumberOfNotes,
                });

                return getNotesByKeys(noteKeyData, { networkId });
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
                    allowLessNumberOfNotes: true,
                });

                return getNotesByKeys(noteKeyData, { networkId });
            },
        );
    },
};
